import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { defaultOffer } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { processRowWithCombinedFields } from "@/utils/fieldCombinerUtils";
import type { ColumnMapping, DatabaseFieldKey } from "@/components/import-data/ColumnMappingDialog";
import type { CombinedField } from "@/components/import-data/FieldCombiner";

export interface CSVPreviewRow {
  [key: string]: string;
}

export interface UploadedImage {
  name: string;
  url: string;
  status: 'success' | 'error';
}

export interface MatchDetail {
  csvRow: number;
  csvAddress: string;
  csvOwnerName: string;
  csvOrigem: string;
  dbId: string;
  dbAddress: string;
  dbOwnerName: string;
  dbOrigem: string;
  matchedBy: string;
  approved: boolean;
}

export interface ImportPreviewState {
  toInsert: number;
  toUpdate: number;
  toSkip: number;
  existingAccounts: Set<string>;
  isLoading: boolean;
  progress: number;
  matchedFields: { csvColumn: string; dbField: string }[];
  dbFieldsCount: { origem: number; address: number; owner_name: number; owner_address: number };
  matchReview?: MatchDetail[];
}

export interface ImportResult {
  imported: number;
  updated: number;
  errors: number;
}

// ── Utility functions ──

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else current += char;
  }
  result.push(current.trim());
  return result;
};

const normalizeForMatch = (str: string | null | undefined): string => {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
};

const createAddressKey = (address: string): string => {
  if (!address) return '';
  const cleaned = address.trim().toUpperCase()
    .replace(/,?\s*(FL|FLORIDA)\s*\d{5}(-\d{4})?/gi, '')
    .replace(/\s+\d{5}(-\d{4})?\s*$/gi, '')
    .replace(/,?\s*\d{5}(-\d{4})?\s*$/gi, '')
    .replace(/,?\s*(ORLANDO|UNINCORPORATED|BELLE ISLE|EATONVILLE|APOPKA|WINTER GARDEN|WINTER PARK|MAITLAND|OCOEE|KISSIMMEE|SANFORD)\s*/gi, '')
    .replace(/\s+/g, ' ').trim();
  const parts = cleaned.split(' ');
  const hasNumber = parts[0]?.match(/^\d+$/);
  const streetParts = parts.slice(0, hasNumber ? 4 : 3).join(' ');
  return streetParts.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const generateSlug = (address: string): string =>
  address.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 100);

const normalizeColumnName = (csvHeader: string): string =>
  csvHeader.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').substring(0, 63);

const inferColumnType = (name: string): string => {
  if (name.includes('age') || name.includes('beds') || name.includes('sqft') || name.includes('year') || name.includes('count')) return 'integer';
  if (name.includes('baths') || name.includes('value') || name.includes('size') || name.includes('price') || name.includes('amount')) return 'numeric';
  if (name.includes('deceased') || name.includes('is_') || name.includes('has_') || name.includes('_flag')) return 'boolean';
  return 'text';
};

const KNOWN_COLUMNS = new Set([
  'id','slug','address','city','state','zip_code','property_image_url','estimated_value','cash_offer_amount',
  'status','created_at','updated_at','sms_sent','email_sent','letter_sent','card_sent','phone_call_made',
  'meeting_scheduled','lead_status','owner_address','owner_name','owner_phone','answer_flag','dnc_flag',
  'neighborhood','origem','carta','zillow_url','evaluation','focar','comparative_price','lead_score','tags',
  'approval_status','approved_by','approved_by_name','approved_at','rejection_reason','rejection_notes',
  'updated_by','updated_by_name','airbnb_eligible','airbnb_check_date','airbnb_regulations','airbnb_notes',
  'import_date','import_batch','last_contact_date','next_followup_date','county','property_type','bedrooms',
  'bathrooms','square_feet','lot_size','year_built','lead_captured','lead_captured_at',
]);

// ── Hook ──

export const useImportProperties = () => {
  const { toast } = useToast();
  const { userId, userName } = useCurrentUser();

  // Image state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);

  // CSV state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CSVPreviewRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [combinedFields, setCombinedFields] = useState<CombinedField[]>([]);

  // Import state
  const [importPreview, setImportPreview] = useState<ImportPreviewState | null>(null);
  const [approvedMatches, setApprovedMatches] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Options
  const [batchName, setBatchName] = useState(`Import-${new Date().toISOString().split('T')[0]}`);
  const [importTags, setImportTags] = useState("");
  const [updateExisting, setUpdateExisting] = useState(true);

  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCalculatingRef = useRef(false);

  // ── Image handlers ──

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const imageArray = Array.from(files).filter(f => f.type.startsWith('image/') || f.name.match(/\.(jpg|jpeg|png|webp)$/i));
    setImageFiles(imageArray);
    toast({ title: "Imagens Selecionadas", description: `${imageArray.length} imagens prontas para upload` });
  }, [toast]);

  const handleUploadImages = useCallback(async () => {
    if (imageFiles.length === 0) { toast({ title: "Erro", description: "Selecione imagens primeiro", variant: "destructive" }); return; }
    setIsUploadingImages(true); setImageUploadProgress(0); setUploadedImages([]);
    const results: UploadedImage[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      try {
        const { data, error } = await supabase.storage.from('property-images').upload(`imports/${batchName}/${fileName}`, file, { cacheControl: '3600', upsert: true });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(data.path);
        results.push({ name: file.name, url: publicUrl, status: 'success' });
      } catch { results.push({ name: file.name, url: '', status: 'error' }); }
      setImageUploadProgress(Math.round(((i + 1) / imageFiles.length) * 100));
      setUploadedImages([...results]);
    }
    setIsUploadingImages(false);
    toast({ title: "Upload Completo", description: `${results.filter(r => r.status === 'success').length}/${imageFiles.length} imagens carregadas` });
  }, [imageFiles, batchName, toast]);

  // ── CSV handlers ──

  const handleCSVSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith('.csv')) {
      if (file) toast({ title: "Erro", description: "Por favor, selecione um arquivo CSV", variant: "destructive" });
      return;
    }
    setCsvFile(file); setCsvErrors([]);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.trim().split('\n');
      if (lines.length < 2) { setCsvErrors(["Arquivo CSV vazio ou inválido"]); return; }
      const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim());
      setCsvHeaders(headers); setTotalRows(lines.length - 1);
      const preview: CSVPreviewRow[] = [];
      for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
        const values = parseCSVLine(lines[i]);
        const row: CSVPreviewRow = {};
        headers.forEach((h, idx) => { row[h] = values[idx]?.replace(/"/g, '').trim() || ''; });
        preview.push(row);
      }
      setCsvPreview(preview); setCsvErrors([]); setShowMappingDialog(true);
      toast({ title: "CSV Carregado", description: `${lines.length - 1} propriedades encontradas.` });
    };
    reader.readAsText(file);
  }, [toast]);

  // ── Preview calculation ──

  const calculateImportPreview = useCallback(async (mappings: ColumnMapping[]) => {
    if (!csvFile || mappings.length === 0 || isCalculatingRef.current) return;
    isCalculatingRef.current = true;

    const origemMapping = mappings.find(m => m.dbField === 'origem');
    const addressMapping = mappings.find(m => m.dbField === 'address');
    const ownerNameMapping = mappings.find(m => m.dbField === 'owner_name');
    const ownerAddressMapping = mappings.find(m => m.dbField === 'owner_address');

    const matchedFields: { csvColumn: string; dbField: string }[] = [];
    if (origemMapping) matchedFields.push({ csvColumn: origemMapping.csvColumn, dbField: 'origem' });
    if (addressMapping) matchedFields.push({ csvColumn: addressMapping.csvColumn, dbField: 'address' });
    if (ownerNameMapping) matchedFields.push({ csvColumn: ownerNameMapping.csvColumn, dbField: 'owner_name' });
    if (ownerAddressMapping) matchedFields.push({ csvColumn: ownerAddressMapping.csvColumn, dbField: 'owner_address' });

    const emptyDbCount = { origem: 0, address: 0, owner_name: 0, owner_address: 0 };
    setImportPreview({ toInsert: 0, toUpdate: 0, toSkip: 0, existingAccounts: new Set(), isLoading: true, progress: 0, matchedFields, dbFieldsCount: emptyDbCount });

    if (!origemMapping && !addressMapping && !ownerNameMapping && !ownerAddressMapping) {
      setImportPreview({ toInsert: totalRows, toUpdate: 0, toSkip: 0, existingAccounts: new Set(), isLoading: false, progress: 100, matchedFields: [], dbFieldsCount: emptyDbCount });
      isCalculatingRef.current = false;
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const lines = content.trim().split('\n');
        const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim());
        const totalToProcess = lines.length - 1;

        const getColIdx = (mapping: ColumnMapping | undefined) => mapping ? headers.indexOf(mapping.csvColumn) : -1;
        const origemIdx = getColIdx(origemMapping);
        const addressIdx = getColIdx(addressMapping);
        const ownerNameIdx = getColIdx(ownerNameMapping);
        const ownerAddressIdx = getColIdx(ownerAddressMapping);

        setImportPreview(prev => prev ? { ...prev, progress: 10 } : prev);

        const { data: existingProperties, error } = await supabase.from('properties').select('id, origem, address, owner_name, owner_address');
        if (error) {
          setImportPreview({ toInsert: totalRows, toUpdate: 0, toSkip: 0, existingAccounts: new Set(), isLoading: false, progress: 100, matchedFields, dbFieldsCount: emptyDbCount });
          isCalculatingRef.current = false;
          return;
        }

        const dbFieldsCount = {
          origem: existingProperties?.filter(p => p.origem).length || 0,
          address: existingProperties?.filter(p => p.address).length || 0,
          owner_name: existingProperties?.filter(p => p.owner_name).length || 0,
          owner_address: existingProperties?.filter(p => p.owner_address).length || 0,
        };
        setImportPreview(prev => prev ? { ...prev, progress: 30, dbFieldsCount } : prev);

        type PropInfo = { id: string; address: string; owner_name: string; origem: string };
        const matchMaps = {
          byOrigem: new Map<string, PropInfo>(),
          byAddressKey: new Map<string, PropInfo>(),
          byOwnerName: new Map<string, PropInfo>(),
          byOwnerAddress: new Map<string, PropInfo>(),
        };
        existingProperties?.forEach(prop => {
          const info: PropInfo = { id: prop.id, address: prop.address || '', owner_name: prop.owner_name || '', origem: prop.origem || '' };
          if (prop.origem) matchMaps.byOrigem.set(normalizeForMatch(prop.origem).replace(/\s/g, ''), info);
          if (prop.address) { const k = createAddressKey(prop.address); if (k) matchMaps.byAddressKey.set(k, info); }
          if (prop.owner_name) matchMaps.byOwnerName.set(normalizeForMatch(prop.owner_name).replace(/\s/g, ''), info);
          if (prop.owner_address) matchMaps.byOwnerAddress.set(normalizeForMatch(prop.owner_address).replace(/\s/g, ''), info);
        });

        const matchedIds = new Set<string>();
        const matchReviewList: MatchDetail[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          const getValue = (idx: number) => idx >= 0 ? values[idx]?.replace(/"/g, '').trim() || '' : '';
          const csvOrigem = normalizeForMatch(getValue(origemIdx)).replace(/\s/g, '');
          const csvAddress = getValue(addressIdx);
          const csvAddressKey = createAddressKey(csvAddress);
          const csvOwnerName = normalizeForMatch(getValue(ownerNameIdx)).replace(/\s/g, '');
          const csvOwnerAddress = normalizeForMatch(getValue(ownerAddressIdx)).replace(/\s/g, '');

          let matchedProp: PropInfo | undefined;
          let matchedBy = '';
          if (csvOrigem && matchMaps.byOrigem.has(csvOrigem)) { matchedProp = matchMaps.byOrigem.get(csvOrigem); matchedBy = 'origem'; }
          else if (csvAddressKey && matchMaps.byAddressKey.has(csvAddressKey)) { matchedProp = matchMaps.byAddressKey.get(csvAddressKey); matchedBy = 'address'; }
          else if (csvOwnerName && matchMaps.byOwnerName.has(csvOwnerName)) { matchedProp = matchMaps.byOwnerName.get(csvOwnerName); matchedBy = 'owner_name'; }
          else if (csvOwnerAddress && matchMaps.byOwnerAddress.has(csvOwnerAddress)) { matchedProp = matchMaps.byOwnerAddress.get(csvOwnerAddress); matchedBy = 'owner_address'; }

          if (matchedProp) {
            matchedIds.add(matchedProp.id);
            matchReviewList.push({
              csvRow: i, csvAddress, csvOwnerName: getValue(ownerNameIdx >= 0 ? ownerNameIdx : -1),
              csvOrigem: getValue(origemIdx >= 0 ? origemIdx : -1), dbId: matchedProp.id,
              dbAddress: matchedProp.address, dbOwnerName: matchedProp.owner_name,
              dbOrigem: matchedProp.origem, matchedBy, approved: true,
            });
          }
          if (i % 100 === 0 || i === totalToProcess) {
            setImportPreview(prev => prev ? { ...prev, progress: 30 + Math.round((i / totalToProcess) * 60) } : prev);
          }
        }

        const matchCount = matchedIds.size;
        setApprovedMatches(new Set(matchReviewList.map(m => m.dbId)));
        setImportPreview({
          toInsert: totalRows - matchCount, toUpdate: updateExisting ? matchCount : 0,
          toSkip: updateExisting ? 0 : matchCount, existingAccounts: matchedIds,
          isLoading: false, progress: 100, matchedFields, dbFieldsCount, matchReview: matchReviewList,
        });
      } catch {
        setImportPreview({ toInsert: totalRows, toUpdate: 0, toSkip: 0, existingAccounts: new Set(), isLoading: false, progress: 100, matchedFields: [], dbFieldsCount: emptyDbCount });
      } finally { isCalculatingRef.current = false; }
    };
    reader.readAsText(csvFile);
  }, [csvFile, totalRows, updateExisting]);

  const handleMappingChange = useCallback((mappings: ColumnMapping[]) => {
    setColumnMappings(mappings);
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    previewTimeoutRef.current = setTimeout(() => calculateImportPreview(mappings), 500);
  }, [calculateImportPreview]);

  // ── Import execution ──

  const handleImport = useCallback(async () => {
    if (!csvFile) { toast({ title: "Erro", description: "Carregue um arquivo CSV primeiro", variant: "destructive" }); return; }
    if (!userId || !userName) { toast({ title: "Erro", description: "Você precisa estar logado para importar", variant: "destructive" }); return; }
    const addressMapping = columnMappings.find(m => m.dbField === 'address');
    const origemMapping = columnMappings.find(m => m.dbField === 'origem');
    if (!addressMapping && !origemMapping) { toast({ title: "Erro", description: "Mapeie pelo menos a coluna 'Endereço' ou 'ID Único'", variant: "destructive" }); return; }

    setIsImporting(true); setImportProgress(0); setImportStatus("Lendo arquivo CSV..."); setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const lines = content.trim().split('\n');
      const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, ''));

      let imported = 0, updated = 0, errors = 0, skipped = 0;

      const imageMap = new Map<string, string>();
      uploadedImages.forEach(img => { imageMap.set(img.name.replace(/\.[^.]+$/, ''), img.url); });

      const mappingLookup = new Map<string, DatabaseFieldKey>();
      columnMappings.forEach(m => { if (m.dbField && m.dbField !== 'skip') mappingLookup.set(m.csvColumn, m.dbField as DatabaseFieldKey); });

      // Dynamic column creation
      const csvToDbColumnMap = new Map<string, string>();
      const columnsToCreate: Array<{ normalized: string; type: string }> = [];
      headers.forEach(header => {
        const n = normalizeColumnName(header);
        if (!n || KNOWN_COLUMNS.has(n)) {
          const mapping = columnMappings.find(m => m.csvColumn === header);
          if (mapping?.dbField && mapping.dbField !== 'skip') csvToDbColumnMap.set(header, mapping.dbField);
          return;
        }
        csvToDbColumnMap.set(header, n);
        if (!columnsToCreate.some(c => c.normalized === n)) columnsToCreate.push({ normalized: n, type: inferColumnType(n) });
      });

      if (columnsToCreate.length > 0) {
        setImportStatus(`Criando ${columnsToCreate.length} novas colunas...`);
        for (const col of columnsToCreate) {
          try { await supabase.rpc('add_column_if_not_exists', { p_table_name: 'properties', p_column_name: col.normalized, p_column_type: col.type }); } catch {}
        }
      }

      const failedRows: Array<{ line: number; account: string; address: string; error: string }> = [];

      setImportStatus("Verificando properties existentes...");
      const { data: existingProperties } = await supabase.from('properties').select('origem, id, address, owner_name, owner_address');
      const existingByOrigem = new Map<string, { id: string }>();
      const existingByAddressKey = new Map<string, { id: string }>();
      const existingByOwnerName = new Map<string, { id: string }>();
      existingProperties?.forEach(p => {
        if (p.origem) existingByOrigem.set(p.origem.toLowerCase().trim(), { id: p.id });
        if (p.address) { const k = createAddressKey(p.address); if (k) existingByAddressKey.set(k, { id: p.id }); }
        if (p.owner_name) { const k = p.owner_name.toLowerCase().replace(/[^a-z0-9]/g, ''); if (k) existingByOwnerName.set(k, { id: p.id }); }
      });

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCSVLine(lines[i]);
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => { row[h] = values[idx]?.replace(/"/g, '') || ''; });
          const processedRow = processRowWithCombinedFields(row, combinedFields);
          Object.assign(row, processedRow);

          const propertyData: Record<string, any> = { lead_status: 'new', approval_status: 'pending', status: 'active', import_batch: batchName, import_date: new Date().toISOString().split('T')[0] };

          headers.forEach(csvCol => {
            const dbField = mappingLookup.get(csvCol);
            if (!dbField) return;
            const value = row[csvCol];
            if (!value) return;
            switch (dbField) {
              case 'bedrooms': case 'square_feet': case 'lot_size': case 'year_built': case 'lead_score': propertyData[dbField] = parseInt(value) || null; break;
              case 'bathrooms': case 'estimated_value': case 'cash_offer_amount': case 'comparative_price': propertyData[dbField] = parseFloat(value) || null; break;
              case 'tags': propertyData[dbField] = value.split(',').map(t => t.trim()).filter(Boolean); break;
              default: propertyData[dbField] = value;
            }
          });

          headers.forEach(csvCol => {
            const dynamicDbField = csvToDbColumnMap.get(csvCol);
            if (!dynamicDbField || propertyData[dynamicDbField] !== undefined) return;
            const value = row[csvCol];
            if (value) propertyData[dynamicDbField] = value;
          });

          const accountNumber = propertyData['origem'] || '';
          const propertyAddress = propertyData['address'] || '';
          if (!accountNumber && !propertyAddress) { errors++; failedRows.push({ line: i, account: 'N/A', address: 'N/A', error: 'Missing identifiers' }); continue; }

          let existingPropId: string | null = null;
          let matchedBy = '';
          if (accountNumber) { const m = existingByOrigem.get(accountNumber.toLowerCase().trim()); if (m) { existingPropId = m.id; matchedBy = 'origem'; } }
          if (!existingPropId && propertyAddress) { const k = createAddressKey(propertyAddress); if (k) { const m = existingByAddressKey.get(k); if (m) { existingPropId = m.id; matchedBy = 'address'; } } }
          if (!existingPropId && propertyData.owner_name) { const k = String(propertyData.owner_name).toLowerCase().replace(/[^a-z0-9]/g, ''); if (k) { const m = existingByOwnerName.get(k); if (m) { existingPropId = m.id; matchedBy = 'owner_name'; } } }

          if (existingPropId && (!updateExisting || !approvedMatches.has(existingPropId))) { skipped++; continue; }

          propertyData.slug = generateSlug(propertyAddress || accountNumber);
          if (!propertyData.zip_code && propertyAddress) { const m = propertyAddress.match(/\b\d{5}(?:-\d{4})?\b/g); if (m?.length) propertyData.zip_code = m[m.length - 1].slice(0, 5); }
          if (!propertyData.city) propertyData.city = 'Orlando';
          if (!propertyData.state) propertyData.state = 'FL';
          if (!propertyData.estimated_value || propertyData.estimated_value === 0) propertyData.estimated_value = propertyData.just_value || propertyData.taxable_value || 100000;
          if (!propertyData.cash_offer_amount || propertyData.cash_offer_amount === 0) propertyData.cash_offer_amount = propertyData.estimated_value > 0 ? defaultOffer(propertyData.estimated_value) : 70000;
          if (!propertyData.property_image_url && accountNumber) propertyData.property_image_url = imageMap.get(accountNumber) || '';
          if (importTags.trim()) { const uiTags = importTags.split(',').map(t => t.trim()).filter(Boolean); propertyData.tags = [...new Set([...(Array.isArray(propertyData.tags) ? propertyData.tags : []), ...uiTags])]; }

          Object.keys(propertyData).forEach(key => { if (propertyData[key] === null || propertyData[key] === undefined || propertyData[key] === '') { if (!['bedrooms','bathrooms','square_feet','year_built','lot_size'].includes(key)) delete propertyData[key]; } });

          if (existingPropId && updateExisting) {
            const updateData = { ...propertyData };
            ['approval_status','approved_by','approved_by_name','approved_at','rejection_reason','rejection_notes','lead_status','status'].forEach(k => delete updateData[k]);
            const { error } = await supabase.from('properties').update(updateData as any).eq('id', existingPropId);
            if (error) { errors++; failedRows.push({ line: i, account: accountNumber, address: propertyAddress, error: error.message }); } else updated++;
          } else if (!existingPropId) {
            const { error } = await supabase.from('properties').insert(propertyData as any);
            if (error) { errors++; failedRows.push({ line: i, account: accountNumber, address: propertyAddress, error: error.message }); } else imported++;
          }

          setImportProgress(Math.round((i / (lines.length - 1)) * 100));
          setImportStatus(`Importando ${i}/${lines.length - 1}...`);
        } catch (error: any) { errors++; failedRows.push({ line: i, account: 'unknown', address: 'unknown', error: error.message || 'Unknown' }); }
      }

      if (failedRows.length > 0) {
        const failedCsv = headers.join(',') + '\n' + failedRows.map(f => lines[f.line]).join('\n');
        const blob = new Blob([failedCsv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `failed_imports_${new Date().toISOString().split('T')[0]}.csv`; a.click();
        URL.revokeObjectURL(url);
      }

      setImportResult({ imported, updated, errors }); setIsImporting(false); setImportStatus("");
      toast({ title: "Importação Completa! 🎉", description: `${imported} novas, ${updated} atualizadas, ${skipped} puladas, ${errors} erros` });
    };
    reader.readAsText(csvFile);
  }, [csvFile, userId, userName, columnMappings, uploadedImages, combinedFields, batchName, importTags, updateExisting, approvedMatches, toast]);

  const downloadSampleCSV = useCallback(() => {
    const sampleData = `account_number,property_address,city,state,zip_code,owner_name,just_value,beds,baths,sqft,year_built,condition_score,photo_url
28-22-29-1234,123 Main St,Orlando,FL,32801,John Doe,150000,3,2,1500,1985,7,
28-22-29-5678,456 Oak Ave,Orlando,FL,32803,Jane Smith,200000,4,2.5,2000,1990,8,`;
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sample_properties.csv'; a.click();
    URL.revokeObjectURL(url);
  }, []);

  return {
    // Image
    imageFiles, handleImageSelect, handleUploadImages, uploadedImages, isUploadingImages, imageUploadProgress,
    // CSV
    csvFile, csvPreview, csvHeaders, totalRows, csvErrors, columnMappings, showMappingDialog, combinedFields, setCombinedFields,
    handleCSVSelect, handleMappingChange,
    // Import
    importPreview, approvedMatches, setApprovedMatches, isImporting, importProgress, importStatus, importResult,
    handleImport, calculateImportPreview, downloadSampleCSV,
    // Options
    batchName, setBatchName, importTags, setImportTags, updateExisting, setUpdateExisting, setImportPreview,
  };
};

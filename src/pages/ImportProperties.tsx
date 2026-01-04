import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import ColumnMappingDialog, { ColumnMapping, DatabaseFieldKey } from "@/components/ColumnMappingDialog";
import { FieldCombiner, CombinedField } from "@/components/FieldCombiner";
import { processRowWithCombinedFields } from "@/utils/fieldCombinerUtils";
import { SkipTracingImporter } from "@/components/SkipTracingImporter";
import {
  Upload,
  Image,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Download,
  Eye,
  Database,
  Trash2,
  Settings2,
  RefreshCw,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CSVPreviewRow {
  [key: string]: string;
}

interface UploadedImage {
  name: string;
  url: string;
  status: 'success' | 'error';
}

const ImportProperties = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId, userName } = useCurrentUser();

  // Image upload state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CSVPreviewRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [combinedFields, setCombinedFields] = useState<CombinedField[]>([]);

  // Import preview state
  const [importPreview, setImportPreview] = useState<{
    toInsert: number;
    toUpdate: number;
    toSkip: number;
    existingAccounts: Set<string>;
    isLoading: boolean;
    progress: number;
    matchedFields: { csvColumn: string; dbField: string }[];
    dbFieldsCount: { origem: number; address: number; owner_name: number; owner_address: number };
  } | null>(null);
  
  // Use useRef instead of useState for timeout and lock - FIXES THE LOOP
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCalculatingRef = useRef(false);

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState("");
  const [importResult, setImportResult] = useState<{
    imported: number;
    updated: number;
    errors: number;
  } | null>(null);

  // Options
  const [batchName, setBatchName] = useState(`Import-${new Date().toISOString().split('T')[0]}`);
  const [updateExisting, setUpdateExisting] = useState(true);

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const imageArray = Array.from(files).filter(f => 
        f.type.startsWith('image/') || f.name.match(/\.(jpg|jpeg|png|webp)$/i)
      );
      setImageFiles(imageArray);
      toast({
        title: "Imagens Selecionadas",
        description: `${imageArray.length} imagens prontas para upload`,
      });
    }
  };

  // Upload images to Supabase Storage
  const handleUploadImages = async () => {
    if (imageFiles.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione imagens primeiro",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImages(true);
    setImageUploadProgress(0);
    setUploadedImages([]);

    const results: UploadedImage[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

      try {
        const { data, error } = await supabase.storage
          .from('property-images')
          .upload(`imports/${batchName}/${fileName}`, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(data.path);

        results.push({
          name: file.name,
          url: publicUrl,
          status: 'success',
        });
      } catch (error: any) {
        results.push({
          name: file.name,
          url: '',
          status: 'error',
        });
        console.error(`Error uploading ${file.name}:`, error);
      }

      setImageUploadProgress(Math.round(((i + 1) / imageFiles.length) * 100));
      setUploadedImages([...results]);
    }

    setIsUploadingImages(false);

    const successCount = results.filter(r => r.status === 'success').length;
    toast({
      title: "Upload Completo",
      description: `${successCount}/${imageFiles.length} imagens carregadas com sucesso`,
    });
  };

  // Parse CSV line handling quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Handle CSV file selection
  const handleCSVSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo CSV",
        variant: "destructive",
      });
      return;
    }

    setCsvFile(file);
    setCsvErrors([]);

    // Read and parse CSV
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.trim().split('\n');

      if (lines.length < 2) {
        setCsvErrors(["Arquivo CSV vazio ou inválido"]);
        return;
      }

      // Parse headers
      const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim());

      console.log('=== CSV DEBUG ===');
      console.log('Total lines:', lines.length);
      console.log('Headers found:', headers.length);
      console.log('First 10 headers:', headers.slice(0, 10));
      console.log('Has account_number?', headers.includes('account_number'));
      console.log('Has property_address?', headers.includes('property_address'));

      setCsvHeaders(headers);
      setTotalRows(lines.length - 1);

      // Parse preview (first 5 rows)
      const preview: CSVPreviewRow[] = [];
      for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
        const values = parseCSVLine(lines[i]);
        const row: CSVPreviewRow = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx]?.replace(/"/g, '').trim() || '';
        });
        preview.push(row);
      }
      setCsvPreview(preview);

      console.log('Preview first row:', preview[0]);

      // No strict validation - allow any CSV structure
      // User will map columns in the mapping dialog
      console.log('CSV loaded - proceeding to column mapping dialog');
      setCsvErrors([]);
      setShowMappingDialog(true);

      toast({
        title: "CSV Carregado",
        description: `${lines.length - 1} propriedades encontradas. Configure o mapeamento de colunas.`,
      });
    };

    reader.readAsText(file);
  };

  // Handle column mapping changes and calculate preview with debounce
  const handleMappingChange = async (mappings: ColumnMapping[]) => {
    setColumnMappings(mappings);
    
    // Debounce the preview calculation to avoid multiple calls
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    
    previewTimeoutRef.current = setTimeout(() => {
      calculateImportPreview(mappings);
    }, 500); // Wait 500ms after last change before calculating
  };

  // Normalize string for comparison - extract key parts only
  const normalizeForMatch = (str: string | null | undefined): string => {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Keep spaces for word splitting
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Create address key for matching - extracts just the essential parts
  // IMPORTANT: This removes ZIP codes, cities, and state to match addresses flexibly
  const createAddressKey = (address: string): string => {
    if (!address) return '';
    
    const normalized = address.trim().toUpperCase();
    
    // Remove common suffixes that vary between records
    const cleaned = normalized
      .replace(/,?\s*(FL|FLORIDA)\s*\d{5}(-\d{4})?/gi, '') // Remove state + zip
      .replace(/\s+\d{5}(-\d{4})?\s*$/gi, '') // Remove trailing ZIP code alone
      .replace(/,?\s*\d{5}(-\d{4})?\s*$/gi, '') // Remove trailing ZIP with comma
      .replace(/,?\s*ORLANDO\s*/gi, '') // Remove city names
      .replace(/,?\s*UNINCORPORATED\s*/gi, '')
      .replace(/,?\s*BELLE ISLE\s*/gi, '')
      .replace(/,?\s*EATONVILLE\s*/gi, '')
      .replace(/,?\s*APOPKA\s*/gi, '')
      .replace(/,?\s*WINTER GARDEN\s*/gi, '')
      .replace(/,?\s*WINTER PARK\s*/gi, '')
      .replace(/,?\s*MAITLAND\s*/gi, '')
      .replace(/,?\s*OCOEE\s*/gi, '')
      .replace(/,?\s*KISSIMMEE\s*/gi, '')
      .replace(/,?\s*SANFORD\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Extract street number and first 3 words of street name
    const parts = cleaned.split(' ');
    const numberMatch = parts[0]?.match(/^\d+$/);
    
    if (numberMatch) {
      // Has street number: take number + next 3 words
      const streetParts = parts.slice(0, 4).join(' ');
      return streetParts.toLowerCase().replace(/[^a-z0-9]/g, '');
    } else {
      // No street number: take first 3 words
      const streetParts = parts.slice(0, 3).join(' ');
      return streetParts.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
  };

  // Calculate how many records will be inserted vs updated
  const calculateImportPreview = async (mappings: ColumnMapping[]) => {
    if (!csvFile || mappings.length === 0) return;
    
    // Prevent concurrent calculations
    if (isCalculatingRef.current) {
      console.log('Preview calculation already in progress, skipping...');
      return;
    }
    isCalculatingRef.current = true;

    // Find all relevant mappings for matching
    const origemMapping = mappings.find(m => m.dbField === 'origem');
    const addressMapping = mappings.find(m => m.dbField === 'address');
    const ownerNameMapping = mappings.find(m => m.dbField === 'owner_name');
    const ownerAddressMapping = mappings.find(m => m.dbField === 'owner_address');

    // Build matchedFields list for display
    const matchedFields: { csvColumn: string; dbField: string }[] = [];
    if (origemMapping) matchedFields.push({ csvColumn: origemMapping.csvColumn, dbField: 'origem' });
    if (addressMapping) matchedFields.push({ csvColumn: addressMapping.csvColumn, dbField: 'address' });
    if (ownerNameMapping) matchedFields.push({ csvColumn: ownerNameMapping.csvColumn, dbField: 'owner_name' });
    if (ownerAddressMapping) matchedFields.push({ csvColumn: ownerAddressMapping.csvColumn, dbField: 'owner_address' });

    setImportPreview({
      toInsert: 0,
      toUpdate: 0,
      toSkip: 0,
      existingAccounts: new Set(),
      isLoading: true,
      progress: 0,
      matchedFields,
      dbFieldsCount: { origem: 0, address: 0, owner_name: 0, owner_address: 0 },
    });

    // If no matchable fields are mapped, all are new inserts
    if (!origemMapping && !addressMapping && !ownerNameMapping && !ownerAddressMapping) {
      console.log('Nenhum campo de match mapeado - todos serão inseridos como novos');
      setImportPreview({
        toInsert: totalRows,
        toUpdate: 0,
        toSkip: 0,
        existingAccounts: new Set(),
        isLoading: false,
        progress: 100,
        matchedFields: [],
        dbFieldsCount: { origem: 0, address: 0, owner_name: 0, owner_address: 0 },
      });
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
        
        // Build index maps for CSV columns
        const getColIdx = (mapping: ColumnMapping | undefined) => 
          mapping ? headers.indexOf(mapping.csvColumn) : -1;
        
        const origemIdx = getColIdx(origemMapping);
        const addressIdx = getColIdx(addressMapping);
        const ownerNameIdx = getColIdx(ownerNameMapping);
        const ownerAddressIdx = getColIdx(ownerAddressMapping);

        // Show progress: 10% - fetching DB
        setImportPreview(prev => prev ? { ...prev, progress: 10 } : prev);

        // Fetch ALL existing properties for matching (only once)
        console.log('Buscando propriedades existentes para matching...');
        const { data: existingProperties, error } = await supabase
          .from('properties')
          .select('id, origem, address, owner_name, owner_address');

        if (error) {
          console.error('Erro ao buscar propriedades:', error);
          setImportPreview({
            toInsert: totalRows,
            toUpdate: 0,
            toSkip: 0,
            existingAccounts: new Set(),
            isLoading: false,
            progress: 100,
            matchedFields,
            dbFieldsCount: { origem: 0, address: 0, owner_name: 0, owner_address: 0 },
          });
          isCalculatingRef.current = false;
          return;
        }

        console.log(`Encontradas ${existingProperties?.length || 0} propriedades no banco`);

        // Count fields in DB for display
        const dbFieldsCount = {
          origem: existingProperties?.filter(p => p.origem).length || 0,
          address: existingProperties?.filter(p => p.address).length || 0,
          owner_name: existingProperties?.filter(p => p.owner_name).length || 0,
          owner_address: existingProperties?.filter(p => p.owner_address).length || 0,
        };

        // Show progress: 30% - building indexes
        setImportPreview(prev => prev ? { ...prev, progress: 30, dbFieldsCount } : prev);

        // Create normalized lookup maps for fast matching
        const matchMaps = {
          byOrigem: new Map<string, string>(),
          byAddressKey: new Map<string, string>(),
          byOwnerName: new Map<string, string>(),
          byOwnerAddress: new Map<string, string>(),
        };

        existingProperties?.forEach(prop => {
          if (prop.origem) {
            matchMaps.byOrigem.set(normalizeForMatch(prop.origem).replace(/\s/g, ''), prop.id);
          }
          if (prop.address) {
            const addrKey = createAddressKey(prop.address);
            if (addrKey) {
              matchMaps.byAddressKey.set(addrKey, prop.id);
            }
          }
          if (prop.owner_name) {
            matchMaps.byOwnerName.set(normalizeForMatch(prop.owner_name).replace(/\s/g, ''), prop.id);
          }
          if (prop.owner_address) {
            matchMaps.byOwnerAddress.set(normalizeForMatch(prop.owner_address).replace(/\s/g, ''), prop.id);
          }
        });

        console.log(`Índices criados: ${matchMaps.byAddressKey.size} endereços únicos`);

        // DEBUG: Show sample of DB address keys
        console.log('=== DEBUG: Amostras de chaves de endereço do BANCO ===');
        const dbAddrSamples = Array.from(matchMaps.byAddressKey.entries()).slice(0, 10);
        dbAddrSamples.forEach(([key, id]) => {
          console.log(`  DB Key: "${key}" -> ID: ${id.substring(0, 8)}...`);
        });

        // Process each CSV row and check for matches
        const matchedIds = new Set<string>();
        const matchDetails: { row: number; csvAddr: string; csvKey: string; dbKey: string }[] = [];
        const noMatchDetails: { row: number; csvAddr: string; csvKey: string }[] = [];

        console.log('=== DEBUG: Processando linhas do CSV ===');

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          
          const getValue = (idx: number) => idx >= 0 ? values[idx]?.replace(/"/g, '').trim() || '' : '';
          
          const csvOrigem = normalizeForMatch(getValue(origemIdx)).replace(/\s/g, '');
          const csvAddress = getValue(addressIdx);
          const csvAddressKey = createAddressKey(csvAddress);
          const csvOwnerName = normalizeForMatch(getValue(ownerNameIdx)).replace(/\s/g, '');
          const csvOwnerAddress = normalizeForMatch(getValue(ownerAddressIdx)).replace(/\s/g, '');

          // DEBUG: Log first 5 CSV rows being processed
          if (i <= 5) {
            console.log(`\n--- CSV Row ${i} ---`);
            console.log(`  CSV Address Raw: "${csvAddress}"`);
            console.log(`  CSV Address Key: "${csvAddressKey}"`);
            console.log(`  CSV Origem: "${csvOrigem}"`);
            console.log(`  CSV Owner Name: "${csvOwnerName}"`);
            
            // Check if key exists in DB
            const dbMatch = matchMaps.byAddressKey.get(csvAddressKey);
            if (dbMatch) {
              console.log(`  ✓ MATCH FOUND in DB!`);
            } else {
              // Find similar keys in DB for debugging
              const similarKeys = Array.from(matchMaps.byAddressKey.keys())
                .filter(k => k.includes(csvAddressKey.substring(0, 10)) || csvAddressKey.includes(k.substring(0, 10)))
                .slice(0, 3);
              if (similarKeys.length > 0) {
                console.log(`  ✗ No match. Similar DB keys: ${similarKeys.join(', ')}`);
              } else {
                console.log(`  ✗ No match found`);
              }
            }
          }

          // Try to find a match using any of the fields
          let matchedId: string | undefined;
          let matchedBy = '';

          // Priority: origem > address > owner_name > owner_address
          if (csvOrigem && matchMaps.byOrigem.has(csvOrigem)) {
            matchedId = matchMaps.byOrigem.get(csvOrigem);
            matchedBy = 'origem';
          } else if (csvAddressKey && matchMaps.byAddressKey.has(csvAddressKey)) {
            matchedId = matchMaps.byAddressKey.get(csvAddressKey);
            matchedBy = 'address';
            matchDetails.push({ row: i, csvAddr: csvAddress, csvKey: csvAddressKey, dbKey: csvAddressKey });
          } else if (csvOwnerName && matchMaps.byOwnerName.has(csvOwnerName)) {
            matchedId = matchMaps.byOwnerName.get(csvOwnerName);
            matchedBy = 'owner_name';
          } else if (csvOwnerAddress && matchMaps.byOwnerAddress.has(csvOwnerAddress)) {
            matchedId = matchMaps.byOwnerAddress.get(csvOwnerAddress);
            matchedBy = 'owner_address';
          }

          if (matchedId) {
            matchedIds.add(matchedId);
            if (i <= 10) {
              console.log(`  ✓ Row ${i} matched by ${matchedBy}`);
            }
          } else if (csvAddressKey && noMatchDetails.length < 10) {
            noMatchDetails.push({ row: i, csvAddr: csvAddress, csvKey: csvAddressKey });
          }

          // Update progress every 100 rows (30% to 90%)
          if (i % 100 === 0 || i === totalToProcess) {
            const progressPct = 30 + Math.round((i / totalToProcess) * 60);
            setImportPreview(prev => prev ? { ...prev, progress: progressPct } : prev);
          }
        }

        const matchCount = matchedIds.size;
        console.log(`\n=== RESULTADO FINAL ===`);
        console.log(`✓ Encontradas ${matchCount} correspondências únicas!`);
        
        if (matchDetails.length > 0) {
          console.log('\nMatches encontrados:');
          matchDetails.slice(0, 5).forEach(m => {
            console.log(`  Row ${m.row}: "${m.csvAddr}" -> Key: "${m.csvKey}"`);
          });
        }
        
        if (noMatchDetails.length > 0) {
          console.log('\nEndereços SEM match (primeiros 10):');
          noMatchDetails.forEach(m => {
            console.log(`  Row ${m.row}: "${m.csvAddr}" -> Key: "${m.csvKey}"`);
          });
        }

        const toUpdate = updateExisting ? matchCount : 0;
        const toInsert = totalRows - matchCount;
        const toSkip = updateExisting ? 0 : matchCount;

        setImportPreview({
          toInsert,
          toUpdate,
          toSkip,
          existingAccounts: matchedIds,
          isLoading: false,
          progress: 100,
          matchedFields,
          dbFieldsCount,
        });
      } catch (err) {
        console.error('Erro no cálculo de preview:', err);
        setImportPreview({
          toInsert: totalRows,
          toUpdate: 0,
          toSkip: 0,
          existingAccounts: new Set(),
          isLoading: false,
          progress: 100,
          matchedFields: [],
          dbFieldsCount: { origem: 0, address: 0, owner_name: 0, owner_address: 0 },
        });
      } finally {
        isCalculatingRef.current = false;
      }
    };
    reader.readAsText(csvFile);
  };

  // Generate slug from address
  const generateSlug = (address: string): string => {
    return address
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100);
  };

  // Import CSV data to database
  const handleImport = async () => {
    if (!csvFile) {
      toast({
        title: "Erro",
        description: "Carregue um arquivo CSV primeiro",
        variant: "destructive",
      });
      return;
    }

    if (!userId || !userName) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para importar",
        variant: "destructive",
      });
      return;
    }

    // Check if at least address is mapped
    const addressMapping = columnMappings.find(m => m.dbField === 'address');
    const origemMapping = columnMappings.find(m => m.dbField === 'origem');
    
    if (!addressMapping && !origemMapping) {
      toast({
        title: "Erro",
        description: "Mapeie pelo menos a coluna 'Endereço' ou 'ID Único'",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportStatus("Lendo arquivo CSV...");
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const lines = content.trim().split('\n');
      const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, ''));

      let imported = 0;
      let updated = 0;
      let errors = 0;
      let skipped = 0;

      // Create image URL map from uploaded images
      const imageMap = new Map<string, string>();
      uploadedImages.forEach(img => {
        const accountNum = img.name.replace(/\.[^.]+$/, '');
        imageMap.set(accountNum, img.url);
      });

      // Create mapping lookup: csvColumn -> dbField
      const mappingLookup = new Map<string, DatabaseFieldKey>();
      columnMappings.forEach(m => {
        if (m.dbField && m.dbField !== 'skip') {
          mappingLookup.set(m.csvColumn, m.dbField as DatabaseFieldKey);
        }
      });

      // === DYNAMIC COLUMN CREATION ===
      console.log('=== DYNAMIC COLUMN CREATION DEBUG ===');
      console.log('Column mappings:', columnMappings.map(m => ({ csv: m.csvColumn, db: m.dbField })));
      
      // List of known database columns
      const knownColumns = [
        'id', 'slug', 'address', 'city', 'state', 'zip_code', 'property_image_url',
        'estimated_value', 'cash_offer_amount', 'status', 'created_at', 'updated_at',
        'sms_sent', 'email_sent', 'letter_sent', 'card_sent', 'phone_call_made',
        'meeting_scheduled', 'lead_status', 'owner_address', 'owner_name', 'owner_phone',
        'answer_flag', 'dnc_flag', 'neighborhood', 'origem', 'carta', 'zillow_url',
        'evaluation', 'focar', 'comparative_price', 'lead_score', 'tags', 'approval_status',
        'approved_by', 'approved_by_name', 'approved_at', 'rejection_reason', 'rejection_notes',
        'updated_by', 'updated_by_name', 'airbnb_eligible', 'airbnb_check_date', 'airbnb_regulations',
        'airbnb_notes', 'import_date', 'import_batch', 'last_contact_date', 'next_followup_date',
        'county', 'property_type', 'bedrooms', 'bathrooms', 'square_feet', 'lot_size', 'year_built',
        'lead_captured', 'lead_captured_at'
      ];
      
      // Find columns that are mapped but don't exist in database
      const columnsToCreate: string[] = [];
      columnMappings.forEach(m => {
        if (m.dbField && m.dbField !== 'skip' && !knownColumns.includes(m.dbField)) {
          columnsToCreate.push(m.dbField);
        }
      });
      
      console.log('Columns to potentially create:', columnsToCreate);
      
      if (columnsToCreate.length > 0) {
        setImportStatus(`Criando ${columnsToCreate.length} novas colunas...`);
        
        for (const columnName of columnsToCreate) {
          // Normalize column name for database
          const normalizedName = columnName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
          
          // Determine column type
          let columnType = 'text';
          if (normalizedName.includes('age') || normalizedName.includes('beds') || normalizedName.includes('sqft') || normalizedName.includes('year')) {
            columnType = 'integer';
          } else if (normalizedName.includes('baths') || normalizedName.includes('value') || normalizedName.includes('size')) {
            columnType = 'numeric';
          } else if (normalizedName.includes('deceased') || normalizedName.includes('is_') || normalizedName.includes('has_')) {
            columnType = 'boolean';
          }
          
          console.log(`Attempting to create column: ${normalizedName} (${columnType})`);
          
          try {
            const { data, error } = await supabase.rpc('add_column_if_not_exists', {
              p_table_name: 'properties',
              p_column_name: normalizedName,
              p_column_type: columnType,
            });
            
            if (error) {
              console.error(`Failed to create column ${normalizedName}:`, error);
            } else if (data === true) {
              console.log(`✅ Created column: ${normalizedName} (${columnType})`);
            } else {
              console.log(`Column ${normalizedName} already exists`);
            }
          } catch (err) {
            console.error(`Error creating column ${normalizedName}:`, err);
          }
        }
      } else {
        console.log('No new columns to create - all mapped to known columns');
      }
      // === END DYNAMIC COLUMN CREATION ===

      const failedRows: Array<{line: number, account: string, address: string, error: string}> = [];
      const skippedRows: Array<{line: number, account: string, address: string, reason: string}> = [];

      // Fetch ALL existing properties to check in batch (much faster than checking one by one)
      setImportStatus("Verificando properties existentes...");
      const { data: existingProperties } = await supabase
        .from('properties')
        .select('origem, id, address, owner_name, owner_address');

      // Create multiple lookup maps for flexible matching
      const existingByOrigem = new Map<string, { id: string; address: string }>();
      const existingByAddressKey = new Map<string, { id: string; address: string }>();
      const existingByOwnerName = new Map<string, { id: string; address: string }>();
      
      existingProperties?.forEach(p => {
        if (p.origem) {
          existingByOrigem.set(p.origem.toLowerCase().trim(), { id: p.id, address: p.address || '' });
        }
        if (p.address) {
          const addrKey = createAddressKey(p.address);
          if (addrKey) {
            existingByAddressKey.set(addrKey, { id: p.id, address: p.address });
          }
        }
        if (p.owner_name) {
          const ownerKey = p.owner_name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (ownerKey) {
            existingByOwnerName.set(ownerKey, { id: p.id, address: p.address || '' });
          }
        }
      });

      console.log(`Found ${existingProperties?.length || 0} existing properties:`);
      console.log(`  - ${existingByOrigem.size} with origem`);
      console.log(`  - ${existingByAddressKey.size} with address key`);
      console.log(`  - ${existingByOwnerName.size} with owner name`);

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCSVLine(lines[i]);
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx]?.replace(/"/g, '') || '';
          });

          // Process combined fields
          const processedRow = processRowWithCombinedFields(row, combinedFields);
          Object.assign(row, processedRow);

          // Build property data from mappings
          const propertyData: Record<string, any> = {
            lead_status: 'new',
            approval_status: 'pending',
            status: 'active',
            import_batch: batchName,
            import_date: new Date().toISOString().split('T')[0],
          };

          // Apply mappings
          headers.forEach(csvCol => {
            const dbField = mappingLookup.get(csvCol);
            if (!dbField) return;

            const value = row[csvCol];
            if (!value) return;

            // Parse values based on field type
            switch (dbField) {
              case 'bedrooms':
              case 'square_feet':
              case 'lot_size':
              case 'year_built':
              case 'lead_score':
                propertyData[dbField] = parseInt(value) || null;
                break;
              case 'bathrooms':
              case 'estimated_value':
              case 'cash_offer_amount':
              case 'comparative_price':
                propertyData[dbField] = parseFloat(value) || null;
                break;
              case 'tags':
                propertyData[dbField] = value.split(',').map(t => t.trim()).filter(Boolean);
                break;
              default:
                propertyData[dbField] = value;
            }
          });

          // Get unique identifier
          const accountNumber = propertyData['origem'] || '';
          const propertyAddress = propertyData['address'] || '';

          if (!accountNumber && !propertyAddress) {
            failedRows.push({
              line: i,
              account: 'N/A',
              address: 'N/A',
              error: 'Missing account_number and property_address'
            });
            errors++;
            continue;
          }

          // Find existing property using multiple match strategies
          let existingPropId: string | null = null;
          let matchedBy = '';

          // Priority 1: Match by origem (account_number)
          if (accountNumber) {
            const origemKey = accountNumber.toLowerCase().trim();
            const match = existingByOrigem.get(origemKey);
            if (match) {
              existingPropId = match.id;
              matchedBy = 'origem';
            }
          }

          // Priority 2: Match by address key
          if (!existingPropId && propertyAddress) {
            const addrKey = createAddressKey(propertyAddress);
            if (addrKey) {
              const match = existingByAddressKey.get(addrKey);
              if (match) {
                existingPropId = match.id;
                matchedBy = 'address';
                console.log(`Matched by address: "${propertyAddress}" -> "${match.address}"`);
              }
            }
          }

          // Priority 3: Match by owner name
          if (!existingPropId && propertyData.owner_name) {
            const ownerKey = String(propertyData.owner_name).toLowerCase().replace(/[^a-z0-9]/g, '');
            if (ownerKey) {
              const match = existingByOwnerName.get(ownerKey);
              if (match) {
                existingPropId = match.id;
                matchedBy = 'owner_name';
              }
            }
          }

          // Check if already exists and skip if not updating
          if (existingPropId && !updateExisting) {
            skippedRows.push({
              line: i,
              account: accountNumber,
              address: propertyAddress,
              reason: `Already exists (matched by ${matchedBy})`
            });
            skipped++;
            continue;
          }

          // Generate slug
          propertyData.slug = generateSlug(propertyAddress || accountNumber);

          // Extract ZIP from property_address if not mapped
          if (!propertyData.zip_code && propertyAddress) {
            const zipMatch = propertyAddress.match(/\b(\d{5})(?:-\d{4})?\b/);
            if (zipMatch) {
              propertyData.zip_code = zipMatch[1];
              console.log(`Extracted ZIP ${zipMatch[1]} from address: ${propertyAddress}`);
            }
          }

          // Set defaults
          if (!propertyData.city) propertyData.city = 'Orlando';
          if (!propertyData.state) propertyData.state = 'FL';
          if (!propertyData.zip_code) {
            propertyData.zip_code = '32801'; // Default Orlando ZIP
            console.log('Using default ZIP code 32801');
          }

          // Handle estimated_value
          if (!propertyData.estimated_value || propertyData.estimated_value === 0) {
            // Try to get from just_value or taxable_value
            propertyData.estimated_value = propertyData.just_value || propertyData.taxable_value || 100000;
          }

          // Handle cash_offer_amount - REQUIRED field
          if (!propertyData.cash_offer_amount || propertyData.cash_offer_amount === 0) {
            if (propertyData.estimated_value && propertyData.estimated_value > 0) {
              propertyData.cash_offer_amount = Math.round(propertyData.estimated_value * 0.7);
            } else {
              propertyData.cash_offer_amount = 70000; // Default reasonable cash offer
            }
          }

          console.log(`Property: ${propertyAddress} - estimated_value: ${propertyData.estimated_value}, cash_offer: ${propertyData.cash_offer_amount}`);

          // Find matching image
          if (!propertyData.property_image_url && accountNumber) {
            propertyData.property_image_url = imageMap.get(accountNumber) || '';
          }

          // Clean up empty values
          Object.keys(propertyData).forEach(key => {
            if (propertyData[key] === null || propertyData[key] === undefined || propertyData[key] === '') {
              if (!['bedrooms', 'bathrooms', 'square_feet', 'year_built', 'lot_size'].includes(key)) {
                delete propertyData[key];
              }
            }
          });

          // UPDATE if property exists and updateExisting is true
          if (existingPropId && updateExisting) {
            const { error: updateError } = await supabase
              .from('properties')
              .update(propertyData as any)
              .eq('id', existingPropId);

            if (updateError) {
              console.error(`Update error (line ${i}):`, updateError);
              failedRows.push({
                line: i,
                account: accountNumber,
                address: propertyAddress,
                error: updateError.message
              });
              errors++;
            } else {
              updated++;
            }
          } else if (!existingPropId) {
            // INSERT new property
            const { error: insertError } = await supabase
              .from('properties')
              .insert(propertyData as any);

            if (insertError) {
              console.error(`Insert error (line ${i}):`, insertError);
              failedRows.push({
                line: i,
                account: accountNumber,
                address: propertyAddress,
                error: insertError.message
              });
              errors++;
            } else {
              imported++;
            }
          }

          setImportProgress(Math.round((i / (lines.length - 1)) * 100));
          setImportStatus(`Importando ${i}/${lines.length - 1}...`);

        } catch (error: any) {
          console.error(`Row error (line ${i}):`, error);
          failedRows.push({
            line: i,
            account: 'unknown',
            address: 'unknown',
            error: error.message || 'Unknown error'
          });
          errors++;
        }
      }

      // Log skipped rows
      if (skippedRows.length > 0) {
        console.log('\n=== SKIPPED ROWS (Already Imported) ===');
        console.log(`Total skipped: ${skippedRows.length}`);
        console.table(skippedRows);
      }

      // Log all failed rows
      if (failedRows.length > 0) {
        console.log('\n=== FAILED ROWS ===');
        console.log(`Total failed: ${failedRows.length}`);
        console.table(failedRows);

        // Create CSV content for failed rows
        const failedCsvHeaders = headers.join(',');
        const failedCsvRows = failedRows.map(f => {
          const lineContent = lines[f.line];
          return lineContent;
        }).join('\n');

        const failedCsv = failedCsvHeaders + '\n' + failedCsvRows;
        console.log('\n=== FAILED ROWS CSV ===');
        console.log('Copy the content below and save as CSV:');
        console.log(failedCsv);

        // Download failed rows as CSV
        const blob = new Blob([failedCsv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `failed_imports_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('✓ Failed rows CSV downloaded automatically');
      }

      // Final summary
      console.log('\n=== IMPORT SUMMARY ===');
      console.log(`Total processed: ${lines.length - 1}`);
      console.log(`✓ Imported (new): ${imported}`);
      console.log(`✓ Updated (existing): ${updated}`);
      console.log(`⏭ Skipped (already exists): ${skipped}`);
      console.log(`✗ Failed (errors): ${errors}`);

      setImportResult({ imported, updated, errors });
      setIsImporting(false);
      setImportStatus("");

      toast({
        title: "Importação Completa! 🎉",
        description: `${imported} novas, ${updated} atualizadas, ${skipped} puladas, ${errors} erros`,
      });
    };

    reader.readAsText(csvFile);
  };

  // Download sample CSV
  const downloadSampleCSV = () => {
    const sampleData = `account_number,property_address,city,state,zip_code,owner_name,just_value,beds,baths,sqft,year_built,condition_score,photo_url
28-22-29-1234,123 Main St,Orlando,FL,32801,John Doe,150000,3,2,1500,1985,7,
28-22-29-5678,456 Oak Ave,Orlando,FL,32803,Jane Smith,200000,4,2.5,2000,1990,8,`;
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_properties.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Import Properties</h1>
              <p className="text-muted-foreground">Importe propriedades com imagens do seu computador</p>
            </div>
          </div>
          <Button variant="outline" onClick={downloadSampleCSV}>
            <Download className="h-4 w-4 mr-2" />
            Sample CSV
          </Button>
        </div>

        {/* Skip Tracing Importer */}
        <SkipTracingImporter />

        {/* Batch Name */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configurações do Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Lote</Label>
                <Input
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="Import-2025-01-15"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="update-existing"
                  checked={updateExisting}
                  onCheckedChange={(checked) => {
                    setUpdateExisting(checked as boolean);
                    // Recalculate preview when this changes
                    if (importPreview) {
                      setImportPreview(prev => prev ? {
                        ...prev,
                        toSkip: !(checked as boolean) ? prev.toUpdate : 0,
                      } : null);
                    }
                  }}
                />
                <Label htmlFor="update-existing">Atualizar propriedades existentes</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                1. Upload de Imagens
              </CardTitle>
              <CardDescription>
                Selecione as fotos das propriedades (nomeie como account_number.jpg)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  disabled={isUploadingImages}
                />
                {imageFiles.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {imageFiles.length} imagens selecionadas
                  </p>
                )}
              </div>

              {isUploadingImages && (
                <div className="space-y-2">
                  <Progress value={imageUploadProgress} />
                  <p className="text-sm text-center">{imageUploadProgress}% carregado</p>
                </div>
              )}

              <Button
                onClick={handleUploadImages}
                disabled={imageFiles.length === 0 || isUploadingImages}
                className="w-full"
              >
                {isUploadingImages ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {imageFiles.length} Imagens
                  </>
                )}
              </Button>

              {uploadedImages.length > 0 && (
                <div className="border rounded-lg p-3 max-h-40 overflow-auto">
                  <p className="text-sm font-medium mb-2">
                    {uploadedImages.filter(i => i.status === 'success').length}/{uploadedImages.length} carregadas
                  </p>
                  {uploadedImages.slice(0, 5).map((img, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {img.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="truncate">{img.name}</span>
                    </div>
                  ))}
                  {uploadedImages.length > 5 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ... e mais {uploadedImages.length - 5}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* CSV Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                2. Upload CSV
              </CardTitle>
              <CardDescription>
                Selecione o arquivo CSV com os dados das propriedades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVSelect}
                  disabled={isImporting}
                />
                {csvFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {csvFile.name} ({(csvFile.size / 1024).toFixed(0)} KB)
                  </p>
                )}
              </div>

              {totalRows > 0 && (
                <div className="text-sm space-y-1">
                  <p><strong>Total:</strong> {totalRows} propriedades</p>
                  <p><strong>Colunas:</strong> {csvHeaders.length}</p>
                </div>
              )}

              {csvErrors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 rounded-lg p-3">
                  {csvErrors.map((err, idx) => (
                    <p key={idx} className="text-sm text-red-600">{err}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Field Combiner Section */}
        {csvHeaders.length > 0 && csvPreview.length > 0 && (
          <FieldCombiner
            availableColumns={csvHeaders}
            sampleData={csvPreview[0]}
            onFieldsChange={setCombinedFields}
          />
        )}

        {/* Column Mapping Section */}
        {showMappingDialog && csvHeaders.length > 0 && (() => {
          const allAvailableColumns = [
            ...csvHeaders,
            ...combinedFields.map(f => f.name)
          ];
          return (
            <ColumnMappingDialog
              csvHeaders={allAvailableColumns}
              onMappingChange={handleMappingChange}
              initialMappings={columnMappings}
            />
          );
        })()}

        {/* CSV Preview */}
        {csvPreview.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview (primeiras 5 linhas)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {csvHeaders.slice(0, 8).map((h, idx) => (
                        <TableHead key={idx} className="whitespace-nowrap">{h}</TableHead>
                      ))}
                      {csvHeaders.length > 8 && <TableHead>...</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvPreview.map((row, idx) => (
                      <TableRow key={idx}>
                        {csvHeaders.slice(0, 8).map((h, colIdx) => (
                          <TableCell key={colIdx} className="max-w-[150px] truncate">
                            {row[h] || '-'}
                          </TableCell>
                        ))}
                        {csvHeaders.length > 8 && <TableCell>...</TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              3. Importar para o Database
            </CardTitle>
            <CardDescription>
              Clique para salvar as propriedades no banco de dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Import Preview - show before importing */}
            {importPreview && !importResult && !isImporting && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    📊 Preview da Importação
                    {importPreview.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  </p>
                  <button
                    onClick={() => calculateImportPreview(columnMappings)}
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    disabled={importPreview.isLoading}
                  >
                    <RefreshCw className={`h-3 w-3 ${importPreview.isLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </button>
                </div>
                
                {/* Progress bar during calculation */}
                {importPreview.isLoading && (
                  <div className="space-y-2">
                    <Progress value={importPreview.progress} className="h-2" />
                    <p className="text-xs text-center text-blue-600 dark:text-blue-400">
                      Analisando correspondências... {importPreview.progress}%
                    </p>
                  </div>
                )}
                
                {!importPreview.isLoading && (
                  <>
                    {/* BIG SUMMARY BOXES */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="bg-green-100 dark:bg-green-900 rounded-lg p-4 text-center border-2 border-green-300 dark:border-green-700">
                        <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                          {importPreview.toInsert}
                        </p>
                        <p className="text-green-600 dark:text-green-400 font-medium">🆕 Novos</p>
                        <p className="text-xs text-green-500">Serão inseridos</p>
                      </div>
                      <div className={`rounded-lg p-4 text-center border-2 ${updateExisting 
                        ? 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700' 
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}>
                        <p className={`text-3xl font-bold ${updateExisting 
                          ? 'text-yellow-700 dark:text-yellow-300' 
                          : 'text-gray-500 dark:text-gray-400'}`}>
                          {importPreview.toUpdate}
                        </p>
                        <p className={`font-medium ${updateExisting 
                          ? 'text-yellow-600 dark:text-yellow-400' 
                          : 'text-gray-500 dark:text-gray-400'}`}>
                          {updateExisting ? '✏️ Atualizar' : '⏭️ Ignorar'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {updateExisting ? 'Encontrados no banco' : 'Já existem'}
                        </p>
                      </div>
                      <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4 text-center border-2 border-blue-300 dark:border-blue-700">
                        <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                          {totalRows}
                        </p>
                        <p className="text-blue-600 dark:text-blue-400 font-medium">📄 Total CSV</p>
                        <p className="text-xs text-blue-500">Linhas no arquivo</p>
                      </div>
                    </div>

                    {/* STEP BY STEP EXPLANATION */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border space-y-3">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        📋 O que vai acontecer ao clicar "Importar":
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-3 p-2 bg-green-50 dark:bg-green-900/30 rounded">
                          <span className="text-lg">1️⃣</span>
                          <div>
                            <p className="font-medium text-green-700 dark:text-green-300">
                              {importPreview.toInsert} propriedades novas serão INSERIDAS
                            </p>
                            <p className="text-xs text-gray-500">
                              Não existem no banco (sem match por endereço)
                            </p>
                          </div>
                        </div>
                        {importPreview.toUpdate > 0 && (
                          <div className={`flex items-start gap-3 p-2 rounded ${updateExisting 
                            ? 'bg-yellow-50 dark:bg-yellow-900/30' 
                            : 'bg-gray-50 dark:bg-gray-800'}`}>
                            <span className="text-lg">2️⃣</span>
                            <div>
                              <p className={`font-medium ${updateExisting 
                                ? 'text-yellow-700 dark:text-yellow-300' 
                                : 'text-gray-600 dark:text-gray-400'}`}>
                                {importPreview.toUpdate} propriedades serão {updateExisting ? 'ATUALIZADAS' : 'IGNORADAS'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {updateExisting 
                                  ? 'Foram encontradas no banco por endereço - os campos mapeados serão atualizados' 
                                  : 'Marque "Atualizar existentes" abaixo para atualizar'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* MAPPED FIELDS - What will be updated */}
                    {columnMappings.filter(m => m.dbField && m.dbField !== 'skip').length > 0 && (
                      <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                        <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
                          🔄 Campos que serão importados/atualizados:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {columnMappings.filter(m => m.dbField && m.dbField !== 'skip').map((m, idx) => {
                            const fieldLabels: Record<string, string> = {
                              'address': 'Endereço',
                              'city': 'Cidade',
                              'state': 'Estado',
                              'zip_code': 'CEP',
                              'owner_name': 'Nome Proprietário',
                              'owner_address': 'End. Proprietário',
                              'owner_phone': 'Telefone',
                              'estimated_value': 'Valor Estimado',
                              'bedrooms': 'Quartos',
                              'bathrooms': 'Banheiros',
                              'square_feet': 'Área m²',
                              'year_built': 'Ano Construção',
                              'lot_size': 'Tamanho Lote',
                              'property_type': 'Tipo Imóvel',
                              'origem': 'ID Único',
                              'tags': 'Tags',
                              'county': 'Condado',
                              'neighborhood': 'Bairro',
                            };
                            return (
                              <div key={idx} className="inline-flex items-center gap-1 bg-white dark:bg-gray-800 rounded-full px-3 py-1 border text-xs">
                                <span className="text-gray-600 dark:text-gray-400">{m.csvColumn}</span>
                                <span className="text-purple-500">→</span>
                                <span className="font-medium text-purple-700 dark:text-purple-300">
                                  {fieldLabels[m.dbField] || m.dbField}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Toggle for update existing */}
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                      <Checkbox
                        id="updateExisting"
                        checked={updateExisting}
                        onCheckedChange={(checked) => setUpdateExisting(checked as boolean)}
                      />
                      <Label htmlFor="updateExisting" className="flex-1 cursor-pointer">
                        <span className="font-medium">✅ Atualizar {importPreview.toUpdate} propriedades existentes</span>
                        <p className="text-xs text-muted-foreground">
                          Se desmarcado, {importPreview.toUpdate} registros serão ignorados
                        </p>
                      </Label>
                    </div>
                  </>
                )}
              </div>
            )}

            {isImporting && (
              <div className="space-y-2">
                <Progress value={importProgress} />
                <p className="text-sm text-center">{importStatus}</p>
              </div>
            )}

            {importResult && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 rounded-lg p-4 space-y-2">
                <p className="font-medium text-green-800 dark:text-green-200">
                  ✅ Importação Completa!
                </p>
                <div className="text-sm space-y-1">
                  <p>{importResult.imported} propriedades novas importadas</p>
                  <p>{importResult.updated} propriedades atualizadas</p>
                  {importResult.errors > 0 && (
                    <p className="text-red-600">{importResult.errors} erros</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleImport}
                disabled={!csvFile || isImporting || csvErrors.length > 0}
                className="flex-1"
                size="lg"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Importar {totalRows} Propriedades
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/admin')}
                disabled={isImporting}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Propriedades
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
          <CardContent className="pt-4 space-y-2 text-sm">
            <p><strong>💡 Dica:</strong> Nomeie as imagens com o account_number (ex: 28-22-29-1234.jpg)</p>
            <p><strong>📄 CSV:</strong> Deve ter pelo menos uma coluna: account_number ou property_address</p>
            <p><strong>🔄 Duplicatas:</strong> Se "Atualizar existentes" estiver marcado, propriedades existentes serão atualizadas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImportProperties;

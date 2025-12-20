import { useState, useCallback } from "react";
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

      // Validate required columns
      const errors: string[] = [];
      const requiredColumns = ['account_number', 'property_address'];

      // Check exact match first
      const hasAccountNumber = headers.includes('account_number');
      const hasPropertyAddress = headers.includes('property_address');

      console.log('Exact match - account_number:', hasAccountNumber);
      console.log('Exact match - property_address:', hasPropertyAddress);

      // Check fuzzy match
      const hasRequired = requiredColumns.filter(col =>
        headers.some(h => h.toLowerCase().includes(col.toLowerCase().replace('_', '')))
      );

      console.log('Fuzzy match found:', hasRequired);

      if (!hasAccountNumber && !hasPropertyAddress) {
        const errorMsg = "CSV deve ter pelo menos 'account_number' ou 'property_address'";
        console.error('VALIDATION ERROR:', errorMsg);
        console.error('Available headers:', headers);
        errors.push(errorMsg);
      } else {
        console.log('✓ Validation passed!');
      }

      setCsvErrors(errors);
      setShowMappingDialog(true);

      toast({
        title: "CSV Carregado",
        description: `${lines.length - 1} propriedades encontradas. Configure o mapeamento de colunas.`,
      });
    };

    reader.readAsText(file);
  };

  // Handle column mapping changes
  const handleMappingChange = (mappings: ColumnMapping[]) => {
    setColumnMappings(mappings);
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

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCSVLine(lines[i]);
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx]?.replace(/"/g, '') || '';
          });

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
            errors++;
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
          if (!propertyData.estimated_value) propertyData.estimated_value = 0;
          if (!propertyData.cash_offer_amount && propertyData.estimated_value) {
            propertyData.cash_offer_amount = Math.round(propertyData.estimated_value * 0.7);
          }

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

          // Check if property exists (by origem field)
          let existing = null;
          if (accountNumber) {
            const { data } = await supabase
              .from('properties')
              .select('id')
              .eq('origem', accountNumber)
              .maybeSingle();
            existing = data;
          }

          if (existing && updateExisting) {
            const { error: updateError } = await supabase
              .from('properties')
              .update(propertyData as any)
              .eq('id', existing.id);

            if (updateError) {
              errors++;
            } else {
              updated++;
            }
          } else if (!existing) {
            const { error: insertError } = await supabase
              .from('properties')
              .insert(propertyData as any);

            if (insertError) {
              console.error('Insert error:', insertError);
              errors++;
            } else {
              imported++;
            }
          }

          setImportProgress(Math.round((i / (lines.length - 1)) * 100));
          setImportStatus(`Importando ${i}/${lines.length - 1}...`);

        } catch (error) {
          console.error('Row error:', error);
          errors++;
        }
      }

      setImportResult({ imported, updated, errors });
      setIsImporting(false);
      setImportStatus("");

      toast({
        title: "Importação Completa! 🎉",
        description: `${imported} novas, ${updated} atualizadas, ${errors} erros`,
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
                  onCheckedChange={(checked) => setUpdateExisting(checked as boolean)}
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

        {/* Column Mapping Section */}
        {showMappingDialog && csvHeaders.length > 0 && (
          <ColumnMappingDialog
            csvHeaders={csvHeaders}
            onMappingChange={handleMappingChange}
            initialMappings={columnMappings}
          />
        )}

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

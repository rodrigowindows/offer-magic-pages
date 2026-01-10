import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Download } from "lucide-react";
import { parseCSV, readFileAsText, type CSVParseResult } from "@/utils/csvParser";
import { supabase } from "@/integrations/supabase/client";

interface ColumnMapping {
  csvColumn: string;
  dbColumn: string;
  isRequired: boolean;
  skipEmpty: boolean;
}

interface DatabaseColumn {
  name: string;
  type: string;
  isRequired: boolean;
}

// Database columns for properties table - includes skip tracing fields
const AVAILABLE_DB_COLUMNS: DatabaseColumn[] = [
  // Property fields
  { name: 'property_address', type: 'text', isRequired: true },
  { name: 'city', type: 'text', isRequired: true },
  { name: 'state', type: 'text', isRequired: false },
  { name: 'zip_code', type: 'text', isRequired: false },
  { name: 'property_type', type: 'text', isRequired: false },
  // Owner fields
  { name: 'owner_first_name', type: 'text', isRequired: false },
  { name: 'owner_last_name', type: 'text', isRequired: false },
  { name: 'owner_full_name', type: 'text', isRequired: false },
  { name: 'owner_age', type: 'integer', isRequired: false },
  { name: 'owner_deceased', type: 'boolean', isRequired: false },
  { name: 'dnc_litigator', type: 'text', isRequired: false },
  // Mailing address fields
  { name: 'mail_address', type: 'text', isRequired: false },
  { name: 'mail_city', type: 'text', isRequired: false },
  { name: 'mail_state', type: 'text', isRequired: false },
  { name: 'mail_zip_code', type: 'text', isRequired: false },
  // Phone fields (up to 5)
  { name: 'phone1', type: 'text', isRequired: false },
  { name: 'phone1_type', type: 'text', isRequired: false },
  { name: 'phone2', type: 'text', isRequired: false },
  { name: 'phone2_type', type: 'text', isRequired: false },
  { name: 'phone3', type: 'text', isRequired: false },
  { name: 'phone3_type', type: 'text', isRequired: false },
  { name: 'phone4', type: 'text', isRequired: false },
  { name: 'phone4_type', type: 'text', isRequired: false },
  { name: 'phone5', type: 'text', isRequired: false },
  { name: 'phone5_type', type: 'text', isRequired: false },
  // Property details
  { name: 'assessed_value', type: 'numeric', isRequired: false },
  { name: 'beds', type: 'integer', isRequired: false },
  { name: 'baths', type: 'numeric', isRequired: false },
  { name: 'sqft', type: 'integer', isRequired: false },
  { name: 'year_built', type: 'integer', isRequired: false },
  { name: 'lot_size', type: 'numeric', isRequired: false },
  // Custom fields
  { name: 'custom_field_1', type: 'text', isRequired: false },
  { name: 'custom_field_2', type: 'text', isRequired: false },
  { name: 'custom_field_3', type: 'text', isRequired: false },
  // Result codes
  { name: 'result_code', type: 'text', isRequired: false },
];

// Common CSV header mappings to DB columns
const COLUMN_ALIASES: Record<string, string> = {
  'input_property_address': 'property_address',
  'input_property_city': 'city',
  'input_property_state': 'state',
  'input_property_zip': 'zip_code',
  'input_last_name': 'owner_last_name',
  'input_first_name': 'owner_first_name',
  'input_mailing_address': 'mail_address',
  'input_mailing_city': 'mail_city',
  'input_mailing_state': 'mail_state',
  'input_mailing_zip': 'mail_zip_code',
  'input_custom_field_1': 'custom_field_1',
  'input_custom_field_2': 'custom_field_2',
  'input_custom_field_3': 'custom_field_3',
  'owner_fix_last_name': 'owner_last_name',
  'owner_fix_first_name': 'owner_first_name',
  'owner_fix_mailing_address': 'mail_address',
  'owner_fix_mailing_city': 'mail_city',
  'owner_fix_mailing_state': 'mail_state',
  'owner_fix_mailing_zip': 'mail_zip_code',
  'matched_first_name': 'owner_first_name',
  'matched_last_name': 'owner_last_name',
  'dnc_litigator_scrub': 'dnc_litigator',
  'age': 'owner_age',
  'deceased': 'owner_deceased',
  'resultcode': 'result_code',
};

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

export const CSVImporter = () => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [csvData, setCSVData] = useState<CSVParseResult | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [newColumns, setNewColumns] = useState<string[]>([]);
  const [createNewColumns, setCreateNewColumns] = useState(true); // Default to true for auto-create
  const [skipEmptyValues, setSkipEmptyValues] = useState(true);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState({ success: 0, errors: 0 });
  const [errors, setErrors] = useState<string[]>([]);
  const [columnsCreated, setColumnsCreated] = useState<string[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrors([]);
      const text = await readFileAsText(file);
      const parsed = parseCSV(text);

      if (parsed.headers.length === 0) {
        setErrors(['CSV file has no headers']);
        return;
      }

      setCSVData(parsed);

      // Auto-map columns based on similarity and aliases
      const mappings = parsed.headers.map((csvHeader) => {
        const normalized = normalizeColumnName(csvHeader);
        
        // First check aliases
        const aliasMatch = COLUMN_ALIASES[normalized];
        if (aliasMatch) {
          const dbColumn = AVAILABLE_DB_COLUMNS.find(db => db.name === aliasMatch);
          return {
            csvColumn: csvHeader,
            dbColumn: aliasMatch,
            isRequired: dbColumn?.isRequired || false,
            skipEmpty: true,
          };
        }
        
        // Then check exact match
        const dbColumn = AVAILABLE_DB_COLUMNS.find(
          (db) => normalizeColumnName(db.name) === normalized
        );

        // If no match, auto-suggest creating the column
        const suggestedColumn = dbColumn?.name || normalized;
        
        return {
          csvColumn: csvHeader,
          dbColumn: dbColumn?.name || suggestedColumn,
          isRequired: dbColumn?.isRequired || false,
          skipEmpty: true,
        };
      });

      // Identify new columns that need to be created
      const existingColumnNames = AVAILABLE_DB_COLUMNS.map(c => c.name);
      const newCols = mappings
        .filter(m => m.dbColumn && !existingColumnNames.includes(m.dbColumn))
        .map(m => m.dbColumn);
      setNewColumns([...new Set(newCols)]);

      setColumnMappings(mappings);
      setStep('mapping');
    } catch (error) {
      setErrors([`Failed to parse CSV: ${error}`]);
    }
  };

  const normalizeColumnName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleMappingChange = (csvColumn: string, dbColumn: string) => {
    setColumnMappings((prev) =>
      prev.map((mapping) =>
        mapping.csvColumn === csvColumn
          ? { ...mapping, dbColumn }
          : mapping
      )
    );

    // Check if this is a new column
    const isExistingColumn = AVAILABLE_DB_COLUMNS.some((col) => col.name === dbColumn);
    if (!isExistingColumn && dbColumn && !newColumns.includes(dbColumn)) {
      setNewColumns((prev) => [...prev, dbColumn]);
    }
  };

  const handleSkipEmptyChange = (csvColumn: string, skipEmpty: boolean) => {
    setColumnMappings((prev) =>
      prev.map((mapping) =>
        mapping.csvColumn === csvColumn ? { ...mapping, skipEmpty } : mapping
      )
    );
  };

  const handlePreview = () => {
    const requiredColumns = columnMappings.filter((m) => m.isRequired && !m.dbColumn);
    if (requiredColumns.length > 0) {
      setErrors([
        `Required columns not mapped: ${requiredColumns.map((c) => c.csvColumn).join(', ')}`,
      ]);
      return;
    }

    setErrors([]);
    setStep('preview');
  };

  const handleImport = async () => {
    if (!csvData) return;

    setStep('importing');
    setImportProgress({ current: 0, total: csvData.rowCount });
    setImportResults({ success: 0, errors: 0 });
    setColumnsCreated([]);
    const importErrors: string[] = [];
    const createdCols: string[] = [];

    // Identify ALL columns that need to be created (not just from newColumns state)
    const existingColumnNames = AVAILABLE_DB_COLUMNS.map(c => c.name);
    const mappedColumns = columnMappings
      .filter(m => m.dbColumn)
      .map(m => m.dbColumn);

    const columnsToCreate = [...new Set(mappedColumns)]
      .filter(col => !existingColumnNames.includes(col) || newColumns.includes(col));

    // Always create new columns dynamically
    if (columnsToCreate.length > 0) {
      for (const columnName of columnsToCreate) {
        try {
          // Determine column type based on naming convention
          let columnType = 'text';
          if (columnName.includes('age') || columnName.includes('beds') || columnName.includes('sqft') || columnName.includes('year')) {
            columnType = 'integer';
          } else if (columnName.includes('baths') || columnName.includes('value') || columnName.includes('size')) {
            columnType = 'numeric';
          } else if (columnName.includes('deceased') || columnName.includes('is_') || columnName.includes('has_')) {
            columnType = 'boolean';
          }

          }

          const { data, error } = await supabase.rpc('add_column_if_not_exists', {
            p_table_name: 'properties',
            p_column_name: columnName,
            p_column_type: columnType,
          });

          if (error) {
            importErrors.push(`Failed to create column ${columnName}: ${error.message}`);
          } else if (data === true) {
            createdCols.push(columnName);
          }
        } catch (error) {
          importErrors.push(`Error creating column ${columnName}: ${error}`);
        }
      }
      setColumnsCreated(createdCols);
    }

    // Import data row by row
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < csvData.data.length; i++) {
      const row = csvData.data[i];
      const mappedRow: Record<string, string | number | boolean | null> = {};

      // Map CSV columns to DB columns
      columnMappings.forEach((mapping) => {
        if (mapping.dbColumn) {
          const value = row[mapping.csvColumn];

          // Skip empty values if configured
          if (skipEmptyValues && (!value || value.trim() === '')) {
            return;
          }

          mappedRow[mapping.dbColumn] = value;
        }
      });

      // Map to properties table fields - convert property_address to address
      const propertyData: Record<string, any> = {
        address: mappedRow.property_address || '',
        city: (mappedRow.city as string) || 'Unknown',
        state: (mappedRow.state as string) || 'FL',
        zip_code: (mappedRow.zip_code as string) || '00000',
        estimated_value: 0,
        cash_offer_amount: 0,
        slug: `prop-${Date.now()}-${i}`,
      };
      
      // Add optional fields
      if (mappedRow.owner_full_name || mappedRow.owner_first_name || mappedRow.owner_last_name) {
        propertyData.owner_name = mappedRow.owner_full_name || 
          `${mappedRow.owner_first_name || ''} ${mappedRow.owner_last_name || ''}`.trim();
      }
      if (mappedRow.mail_address) propertyData.owner_address = mappedRow.mail_address;
      if (mappedRow.sqft) propertyData.square_feet = parseInt(String(mappedRow.sqft)) || null;
      if (mappedRow.beds) propertyData.bedrooms = parseInt(String(mappedRow.beds)) || null;
      if (mappedRow.baths) propertyData.bathrooms = parseFloat(String(mappedRow.baths)) || null;
      if (mappedRow.year_built) propertyData.year_built = parseInt(String(mappedRow.year_built)) || null;
      if (mappedRow.lot_size) propertyData.lot_size = parseFloat(String(mappedRow.lot_size)) || null;
      if (mappedRow.property_type) propertyData.property_type = mappedRow.property_type;
      if (mappedRow.assessed_value) propertyData.estimated_value = parseFloat(String(mappedRow.assessed_value)) || 0;

      // Only insert if we have at least the required fields
      const hasRequiredFields = propertyData.address && propertyData.city;

      if (!hasRequiredFields) {
        errorCount++;
        importErrors.push(
          `Row ${i + 1}: Missing required fields (address or city)`
        );
        continue;
      }

      try {
        const { error } = await supabase
          .from('properties')
          .insert(propertyData as any);

        if (error) {
          errorCount++;
          importErrors.push(`Row ${i + 1}: ${error.message}`);
        } else {
          successCount++;
        }
      } catch (error) {
        errorCount++;
        importErrors.push(`Row ${i + 1}: ${error}`);
      }

      setImportProgress({ current: i + 1, total: csvData.rowCount });
    }

    setImportResults({ success: successCount, errors: errorCount });
    setErrors(importErrors.slice(0, 50)); // Show first 50 errors
    setStep('complete');
  };

  const downloadSampleCSV = () => {
    const sampleHeaders = [
      'Input Property Address',
      'Input Property City',
      'Input Property State',
      'Input Property Zip',
      'Input Last Name',
      'Input First Name',
      'Owner First Name',
      'Owner Last Name',
    ];

    const sampleRow = [
      '5528 LONG LAKE RD',
      'Orlando',
      'FL',
      '32810',
      'DELICH',
      'LUCIA M',
      'TAYLOR',
      'ROSE',
    ];

    const csvContent = [
      sampleHeaders.join(','),
      sampleRow.join(','),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-import.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetImporter = () => {
    setStep('upload');
    setCSVData(null);
    setColumnMappings([]);
    setNewColumns([]);
    setErrors([]);
    setImportProgress({ current: 0, total: 0 });
    setImportResults({ success: 0, errors: 0 });
    setColumnsCreated([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6" />
            CSV Property Importer
          </CardTitle>
          <CardDescription>
            Import property data from CSV files with automatic column mapping
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center gap-4">
            <StepIndicator step="upload" currentStep={step} label="Upload" />
            <div className="flex-1 border-t" />
            <StepIndicator step="mapping" currentStep={step} label="Map Columns" />
            <div className="flex-1 border-t" />
            <StepIndicator step="preview" currentStep={step} label="Preview" />
            <div className="flex-1 border-t" />
            <StepIndicator step="importing" currentStep={step} label="Import" />
          </div>

          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <Label htmlFor="csv-file" className="cursor-pointer">
                    <div className="text-lg font-medium">Choose CSV file</div>
                    <div className="text-sm text-muted-foreground">
                      or drag and drop here
                    </div>
                  </Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                <Button onClick={() => document.getElementById('csv-file')?.click()}>
                  Select File
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm">Need an example format?</span>
                <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Sample CSV
                </Button>
              </div>
            </div>
          )}

          {/* Mapping Step */}
          {step === 'mapping' && csvData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Map CSV Columns to Database Fields</h3>
                  <p className="text-sm text-muted-foreground">
                    Found {csvData.headers.length} columns, {csvData.rowCount} rows
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="skip-empty"
                    checked={skipEmptyValues}
                    onCheckedChange={(checked) => setSkipEmptyValues(checked as boolean)}
                  />
                  <Label htmlFor="skip-empty" className="text-sm">
                    Skip empty values
                  </Label>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {columnMappings.map((mapping) => (
                  <div
                    key={mapping.csvColumn}
                    className="flex items-center gap-4 p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <Label className="text-sm font-medium">{mapping.csvColumn}</Label>
                      <div className="text-xs text-muted-foreground">
                        Sample: {csvData.data[0]?.[mapping.csvColumn] || '(empty)'}
                      </div>
                    </div>

                    <div className="flex-1">
                      <Select
                        value={mapping.dbColumn}
                        onValueChange={(value) =>
                          handleMappingChange(mapping.csvColumn, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Skip this column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Skip this column</SelectItem>
                          {AVAILABLE_DB_COLUMNS.map((col) => (
                            <SelectItem key={col.name} value={col.name}>
                              {col.name}
                              {col.isRequired && (
                                <Badge variant="destructive" className="ml-2 text-xs">
                                  Required
                                </Badge>
                              )}
                            </SelectItem>
                          ))}
                          <SelectItem value={`new_${normalizeColumnName(mapping.csvColumn)}`}>
                            Create new: {normalizeColumnName(mapping.csvColumn)}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={mapping.skipEmpty}
                        onCheckedChange={(checked) =>
                          handleSkipEmptyChange(mapping.csvColumn, checked as boolean)
                        }
                      />
                      <Label className="text-xs">Skip empty</Label>
                    </div>
                  </div>
                ))}
              </div>

              {newColumns.length > 0 && (
                <Alert className="bg-blue-50 border-blue-200">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-blue-800">
                          {newColumns.length} new column(s) will be created automatically:
                        </span>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="create-columns"
                            checked={createNewColumns}
                            onCheckedChange={(checked) =>
                              setCreateNewColumns(checked as boolean)
                            }
                          />
                          <Label htmlFor="create-columns" className="text-sm">Auto-create enabled</Label>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {newColumns.map(col => (
                          <Badge key={col} variant="secondary" className="text-xs">
                            {col}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Back
                </Button>
                <Button onClick={handlePreview}>Continue to Preview</Button>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && csvData && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Preview Import</h3>
                <p className="text-sm text-muted-foreground">
                  Review the first 5 rows before importing {csvData.rowCount} total rows
                </p>
              </div>

              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {columnMappings
                        .filter((m) => m.dbColumn)
                        .map((mapping) => (
                          <th key={mapping.dbColumn} className="p-2 text-left font-medium">
                            {mapping.dbColumn}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.data.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="border-t">
                        {columnMappings
                          .filter((m) => m.dbColumn)
                          .map((mapping) => (
                            <td key={mapping.dbColumn} className="p-2">
                              {row[mapping.csvColumn] || (
                                <span className="text-muted-foreground italic">empty</span>
                              )}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('mapping')}>
                  Back
                </Button>
                <Button onClick={handleImport}>
                  Import {csvData.rowCount} Rows
                </Button>
              </div>
            </div>
          )}

          {/* Importing Step */}
          {step === 'importing' && (
            <div className="space-y-4 text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <div>
                <div className="text-lg font-medium">Importing data...</div>
                <div className="text-sm text-muted-foreground">
                  {importProgress.current} of {importProgress.total} rows processed
                </div>
              </div>
              <div className="max-w-md mx-auto">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${(importProgress.current / importProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="space-y-4">
              <div className="text-center py-6">
                {importResults.errors === 0 ? (
                  <>
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-green-600">Import Complete!</h3>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold">Import Completed with Errors</h3>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4 mt-6 max-w-md mx-auto">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {importResults.success}
                    </div>
                    <div className="text-sm text-green-700">Successful</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="text-3xl font-bold text-red-600">
                      {importResults.errors}
                    </div>
                    <div className="text-sm text-red-700">Errors</div>
                  </div>
                </div>

                {columnsCreated.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800 font-medium mb-2">
                      {columnsCreated.length} new column(s) created:
                    </div>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {columnsCreated.map(col => (
                        <Badge key={col} variant="secondary" className="text-xs">
                          {col}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {errors.length > 0 && (
                <div className="max-h-60 overflow-y-auto space-y-1">
                  <Label className="text-sm font-medium text-destructive">
                    Error Details (showing first 50):
                  </Label>
                  {errors.map((error, idx) => (
                    <div key={idx} className="text-xs text-destructive bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={resetImporter} className="w-full">
                Import Another File
              </Button>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && step !== 'complete' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {errors.map((error, idx) => (
                    <div key={idx}>{error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const StepIndicator = ({
  step,
  currentStep,
  label,
}: {
  step: ImportStep;
  currentStep: ImportStep;
  label: string;
}) => {
  const stepOrder: ImportStep[] = ['upload', 'mapping', 'preview', 'importing', 'complete'];
  const currentIndex = stepOrder.indexOf(currentStep);
  const thisIndex = stepOrder.indexOf(step);

  const isActive = currentStep === step;
  const isComplete = currentIndex > thisIndex;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          isActive
            ? 'bg-primary text-primary-foreground'
            : isComplete
            ? 'bg-green-500 text-white'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {isComplete ? <CheckCircle className="h-4 w-4" /> : thisIndex + 1}
      </div>
      <div className="text-xs font-medium">{label}</div>
    </div>
  );
};

export default CSVImporter;

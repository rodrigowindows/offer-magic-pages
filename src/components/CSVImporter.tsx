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

// Database columns for properties table (extend as needed)
const AVAILABLE_DB_COLUMNS: DatabaseColumn[] = [
  { name: 'property_address', type: 'text', isRequired: true },
  { name: 'city', type: 'text', isRequired: true },
  { name: 'state', type: 'text', isRequired: false },
  { name: 'zip_code', type: 'text', isRequired: false },
  { name: 'owner_first_name', type: 'text', isRequired: false },
  { name: 'owner_last_name', type: 'text', isRequired: false },
  { name: 'owner_full_name', type: 'text', isRequired: false },
  { name: 'mail_address', type: 'text', isRequired: false },
  { name: 'mail_city', type: 'text', isRequired: false },
  { name: 'mail_state', type: 'text', isRequired: false },
  { name: 'mail_zip_code', type: 'text', isRequired: false },
  { name: 'assessed_value', type: 'numeric', isRequired: false },
  { name: 'beds', type: 'numeric', isRequired: false },
  { name: 'baths', type: 'numeric', isRequired: false },
  { name: 'sqft', type: 'numeric', isRequired: false },
  { name: 'year_built', type: 'numeric', isRequired: false },
  { name: 'lot_size', type: 'numeric', isRequired: false },
  { name: 'property_type', type: 'text', isRequired: false },
];

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

export const CSVImporter = () => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [csvData, setCSVData] = useState<CSVParseResult | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [newColumns, setNewColumns] = useState<string[]>([]);
  const [createNewColumns, setCreateNewColumns] = useState(false);
  const [skipEmptyValues, setSkipEmptyValues] = useState(true);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState({ success: 0, errors: 0 });
  const [errors, setErrors] = useState<string[]>([]);

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

      // Auto-map columns based on similarity
      const mappings = parsed.headers.map((csvHeader) => {
        const normalized = normalizeColumnName(csvHeader);
        const dbColumn = AVAILABLE_DB_COLUMNS.find(
          (db) => normalizeColumnName(db.name) === normalized
        );

        return {
          csvColumn: csvHeader,
          dbColumn: dbColumn?.name || '',
          isRequired: dbColumn?.isRequired || false,
          skipEmpty: true,
        };
      });

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
    const importErrors: string[] = [];

    // Create new columns if needed
    if (createNewColumns && newColumns.length > 0) {
      for (const columnName of newColumns) {
        try {
          // Add column to properties table
          const { error } = await supabase.rpc('add_column_if_not_exists', {
            table_name: 'properties',
            column_name: columnName,
            column_type: 'text',
          });

          if (error) {
            console.error(`Failed to create column ${columnName}:`, error);
            importErrors.push(`Failed to create column ${columnName}: ${error.message}`);
          }
        } catch (error) {
          console.error(`Error creating column ${columnName}:`, error);
        }
      }
    }

    // Import data row by row
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < csvData.data.length; i++) {
      const row = csvData.data[i];
      const mappedRow: Record<string, any> = {};

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

      // Only insert if we have at least the required fields
      const hasRequiredFields =
        mappedRow.property_address &&
        mappedRow.city;

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
          .insert(mappedRow);

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
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>
                        {newColumns.length} new column(s) will be created:{' '}
                        <strong>{newColumns.join(', ')}</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="create-columns"
                          checked={createNewColumns}
                          onCheckedChange={(checked) =>
                            setCreateNewColumns(checked as boolean)
                          }
                        />
                        <Label htmlFor="create-columns">Allow creation</Label>
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

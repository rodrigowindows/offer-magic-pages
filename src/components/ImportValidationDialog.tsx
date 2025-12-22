import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle, AlertTriangle, FileDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidatedRow {
  row: any;
  rowNumber: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  isValid: boolean;
}

interface ImportValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  validRows: ValidatedRow[];
  invalidRows: ValidatedRow[];
  onConfirmImport: (rows: any[]) => void;
  onFixErrors: (rows: ValidatedRow[]) => void;
}

export const ImportValidationDialog = ({
  open,
  onOpenChange,
  validRows,
  invalidRows,
  onConfirmImport,
  onFixErrors,
}: ImportValidationDialogProps) => {
  const [selectedTab, setSelectedTab] = useState<'valid' | 'invalid'>('valid');

  const totalRows = validRows.length + invalidRows.length;
  const validPercentage = ((validRows.length / totalRows) * 100).toFixed(0);

  const handleConfirm = () => {
    onConfirmImport(validRows.map(v => v.row));
    onOpenChange(false);
  };

  const handleExportErrors = () => {
    // Create CSV with errors - properly escape values
    const escapeCSV = (value: any): string => {
      const str = String(value || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      ['Row', 'Field', 'Error', 'Severity', 'Value'],
      ...invalidRows.flatMap(row =>
        [...row.errors, ...row.warnings].map(err => [
          row.rowNumber,
          err.field,
          err.message,
          err.severity,
          row.row[err.field] || ''
        ])
      )
    ].map(row => row.map(escapeCSV).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-errors-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import Validation Results</DialogTitle>
          <DialogDescription>
            Review validation results before importing data
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Total Rows</div>
            <div className="text-2xl font-bold">{totalRows}</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm text-green-700 mb-1 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Valid Rows
            </div>
            <div className="text-2xl font-bold text-green-700">
              {validRows.length}
              <span className="text-sm ml-2 font-normal">({validPercentage}%)</span>
            </div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-sm text-red-700 mb-1 flex items-center gap-1">
              <XCircle className="h-4 w-4" />
              Invalid Rows
            </div>
            <div className="text-2xl font-bold text-red-700">
              {invalidRows.length}
            </div>
          </div>
        </div>

        {/* Tabs for valid/invalid */}
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'valid' | 'invalid')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="valid" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Valid ({validRows.length})
            </TabsTrigger>
            <TabsTrigger value="invalid" className="gap-2">
              <XCircle className="h-4 w-4" />
              Invalid ({invalidRows.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="valid" className="mt-4">
            <ScrollArea className="h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Row</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Offer</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validRows.slice(0, 50).map((validRow) => (
                    <TableRow key={validRow.rowNumber}>
                      <TableCell className="font-medium">{validRow.rowNumber}</TableCell>
                      <TableCell>{validRow.row.address}</TableCell>
                      <TableCell>{validRow.row.city}</TableCell>
                      <TableCell>${validRow.row.estimated_value?.toLocaleString()}</TableCell>
                      <TableCell>${validRow.row.cash_offer_amount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Valid
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {validRows.length > 50 && (
                <div className="text-center text-sm text-gray-500 py-2">
                  Showing first 50 of {validRows.length} valid rows
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="invalid" className="mt-4">
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {invalidRows.map((invalidRow) => (
                  <div
                    key={invalidRow.rowNumber}
                    className="p-3 border border-red-200 rounded-lg bg-red-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-sm">
                        Row {invalidRow.rowNumber}: {invalidRow.row.address || 'No address'}
                      </div>
                      <Badge variant="destructive">
                        {invalidRow.errors.length} errors
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      {invalidRow.errors.map((error, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-red-900">{error.field}:</span>{' '}
                            <span className="text-red-700">{error.message}</span>
                          </div>
                        </div>
                      ))}
                      {invalidRow.warnings.map((warning, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-yellow-900">{warning.field}:</span>{' '}
                            <span className="text-yellow-700">{warning.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            {invalidRows.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportErrors}
                  className="gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Export Errors
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFixErrors(invalidRows)}
                  className="gap-2"
                >
                  Fix Errors
                </Button>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={validRows.length === 0}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Import {validRows.length} Valid Rows
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Validation utility functions
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
};

export const isValidZipCode = (zip: string): boolean => {
  return /^\d{5}(-\d{4})?$/.test(zip);
};

export const validatePropertyRow = (row: any, rowNumber: number): ValidatedRow => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Required field validations
  if (!row.address || row.address.trim() === '') {
    errors.push({
      field: 'address',
      message: 'Address is required',
      severity: 'error'
    });
  }

  if (!row.city || row.city.trim() === '') {
    errors.push({
      field: 'city',
      message: 'City is required',
      severity: 'error'
    });
  }

  if (!row.state || row.state.trim() === '') {
    errors.push({
      field: 'state',
      message: 'State is required',
      severity: 'error'
    });
  }

  if (!row.zip_code) {
    errors.push({
      field: 'zip_code',
      message: 'ZIP code is required',
      severity: 'error'
    });
  } else if (!isValidZipCode(row.zip_code)) {
    errors.push({
      field: 'zip_code',
      message: 'Invalid ZIP code format',
      severity: 'error'
    });
  }

  // Value validations
  if (!row.estimated_value || row.estimated_value <= 0) {
    errors.push({
      field: 'estimated_value',
      message: 'Estimated value must be greater than 0',
      severity: 'error'
    });
  }

  if (!row.cash_offer_amount || row.cash_offer_amount <= 0) {
    errors.push({
      field: 'cash_offer_amount',
      message: 'Cash offer amount must be greater than 0',
      severity: 'error'
    });
  }

  // Warnings
  if (row.owner_email && !isValidEmail(row.owner_email)) {
    warnings.push({
      field: 'owner_email',
      message: 'Email format appears invalid',
      severity: 'warning'
    });
  }

  if (row.owner_phone && !isValidPhone(row.owner_phone)) {
    warnings.push({
      field: 'owner_phone',
      message: 'Phone number format appears invalid',
      severity: 'warning'
    });
  }

  if (row.cash_offer_amount > row.estimated_value) {
    warnings.push({
      field: 'cash_offer_amount',
      message: 'Offer exceeds estimated value',
      severity: 'warning'
    });
  }

  if (row.estimated_value > 5000000) {
    warnings.push({
      field: 'estimated_value',
      message: 'Unusually high property value',
      severity: 'warning'
    });
  }

  return {
    row,
    rowNumber,
    errors,
    warnings,
    isValid: errors.length === 0
  };
};

export const validateCSVData = (rows: any[]): {
  valid: ValidatedRow[];
  invalid: ValidatedRow[];
} => {
  const validated = rows.map((row, index) => validatePropertyRow(row, index + 1));

  return {
    valid: validated.filter(v => v.isValid),
    invalid: validated.filter(v => !v.isValid)
  };
};

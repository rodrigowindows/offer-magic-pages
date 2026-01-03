import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Eye, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import type { ColumnMapping } from "./ColumnMappingDialog";

interface MappingDataPreviewProps {
  csvData: Array<{ [key: string]: string }>;
  mappings: ColumnMapping[];
  maxRows?: number;
}

interface PreviewColumn {
  csvColumn: string;
  dbField: string;
  sample: string;
  hasData: boolean;
  isRequired: boolean;
}

const MappingDataPreview = ({ csvData, mappings, maxRows = 5 }: MappingDataPreviewProps) => {
  // Generate preview data based on mappings
  const previewData = useMemo(() => {
    const activeMappings = mappings.filter(m => m.dbField && m.dbField !== 'skip');

    const columns: PreviewColumn[] = activeMappings.map(mapping => {
      const sampleData = csvData
        .slice(0, maxRows)
        .map(row => row[mapping.csvColumn])
        .filter(val => val && val.trim() !== '');

      return {
        csvColumn: mapping.csvColumn,
        dbField: mapping.dbField as string,
        sample: sampleData[0] || '(vazio)',
        hasData: sampleData.length > 0,
        isRequired: mapping.dbField === 'address' || mapping.dbField === 'estimated_value',
      };
    });

    const previewRows = csvData.slice(0, maxRows).map(row => {
      const mappedRow: { [key: string]: string } = {};
      activeMappings.forEach(mapping => {
        mappedRow[mapping.dbField as string] = row[mapping.csvColumn] || '';
      });
      return mappedRow;
    });

    return { columns, previewRows };
  }, [csvData, mappings, maxRows]);

  const { columns, previewRows } = previewData;

  // Validation stats
  const stats = useMemo(() => {
    const totalMapped = columns.length;
    const withData = columns.filter(c => c.hasData).length;
    const requiredFields = columns.filter(c => c.isRequired);
    const missingRequired = requiredFields.filter(c => !c.hasData);

    return {
      totalMapped,
      withData,
      requiredFields: requiredFields.length,
      missingRequired: missingRequired.length,
      missingRequiredNames: missingRequired.map(c => c.dbField),
    };
  }, [columns]);

  if (columns.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma coluna mapeada ainda</p>
            <p className="text-sm">Mapeie colunas para ver o preview dos dados</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview dos Dados Mapeados
            </CardTitle>
            <CardDescription>
              Primeiras {maxRows} linhas com mapeamentos aplicados
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={stats.withData === stats.totalMapped ? "default" : "secondary"}>
              {stats.withData}/{stats.totalMapped} com dados
            </Badge>
            {stats.missingRequired > 0 && (
              <Badge variant="destructive">
                {stats.missingRequired} obrigatório(s) vazio(s)
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Alert */}
        {stats.missingRequired > 0 && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-red-800 dark:text-red-200">
                Campos obrigatórios sem dados
              </p>
              <p className="text-red-700 dark:text-red-300">
                Os seguintes campos obrigatórios estão vazios: {stats.missingRequiredNames.join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Column Summary */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="text-sm space-y-2">
            <p className="font-semibold text-blue-800 dark:text-blue-200">
              📋 Resumo das Colunas Mapeadas
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {columns.slice(0, 12).map((col, idx) => (
                <div key={idx} className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  {col.hasData ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="truncate text-xs">
                    <strong>{col.dbField}:</strong> {col.sample}
                  </span>
                </div>
              ))}
            </div>
            {columns.length > 12 && (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                +{columns.length - 12} colunas adicionais
              </p>
            )}
          </div>
        </div>

        {/* Data Table Preview */}
        <ScrollArea className="h-[400px] border rounded-lg">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                {columns.map((col, idx) => (
                  <TableHead key={idx} className="min-w-[150px]">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{col.dbField}</span>
                      <span className="text-xs text-muted-foreground font-normal truncate">
                        ← {col.csvColumn}
                      </span>
                      {col.isRequired && (
                        <Badge variant="outline" className="text-xs w-fit border-red-300 text-red-600">
                          obrigatório
                        </Badge>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row, rowIdx) => (
                <TableRow key={rowIdx}>
                  <TableCell className="font-medium text-muted-foreground">{rowIdx + 1}</TableCell>
                  {columns.map((col, colIdx) => {
                    const value = row[col.dbField];
                    const isEmpty = !value || value.trim() === '';
                    const isRequiredAndEmpty = col.isRequired && isEmpty;

                    return (
                      <TableCell
                        key={colIdx}
                        className={`${
                          isRequiredAndEmpty
                            ? 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200'
                            : isEmpty
                            ? 'text-muted-foreground italic'
                            : ''
                        }`}
                      >
                        {isEmpty ? '(vazio)' : (
                          <span className="font-mono text-sm">{value}</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Help Text */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
          <p>
            💡 <strong>Dica:</strong> Verifique se os dados estão corretos antes de importar.
            Células em vermelho indicam campos obrigatórios vazios.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MappingDataPreview;

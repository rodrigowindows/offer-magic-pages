import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, Plus, Eye, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CombinedField } from "./FieldCombiner";

interface ManualFieldMatcherProps {
  csvData: Record<string, string>[];
  availableColumns: string[];
  onCombinationSelected: (field: CombinedField, dbField: string) => void;
}

const DATABASE_FIELDS = [
  { key: 'address', label: 'Endereço da Propriedade', example: '5528 LONG LAKE DR' },
  { key: 'city', label: 'Cidade', example: 'Orlando' },
  { key: 'state', label: 'Estado', example: 'FL' },
  { key: 'zip_code', label: 'CEP', example: '32810' },
  { key: 'owner_name', label: 'Nome do Proprietário', example: 'John Doe' },
  { key: 'owner_phone', label: 'Telefone', example: '(407) 555-1234' },
  { key: 'owner_address', label: 'Endereço do Proprietário', example: '123 Main St, Orlando, FL 32801' },
  { key: 'bedrooms', label: 'Quartos', example: '3' },
  { key: 'bathrooms', label: 'Banheiros', example: '2' },
  { key: 'square_feet', label: 'Área (sqft)', example: '1500' },
  { key: 'year_built', label: 'Ano de Construção', example: '2005' },
  { key: 'estimated_value', label: 'Valor Estimado', example: '250000' },
];

export const ManualFieldMatcher = ({ csvData, availableColumns, onCombinationSelected }: ManualFieldMatcherProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [targetDbField, setTargetDbField] = useState<string>('');
  const [separator, setSeparator] = useState<string>(' ');
  const [showPreview, setShowPreview] = useState(false);

  const toggleColumn = (column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  const getPreviewValue = (rowIndex: number): string => {
    if (!csvData[rowIndex] || selectedColumns.length === 0) return '';

    const values = selectedColumns
      .map(col => csvData[rowIndex][col])
      .filter(v => v && v.trim() !== '');

    const actualSeparator = separator === '__NONE__' ? '' : separator;
    return values.join(actualSeparator);
  };

  const handleCreate = () => {
    if (selectedColumns.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos uma coluna',
        variant: 'destructive',
      });
      return;
    }

    if (!targetDbField) {
      toast({
        title: 'Erro',
        description: 'Selecione um campo do banco de dados',
        variant: 'destructive',
      });
      return;
    }

    const dbFieldLabel = DATABASE_FIELDS.find(f => f.key === targetDbField)?.label || targetDbField;
    const combinedField: CombinedField = {
      id: `manual_${Date.now()}`,
      name: `${dbFieldLabel} (${selectedColumns.join(' + ')})`,
      sourceColumns: selectedColumns,
      separator: separator,
      cleanupRules: ['trim', 'removeEmptyValues'],
      preview: getPreviewValue(0),
    };

    onCombinationSelected(combinedField, targetDbField);

    toast({
      title: 'Campo criado!',
      description: `"${combinedField.name}" → ${targetDbField}`,
    });

    // Reset
    setSelectedColumns([]);
    setTargetDbField('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Search className="h-4 w-4 mr-2" />
          Mapear Manualmente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>🎯 Mapeamento Manual de Campos</DialogTitle>
          <DialogDescription>
            Selecione as colunas do CSV e veja os valores lado a lado para criar o mapeamento perfeito
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
          {/* Left Side - CSV Columns */}
          <div className="flex flex-col overflow-hidden">
            <div className="mb-4">
              <Label className="text-base font-semibold">Colunas do CSV ({availableColumns.length})</Label>
              <p className="text-sm text-muted-foreground">
                Selecione as colunas que deseja combinar
              </p>
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-4 space-y-2">
                {availableColumns.map((column) => (
                  <div
                    key={column}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedColumns.includes(column)
                        ? 'bg-blue-50 dark:bg-blue-950 border-blue-300'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleColumn(column)}
                  >
                    <Checkbox
                      checked={selectedColumns.includes(column)}
                      onCheckedChange={() => toggleColumn(column)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{column}</div>
                      {csvData[0] && csvData[0][column] && (
                        <div className="text-xs text-muted-foreground mt-1 truncate font-mono">
                          Ex: {csvData[0][column]}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Separator Selection */}
            {selectedColumns.length > 1 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <Label className="text-sm mb-2 block">Separador</Label>
                <Select value={separator} onValueChange={setSeparator}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Espaço</SelectItem>
                    <SelectItem value=", ">Vírgula + Espaço</SelectItem>
                    <SelectItem value=",">Vírgula</SelectItem>
                    <SelectItem value=" - ">Hífen com espaços</SelectItem>
                    <SelectItem value="-">Hífen</SelectItem>
                    <SelectItem value="__NONE__">Sem separador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Right Side - DB Fields & Preview */}
          <div className="flex flex-col overflow-hidden">
            <div className="mb-4">
              <Label className="text-base font-semibold">Campo do Banco de Dados</Label>
              <p className="text-sm text-muted-foreground">
                Para onde vai mapear
              </p>
            </div>

            <div className="space-y-3 mb-4">
              {DATABASE_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    targetDbField === field.key
                      ? 'bg-green-50 dark:bg-green-950 border-green-300'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setTargetDbField(field.key)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="radio"
                      checked={targetDbField === field.key}
                      onChange={() => setTargetDbField(field.key)}
                      className="cursor-pointer"
                    />
                    <span className="font-medium text-sm">{field.label}</span>
                    <Badge variant="outline" className="ml-auto font-mono text-xs">
                      {field.key}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground ml-6 font-mono">
                    Ex: {field.example}
                  </div>
                </div>
              ))}
            </div>

            {/* Preview */}
            {selectedColumns.length > 0 && (
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Preview (primeiras 5 linhas)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {showPreview ? 'Ocultar' : 'Mostrar'}
                  </Button>
                </div>

                {showPreview && (
                  <ScrollArea className="h-48 border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Valor Combinado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.slice(0, 5).map((_, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{idx + 1}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {getPreviewValue(idx) || <span className="text-muted-foreground italic">vazio</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedColumns.length > 0 && targetDbField && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedColumns.length} coluna{selectedColumns.length > 1 ? 's' : ''}</Badge>
                <ArrowRight className="h-4 w-4" />
                <Badge variant="outline" className="font-mono">
                  {targetDbField}
                </Badge>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={selectedColumns.length === 0 || !targetDbField}
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Mapeamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualFieldMatcher;

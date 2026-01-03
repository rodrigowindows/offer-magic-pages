import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X, Eye, Sparkles, Trash2, Wand2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { autoDetectBestCombinations, type DetectionResult } from "@/utils/smartFieldDetector";

export interface CombinedField {
  id: string;
  name: string;
  sourceColumns: string[];
  separator: string;
  cleanupRules: CleanupRule[];
  preview?: string;
}

export type CleanupRule =
  | 'trim'
  | 'uppercase'
  | 'lowercase'
  | 'removeSpecialChars'
  | 'removeDuplicateSpaces'
  | 'removeEmptyValues';

interface FieldCombinerProps {
  availableColumns: string[];
  sampleData?: Record<string, string>;
  onFieldsChange: (fields: CombinedField[]) => void;
}

const SEPARATOR_OPTIONS = [
  { value: ' ', label: 'Espaço' },
  { value: ', ', label: 'Vírgula + Espaço' },
  { value: ',', label: 'Vírgula' },
  { value: '-', label: 'Hífen' },
  { value: '_', label: 'Underscore' },
  { value: '__NONE__', label: 'Sem separador' },
];

const CLEANUP_OPTIONS: { value: CleanupRule; label: string; description: string }[] = [
  { value: 'trim', label: 'Trim', description: 'Remove espaços extras no início/fim' },
  { value: 'uppercase', label: 'MAIÚSCULAS', description: 'Converte tudo para maiúsculas' },
  { value: 'lowercase', label: 'minúsculas', description: 'Converte tudo para minúsculas' },
  { value: 'removeSpecialChars', label: 'Sem caracteres especiais', description: 'Remove !@#$%^&*()' },
  { value: 'removeDuplicateSpaces', label: 'Espaços únicos', description: 'Substitui múltiplos espaços por um' },
  { value: 'removeEmptyValues', label: 'Pular vazios', description: 'Não inclui valores vazios' },
];

const PRESET_TEMPLATES = [
  {
    name: 'Full Address',
    description: 'Combina endereço + cidade + estado',
    columns: ['Owner Fix - Mailing Address', 'Owner Fix - Mailing City', 'Owner Fix - Mailing State'],
    separator: ' ',
    cleanupRules: ['trim', 'removeEmptyValues'] as CleanupRule[],
  },
  {
    name: 'Property Address Only',
    description: 'Apenas endereço da propriedade (limpo)',
    columns: ['Owner Fix - Mailing Address'],
    separator: '__NONE__',
    cleanupRules: ['trim'] as CleanupRule[],
  },
  {
    name: 'Full Name',
    description: 'Primeiro + Último nome',
    columns: ['Input First Name', 'Input Last Name'],
    separator: ' ',
    cleanupRules: ['trim', 'removeEmptyValues'] as CleanupRule[],
  },
  {
    name: 'Owner Full Name',
    description: 'Nome completo do proprietário',
    columns: ['Owner Fix - First Name', 'Owner Fix - Last Name'],
    separator: ' ',
    cleanupRules: ['trim', 'removeEmptyValues'] as CleanupRule[],
  },
];

export const FieldCombiner = ({ availableColumns, sampleData, onFieldsChange }: FieldCombinerProps) => {
  const [combinedFields, setCombinedFields] = useState<CombinedField[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New field state
  const [newFieldName, setNewFieldName] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [separator, setSeparator] = useState(' ');
  const [cleanupRules, setCleanupRules] = useState<CleanupRule[]>(['trim', 'removeEmptyValues']);

  useEffect(() => {
    onFieldsChange(combinedFields);
  }, [combinedFields, onFieldsChange]);

  const applyCleanup = (value: string, rules: CleanupRule[]): string => {
    let result = value;

    rules.forEach(rule => {
      switch (rule) {
        case 'trim':
          result = result.trim();
          break;
        case 'uppercase':
          result = result.toUpperCase();
          break;
        case 'lowercase':
          result = result.toLowerCase();
          break;
        case 'removeSpecialChars':
          result = result.replace(/[^a-zA-Z0-9\s]/g, '');
          break;
        case 'removeDuplicateSpaces':
          result = result.replace(/\s+/g, ' ');
          break;
      }
    });

    return result;
  };

  const generatePreview = (columns: string[], sep: string, rules: CleanupRule[]): string => {
    if (!sampleData || columns.length === 0) return '';

    let values = columns.map(col => sampleData[col] || '');

    if (rules.includes('removeEmptyValues')) {
      values = values.filter(v => v.trim() !== '');
    }

    values = values.map(v => applyCleanup(v, rules));

    const actualSeparator = sep === "__NONE__" ? "" : sep; return values.join(actualSeparator);
  };

  const currentPreview = generatePreview(selectedColumns, separator, cleanupRules);

  const handleAddField = () => {
    if (!newFieldName || selectedColumns.length === 0) return;

    const newField: CombinedField = {
      id: `combined_${Date.now()}`,
      name: newFieldName,
      sourceColumns: selectedColumns,
      separator,
      cleanupRules,
      preview: currentPreview,
    };

    setCombinedFields([...combinedFields, newField]);

    // Reset form
    setNewFieldName('');
    setSelectedColumns([]);
    setSeparator(' ');
    setCleanupRules(['trim', 'removeEmptyValues']);
    setIsDialogOpen(false);
  };

  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    // Filter only columns that exist
    const existingColumns = preset.columns.filter(col => availableColumns.includes(col));

    if (existingColumns.length === 0) return;

    setNewFieldName(preset.name);
    setSelectedColumns(existingColumns);
    setSeparator(preset.separator);
    setCleanupRules(preset.cleanupRules);
  };

  const handleRemoveField = (id: string) => {
    setCombinedFields(combinedFields.filter(f => f.id !== id));
  };

  const toggleColumnSelection = (column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  const toggleCleanupRule = (rule: CleanupRule) => {
    setCleanupRules(prev =>
      prev.includes(rule)
        ? prev.filter(r => r !== rule)
        : [...prev, rule]
    );
  };


  const handleAutoDetect = async () => {
    if (!sampleData) {
      toast({
        title: 'Erro',
        description: 'Nenhum dado de amostra disponível',
        variant: 'destructive',
      });
      return;
    }

    setIsDetecting(true);
    setDetectionResults([]);

    try {
      const results = await autoDetectBestCombinations(
        availableColumns,
        sampleData,
        (status) => {
          console.log(status);
        }
      );

      setDetectionResults(results);

      if (results.length === 0) {
        toast({
          title: 'Nenhuma combinação encontrada',
          description: 'Não foi possível encontrar combinações que correspondam ao banco de dados',
        });
      } else {
        toast({
          title: 'Detecção concluída!',
          description: `Encontradas ${results.length} combinações com matches`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro na detecção',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const handleApplyDetectedField = (result: DetectionResult) => {
    const exists = combinedFields.find(f => f.name === result.field.name);
    if (exists) {
      toast({
        title: 'Campo já existe',
        description: `O campo "${result.field.name}" já foi adicionado`,
        variant: 'destructive',
      });
      return;
    }

    setCombinedFields([...combinedFields, result.field]);
    toast({
      title: 'Campo adicionado!',
      description: `"${result.field.name}" foi adicionado aos campos combinados`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Campos Combinados
            </CardTitle>
            <CardDescription>
              Combine múltiplas colunas em um único campo
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Campo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Campo Combinado</DialogTitle>
                <DialogDescription>
                  Combine várias colunas do CSV em um único campo
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Presets */}
                <div>
                  <Label className="mb-2 block">Templates Rápidos</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_TEMPLATES.map((preset) => (
                      <Button
                        key={preset.name}
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyPreset(preset)}
                        className="justify-start h-auto p-3"
                      >
                        <div className="text-left">
                          <div className="font-medium text-sm">{preset.name}</div>
                          <div className="text-xs text-muted-foreground">{preset.description}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Field Name */}
                <div>
                  <Label>Nome do Campo</Label>
                  <Input
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="Ex: Full Address"
                  />
                </div>

                {/* Column Selection */}
                <div>
                  <Label className="mb-2 block">Colunas para Combinar</Label>
                  <ScrollArea className="h-40 border rounded-lg p-2">
                    <div className="space-y-2">
                      {availableColumns.map((col) => (
                        <div
                          key={col}
                          className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded cursor-pointer"
                          onClick={() => toggleColumnSelection(col)}
                        >
                          <Checkbox
                            checked={selectedColumns.includes(col)}
                            onCheckedChange={() => toggleColumnSelection(col)}
                          />
                          <span className="text-sm flex-1">{col}</span>
                          {sampleData && sampleData[col] && (
                            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {sampleData[col]}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  {selectedColumns.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedColumns.map((col) => (
                        <Badge key={col} variant="secondary" className="text-xs">
                          {col}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={() => toggleColumnSelection(col)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Separator */}
                <div>
                  <Label>Separador</Label>
                  <Select value={separator} onValueChange={setSeparator}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEPARATOR_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cleanup Rules */}
                <div>
                  <Label className="mb-2 block">Limpeza e Transformação</Label>
                  <div className="space-y-2">
                    {CLEANUP_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-start gap-2 hover:bg-muted/50 p-2 rounded cursor-pointer"
                        onClick={() => toggleCleanupRule(option.value)}
                      >
                        <Checkbox
                          checked={cleanupRules.includes(option.value)}
                          onCheckedChange={() => toggleCleanupRule(option.value)}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {currentPreview && (
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">Preview (primeira linha)</Label>
                    </div>
                    <div className="bg-background rounded p-3 font-mono text-sm">
                      {currentPreview || <span className="text-muted-foreground italic">vazio</span>}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddField}
                    disabled={!newFieldName || selectedColumns.length === 0}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Campo
                  </Button>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {combinedFields.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum campo combinado criado ainda</p>
            <p className="text-sm">Clique em "Adicionar Campo" para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {combinedFields.map((field) => (
              <div
                key={field.id}
                className="border rounded-lg p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium">{field.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {field.sourceColumns.length} colunas combinadas
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveField(field.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {field.sourceColumns.map((col, idx) => (
                    <span key={col} className="text-xs">
                      <Badge variant="outline" className="font-mono">
                        {col}
                      </Badge>
                      {idx < field.sourceColumns.length - 1 && (
                        <span className="mx-1 text-muted-foreground">
                          {field.separator === '__NONE__' ? '→' : `"${field.separator}"`}
                        </span>
                      )}
                    </span>
                  ))}
                </div>

                {field.preview && (
                  <div className="bg-muted/50 rounded p-2 text-xs font-mono">
                    Preview: {field.preview}
                  </div>
                )}

                {field.cleanupRules.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {field.cleanupRules.map((rule) => (
                      <Badge key={rule} variant="secondary" className="text-xs">
                        {CLEANUP_OPTIONS.find(o => o.value === rule)?.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {combinedFields.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
            <p className="font-medium mb-1">💡 Próximo passo:</p>
            <p className="text-muted-foreground">
              Esses campos combinados estarão disponíveis no mapeamento de colunas
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FieldCombiner;

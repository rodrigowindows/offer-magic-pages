import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
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
import { Search, TrendingUp, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { CombinedField } from "./FieldCombiner";

interface SmartManualMatcherProps {
  csvData: Record<string, string>[];
  availableColumns: string[];
  onCombinationSelected: (field: CombinedField, dbField: string) => void;
}

interface MatchPreview {
  csvValue: string;
  dbValue: string;
  similarity: number;
}

interface ColumnScore {
  column: string;
  sampleValue: string;
  matchCount: number;
  matchPercentage: number;
  topMatches: MatchPreview[];
}

const DATABASE_FIELDS = [
  { key: 'address', label: 'Endereço', color: 'blue' },
  { key: 'city', label: 'Cidade', color: 'green' },
  { key: 'state', label: 'Estado', color: 'purple' },
  { key: 'zip_code', label: 'CEP', color: 'orange' },
  { key: 'owner_name', label: 'Nome do Proprietário', color: 'pink' },
  { key: 'owner_phone', label: 'Telefone', color: 'yellow' },
  { key: 'owner_address', label: 'Endereço do Proprietário', color: 'indigo' },
];

export const SmartManualMatcher = ({ csvData, availableColumns, onCombinationSelected }: SmartManualMatcherProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [targetDbField, setTargetDbField] = useState<string>('owner_name');
  const [separator, setSeparator] = useState<string>(' ');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [columnScores, setColumnScores] = useState<ColumnScore[]>([]);
  const [liveMatches, setLiveMatches] = useState<MatchPreview[]>([]);
  const [matchStats, setMatchStats] = useState<{ count: number; percentage: number } | null>(null);

  // Auto-analyze columns when dialog opens
  useEffect(() => {
    if (isOpen && columnScores.length === 0) {
      analyzeAllColumns();
    }
  }, [isOpen]);

  // Live match preview when selection changes
  useEffect(() => {
    if (selectedColumns.length > 0 && targetDbField) {
      analyzeLiveMatches();
    } else {
      setLiveMatches([]);
      setMatchStats(null);
    }
  }, [selectedColumns, targetDbField, separator]);

  const analyzeAllColumns = async () => {
    setIsAnalyzing(true);
    const scores: ColumnScore[] = [];

    try {
      // Sample first 10 rows for quick analysis
      const sampleSize = Math.min(csvData.length, 10);

      for (const column of availableColumns) {
        const sampleValue = csvData[0][column] || '';

        // Skip empty columns
        if (!sampleValue.trim()) continue;

        // Quick match test against database
        const { data, count } = await supabase
          .from('properties')
          .select('owner_name, address', { count: 'exact' })
          .or(`owner_name.ilike.%${sampleValue}%,address.ilike.%${sampleValue}%`)
          .limit(3);

        const matchCount = count || 0;
        const topMatches: MatchPreview[] = (data || []).map(row => ({
          csvValue: sampleValue,
          dbValue: row.owner_name || row.address || '',
          similarity: calculateSimilarity(sampleValue, row.owner_name || row.address || ''),
        }));

        scores.push({
          column,
          sampleValue,
          matchCount,
          matchPercentage: (matchCount / sampleSize) * 100,
          topMatches,
        });
      }

      // Sort by best matches
      scores.sort((a, b) => b.matchCount - a.matchCount);
      setColumnScores(scores);
    } catch (error) {
      console.error('Error analyzing columns:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeLiveMatches = async () => {
    if (selectedColumns.length === 0) return;

    try {
      // Combine selected columns
      const combinedValues = csvData.slice(0, 10).map(row => {
        const values = selectedColumns
          .map(col => row[col])
          .filter(v => v && v.trim() !== '');
        const actualSep = separator === '__NONE__' ? '' : separator;
        return values.join(actualSep);
      });

      // Test against database
      const { data: dbData } = await supabase
        .from('properties')
        .select(targetDbField)
        .limit(50);

      if (!dbData) {
        setLiveMatches([]);
        return;
      }

      const dbValues = dbData.map(row => row[targetDbField]).filter(Boolean);
      const matches: MatchPreview[] = [];
      let totalMatches = 0;

      // Find matches
      for (const csvVal of combinedValues) {
        if (!csvVal.trim()) continue;

        let bestMatch: MatchPreview | null = null;
        let bestSimilarity = 0;

        for (const dbVal of dbValues) {
          const similarity = calculateSimilarity(csvVal, dbVal);

          if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestMatch = {
              csvValue: csvVal,
              dbValue: dbVal,
              similarity,
            };
          }
        }

        if (bestMatch && bestMatch.similarity > 0.5) {
          matches.push(bestMatch);
          totalMatches++;
        }
      }

      setLiveMatches(matches.slice(0, 5));
      setMatchStats({
        count: totalMatches,
        percentage: (totalMatches / combinedValues.length) * 100,
      });
    } catch (error) {
      console.error('Error analyzing live matches:', error);
    }
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    // Simple similarity based on common words
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w)).length;
    const totalWords = Math.max(words1.length, words2.length);

    return commonWords / totalWords;
  };

  const toggleColumn = (column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  const handleCreate = () => {
    if (selectedColumns.length === 0 || !targetDbField) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos uma coluna e um campo de destino',
        variant: 'destructive',
      });
      return;
    }

    const dbFieldLabel = DATABASE_FIELDS.find(f => f.key === targetDbField)?.label || targetDbField;
    const combinedField: CombinedField = {
      id: `smart_manual_${Date.now()}`,
      name: `${dbFieldLabel} (${selectedColumns.join(' + ')})`,
      sourceColumns: selectedColumns,
      separator,
      cleanupRules: ['trim', 'removeEmptyValues'],
    };

    onCombinationSelected(combinedField, targetDbField);

    toast({
      title: '✓ Campo criado com sucesso!',
      description: `${matchStats?.count || 0} matches encontrados (${matchStats?.percentage.toFixed(0) || 0}%)`,
    });

    setIsOpen(false);
    setSelectedColumns([]);
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'text-green-600';
    if (similarity >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Search className="h-4 w-4 mr-2" />
          Mapeamento Inteligente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Mapeamento Inteligente com Preview
          </DialogTitle>
          <DialogDescription>
            Colunas ordenadas por melhor match. Selecione e veja resultados em tempo real.
          </DialogDescription>
        </DialogHeader>

        {/* Target DB Field Selection */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Label className="font-semibold whitespace-nowrap">Campo Destino:</Label>
          <Select value={targetDbField} onValueChange={setTargetDbField}>
            <SelectTrigger className="w-[280px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATABASE_FIELDS.map(field => (
                <SelectItem key={field.key} value={field.key}>
                  {field.label} ({field.key})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {matchStats && (
            <Badge variant={matchStats.percentage > 70 ? "default" : "secondary"} className="ml-auto">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {matchStats.count} matches ({matchStats.percentage.toFixed(0)}%)
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-5 gap-4 flex-1 overflow-hidden">
          {/* Left - CSV Columns (ordered by match) */}
          <div className="col-span-2 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <Label className="font-semibold">
                Colunas CSV ({columnScores.length})
              </Label>
              {isAnalyzing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analisando...
                </div>
              )}
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-2 space-y-1">
                {columnScores.map((score) => (
                  <div
                    key={score.column}
                    className={`p-2 rounded border cursor-pointer transition-all ${
                      selectedColumns.includes(score.column)
                        ? 'bg-blue-50 dark:bg-blue-950 border-blue-300'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleColumn(score.column)}
                  >
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={selectedColumns.includes(score.column)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{score.column}</div>
                        <div className="text-xs text-muted-foreground truncate font-mono mt-0.5">
                          {score.sampleValue}
                        </div>
                        {score.matchCount > 0 && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {score.matchCount} matches
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {selectedColumns.length > 1 && (
              <div className="mt-3 p-2 bg-muted/50 rounded">
                <Label className="text-xs mb-1 block">Separador</Label>
                <Select value={separator} onValueChange={setSeparator}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Espaço</SelectItem>
                    <SelectItem value=", ">Vírgula + Espaço</SelectItem>
                    <SelectItem value="-">Hífen</SelectItem>
                    <SelectItem value="__NONE__">Sem separador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Right - Live Match Preview */}
          <div className="col-span-3 flex flex-col overflow-hidden">
            <Label className="font-semibold mb-3">
              Preview de Matches - CSV vs Banco de Dados
            </Label>

            {liveMatches.length > 0 ? (
              <ScrollArea className="flex-1 border rounded-lg">
                <div className="p-3 space-y-3">
                  {liveMatches.map((match, idx) => (
                    <Card key={idx} className="p-3 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="text-xs">#{ idx + 1}</Badge>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground font-semibold">CSV:</span>
                              <span className="text-sm font-mono">{match.csvValue}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground font-semibold">DB:</span>
                              <span className="text-sm font-mono">{match.dbValue}</span>
                            </div>
                          </div>
                          <Badge
                            variant={match.similarity >= 0.8 ? "default" : "secondary"}
                            className={getSimilarityColor(match.similarity)}
                          >
                            {(match.similarity * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 border rounded-lg flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Selecione colunas para ver o preview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedColumns.length > 0 && (
              <span>{selectedColumns.length} coluna{selectedColumns.length > 1 ? 's' : ''} selecionada{selectedColumns.length > 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={selectedColumns.length === 0}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Criar Mapeamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SmartManualMatcher;

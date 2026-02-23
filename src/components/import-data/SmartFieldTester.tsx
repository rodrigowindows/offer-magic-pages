import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Wand2, CheckCircle2, XCircle, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { testAllCombinations, rankMatchesWithAI, type FieldTestResult } from "@/utils/smartFieldMatcher";
import type { CombinedField } from "./FieldCombiner";

interface SmartFieldTesterProps {
  csvData: Record<string, string>[];
  availableColumns: string[];
  onCombinationSelected: (field: CombinedField, dbField: string) => void;
}

const DATABASE_FIELDS = [
  { key: 'address', label: 'Endereço' },
  { key: 'city', label: 'Cidade' },
  { key: 'state', label: 'Estado' },
  { key: 'zip_code', label: 'CEP' },
  { key: 'owner_name', label: 'Nome do Proprietário' },
  { key: 'owner_phone', label: 'Telefone' },
  { key: 'owner_address', label: 'Endereço do Proprietário' },
];

export const SmartFieldTester = ({ csvData, availableColumns, onCombinationSelected }: SmartFieldTesterProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [results, setResults] = useState<FieldTestResult[]>([]);
  const [selectedDbFields, setSelectedDbFields] = useState<string[]>(['owner_name', 'owner_address', 'address']);
  const [useAI, setUseAI] = useState(true);

  const handleTest = async () => {
    if (csvData.length === 0) {
      toast({
        title: 'Erro',
        description: 'Nenhum dado CSV disponível',
        variant: 'destructive',
      });
      return;
    }

    setIsTesting(true);
    setProgress(0);
    setResults([]);

    try {
      const dbFields = selectedDbFields.length > 0 ? selectedDbFields : DATABASE_FIELDS.map(f => f.key);

      // Test all combinations
      const testResults = await testAllCombinations(
        csvData,
        availableColumns,
        dbFields,
        (status) => {
          setStatusMessage(status);
          // Estimate progress
          const match = status.match(/(\d+)\/(\d+)/);
          if (match) {
            const current = parseInt(match[1]);
            const total = parseInt(match[2]);
            setProgress((current / total) * (useAI ? 70 : 100));
          }
        }
      );

      // Use AI to rank if enabled
      let rankedResults = testResults;
      if (useAI && testResults.length > 0) {
        setStatusMessage('Usando IA para rankear resultados...');
        setProgress(80);

        for (const result of testResults) {
          const rankedMatches = await rankMatchesWithAI(result.matches, (status) => {
            setStatusMessage(status);
          });
          result.matches = rankedMatches;
        }

        setProgress(100);
      }

      setResults(rankedResults);

      if (rankedResults.length === 0) {
        toast({
          title: 'Nenhum match encontrado',
          description: 'Tente selecionar diferentes campos do banco de dados',
        });
      } else {
        toast({
          title: 'Testes concluídos!',
          description: `Encontradas ${rankedResults.length} combinações promissoras`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao testar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
      setProgress(0);
      setStatusMessage('');
    }
  };

  const handleSelectCombination = (result: FieldTestResult) => {
    onCombinationSelected(result.combination, result.dbField);
    toast({
      title: 'Combinação selecionada!',
      description: `"${result.combination.name}" → ${result.dbField}`,
    });
  };

  const toggleDbField = (field: string) => {
    setSelectedDbFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const getSimilarityColor = (similarity: number): string => {
    if (similarity >= 0.8) return 'text-green-600';
    if (similarity >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getSimilarityBg = (similarity: number): string => {
    if (similarity >= 0.8) return 'bg-green-50 dark:bg-green-950 border-green-200';
    if (similarity >= 0.6) return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200';
    return 'bg-orange-50 dark:bg-orange-950 border-orange-200';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          Testar Combinações Inteligente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🔍 Teste Inteligente de Combinações</DialogTitle>
          <DialogDescription>
            Selecione os campos do banco de dados e teste automaticamente todas as combinações possíveis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* DB Field Selection */}
          <div>
            <Label className="mb-3 block">Campos do Banco de Dados para Testar</Label>
            <div className="grid grid-cols-2 gap-2">
              {DATABASE_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                  onClick={() => toggleDbField(field.key)}
                >
                  <Checkbox
                    checked={selectedDbFields.includes(field.key)}
                    onCheckedChange={() => toggleDbField(field.key)}
                  />
                  <span className="text-sm">{field.label}</span>
                  <Badge variant="outline" className="text-xs font-mono ml-auto">
                    {field.key}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* AI Toggle */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Checkbox
              checked={useAI}
              onCheckedChange={(checked) => setUseAI(checked as boolean)}
            />
            <div className="flex-1">
              <div className="font-medium text-sm">Usar IA para Rankear Resultados</div>
              <div className="text-xs text-muted-foreground">
                Usa Gemini AI para comparar endereços e ordenar por melhor similaridade
              </div>
            </div>
            <Wand2 className="h-4 w-4 text-blue-600" />
          </div>

          {/* Test Button */}
          <Button
            onClick={handleTest}
            disabled={isTesting || selectedDbFields.length === 0}
            className="w-full"
            size="lg"
          >
            {isTesting ? (
              <>
                <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Testar Todas as Combinações
              </>
            )}
          </Button>

          {/* Progress */}
          {isTesting && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">{statusMessage}</p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Resultados ({results.length})</h4>
                <Badge variant="outline">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Ordenado por melhor match
                </Badge>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {results.map((result, idx) => (
                    <Card key={idx} className={getSimilarityBg(result.avgSimilarity)}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <span>{result.combination.name}</span>
                              <ArrowRight className="h-3 w-3" />
                              <Badge variant="outline" className="font-mono text-xs">
                                {result.dbField}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {result.totalMatches} matches • {result.matchPercentage.toFixed(0)}% de similaridade • Score: {(result.avgSimilarity * 100).toFixed(0)}%
                            </CardDescription>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleSelectCombination(result)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Usar Esta
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {/* Source Columns */}
                        <div className="flex flex-wrap gap-1">
                          {result.combination.sourceColumns.map((col) => (
                            <Badge key={col} variant="secondary" className="text-xs font-mono">
                              {col}
                            </Badge>
                          ))}
                        </div>

                        {/* Match Examples */}
                        {result.matches.length > 0 && (
                          <div className="space-y-2 mt-3">
                            <div className="text-xs font-medium">Exemplos de Matches:</div>
                            {result.matches.slice(0, 3).map((match, i) => (
                              <div key={i} className="bg-white dark:bg-background rounded p-2 text-xs space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground min-w-[60px]">CSV:</span>
                                  <span className="font-mono flex-1">{match.csvValue}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground min-w-[60px]">Banco:</span>
                                  <span className="font-mono flex-1">{match.dbValue}</span>
                                  <Badge
                                    variant="outline"
                                    className={`${getSimilarityColor(match.similarity)} text-xs`}
                                  >
                                    {(match.similarity * 100).toFixed(0)}%
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SmartFieldTester;

/**
 * Automated A/B Testing System
 * Sistema inteligente de testes A/B para otimização de campanhas
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  TestTube,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  BarChart3,
  Zap,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Crown
} from 'lucide-react';

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'completed' | 'paused';
  variants: ABVariant[];
  targetMetric: 'open_rate' | 'click_rate' | 'conversion_rate' | 'response_rate';
  sampleSize: number;
  confidenceThreshold: number;
  winner?: string;
  startDate?: string;
  endDate?: string;
  created_at: string;
}

interface ABVariant {
  id: string;
  name: string;
  templateId: string;
  subjectLine?: string;
  content: string;
  trafficPercentage: number;
  metrics: {
    sent: number;
    opens: number;
    clicks: number;
    conversions: number;
    responses: number;
  };
}

interface ABTestResults {
  testId: string;
  variants: Array<{
    variantId: string;
    name: string;
    metrics: {
      openRate: number;
      clickRate: number;
      conversionRate: number;
      responseRate: number;
    };
    confidence: number;
    isWinner: boolean;
  }>;
  winnerDeclared: boolean;
  winnerVariant?: string;
  improvement: number;
}

const AutomatedABTesting = () => {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [results, setResults] = useState<ABTestResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingTest, setCreatingTest] = useState(false);
  const { toast } = useToast();

  // Form state for new test
  const [newTest, setNewTest] = useState<Partial<ABTest>>({
    name: '',
    description: '',
    status: 'draft',
    variants: [
      { id: 'A', name: 'Variant A', templateId: '', content: '', trafficPercentage: 50, metrics: { sent: 0, opens: 0, clicks: 0, conversions: 0, responses: 0 } },
      { id: 'B', name: 'Variant B', templateId: '', content: '', trafficPercentage: 50, metrics: { sent: 0, opens: 0, clicks: 0, conversions: 0, responses: 0 } }
    ],
    targetMetric: 'open_rate',
    sampleSize: 1000,
    confidenceThreshold: 95
  });

  useEffect(() => {
    loadABTests();
  }, []);

  const loadABTests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ab_tests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error('Erro ao carregar testes A/B:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os testes A/B",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createABTest = async () => {
    if (!newTest.name || !newTest.variants || newTest.variants.length < 2) {
      toast({
        title: "Erro",
        description: "Nome e pelo menos 2 variantes são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('ab_tests')
        .insert([newTest])
        .select()
        .single();

      if (error) throw error;

      setTests([data, ...tests]);
      setNewTest({
        name: '',
        description: '',
        status: 'draft',
        variants: [
          { id: 'A', name: 'Variant A', templateId: '', content: '', trafficPercentage: 50, metrics: { sent: 0, opens: 0, clicks: 0, conversions: 0, responses: 0 } },
          { id: 'B', name: 'Variant B', templateId: '', content: '', trafficPercentage: 50, metrics: { sent: 0, opens: 0, clicks: 0, conversions: 0, responses: 0 } }
        ],
        targetMetric: 'open_rate',
        sampleSize: 1000,
        confidenceThreshold: 95
      });
      setCreatingTest(false);

      toast({
        title: "Sucesso",
        description: "Teste A/B criado com sucesso"
      });
    } catch (error) {
      console.error('Erro ao criar teste A/B:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o teste A/B",
        variant: "destructive"
      });
    }
  };

  const startABTest = async (testId: string) => {
    try {
      const { error } = await supabase
        .from('ab_tests')
        .update({
          status: 'running',
          startDate: new Date().toISOString()
        })
        .eq('id', testId);

      if (error) throw error;

      setTests(tests.map(t =>
        t.id === testId
          ? { ...t, status: 'running', startDate: new Date().toISOString() }
          : t
      ));

      toast({
        title: "Teste Iniciado",
        description: "O teste A/B foi iniciado com sucesso"
      });
    } catch (error) {
      console.error('Erro ao iniciar teste:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o teste",
        variant: "destructive"
      });
    }
  };

  const stopABTest = async (testId: string) => {
    try {
      const { error } = await supabase
        .from('ab_tests')
        .update({
          status: 'completed',
          endDate: new Date().toISOString()
        })
        .eq('id', testId);

      if (error) throw error;

      setTests(tests.map(t =>
        t.id === testId
          ? { ...t, status: 'completed', endDate: new Date().toISOString() }
          : t
      ));

      toast({
        title: "Teste Finalizado",
        description: "O teste A/B foi finalizado"
      });
    } catch (error) {
      console.error('Erro ao finalizar teste:', error);
    }
  };

  const calculateResults = (test: ABTest): ABTestResults => {
    const variants = test.variants.map(variant => {
      const metrics = variant.metrics;
      const totalSent = metrics.sent;

      return {
        variantId: variant.id,
        name: variant.name,
        metrics: {
          openRate: totalSent > 0 ? (metrics.opens / totalSent) * 100 : 0,
          clickRate: totalSent > 0 ? (metrics.clicks / totalSent) * 100 : 0,
          conversionRate: totalSent > 0 ? (metrics.conversions / totalSent) * 100 : 0,
          responseRate: totalSent > 0 ? (metrics.responses / totalSent) * 100 : 0
        },
        confidence: 85 + Math.random() * 10, // Mock confidence calculation
        isWinner: false
      };
    });

    // Determine winner based on target metric
    const targetMetric = test.targetMetric;
    variants.sort((a, b) => b.metrics[targetMetric] - a.metrics[targetMetric]);
    variants[0].isWinner = true;

    const winnerVariant = variants[0].variantId;
    const improvement = variants.length > 1 ?
      ((variants[0].metrics[targetMetric] - variants[1].metrics[targetMetric]) / variants[1].metrics[targetMetric]) * 100 : 0;

    return {
      testId: test.id,
      variants,
      winnerDeclared: test.status === 'completed',
      winnerVariant,
      improvement
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-green-100 text-green-800"><Play className="w-3 h-3 mr-1" />Executando</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800"><Pause className="w-3 h-3 mr-1" />Pausado</Badge>;
      default:
        return <Badge variant="outline"><TestTube className="w-3 h-3 mr-1" />Rascunho</Badge>;
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'open_rate': return 'Taxa de Abertura';
      case 'click_rate': return 'Taxa de Cliques';
      case 'conversion_rate': return 'Taxa de Conversão';
      case 'response_rate': return 'Taxa de Resposta';
      default: return metric;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Testes A/B Automatizados</h1>
          <p className="text-muted-foreground">
            Otimize suas campanhas testando diferentes abordagens automaticamente
          </p>
        </div>
        <Button onClick={() => setCreatingTest(true)}>
          <TestTube className="h-4 w-4 mr-2" />
          Novo Teste A/B
        </Button>
      </div>

      <Tabs defaultValue="tests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tests">Testes</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.map((test) => (
              <Card key={test.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedTest(test);
                      setResults(calculateResults(test));
                    }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{test.name}</CardTitle>
                    {getStatusBadge(test.status)}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {test.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Métrica Alvo:</span>
                    <Badge variant="outline">{getMetricLabel(test.targetMetric)}</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Amostra:</span>
                      <span>{test.sampleSize.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Variantes:</span>
                      <span>{test.variants.length}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {test.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          startABTest(test.id);
                        }}
                        className="flex-1"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Iniciar
                      </Button>
                    )}
                    {test.status === 'running' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          stopABTest(test.id);
                        }}
                        className="flex-1"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Finalizar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {tests.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TestTube className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum teste A/B criado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Crie seu primeiro teste A/B para começar a otimizar suas campanhas automaticamente
                </p>
                <Button onClick={() => setCreatingTest(true)}>
                  <TestTube className="h-4 w-4 mr-2" />
                  Criar Primeiro Teste
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {selectedTest && results ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedTest.name}</h2>
                  <p className="text-muted-foreground">{selectedTest.description}</p>
                </div>
                {results.winnerDeclared && (
                  <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1">
                    <Crown className="w-4 h-4 mr-1" />
                    Vencedor: {results.variants.find(v => v.isWinner)?.name}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.variants.map((variant) => (
                  <Card key={variant.variantId} className={variant.isWinner ? 'border-green-500 bg-green-50' : ''}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center">
                          {variant.isWinner && <Crown className="w-5 h-5 text-green-600 mr-2" />}
                          {variant.name}
                        </CardTitle>
                        {variant.isWinner && <Badge className="bg-green-600">Vencedor</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {variant.metrics.openRate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Taxa de Abertura</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {variant.metrics.clickRate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Taxa de Cliques</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">
                            {variant.metrics.conversionRate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Conversão</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-orange-600">
                            {variant.confidence.toFixed(0)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Confiança</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {results.winnerDeclared && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{results.variants.find(v => v.isWinner)?.name}</strong> teve
                    <strong> {results.improvement.toFixed(1)}% </strong>
                    de melhoria na {getMetricLabel(selectedTest.targetMetric).toLowerCase()} comparado à segunda melhor variante.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecione um teste</h3>
                <p className="text-muted-foreground text-center">
                  Clique em um teste A/B para ver os resultados detalhados
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Padrões de Sucesso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Assuntos curtos e diretos</strong> têm 34% mais taxa de abertura
                  </AlertDescription>
                </Alert>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Personalização com nome</strong> aumenta conversão em 28%
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Links no final</strong> performam 15% pior que links no meio do texto
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Recomendações Automáticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-1">Próximo Teste Sugerido</h4>
                  <p className="text-sm text-blue-800">
                    Teste diferentes horários de envio: 9h vs 14h vs 18h
                  </p>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-1">Otimização Identificada</h4>
                  <p className="text-sm text-green-800">
                    Templates com imagens têm 42% mais engajamento
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Test Dialog */}
      {creatingTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Criar Novo Teste A/B</CardTitle>
              <CardDescription>
                Configure um teste para otimizar suas campanhas automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testName">Nome do Teste</Label>
                  <Input
                    id="testName"
                    value={newTest.name}
                    onChange={(e) => setNewTest(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Teste de Assunto"
                  />
                </div>
                <div>
                  <Label htmlFor="targetMetric">Métrica Alvo</Label>
                  <Select
                    value={newTest.targetMetric}
                    onValueChange={(value) => setNewTest(prev => ({ ...prev, targetMetric: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open_rate">Taxa de Abertura</SelectItem>
                      <SelectItem value="click_rate">Taxa de Cliques</SelectItem>
                      <SelectItem value="conversion_rate">Taxa de Conversão</SelectItem>
                      <SelectItem value="response_rate">Taxa de Resposta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={newTest.description}
                  onChange={(e) => setNewTest(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o objetivo do teste"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sampleSize">Tamanho da Amostra</Label>
                  <Input
                    id="sampleSize"
                    type="number"
                    value={newTest.sampleSize}
                    onChange={(e) => setNewTest(prev => ({ ...prev, sampleSize: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="confidence">Confiança Mínima (%)</Label>
                  <Input
                    id="confidence"
                    type="number"
                    value={newTest.confidenceThreshold}
                    onChange={(e) => setNewTest(prev => ({ ...prev, confidenceThreshold: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Variantes do Teste</Label>
                {newTest.variants?.map((variant, index) => (
                  <Card key={variant.id}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Nome da Variante</Label>
                          <Input
                            value={variant.name}
                            onChange={(e) => {
                              const variants = [...(newTest.variants || [])];
                              variants[index].name = e.target.value;
                              setNewTest(prev => ({ ...prev, variants }));
                            }}
                          />
                        </div>
                        <div>
                          <Label>% do Tráfego</Label>
                          <Input
                            type="number"
                            value={variant.trafficPercentage}
                            onChange={(e) => {
                              const variants = [...(newTest.variants || [])];
                              variants[index].trafficPercentage = parseInt(e.target.value);
                              setNewTest(prev => ({ ...prev, variants }));
                            }}
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label>Conteúdo/Template</Label>
                        <Input
                          value={variant.content}
                          onChange={(e) => {
                            const variants = [...(newTest.variants || [])];
                            variants[index].content = e.target.value;
                            setNewTest(prev => ({ ...prev, variants }));
                          }}
                          placeholder="Descreva o conteúdo da variante"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setCreatingTest(false)}>
                  Cancelar
                </Button>
                <Button onClick={createABTest}>
                  Criar Teste A/B
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export { AutomatedABTesting };
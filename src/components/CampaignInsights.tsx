/**
 * CampaignInsights - Insights e recomendações para campanhas
 * Análise inteligente e sugestões de otimização
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Lightbulb,
  TrendingUp,
  Target,
  Zap,
  Clock,
  Users,
  MessageSquare,
  Mail,
  Phone,
  BarChart3,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface CampaignInsightsProps {
  className?: string;
}

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  suggestion?: string;
}

export const CampaignInsights = ({ className }: CampaignInsightsProps) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock insights - em produção viria de análise de dados reais
    const mockInsights: Insight[] = [
      {
        id: '1',
        type: 'opportunity',
        title: 'Sequências Multi-Canal',
        description: 'Implementar sequências SMS → Email → Call pode aumentar conversões em 40-60%',
        impact: 'high',
        actionable: true,
        suggestion: 'Configure campanhas sequenciais no agendador'
      },
      {
        id: '2',
        type: 'success',
        title: 'Horário Ideal Encontrado',
        description: 'Ligações entre 14h-16h têm 35% mais conversões que outros horários',
        impact: 'medium',
        actionable: true,
        suggestion: 'Agende mais campanhas neste horário'
      },
      {
        id: '3',
        type: 'warning',
        title: 'Templates Pouco Eficazes',
        description: '3 templates têm taxa de resposta abaixo de 5%. Considere revisá-los',
        impact: 'medium',
        actionable: true,
        suggestion: 'Teste variações dos templates problemáticos'
      },
      {
        id: '4',
        type: 'info',
        title: 'Segmentação por Valor',
        description: 'Propriedades acima de $300k convertem 2x mais que propriedades menores',
        impact: 'high',
        actionable: true,
        suggestion: 'Crie campanhas específicas para alto valor'
      },
      {
        id: '5',
        type: 'opportunity',
        title: 'A/B Testing Não Utilizado',
        description: 'Você ainda não testou variações de mensagem. Potencial de +25% performance',
        impact: 'medium',
        actionable: true,
        suggestion: 'Configure teste A/B na próxima campanha'
      },
      {
        id: '6',
        type: 'success',
        title: 'Follow-up Eficaz',
        description: 'Campanhas de follow-up 3 dias após contato inicial têm 28% mais respostas',
        impact: 'medium',
        actionable: true,
        suggestion: 'Implemente follow-ups automáticos'
      }
    ];

    setTimeout(() => {
      setInsights(mockInsights);
      setLoading(false);
    }, 1000);
  }, []);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'opportunity': return <Lightbulb className="w-5 h-5 text-blue-500" />;
      default: return <BarChart3 className="w-5 h-5 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const highImpactInsights = insights.filter(i => i.impact === 'high');
  const actionableInsights = insights.filter(i => i.actionable);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="w-6 h-6" />
            Insights de Campanhas
          </h2>
          <p className="text-muted-foreground">
            Análise inteligente para otimizar suas campanhas e aumentar conversões
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="destructive" className="text-sm">
            {highImpactInsights.length} Alto Impacto
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {actionableInsights.length} Acionáveis
          </Badge>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Potencial de Melhoria</p>
                <p className="text-2xl font-bold text-green-600">+45%</p>
                <p className="text-xs text-muted-foreground">conversões estimadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Oportunidades</p>
                <p className="text-2xl font-bold">{insights.filter(i => i.type === 'opportunity').length}</p>
                <p className="text-xs text-muted-foreground">para implementar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Implementação Rápida</p>
                <p className="text-2xl font-bold">{actionableInsights.length}</p>
                <p className="text-xs text-muted-foreground">insights acionáveis</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recomendações Prioritárias</h3>

        <div className="space-y-3">
          {insights.map((insight) => (
            <Card key={insight.id} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getInsightIcon(insight.type)}
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge className={getImpactColor(insight.impact)}>
                        {insight.impact === 'high' ? 'Alto Impacto' :
                         insight.impact === 'medium' ? 'Médio Impacto' : 'Baixo Impacto'}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {insight.description}
                    </p>

                    {insight.suggestion && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm">
                          <strong>💡 Sugestão:</strong> {insight.suggestion}
                        </p>
                      </div>
                    )}

                    {insight.actionable && (
                      <div className="flex justify-end">
                        <Button size="sm" variant="outline" className="gap-2">
                          <Zap className="w-4 h-4" />
                          Implementar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Roadmap de Melhorias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Roadmap de Otimização
          </CardTitle>
          <CardDescription>
            Plano passo-a-passo para implementar melhorias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-green-800">1</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Configurar Sequências Multi-Canal</h4>
                <p className="text-sm text-muted-foreground">
                  SMS → Email → Call com intervalos otimizados
                </p>
                <Progress value={25} className="mt-2 h-2" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-800">2</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Implementar A/B Testing</h4>
                <p className="text-sm text-muted-foreground">
                  Testar variações de mensagem e horários
                </p>
                <Progress value={10} className="mt-2 h-2" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-purple-800">3</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Agendamento Inteligente</h4>
                <p className="text-sm text-muted-foreground">
                  Horários otimizados por canal e perfil do destinatário
                </p>
                <Progress value={0} className="mt-2 h-2" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-orange-800">4</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Segmentação Avançada</h4>
                <p className="text-sm text-muted-foreground">
                  Campanhas personalizadas por valor, localização e perfil
                </p>
                <Progress value={5} className="mt-2 h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
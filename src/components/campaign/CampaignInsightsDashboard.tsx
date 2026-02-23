/**
 * CampaignInsightsDashboard - Dashboard de insights integrado
 * Mostra métricas rápidas e recomendações no dashboard principal
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Target,
  Lightbulb,
  BarChart3,
  ArrowRight
} from 'lucide-react';

interface CampaignInsightsDashboardProps {
  className?: string;
  onViewFullAnalytics?: () => void;
}

export const CampaignInsightsDashboard = ({
  className,
  onViewFullAnalytics
}: CampaignInsightsDashboardProps) => {
  // Mock data - em produção viria de analytics reais
  const insights = [
    {
      type: 'success',
      title: 'Sequências Performam Melhor',
      description: 'Campanhas SMS → Email → Call têm 45% mais conversões',
      impact: 'high'
    },
    {
      type: 'opportunity',
      title: 'Horário Ideal: 14h-16h',
      description: 'Ligações neste horário convertem 35% mais',
      impact: 'medium'
    },
    {
      type: 'warning',
      title: 'Templates Precisam Otimização',
      description: '3 templates têm resposta abaixo de 5%',
      impact: 'medium'
    }
  ];

  const metrics = {
    totalSent: 1250,
    totalConverted: 187,
    conversionRate: 14.96,
    avgCostPerLead: 18.50,
    bestChannel: 'Call',
    bestTime: '14h-16h'
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance das Campanhas
          </h3>
          <p className="text-sm text-muted-foreground">
            Insights baseados nos seus dados recentes
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onViewFullAnalytics}
          className="gap-2"
        >
          Ver Analytics Completos
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{metrics.totalSent}</div>
            <p className="text-xs text-muted-foreground">Mensagens Enviadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{metrics.totalConverted}</div>
            <p className="text-xs text-muted-foreground">Conversões</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{metrics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Taxa Conversão</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">${metrics.avgCostPerLead}</div>
            <p className="text-xs text-muted-foreground">Custo por Lead</p>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Insights Principais
          </CardTitle>
          <CardDescription>
            Recomendações baseadas na sua performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                insight.type === 'success'
                  ? 'bg-green-50 border-green-200'
                  : insight.type === 'warning'
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  insight.type === 'success'
                    ? 'bg-green-500'
                    : insight.type === 'warning'
                    ? 'bg-orange-500'
                    : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium">{insight.title}</h4>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        insight.impact === 'high'
                          ? 'border-red-300 text-red-700'
                          : 'border-yellow-300 text-yellow-700'
                      }`}
                    >
                      {insight.impact === 'high' ? 'Alto Impacto' : 'Médio Impacto'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            Melhores Práticas Atuais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Melhor Canal:</p>
              <p className="font-medium text-green-600">{metrics.bestChannel}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Melhor Horário:</p>
              <p className="font-medium text-blue-600">{metrics.bestTime}</p>
            </div>
            <div>
              <p className="text-muted-foreground">ROI Estimado:</p>
              <p className="font-medium text-purple-600">285%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Próxima Ação:</p>
              <p className="font-medium text-orange-600">Teste A/B</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
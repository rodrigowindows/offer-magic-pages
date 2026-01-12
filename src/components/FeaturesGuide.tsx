import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUsageAnalytics } from '@/contexts/UsageAnalyticsContext';
import {
  BarChart3,
  Users,
  MessageSquare,
  Mail,
  Phone,
  Rocket,
  Settings,
  Zap,
  Target,
  Eye,
  FileText,
  MapPin,
  Calculator,
  Search,
  Filter,
  Upload,
  Download,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Star,
  TrendingUp,
  Home,
  Building,
  DollarSign,
  PieChart,
  Activity,
  Globe,
  Shield,
  Heart,
  Trophy,
  Lightbulb,
  Wrench,
  Database,
  Smartphone,
  Bot,
  Layers,
  Navigation,
  Briefcase,
  Clock,
  Bell
} from 'lucide-react';

interface FeatureInfo {
  id: string;
  name: string;
  description: string;
  detailedDescription: string;
  category: string;
  icon: React.ComponentType<any>;
  path?: string;
  tab?: string;
  benefits: string[];
  useCases: string[];
  isNew?: boolean;
  isPopular?: boolean;
}

const FEATURES: FeatureInfo[] = [
  // Dashboard & Navigation
  {
    id: 'dashboard',
    name: 'Dashboard Principal',
    description: 'Visão geral completa de todas as propriedades e métricas',
    detailedDescription: 'O dashboard principal oferece uma visão panorâmica de todo o seu negócio imobiliário. Visualize estatísticas importantes, propriedades recentes, campanhas ativas e métricas de performance em tempo real.',
    category: 'Navegação',
    icon: BarChart3,
    path: '/',
    benefits: [
      'Visão consolidada de todas as métricas',
      'Acesso rápido às propriedades mais importantes',
      'Monitoramento de campanhas em andamento',
      'Relatórios automáticos de performance'
    ],
    useCases: [
      'Revisar performance diária',
      'Identificar oportunidades de negócio',
      'Acompanhar progresso de campanhas',
      'Tomar decisões estratégicas'
    ]
  },
  {
    id: 'property_details',
    name: 'Página da Propriedade',
    description: 'Informações completas e gerenciamento individual de propriedades',
    detailedDescription: 'Cada propriedade tem sua própria página dedicada com todas as informações relevantes: dados do imóvel, histórico de contato, campanhas realizadas, documentos e muito mais.',
    category: 'Navegação',
    icon: Home,
    benefits: [
      'Informações centralizadas por propriedade',
      'Histórico completo de interações',
      'Documentação organizada',
      'Acesso rápido a ações importantes'
    ],
    useCases: [
      'Analisar uma propriedade específica',
      'Preparar uma oferta personalizada',
      'Revisar histórico de negociações',
      'Gerenciar documentos relacionados'
    ]
  },

  // Property Management
  {
    id: 'property_filters',
    name: 'Filtros Avançados',
    description: 'Sistema completo de filtros para encontrar propriedades específicas',
    detailedDescription: 'Filtre propriedades por localização, valor, status, tags, datas e muito mais. Combine múltiplos filtros para encontrar exatamente o que procura.',
    category: 'Gerenciamento',
    icon: Filter,
    tab: 'properties',
    benefits: [
      'Localização rápida de propriedades',
      'Segmentação avançada',
      'Busca inteligente por critérios',
      'Salvamento de filtros personalizados'
    ],
    useCases: [
      'Encontrar propriedades em uma cidade específica',
      'Identificar imóveis com valor alto',
      'Localizar propriedades não contactadas',
      'Criar listas segmentadas para campanhas'
    ]
  },
  {
    id: 'bulk_actions',
    name: 'Ações em Massa',
    description: 'Execute ações em múltiplas propriedades simultaneamente',
    detailedDescription: 'Selecione várias propriedades e execute ações como mudança de status, envio de campanhas, geração de relatórios e muito mais, tudo de uma vez.',
    category: 'Gerenciamento',
    icon: Layers,
    benefits: [
      'Produtividade aumentada',
      'Processamento em lote eficiente',
      'Manutenção de consistência',
      'Economia de tempo significativa'
    ],
    useCases: [
      'Atualizar status de múltiplas propriedades',
      'Enviar campanha para grupo selecionado',
      'Gerar relatórios em lote',
      'Aplicar tags a várias propriedades'
    ]
  },
  {
    id: 'property_import',
    name: 'Importação de Propriedades',
    description: 'Importe propriedades via CSV com validação automática',
    detailedDescription: 'Faça upload de arquivos CSV para importar múltiplas propriedades. O sistema valida os dados, identifica duplicatas e fornece feedback detalhado sobre o processo.',
    category: 'Gerenciamento',
    icon: Upload,
    tab: 'properties',
    benefits: [
      'Importação rápida de grandes volumes',
      'Validação automática de dados',
      'Detecção de duplicatas',
      'Relatórios detalhados de importação'
    ],
    useCases: [
      'Migrar dados de outros sistemas',
      'Importar listas de corretores',
      'Atualizar base de dados em lote',
      'Adicionar novas propriedades regularmente'
    ]
  },

  // Marketing & Campaigns
  {
    id: 'campaign_manager',
    name: 'Gerenciador de Campanhas',
    description: 'Crie e gerencie campanhas de marketing automatizadas',
    detailedDescription: 'Interface completa para criar campanhas de email, SMS e ligações. Escolha templates, segmente o público, defina cronogramas e acompanhe resultados em tempo real.',
    category: 'Marketing',
    icon: Rocket,
    tab: 'campaigns',
    benefits: [
      'Campanhas totalmente automatizadas',
      'Templates profissionais prontos',
      'Segmentação avançada de público',
      'Acompanhamento de resultados detalhado'
    ],
    useCases: [
      'Lançar campanhas de follow-up',
      'Enviar ofertas personalizadas',
      'Nutrir leads interessados',
      'Manter contato com proprietários'
    ],
    isPopular: true
  },
  {
    id: 'email_campaigns',
    name: 'Campanhas por Email',
    description: 'Envio automatizado de emails personalizados',
    detailedDescription: 'Crie sequências de email automatizadas com templates personalizáveis. Inclua informações da propriedade, ofertas específicas e calls-to-action estratégicos.',
    category: 'Marketing',
    icon: Mail,
    tab: 'campaigns',
    benefits: [
      'Emails totalmente personalizados',
      'Sequências automatizadas',
      'Templates profissionais',
      'Tracking de abertura e cliques'
    ],
    useCases: [
      'Enviar ofertas iniciais',
      'Follow-up após contato',
      'Newsletter mensal',
      'Atualizações de mercado'
    ]
  },
  {
    id: 'sms_campaigns',
    name: 'Campanhas por SMS',
    description: 'Mensagens de texto diretas e imediatas',
    detailedDescription: 'Envie SMS instantâneos para proprietários. Perfeito para comunicações urgentes, confirmações e lembretes importantes.',
    category: 'Marketing',
    icon: Smartphone,
    tab: 'campaigns',
    benefits: [
      'Taxa de abertura superior a 90%',
      'Entrega instantânea',
      'Custo muito baixo',
      'Perfeito para comunicações urgentes'
    ],
    useCases: [
      'Confirmação de ofertas',
      'Lembretes de follow-up',
      'Alertas importantes',
      'Mensagens de urgência'
    ]
  },

  // Communication Tools
  {
    id: 'chatbot',
    name: 'Chatbot IA',
    description: 'Assistente virtual inteligente para visitantes',
    detailedDescription: 'Chatbot alimentado por IA que responde perguntas dos visitantes do site, coleta informações de contato e qualifica leads automaticamente.',
    category: 'Comunicação',
    icon: Bot,
    benefits: [
      'Atendimento 24/7 automático',
      'Qualificação automática de leads',
      'Coleta inteligente de dados',
      'Redução de workload da equipe'
    ],
    useCases: [
      'Atender visitantes do site',
      'Coletar informações de contato',
      'Responder perguntas frequentes',
      'Qualificar interesse inicial'
    ],
    isPopular: true
  },
  {
    id: 'offer_chatbot',
    name: 'Chatbot de Ofertas',
    description: 'Negociação automatizada de ofertas por propriedade',
    detailedDescription: 'Chatbot específico para cada propriedade que negocia ofertas em tempo real, responde objeções e guia o proprietário através do processo de venda.',
    category: 'Comunicação',
    icon: MessageSquare,
    benefits: [
      'Negociação automatizada',
      'Disponibilidade 24/7',
      'Respostas consistentes',
      'Escalabilidade ilimitada'
    ],
    useCases: [
      'Negociar ofertas iniciais',
      'Responder objeções comuns',
      'Fornecer informações adicionais',
      'Agendar visitas virtuais'
    ]
  },

  // Analytics & Reporting
  {
    id: 'property_analytics',
    name: 'Analytics de Propriedade',
    description: 'Métricas detalhadas de performance por imóvel',
    detailedDescription: 'Acompanhe todas as interações, campanhas e resultados para cada propriedade individualmente. Visualize histórico completo e métricas de engajamento.',
    category: 'Analytics',
    icon: PieChart,
    benefits: [
      'Visão detalhada por propriedade',
      'Histórico completo de interações',
      'Métricas de engajamento',
      'Insights para otimização'
    ],
    useCases: [
      'Analisar performance de uma propriedade',
      'Identificar padrões de sucesso',
      'Otimizar estratégias por imóvel',
      'Tomar decisões baseadas em dados'
    ]
  },
  {
    id: 'channel_analytics',
    name: 'Analytics por Canal',
    description: 'Performance de cada canal de comunicação',
    detailedDescription: 'Compare a efetividade de emails, SMS, ligações e outros canais. Identifique quais canais geram mais engajamento e melhores resultados.',
    category: 'Analytics',
    icon: BarChart3,
    tab: 'analytics',
    benefits: [
      'Comparação entre canais',
      'Identificação de melhores práticas',
      'Otimização de investimento',
      'Melhoria contínua de resultados'
    ],
    useCases: [
      'Decidir onde investir mais',
      'Otimizar mix de canais',
      'Identificar canais subutilizados',
      'Maximizar ROI por canal'
    ]
  },

  // Financial Tools
  {
    id: 'cash_offer_calculator',
    name: 'Calculadora de Ofertas',
    description: 'Geração automática de ofertas em dinheiro',
    detailedDescription: 'Calcula automaticamente ofertas competitivas baseadas no valor de mercado, condições da propriedade e estratégia de investimento.',
    category: 'Financeiro',
    icon: Calculator,
    benefits: [
      'Ofertas consistentes e competitivas',
      'Cálculos automáticos precisos',
      'Consideração de múltiplos fatores',
      'Padronização de processo'
    ],
    useCases: [
      'Gerar ofertas iniciais',
      'Comparar múltiplas propriedades',
      'Otimizar estratégia de preços',
      'Manter consistência na precificação'
    ]
  },
  {
    id: 'savings_calculator',
    name: 'Calculadora de Economia',
    description: 'Mostra aos compradores quanto eles economizam',
    detailedDescription: 'Calcula e demonstra visualmente quanto dinheiro os compradores economizam ao vender diretamente, sem corretores tradicionais.',
    category: 'Financeiro',
    icon: DollarSign,
    benefits: [
      'Demonstração clara de valor',
      'Argumento persuasivo',
      'Cálculos transparentes',
      'Aumento de conversão'
    ],
    useCases: [
      'Apresentar propostas',
      'Negociar com proprietários',
      'Justificar preços oferecidos',
      'Educar sobre o processo'
    ]
  },

  // AI & Automation
  {
    id: 'ai_property_review',
    name: 'Revisão IA de Propriedades',
    description: 'Avaliação automática de imóveis usando inteligência artificial',
    detailedDescription: 'IA analisa fotos, descrições e dados da propriedade para fornecer avaliações automáticas, identificar oportunidades e sugerir estratégias.',
    category: 'IA',
    icon: Lightbulb,
    benefits: [
      'Análise rápida de grandes volumes',
      'Identificação automática de oportunidades',
      'Avaliações consistentes',
      'Insights baseados em dados'
    ],
    useCases: [
      'Triagem inicial de propriedades',
      'Identificação de imóveis problemáticos',
      'Avaliação de potencial de investimento',
      'Priorização de leads'
    ],
    isNew: true
  },
  {
    id: 'smart_matching',
    name: 'Correspondência Inteligente',
    description: 'Matching automático entre propriedades e compradores',
    detailedDescription: 'Algoritmos de IA identificam automaticamente as melhores combinações entre propriedades disponíveis e critérios dos compradores.',
    category: 'IA',
    icon: Target,
    benefits: [
      'Correspondências mais precisas',
      'Processo mais eficiente',
      'Redução de tempo de busca',
      'Aumento de satisfação'
    ],
    useCases: [
      'Encontrar imóveis ideais para compradores',
      'Otimizar processo de busca',
      'Personalizar recomendações',
      'Acelerar fechamento de negócios'
    ]
  },

  // Maps & Visualization
  {
    id: 'property_map',
    name: 'Mapa de Propriedades',
    description: 'Visualização geográfica interativa de todas as propriedades',
    detailedDescription: 'Mapa interativo mostrando todas as propriedades com filtros, clusters e informações detalhadas ao clicar em cada marcador.',
    category: 'Visualização',
    icon: MapPin,
    tab: 'properties',
    benefits: [
      'Visão geográfica clara',
      'Análise de densidade',
      'Identificação de padrões territoriais',
      'Planejamento estratégico'
    ],
    useCases: [
      'Analisar distribuição geográfica',
      'Identificar áreas de oportunidade',
      'Planejar rotas de visita',
      'Entender dinâmica de mercado local'
    ]
  },

  // Administration
  {
    id: 'feature_toggles',
    name: 'Controle de Recursos',
    description: 'Ative/desative recursos dinamicamente',
    detailedDescription: 'Sistema avançado para controlar quais recursos estão disponíveis, permitindo testes A/B, rollouts graduais e personalização por usuário.',
    category: 'Administração',
    icon: Settings,
    tab: 'features',
    benefits: [
      'Controle granular de recursos',
      'Testes A/B facilitados',
      'Rollouts seguros',
      'Personalização avançada'
    ],
    useCases: [
      'Testar novos recursos',
      'Controlar acesso por usuário',
      'Implementar mudanças gradualmente',
      'Personalizar experiência'
    ]
  },
  {
    id: 'usage_analytics',
    name: 'Analytics de Uso',
    description: 'Acompanhe quais recursos estão sendo utilizados',
    detailedDescription: 'Dashboard completo mostrando estatísticas de uso de cada recurso, identificação de funcionalidades subutilizadas e insights para melhoria.',
    category: 'Administração',
    icon: Activity,
    tab: 'usage',
    benefits: [
      'Visibilidade completa de uso',
      'Identificação de oportunidades',
      'Otimização baseada em dados',
      'Melhoria contínua do produto'
    ],
    useCases: [
      'Entender comportamento dos usuários',
      'Identificar recursos pouco usados',
      'Otimizar interface',
      'Planejar desenvolvimento futuro'
    ],
    isNew: true
  }
];

export const FeaturesGuide: React.FC = () => {
  const { features: usageData, getCategoryStats } = useUsageAnalytics();

  const categories = [...new Set(FEATURES.map(f => f.category))];

  const getUsageInfo = (featureId: string) => {
    return usageData.find(f => f.featureId === featureId);
  };

  const getCategoryUsage = (category: string) => {
    const categoryFeatures = getCategoryStats(category);
    const usedCount = categoryFeatures.filter(f => f.usageCount > 0).length;
    const totalCount = categoryFeatures.length;
    return { usedCount, totalCount, usageRate: totalCount > 0 ? (usedCount / totalCount) * 100 : 0 };
  };

  const navigateToFeature = (feature: FeatureInfo) => {
    if (feature.path) {
      window.location.href = feature.path;
    } else if (feature.tab) {
      // Navigate to admin page with specific tab
      window.location.href = `/admin#${feature.tab}`;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <Star className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Guia Completo de Recursos
            </h1>
            <p className="text-muted-foreground text-lg">
              Explore todas as funcionalidades do MyLocalInvest
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{usageData.filter(f => f.usageCount > 0).length}</div>
                  <div className="text-sm text-muted-foreground">Recursos Utilizados</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{usageData.reduce((sum, f) => sum + f.usageCount, 0)}</div>
                  <div className="text-sm text-muted-foreground">Total de Interações</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{FEATURES.filter(f => f.isPopular).length}</div>
                  <div className="text-sm text-muted-foreground">Recursos Populares</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
          <TabsTrigger value="popular">Mais Usados</TabsTrigger>
          <TabsTrigger value="new">Novidades</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6">
            {categories.map(category => {
              const categoryUsage = getCategoryUsage(category);
              const categoryFeatures = FEATURES.filter(f => f.category === category);

              return (
                <Card key={category} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold">{category}</h2>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {categoryUsage.usedCount}/{categoryUsage.totalCount} utilizados
                      </Badge>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${categoryUsage.usageRate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryFeatures.map(feature => {
                      const usageInfo = getUsageInfo(feature.id);
                      const IconComponent = feature.icon;

                      return (
                        <Card key={feature.id} className="p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`p-2 rounded-lg ${usageInfo?.usageCount ? 'bg-blue-100' : 'bg-gray-100'}`}>
                              <IconComponent className={`h-5 w-5 ${usageInfo?.usageCount ? 'text-blue-600' : 'text-gray-500'}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-sm">{feature.name}</h3>
                                {feature.isNew && <Badge variant="secondary" className="text-xs">Novo</Badge>}
                                {feature.isPopular && <Badge variant="default" className="text-xs">Popular</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">{feature.description}</p>
                              {usageInfo && (
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-muted-foreground">Usado {usageInfo.usageCount}x</span>
                                  {usageInfo.lastUsed && (
                                    <span className="text-muted-foreground">
                                      • Último: {usageInfo.lastUsed.toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {(feature.path || feature.tab) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => navigateToFeature(feature)}
                            >
                              <ExternalLink className="h-3 w-3 mr-2" />
                              Acessar
                            </Button>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid gap-4">
            {categories.map(category => {
              const categoryFeatures = FEATURES.filter(f => f.category === category);
              const categoryUsage = getCategoryUsage(category);

              return (
                <Card key={category}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {category}
                        <Badge variant="outline">
                          {categoryUsage.usedCount}/{categoryUsage.totalCount}
                        </Badge>
                      </CardTitle>
                      <div className="text-sm text-muted-foreground">
                        {categoryUsage.usageRate.toFixed(1)}% utilizado
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {categoryFeatures.map(feature => {
                        const usageInfo = getUsageInfo(feature.id);
                        const IconComponent = feature.icon;

                        return (
                          <div key={feature.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start gap-3">
                                <IconComponent className="h-6 w-6 text-blue-500 mt-1" />
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold">{feature.name}</h3>
                                    {feature.isNew && <Badge variant="secondary">Novo</Badge>}
                                    {feature.isPopular && <Badge variant="default">Popular</Badge>}
                                  </div>
                                  <p className="text-muted-foreground mb-2">{feature.description}</p>
                                  <p className="text-sm">{feature.detailedDescription}</p>
                                </div>
                              </div>
                              {(feature.path || feature.tab) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigateToFeature(feature)}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Acessar
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  Benefícios
                                </h4>
                                <ul className="text-sm space-y-1">
                                  {feature.benefits.map((benefit, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <span className="text-green-500 mt-1">•</span>
                                      {benefit}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <Target className="h-4 w-4 text-blue-500" />
                                  Casos de Uso
                                </h4>
                                <ul className="text-sm space-y-1">
                                  {feature.useCases.map((useCase, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <span className="text-blue-500 mt-1">•</span>
                                      {useCase}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {usageInfo && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-4">
                                    <span>Usado {usageInfo.usageCount}x</span>
                                    {usageInfo.lastUsed && (
                                      <span>Último uso: {usageInfo.lastUsed.toLocaleDateString()}</span>
                                    )}
                                  </div>
                                  <div className={`flex items-center gap-1 ${usageInfo.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                                    {usageInfo.isActive ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                    {usageInfo.isActive ? 'Ativo' : 'Inativo'}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="popular" className="space-y-6">
          <div className="grid gap-4">
            {FEATURES.filter(f => f.isPopular).map(feature => {
              const usageInfo = getUsageInfo(feature.id);
              const IconComponent = feature.icon;

              return (
                <Card key={feature.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-2xl font-semibold">{feature.name}</h2>
                        <Badge variant="default">Mais Usado</Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">{feature.description}</p>
                      <p className="mb-4">{feature.detailedDescription}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <h3 className="font-semibold mb-2">Benefícios Principais</h3>
                          <ul className="space-y-1">
                            {feature.benefits.map((benefit, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">Casos de Uso</h3>
                          <ul className="space-y-1">
                            {feature.useCases.map((useCase, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                {useCase}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        {usageInfo && (
                          <div className="text-sm text-muted-foreground">
                            Usado {usageInfo.usageCount}x •
                            {usageInfo.lastUsed && ` Último: ${usageInfo.lastUsed.toLocaleDateString()}`}
                          </div>
                        )}
                        {(feature.path || feature.tab) && (
                          <Button onClick={() => navigateToFeature(feature)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Experimentar Agora
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="new" className="space-y-6">
          <div className="grid gap-4">
            {FEATURES.filter(f => f.isNew).map(feature => {
              const usageInfo = getUsageInfo(feature.id);
              const IconComponent = feature.icon;

              return (
                <Card key={feature.id} className="p-6 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg">
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-2xl font-semibold">{feature.name}</h2>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">🆕 Novo</Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">{feature.description}</p>
                      <p className="mb-4">{feature.detailedDescription}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <h3 className="font-semibold mb-2">Benefícios</h3>
                          <ul className="space-y-1">
                            {feature.benefits.map((benefit, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">Experimente</h3>
                          <ul className="space-y-1">
                            {feature.useCases.map((useCase, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                {useCase}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        {usageInfo ? (
                          <div className="text-sm text-muted-foreground">
                            Você já usou {usageInfo.usageCount}x
                          </div>
                        ) : (
                          <div className="text-sm text-orange-600">
                            Ainda não experimentou este recurso
                          </div>
                        )}
                        {(feature.path || feature.tab) && (
                          <Button onClick={() => navigateToFeature(feature)} className="bg-purple-600 hover:bg-purple-700">
                            <Star className="h-4 w-4 mr-2" />
                            Experimentar Agora
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
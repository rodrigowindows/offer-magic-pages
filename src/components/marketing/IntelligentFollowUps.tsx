/**
 * Intelligent Follow-up System
 * Sistema inteligente de follow-ups baseado em comportamento do lead
 * Uses mock data as follow_up_rules table doesn't exist
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Brain,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Target,
  TrendingUp,
  Users,
  Zap,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Settings,
  BarChart3,
  Plus
} from 'lucide-react';

interface FollowUpRule {
  id: string;
  name: string;
  description: string;
  trigger: FollowUpTrigger;
  conditions: FollowUpCondition[];
  actions: FollowUpAction[];
  active: boolean;
  priority: number;
  cooldownHours: number;
  maxExecutions: number;
  executionCount: number;
  created_at: string;
}

interface FollowUpTrigger {
  event: 'email_opened' | 'email_clicked' | 'link_clicked' | 'no_response' | 'property_viewed' | 'meeting_scheduled' | 'offer_declined';
  delayHours: number;
  onlyOnce: boolean;
}

interface FollowUpCondition {
  field: 'lead_score' | 'last_contact' | 'property_type' | 'budget_range' | 'urgency_level';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_equals';
  value: string | number;
}

interface FollowUpAction {
  type: 'send_email' | 'send_sms' | 'make_call' | 'update_status' | 'add_tag';
  templateId?: string;
  content?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channel: 'email' | 'sms' | 'call';
}

interface FollowUpExecution {
  id: string;
  ruleId: string;
  leadId: string;
  triggerEvent: string;
  executedAt: string;
  success: boolean;
  response?: string;
  nextFollowUp?: string;
}

interface LeadBehavior {
  leadId: string;
  lastActivity: string;
  activityScore: number;
  engagementLevel: 'cold' | 'warm' | 'hot';
  preferredChannel: 'email' | 'sms' | 'call';
  bestTimeToContact: string;
  followUpHistory: FollowUpExecution[];
}

// Mock data for rules since the table doesn't exist
const MOCK_RULES: FollowUpRule[] = [
  {
    id: 'rule_1',
    name: 'Sem Resposta - 48h',
    description: 'Envia follow-up quando lead não responde em 48 horas',
    trigger: { event: 'no_response', delayHours: 48, onlyOnce: false },
    conditions: [{ field: 'lead_score', operator: 'greater_than', value: 50 }],
    actions: [{ type: 'send_email', priority: 'medium', channel: 'email' }],
    active: true,
    priority: 1,
    cooldownHours: 24,
    maxExecutions: 5,
    executionCount: 12,
    created_at: new Date().toISOString()
  },
  {
    id: 'rule_2',
    name: 'Email Aberto',
    description: 'Envia SMS quando email é aberto mas sem resposta',
    trigger: { event: 'email_opened', delayHours: 4, onlyOnce: true },
    conditions: [],
    actions: [{ type: 'send_sms', priority: 'high', channel: 'sms' }],
    active: true,
    priority: 2,
    cooldownHours: 12,
    maxExecutions: 3,
    executionCount: 8,
    created_at: new Date().toISOString()
  }
];

const IntelligentFollowUps = () => {
  const [rules, setRules] = useState<FollowUpRule[]>(MOCK_RULES);
  const [executions, setExecutions] = useState<FollowUpExecution[]>([]);
  const [leadBehaviors, setLeadBehaviors] = useState<LeadBehavior[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingRule, setCreatingRule] = useState(false);
  const [selectedRule, setSelectedRule] = useState<FollowUpRule | null>(null);
  const { toast } = useToast();

  // Form state for new rule
  const [newRule, setNewRule] = useState<Partial<FollowUpRule>>({
    name: '',
    description: '',
    trigger: {
      event: 'no_response',
      delayHours: 48,
      onlyOnce: true
    },
    conditions: [],
    actions: [],
    active: true,
    priority: 1,
    cooldownHours: 24,
    maxExecutions: 5,
    executionCount: 0
  });

  useEffect(() => {
    loadFollowUpData();
  }, []);

  const loadFollowUpData = async () => {
    setLoading(true);
    // Use mock data since tables don't exist
    setLeadBehaviors(generateMockLeadBehaviors());
    setLoading(false);
  };

  const generateMockLeadBehaviors = (): LeadBehavior[] => {
    return [
      {
        leadId: 'lead_1',
        lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        activityScore: 85,
        engagementLevel: 'hot',
        preferredChannel: 'email',
        bestTimeToContact: '14:00',
        followUpHistory: []
      },
      {
        leadId: 'lead_2',
        lastActivity: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        activityScore: 45,
        engagementLevel: 'warm',
        preferredChannel: 'sms',
        bestTimeToContact: '10:00',
        followUpHistory: []
      },
      {
        leadId: 'lead_3',
        lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        activityScore: 15,
        engagementLevel: 'cold',
        preferredChannel: 'call',
        bestTimeToContact: '16:00',
        followUpHistory: []
      }
    ];
  };

  const createFollowUpRule = async () => {
    if (!newRule.name || !newRule.trigger || !newRule.actions || newRule.actions.length === 0) {
      toast({
        title: "Erro",
        description: "Nome, trigger e pelo menos uma ação são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Create rule locally (no database)
    const createdRule: FollowUpRule = {
      id: `rule_${Date.now()}`,
      name: newRule.name,
      description: newRule.description || '',
      trigger: newRule.trigger as FollowUpTrigger,
      conditions: newRule.conditions || [],
      actions: newRule.actions,
      active: newRule.active ?? true,
      priority: newRule.priority || 1,
      cooldownHours: newRule.cooldownHours || 24,
      maxExecutions: newRule.maxExecutions || 5,
      executionCount: 0,
      created_at: new Date().toISOString()
    };

    setRules([createdRule, ...rules]);
    setNewRule({
      name: '',
      description: '',
      trigger: { event: 'no_response', delayHours: 48, onlyOnce: true },
      conditions: [],
      actions: [],
      active: true,
      priority: 1,
      cooldownHours: 24,
      maxExecutions: 5,
      executionCount: 0
    });
    setCreatingRule(false);

    toast({
      title: "Sucesso",
      description: "Regra de follow-up criada com sucesso"
    });
  };

  const toggleRule = (ruleId: string, active: boolean) => {
    setRules(rules.map(r => r.id === ruleId ? { ...r, active } : r));
  };

  const deleteRule = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId));
    toast({
      title: "Sucesso",
      description: "Regra de follow-up removida"
    });
  };

  const executeFollowUp = (rule: FollowUpRule, leadId: string) => {
    const execution: FollowUpExecution = {
      id: `exec_${Date.now()}`,
      ruleId: rule.id,
      leadId,
      triggerEvent: rule.trigger.event,
      executedAt: new Date().toISOString(),
      success: Math.random() > 0.2,
      response: 'Follow-up enviado com sucesso'
    };

    setExecutions([execution, ...executions]);
    setRules(rules.map(r =>
      r.id === rule.id ? { ...r, executionCount: r.executionCount + 1 } : r
    ));

    toast({
      title: "Follow-up Executado",
      description: `Regra "${rule.name}" executada para lead ${leadId}`
    });
  };

  const getTriggerIcon = (event: string) => {
    switch (event) {
      case 'email_opened': return <Mail className="w-4 h-4" />;
      case 'email_clicked': return <Target className="w-4 h-4" />;
      case 'no_response': return <Clock className="w-4 h-4" />;
      case 'property_viewed': return <Users className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getEngagementBadge = (level: string) => {
    switch (level) {
      case 'hot':
        return <Badge className="bg-red-100 text-red-800">Quente</Badge>;
      case 'warm':
        return <Badge className="bg-yellow-100 text-yellow-800">Morno</Badge>;
      case 'cold':
        return <Badge className="bg-blue-100 text-blue-800">Frio</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const addCondition = () => {
    setNewRule(prev => ({
      ...prev,
      conditions: [
        ...(prev.conditions || []),
        { field: 'lead_score', operator: 'greater_than', value: 50 }
      ]
    }));
  };

  const addAction = () => {
    setNewRule(prev => ({
      ...prev,
      actions: [
        ...(prev.actions || []),
        { type: 'send_email', priority: 'medium', channel: 'email' }
      ]
    }));
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
          <h1 className="text-3xl font-bold">Follow-ups Inteligentes</h1>
          <p className="text-muted-foreground">
            Automatize sequências de comunicação baseadas no comportamento dos leads
          </p>
        </div>
        <Button onClick={() => setCreatingRule(true)}>
          <Brain className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="behaviors">Comportamento dos Leads</TabsTrigger>
          <TabsTrigger value="executions">Execuções</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map((rule) => (
              <Card key={rule.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      {getTriggerIcon(rule.trigger.event)}
                      <span className="ml-2">{rule.name}</span>
                    </CardTitle>
                    <Switch
                      checked={rule.active}
                      onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                    />
                  </div>
                  <CardDescription className="line-clamp-2">
                    {rule.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Trigger:</span>
                    <Badge variant="outline" className="capitalize">
                      {rule.trigger.event.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Ações:</span>
                      <span>{rule.actions.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Execuções:</span>
                      <span>{rule.executionCount}/{rule.maxExecutions}</span>
                    </div>
                    <Progress
                      value={(rule.executionCount / rule.maxExecutions) * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRule(rule)}
                      className="flex-1"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRule(rule.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <AlertCircle className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {rules.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma regra criada</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Crie sua primeira regra de follow-up inteligente para automatizar suas comunicações
                </p>
                <Button onClick={() => setCreatingRule(true)}>
                  <Brain className="h-4 w-4 mr-2" />
                  Criar Primeira Regra
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="behaviors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leadBehaviors.map((behavior) => (
              <Card key={behavior.leadId} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Lead {behavior.leadId.split('_')[1]}</CardTitle>
                  <CardDescription>
                    Última atividade: {new Date(behavior.lastActivity).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Engajamento:</span>
                    {getEngagementBadge(behavior.engagementLevel)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Score:</span>
                    <span className="font-bold">{behavior.activityScore}</span>
                  </div>
                  <Progress value={behavior.activityScore} className="h-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span>Canal Preferido:</span>
                    <div className="flex items-center gap-1">
                      {getChannelIcon(behavior.preferredChannel)}
                      <span className="capitalize">{behavior.preferredChannel}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Melhor Horário:</span>
                    <span>{behavior.bestTimeToContact}</span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const activeRule = rules.find(r => r.active);
                      if (activeRule) {
                        executeFollowUp(activeRule, behavior.leadId);
                      }
                    }}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Executar Follow-up
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Execuções</CardTitle>
              <CardDescription>Últimas execuções de follow-up</CardDescription>
            </CardHeader>
            <CardContent>
              {executions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma execução registrada ainda
                </div>
              ) : (
                <div className="space-y-3">
                  {executions.slice(0, 10).map((exec) => (
                    <div key={exec.id} className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-3">
                        {exec.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">Lead {exec.leadId}</p>
                          <p className="text-sm text-muted-foreground">
                            {exec.triggerEvent} • {new Date(exec.executedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={exec.success ? "default" : "destructive"}>
                        {exec.success ? 'Sucesso' : 'Falha'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Regras</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rules.length}</div>
                <p className="text-xs text-muted-foreground">
                  {rules.filter(r => r.active).length} ativas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Execuções Hoje</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{executions.length}</div>
                <p className="text-xs text-muted-foreground">
                  {executions.filter(e => e.success).length} com sucesso
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {executions.length > 0
                    ? Math.round((executions.filter(e => e.success).length / executions.length) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Últimas 24h</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Leads Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leadBehaviors.length}</div>
                <p className="text-xs text-muted-foreground">
                  {leadBehaviors.filter(l => l.engagementLevel === 'hot').length} quentes
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Rule Dialog */}
      {creatingRule && (
        <Card className="fixed inset-4 z-50 overflow-auto bg-background shadow-xl">
          <CardHeader>
            <CardTitle>Nova Regra de Follow-up</CardTitle>
            <CardDescription>Configure uma nova regra de automação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome da Regra</Label>
                <Input
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Sem resposta em 48h"
                />
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select
                  value={String(newRule.priority)}
                  onValueChange={(v) => setNewRule(prev => ({ ...prev, priority: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Alta</SelectItem>
                    <SelectItem value="2">Média</SelectItem>
                    <SelectItem value="3">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Descrição</Label>
              <Input
                value={newRule.description}
                onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição da regra..."
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ações (O que fazer)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addAction}>
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
              </div>
              {newRule.actions?.map((action, index) => (
                <div key={index} className="flex gap-2">
                  <Select
                    value={action.channel}
                    onValueChange={(v) => {
                      const actions = [...(newRule.actions || [])];
                      actions[index].channel = v as 'email' | 'sms' | 'call';
                      setNewRule(prev => ({ ...prev, actions }));
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="call">Ligação</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={action.priority}
                    onValueChange={(v) => {
                      const actions = [...(newRule.actions || [])];
                      actions[index].priority = v as 'low' | 'medium' | 'high' | 'urgent';
                      setNewRule(prev => ({ ...prev, actions }));
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreatingRule(false)}>
                Cancelar
              </Button>
              <Button onClick={createFollowUpRule}>
                Criar Regra
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IntelligentFollowUps;
/**
 * Intelligent Follow-up System
 * Sistema inteligente de follow-ups baseado em comportamento do lead
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
import { supabase } from '@/integrations/supabase/client';
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
  BarChart3
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

const IntelligentFollowUps = () => {
  const [rules, setRules] = useState<FollowUpRule[]>([]);
  const [executions, setExecutions] = useState<FollowUpExecution[]>([]);
  const [leadBehaviors, setLeadBehaviors] = useState<LeadBehavior[]>([]);
  const [loading, setLoading] = useState(true);
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
    try {
      setLoading(true);

      // Load rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('follow_up_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (rulesError) throw rulesError;
      setRules(rulesData || []);

      // Load executions
      const { data: executionsData, error: executionsError } = await supabase
        .from('follow_up_executions')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(100);

      if (executionsError) throw executionsError;
      setExecutions(executionsData || []);

      // Load lead behaviors (mock data for now)
      setLeadBehaviors(generateMockLeadBehaviors());

    } catch (error) {
      console.error('Erro ao carregar dados de follow-up:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de follow-up",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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

    try {
      const { data, error } = await supabase
        .from('follow_up_rules')
        .insert([newRule])
        .select()
        .single();

      if (error) throw error;

      setRules([data, ...rules]);
      setNewRule({
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
      setCreatingRule(false);

      toast({
        title: "Sucesso",
        description: "Regra de follow-up criada com sucesso"
      });
    } catch (error) {
      console.error('Erro ao criar regra de follow-up:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a regra de follow-up",
        variant: "destructive"
      });
    }
  };

  const toggleRule = async (ruleId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('follow_up_rules')
        .update({ active })
        .eq('id', ruleId);

      if (error) throw error;

      setRules(rules.map(r =>
        r.id === ruleId ? { ...r, active } : r
      ));
    } catch (error) {
      console.error('Erro ao atualizar regra:', error);
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('follow_up_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      setRules(rules.filter(r => r.id !== ruleId));
      toast({
        title: "Sucesso",
        description: "Regra de follow-up removida"
      });
    } catch (error) {
      console.error('Erro ao deletar regra:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a regra",
        variant: "destructive"
      });
    }
  };

  const executeFollowUp = async (rule: FollowUpRule, leadId: string) => {
    try {
      // Simulate execution
      const execution: FollowUpExecution = {
        id: `exec_${Date.now()}`,
        ruleId: rule.id,
        leadId,
        triggerEvent: rule.trigger.event,
        executedAt: new Date().toISOString(),
        success: Math.random() > 0.2, // 80% success rate
        response: 'Follow-up enviado com sucesso'
      };

      setExecutions([execution, ...executions]);

      // Update rule execution count
      const updatedRules = rules.map(r =>
        r.id === rule.id
          ? { ...r, executionCount: r.executionCount + 1 }
          : r
      );
      setRules(updatedRules);

      toast({
        title: "Follow-up Executado",
        description: `Regra "${rule.name}" executada para lead ${leadId}`
      });
    } catch (error) {
      console.error('Erro ao executar follow-up:', error);
    }
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
        {
          field: 'lead_score',
          operator: 'greater_than',
          value: 50
        }
      ]
    }));
  };

  const addAction = () => {
    setNewRule(prev => ({
      ...prev,
      actions: [
        ...(prev.actions || []),
        {
          type: 'send_email',
          priority: 'medium',
          channel: 'email'
        }
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

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Score de Atividade:</span>
                      <span className="font-semibold">{behavior.activityScore}/100</span>
                    </div>
                    <Progress value={behavior.activityScore} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center text-muted-foreground mb-1">
                        {getChannelIcon(behavior.preferredChannel)}
                        <span className="ml-1">Canal</span>
                      </div>
                      <div className="font-semibold capitalize">{behavior.preferredChannel}</div>
                    </div>
                    <div>
                      <div className="flex items-center text-muted-foreground mb-1">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>Melhor Horário</span>
                      </div>
                      <div className="font-semibold">{behavior.bestTimeToContact}</div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {rules.filter(r => r.active).map((rule) => (
                      <Button
                        key={rule.id}
                        variant="outline"
                        size="sm"
                        onClick={() => executeFollowUp(rule, behavior.leadId)}
                        disabled={rule.executionCount >= rule.maxExecutions}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        {rule.name.split(' ')[0]}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Execuções</CardTitle>
              <CardDescription>
                Últimas 100 execuções de follow-ups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {executions.map((execution) => (
                  <div key={execution.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {execution.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <div className="font-medium">
                          {rules.find(r => r.id === execution.ruleId)?.name || 'Regra desconhecida'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Lead {execution.leadId} • {new Date(execution.executedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant={execution.success ? 'default' : 'destructive'}>
                      {execution.success ? 'Sucesso' : 'Falha'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Regras Ativas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {rules.filter(r => r.active).length}
                </div>
                <p className="text-sm text-muted-foreground">
                  de {rules.length} regras totais
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Execuções Hoje</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {executions.filter(e =>
                    new Date(e.executedAt).toDateString() === new Date().toDateString()
                  ).length}
                </div>
                <p className="text-sm text-muted-foreground">
                  follow-ups executados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Taxa de Sucesso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {executions.length > 0
                    ? Math.round((executions.filter(e => e.success).length / executions.length) * 100)
                    : 0}%
                </div>
                <p className="text-sm text-muted-foreground">
                  dos follow-ups
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Leads Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {leadBehaviors.filter(l => l.engagementLevel !== 'cold').length}
                </div>
                <p className="text-sm text-muted-foreground">
                  com engajamento
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Insights de Follow-up</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <strong>Follow-ups por email</strong> têm 67% mais taxa de resposta quando enviados 48h após o primeiro contato
                </AlertDescription>
              </Alert>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Leads quentes</strong> respondem 3x mais rápido quando contactados no canal preferido
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Evite spam</strong>: 23% dos leads param de responder após 3 follow-ups no mesmo dia
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Rule Dialog */}
      {creatingRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Criar Regra de Follow-up</CardTitle>
              <CardDescription>
                Configure uma regra inteligente para automatizar follow-ups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ruleName">Nome da Regra</Label>
                  <Input
                    id="ruleName"
                    value={newRule.name}
                    onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Follow-up sem resposta"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={newRule.priority?.toString()}
                    onValueChange={(value) => setNewRule(prev => ({ ...prev, priority: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Baixa</SelectItem>
                      <SelectItem value="2">Média</SelectItem>
                      <SelectItem value="3">Alta</SelectItem>
                      <SelectItem value="4">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={newRule.description}
                  onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva quando esta regra deve ser executada"
                />
              </div>

              <div className="space-y-4">
                <Label>Trigger (Quando executar)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Evento</Label>
                    <Select
                      value={newRule.trigger?.event}
                      onValueChange={(value) => setNewRule(prev => ({
                        ...prev,
                        trigger: { ...prev.trigger!, event: value as any }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email_opened">Email Aberto</SelectItem>
                        <SelectItem value="email_clicked">Link Clicado</SelectItem>
                        <SelectItem value="no_response">Sem Resposta</SelectItem>
                        <SelectItem value="property_viewed">Propriedade Visualizada</SelectItem>
                        <SelectItem value="meeting_scheduled">Reunião Agendada</SelectItem>
                        <SelectItem value="offer_declined">Oferta Recusada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Delay (horas)</Label>
                    <Input
                      type="number"
                      value={newRule.trigger?.delayHours}
                      onChange={(e) => setNewRule(prev => ({
                        ...prev,
                        trigger: { ...prev.trigger!, delayHours: parseInt(e.target.value) }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Condições (Opcional)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {newRule.conditions?.map((condition, index) => (
                    <div key={index} className="flex space-x-2">
                      <Select
                        value={condition.field}
                        onValueChange={(value) => {
                          const conditions = [...(newRule.conditions || [])];
                          conditions[index].field = value as any;
                          setNewRule(prev => ({ ...prev, conditions }));
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lead_score">Lead Score</SelectItem>
                          <SelectItem value="last_contact">Último Contato</SelectItem>
                          <SelectItem value="property_type">Tipo Propriedade</SelectItem>
                          <SelectItem value="budget_range">Faixa Orçamentária</SelectItem>
                          <SelectItem value="urgency_level">Nível Urgência</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={condition.operator}
                        onValueChange={(value) => {
                          const conditions = [...(newRule.conditions || [])];
                          conditions[index].operator = value as any;
                          setNewRule(prev => ({ ...prev, conditions }));
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Igual</SelectItem>
                          <SelectItem value="greater_than">Maior que</SelectItem>
                          <SelectItem value="less_than">Menor que</SelectItem>
                          <SelectItem value="contains">Contém</SelectItem>
                          <SelectItem value="not_equals">Diferente</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Valor"
                        value={condition.value}
                        onChange={(e) => {
                          const conditions = [...(newRule.conditions || [])];
                          conditions[index].value = e.target.value;
                          setNewRule(prev => ({ ...prev, conditions }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Ações (O que fazer)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addAction}>
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {newRule.actions?.map((action, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Tipo</Label>
                            <Select
                              value={action.type}
                              onValueChange={(value) => {
                                const actions = [...(newRule.actions || [])];
                                actions[index].type = value as any;
                                setNewRule(prev => ({ ...prev, actions }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="send_email">Enviar Email</SelectItem>
                                <SelectItem value="send_sms">Enviar SMS</SelectItem>
                                <SelectItem value="make_call">Fazer Ligação</SelectItem>
                                <SelectItem value="update_status">Atualizar Status</SelectItem>
                                <SelectItem value="add_tag">Adicionar Tag</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Canal</Label>
                            <Select
                              value={action.channel}
                              onValueChange={(value) => {
                                const actions = [...(newRule.actions || [])];
                                actions[index].channel = value as any;
                                setNewRule(prev => ({ ...prev, actions }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="sms">SMS</SelectItem>
                                <SelectItem value="call">Ligação</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Prioridade</Label>
                            <Select
                              value={action.priority}
                              onValueChange={(value) => {
                                const actions = [...(newRule.actions || [])];
                                actions[index].priority = value as any;
                                setNewRule(prev => ({ ...prev, actions }));
                              }}
                            >
                              <SelectTrigger>
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
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setCreatingRule(false)}>
                  Cancelar
                </Button>
                <Button onClick={createFollowUpRule}>
                  Criar Regra
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export { IntelligentFollowUps };
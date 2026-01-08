/**
 * Advanced Webhook Management System
 * Sistema avançado de webhooks com suporte a múltiplas integrações
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Webhook,
  Plus,
  Trash2,
  TestTube,
  CheckCircle,
  AlertCircle,
  Zap,
  Settings,
  ExternalLink,
  Code,
  Send,
  Activity,
  Globe,
  Shield,
  Clock
} from 'lucide-react';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  headers: Record<string, string>;
  method: 'POST' | 'PUT' | 'PATCH';
  active: boolean;
  integration: 'zapier' | 'make' | 'webhook_site' | 'custom';
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
  lastTriggered?: string;
  successCount: number;
  failureCount: number;
}

type WebhookEvent =
  | 'campaign_created'
  | 'campaign_sent'
  | 'lead_responded'
  | 'property_viewed'
  | 'email_opened'
  | 'link_clicked'
  | 'phone_called'
  | 'meeting_scheduled'
  | 'offer_accepted'
  | 'campaign_completed';

interface IntegrationTemplate {
  name: string;
  icon: string;
  description: string;
  webhookUrl: string;
  events: WebhookEvent[];
  headers: Record<string, string>;
}

const INTEGRATION_TEMPLATES: Record<string, IntegrationTemplate> = {
  zapier: {
    name: 'Zapier',
    icon: '⚡',
    description: 'Integração com Zapier para automação avançada',
    webhookUrl: 'https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID/',
    events: ['campaign_sent', 'lead_responded', 'property_viewed', 'email_opened'],
    headers: {}
  },
  make: {
    name: 'Make.com',
    icon: '🔗',
    description: 'Integração com Make (Integromat) para workflows',
    webhookUrl: 'https://hook.eu1.make.com/YOUR_WEBHOOK_ID',
    events: ['campaign_created', 'lead_responded', 'meeting_scheduled'],
    headers: {}
  },
  webhook_site: {
    name: 'Webhook.site',
    icon: '🌐',
    description: 'Teste e debug de webhooks',
    webhookUrl: 'https://webhook.site/YOUR_UNIQUE_ID',
    events: ['campaign_sent', 'lead_responded', 'property_viewed'],
    headers: {}
  }
};

const AdvancedWebhookManager = () => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfig | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const { toast } = useToast();

  // Form state for new webhook
  const [newWebhook, setNewWebhook] = useState<Partial<WebhookConfig>>({
    name: '',
    url: '',
    events: [],
    headers: {},
    method: 'POST',
    active: true,
    integration: 'custom',
    retryPolicy: {
      maxRetries: 3,
      backoffMs: 1000
    },
    successCount: 0,
    failureCount: 0
  });

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      // Load from localStorage since webhook_configs table doesn't exist
      const saved = localStorage.getItem('webhook_configs');
      if (saved) {
        setWebhooks(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Erro ao carregar webhooks:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar configurações de webhook",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url) {
      toast({
        title: "Erro",
        description: "Nome e URL são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const newWebhookData: WebhookConfig = {
        id: crypto.randomUUID(),
        name: newWebhook.name || '',
        url: newWebhook.url || '',
        events: newWebhook.events || [],
        headers: newWebhook.headers || {},
        method: newWebhook.method || 'POST',
        active: newWebhook.active ?? true,
        integration: newWebhook.integration || 'custom',
        retryPolicy: newWebhook.retryPolicy || { maxRetries: 3, backoffMs: 1000 },
        successCount: 0,
        failureCount: 0
      };

      const updatedWebhooks = [newWebhookData, ...webhooks];
      setWebhooks(updatedWebhooks);
      localStorage.setItem('webhook_configs', JSON.stringify(updatedWebhooks));
      setNewWebhook({
        name: '',
        url: '',
        events: [],
        headers: {},
        method: 'POST',
        active: true,
        integration: 'custom',
        retryPolicy: { maxRetries: 3, backoffMs: 1000 },
        successCount: 0,
        failureCount: 0
      });
      setIsCreateDialogOpen(false);

      toast({
        title: "Sucesso",
        description: "Webhook criado com sucesso"
      });
    } catch (error) {
      console.error('Erro ao criar webhook:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o webhook",
        variant: "destructive"
      });
    }
  };

  const deleteWebhook = async (id: string) => {
    try {
      const updatedWebhooks = webhooks.filter(w => w.id !== id);
      setWebhooks(updatedWebhooks);
      localStorage.setItem('webhook_configs', JSON.stringify(updatedWebhooks));
      toast({
        title: "Sucesso",
        description: "Webhook removido com sucesso"
      });
    } catch (error) {
      console.error('Erro ao deletar webhook:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o webhook",
        variant: "destructive"
      });
    }
  };

  const toggleWebhook = async (id: string, active: boolean) => {
    try {
      const updatedWebhooks = webhooks.map(w =>
        w.id === id ? { ...w, active } : w
      );
      setWebhooks(updatedWebhooks);
      localStorage.setItem('webhook_configs', JSON.stringify(updatedWebhooks));
    } catch (error) {
      console.error('Erro ao atualizar webhook:', error);
    }
  };

  const testWebhook = async (webhook: WebhookConfig) => {
    const testPayload = {
      event: 'test_webhook',
      timestamp: new Date().toISOString(),
      data: {
        message: 'Teste de webhook',
        campaignId: 'test_campaign',
        leadId: 'test_lead'
      }
    };

    try {
      const response = await fetch(webhook.url, {
        method: webhook.method,
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers
        },
        body: JSON.stringify(testPayload)
      });

      const result = {
        webhookId: webhook.id,
        success: response.ok,
        statusCode: response.status,
        timestamp: new Date().toISOString(),
        response: response.ok ? 'OK' : await response.text()
      };

      setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results

      toast({
        title: response.ok ? "Teste Bem-sucedido" : "Teste Falhou",
        description: `Status: ${response.status}`,
        variant: response.ok ? "default" : "destructive"
      });

    } catch (error) {
      const result = {
        webhookId: webhook.id,
        success: false,
        statusCode: 0,
        timestamp: new Date().toISOString(),
        response: error instanceof Error ? error.message : 'Erro desconhecido'
      };

      setTestResults(prev => [result, ...prev.slice(0, 9)]);

      toast({
        title: "Erro no Teste",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      });
    }
  };

  const applyIntegrationTemplate = (integration: string) => {
    const template = INTEGRATION_TEMPLATES[integration];
    if (template) {
      setNewWebhook(prev => ({
        ...prev,
        integration: integration as any,
        url: template.webhookUrl,
        events: template.events,
        headers: template.headers,
        name: `${template.name} Integration`
      }));
    }
  };

  const addEvent = (event: WebhookEvent) => {
    setNewWebhook(prev => ({
      ...prev,
      events: [...(prev.events || []), event]
    }));
  };

  const removeEvent = (event: WebhookEvent) => {
    setNewWebhook(prev => ({
      ...prev,
      events: (prev.events || []).filter(e => e !== event)
    }));
  };

  const addHeader = () => {
    setNewWebhook(prev => ({
      ...prev,
      headers: { ...(prev.headers || {}), '': '' }
    }));
  };

  const updateHeader = (key: string, value: string, oldKey?: string) => {
    setNewWebhook(prev => {
      const headers = { ...(prev.headers || {}) };
      if (oldKey && oldKey !== key) {
        delete headers[oldKey];
      }
      headers[key] = value;
      return { ...prev, headers };
    });
  };

  const removeHeader = (key: string) => {
    setNewWebhook(prev => {
      const headers = { ...(prev.headers || {}) };
      delete headers[key];
      return { ...prev, headers };
    });
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
          <h1 className="text-3xl font-bold">Webhooks Avançados</h1>
          <p className="text-muted-foreground">
            Gerencie integrações externas e automação de eventos
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Webhook</DialogTitle>
              <DialogDescription>
                Configure um webhook para integração externa
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do webhook"
                  />
                </div>
                <div>
                  <Label htmlFor="integration">Integração</Label>
                  <Select
                    value={newWebhook.integration}
                    onValueChange={(value) => {
                      setNewWebhook(prev => ({ ...prev, integration: value as any }));
                      applyIntegrationTemplate(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Personalizado</SelectItem>
                      <SelectItem value="zapier">Zapier</SelectItem>
                      <SelectItem value="make">Make.com</SelectItem>
                      <SelectItem value="webhook_site">Webhook.site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="url">URL do Webhook</Label>
                <Input
                  id="url"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="method">Método HTTP</Label>
                  <Select
                    value={newWebhook.method}
                    onValueChange={(value) => setNewWebhook(prev => ({ ...prev, method: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={newWebhook.active}
                    onCheckedChange={(checked) => setNewWebhook(prev => ({ ...prev, active: checked }))}
                  />
                  <Label htmlFor="active">Ativo</Label>
                </div>
              </div>

              <div>
                <Label>Eventos para Monitorar</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    'campaign_created', 'campaign_sent', 'lead_responded',
                    'property_viewed', 'email_opened', 'link_clicked',
                    'phone_called', 'meeting_scheduled', 'offer_accepted', 'campaign_completed'
                  ].map((event) => (
                    <div key={event} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={event}
                        checked={newWebhook.events?.includes(event as WebhookEvent)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            addEvent(event as WebhookEvent);
                          } else {
                            removeEvent(event as WebhookEvent);
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={event} className="text-sm capitalize">
                        {event.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Headers Personalizados</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addHeader}>
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {Object.entries(newWebhook.headers || {}).map(([key, value], index) => (
                    <div key={index} className="flex space-x-2">
                      <Input
                        placeholder="Header name"
                        value={key}
                        onChange={(e) => updateHeader(e.target.value, value, key)}
                      />
                      <Input
                        placeholder="Header value"
                        value={value}
                        onChange={(e) => updateHeader(key, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeHeader(key)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={createWebhook}>
                  Criar Webhook
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="logs">Logs de Teste</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <Webhook className="h-5 w-5 mr-2" />
                      {webhook.name}
                    </CardTitle>
                    <Switch
                      checked={webhook.active}
                      onCheckedChange={(checked) => toggleWebhook(webhook.id, checked)}
                    />
                  </div>
                  <CardDescription className="truncate">
                    {webhook.url}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant={webhook.integration !== 'custom' ? 'default' : 'secondary'}>
                      {webhook.integration === 'custom' ? 'Personalizado' :
                       INTEGRATION_TEMPLATES[webhook.integration]?.name || webhook.integration}
                    </Badge>
                    <span className="text-muted-foreground">
                      {webhook.method}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Eventos:</span>
                      <span>{webhook.events.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.slice(0, 3).map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event.replace('_', ' ')}
                        </Badge>
                      ))}
                      {webhook.events.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{webhook.events.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {webhook.successCount}
                      </div>
                      <div className="text-xs text-muted-foreground">Sucessos</div>
                    </div>
                    <div>
                      <div className="flex items-center text-red-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {webhook.failureCount}
                      </div>
                      <div className="text-xs text-muted-foreground">Falhas</div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook(webhook)}
                      className="flex-1"
                    >
                      <TestTube className="h-3 w-3 mr-1" />
                      Testar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteWebhook(webhook.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {webhooks.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum webhook configurado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Crie seu primeiro webhook para começar a integrar com ferramentas externas
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Webhook
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(INTEGRATION_TEMPLATES).map(([key, template]) => (
              <Card key={key} className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setNewWebhook(prev => ({
                        ...prev,
                        integration: key as any,
                        name: `${template.name} Integration`,
                        url: template.webhookUrl,
                        events: template.events,
                        headers: template.headers
                      }));
                      setIsCreateDialogOpen(true);
                    }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <span className="text-2xl mr-2">{template.icon}</span>
                    {template.name}
                  </CardTitle>
                  <CardDescription>
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Activity className="h-4 w-4 mr-1" />
                      {template.events.length} eventos suportados
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.events.slice(0, 3).map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                    <Button className="w-full" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Teste de Webhook</CardTitle>
              <CardDescription>
                Últimos 10 testes realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum teste realizado ainda
                </div>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <div className="font-medium">
                            Webhook {webhooks.find(w => w.id === result.webhookId)?.name || result.webhookId}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(result.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={result.success ? 'default' : 'destructive'}>
                          {result.statusCode}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { AdvancedWebhookManager };
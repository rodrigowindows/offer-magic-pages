/**
 * External Tools Integration
 * Sistema de integração com ferramentas externas e APIs
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Zap,
  Mail,
  MessageSquare,
  Phone,
  Calendar,
  Database,
  Webhook,
  Settings,
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Key,
  Shield,
  Globe
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'crm' | 'calendar' | 'webhook' | 'api';
  provider: string;
  status: 'connected' | 'disconnected' | 'error' | 'configuring';
  config: Record<string, any>;
  last_sync?: string;
  error_message?: string;
}

interface APIEndpoint {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  auth_type: 'none' | 'bearer' | 'basic' | 'api_key';
  auth_config: Record<string, string>;
  enabled: boolean;
  last_used?: string;
  success_count: number;
  error_count: number;
}

const ExternalToolsIntegration = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<APIEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadIntegrations();
    loadApiEndpoints();
  }, []);

  const loadIntegrations = async () => {
    try {
      // Load integrations from database or config
      const mockIntegrations: Integration[] = [
        {
          id: 'twilio_sms',
          name: 'Twilio SMS',
          type: 'sms',
          provider: 'Twilio',
          status: 'connected',
          config: { account_sid: '***', auth_token: '***' },
          last_sync: new Date().toISOString()
        },
        {
          id: 'sendgrid_email',
          name: 'SendGrid Email',
          type: 'email',
          provider: 'SendGrid',
          status: 'connected',
          config: { api_key: '***' },
          last_sync: new Date().toISOString()
        },
        {
          id: 'hubspot_crm',
          name: 'HubSpot CRM',
          type: 'crm',
          provider: 'HubSpot',
          status: 'disconnected',
          config: {},
          error_message: 'API key expired'
        },
        {
          id: 'google_calendar',
          name: 'Google Calendar',
          type: 'calendar',
          provider: 'Google',
          status: 'configuring',
          config: {}
        }
      ];

      setIntegrations(mockIntegrations);
    } catch (error) {
      console.error('Error loading integrations:', error);
      toast({
        title: "Error",
        description: "Failed to load integrations",
        variant: "destructive"
      });
    }
  };

  const loadApiEndpoints = async () => {
    try {
      // Load API endpoints from database
      const mockEndpoints: APIEndpoint[] = [
        {
          id: 'property_api',
          name: 'Property Data API',
          url: 'https://api.propertydata.com/v1/properties',
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          auth_type: 'bearer',
          auth_config: { token: '***' },
          enabled: true,
          last_used: new Date().toISOString(),
          success_count: 1250,
          error_count: 12
        },
        {
          id: 'lead_enrichment',
          name: 'Lead Enrichment API',
          url: 'https://api.leadenrichment.com/enrich',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          auth_type: 'api_key',
          auth_config: { 'X-API-Key': '***' },
          enabled: true,
          last_used: new Date().toISOString(),
          success_count: 890,
          error_count: 5
        }
      ];

      setApiEndpoints(mockEndpoints);
    } catch (error) {
      console.error('Error loading API endpoints:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (integrationId: string) => {
    setTestingConnection(integrationId);
    try {
      // Simulate API call to test connection
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update integration status
      setIntegrations(prev => prev.map(integration =>
        integration.id === integrationId
          ? { ...integration, status: 'connected' as const, last_sync: new Date().toISOString(), error_message: undefined }
          : integration
      ));

      toast({
        title: "Connection Test Successful",
        description: "Integration is working correctly"
      });
    } catch (error) {
      setIntegrations(prev => prev.map(integration =>
        integration.id === integrationId
          ? { ...integration, status: 'error' as const, error_message: 'Connection failed' }
          : integration
      ));

      toast({
        title: "Connection Test Failed",
        description: "Unable to connect to the service",
        variant: "destructive"
      });
    } finally {
      setTestingConnection(null);
    }
  };

  const saveIntegrationConfig = async (integration: Integration) => {
    try {
      // Save configuration to database
      setIntegrations(prev => prev.map(i =>
        i.id === integration.id ? integration : i
      ));

      toast({
        title: "Configuration Saved",
        description: "Integration settings have been updated"
      });

      setShowConfigDialog(false);
      setSelectedIntegration(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive"
      });
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-5 w-5" />;
      case 'sms': return <MessageSquare className="h-5 w-5" />;
      case 'crm': return <Database className="h-5 w-5" />;
      case 'calendar': return <Calendar className="h-5 w-5" />;
      case 'webhook': return <Webhook className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Connected</Badge>;
      case 'disconnected':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Disconnected</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Error</Badge>;
      case 'configuring':
        return <Badge className="bg-yellow-100 text-yellow-800"><Settings className="h-3 w-3 mr-1" />Configuring</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const IntegrationConfigDialog = ({ integration, onSave, onCancel }: {
    integration: Integration;
    onSave: (integration: Integration) => void;
    onCancel: () => void;
  }) => {
    const [config, setConfig] = useState(integration.config);

    const handleSave = () => {
      onSave({ ...integration, config });
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Configure {integration.name}</h3>

          <div className="space-y-4">
            {integration.provider === 'Twilio' && (
              <>
                <div>
                  <Label htmlFor="account_sid">Account SID</Label>
                  <Input
                    id="account_sid"
                    type="password"
                    value={config.account_sid || ''}
                    onChange={(e) => setConfig({...config, account_sid: e.target.value})}
                    placeholder="Enter Account SID"
                  />
                </div>
                <div>
                  <Label htmlFor="auth_token">Auth Token</Label>
                  <Input
                    id="auth_token"
                    type="password"
                    value={config.auth_token || ''}
                    onChange={(e) => setConfig({...config, auth_token: e.target.value})}
                    placeholder="Enter Auth Token"
                  />
                </div>
              </>
            )}

            {integration.provider === 'SendGrid' && (
              <div>
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={config.api_key || ''}
                  onChange={(e) => setConfig({...config, api_key: e.target.value})}
                  placeholder="Enter API Key"
                />
              </div>
            )}

            {integration.provider === 'HubSpot' && (
              <div>
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={config.api_key || ''}
                  onChange={(e) => setConfig({...config, api_key: e.target.value})}
                  placeholder="Enter HubSpot API Key"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6">
            <Button onClick={handleSave} className="flex-1">Save Configuration</Button>
            <Button onClick={onCancel} variant="outline" className="flex-1">Cancel</Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">External Tools Integration</h2>
          <p className="text-muted-foreground">Connect and manage third-party services and APIs</p>
        </div>
        <Button onClick={() => loadIntegrations()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Service Integrations</TabsTrigger>
          <TabsTrigger value="apis">API Endpoints</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getIntegrationIcon(integration.type)}
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                    </div>
                    {getStatusBadge(integration.status)}
                  </div>
                  <CardDescription>{integration.provider}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {integration.last_sync && (
                      <p className="text-sm text-muted-foreground">
                        Last sync: {new Date(integration.last_sync).toLocaleString()}
                      </p>
                    )}

                    {integration.error_message && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {integration.error_message}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testConnection(integration.id)}
                        disabled={testingConnection === integration.id}
                      >
                        {testingConnection === integration.id ? (
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <TestTube className="h-3 w-3 mr-1" />
                        )}
                        Test
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedIntegration(integration);
                          setShowConfigDialog(true);
                        }}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add New Integration */}
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center py-8">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Add New Integration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apis" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">API Endpoints</h3>
            <Button size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Add API Endpoint
            </Button>
          </div>

          <div className="space-y-4">
            {apiEndpoints.map((endpoint) => (
              <Card key={endpoint.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={endpoint.enabled} />
                      <Badge variant={endpoint.enabled ? "default" : "secondary"}>
                        {endpoint.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{endpoint.url}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Method</p>
                      <Badge variant="outline">{endpoint.method}</Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Auth Type</p>
                      <p className="font-medium">{endpoint.auth_type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Success Rate</p>
                      <p className="font-medium">
                        {endpoint.success_count + endpoint.error_count > 0
                          ? ((endpoint.success_count / (endpoint.success_count + endpoint.error_count)) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Used</p>
                      <p className="font-medium">
                        {endpoint.last_used ? new Date(endpoint.last_used).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline">
                      <TestTube className="h-3 w-3 mr-1" />
                      Test Endpoint
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Alert>
            <Webhook className="h-4 w-4" />
            <AlertDescription>
              Webhooks allow external services to send real-time notifications to your system.
              Configure endpoints to receive data from CRM systems, payment processors, and other services.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Webhook Endpoints</CardTitle>
              <CardDescription>Manage incoming webhook connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Lead Created Webhook</h4>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Receives notifications when new leads are created in external CRM
                  </p>
                  <code className="text-xs bg-muted p-2 rounded block">
                    https://your-app.supabase.co/functions/webhook-lead-created
                  </code>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Payment Processed Webhook</h4>
                    <Badge variant="secondary">Inactive</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Receives payment confirmations from payment processor
                  </p>
                  <code className="text-xs bg-muted p-2 rounded block">
                    https://your-app.supabase.co/functions/webhook-payment-processed
                  </code>
                </div>
              </div>

              <Button className="w-full mt-4" variant="outline">
                <Webhook className="h-4 w-4 mr-2" />
                Add Webhook Endpoint
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      {showConfigDialog && selectedIntegration && (
        <IntegrationConfigDialog
          integration={selectedIntegration}
          onSave={saveIntegrationConfig}
          onCancel={() => {
            setShowConfigDialog(false);
            setSelectedIntegration(null);
          }}
        />
      )}
    </div>
  );
};

export { ExternalToolsIntegration };
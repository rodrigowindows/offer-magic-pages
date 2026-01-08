/**
 * Campaign Creation Wizard - Página dedicada para criação de campanhas
 * Fluxo step-by-step: Template → Propriedades → Configuração → Preview → Envio
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  ChevronRight,
  ChevronLeft,
  Rocket,
  MessageSquare,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Target,
  Settings,
  Eye,
  Send as SendIcon,
  BarChart3,
  Zap,
  Users,
  Loader2,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DEFAULT_TEMPLATES } from '@/constants/defaultTemplates';
import type { SavedTemplate } from '@/types/marketing.types';

interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  channels: string[];
  estimatedCost: string;
  successRate: string;
  category: 'quick' | 'advanced' | 'automated';
}

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  approval_status?: string;
  lead_status?: string;
  preferred_phones?: string[];
  preferred_emails?: string[];
  skip_tracing_data?: {
    phones?: Array<{number: string; type: string}>;
    emails?: string[];
    preferred_phones?: string[];
    preferred_emails?: string[];
  };
}

const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'approved-blast',
    name: 'Approved Properties Blast',
    description: 'Envie campanha para todas as propriedades aprovadas automaticamente',
    icon: '🚀',
    channels: ['sms', 'call', 'email'],
    estimatedCost: '$0.50-2.00',
    successRate: '15-25%',
    category: 'quick'
  },
  {
    id: 'follow-up-sequence',
    name: 'Follow-up Sequence',
    description: 'Sequência automatizada de follow-up para leads interessados',
    icon: '🔄',
    channels: ['sms', 'email'],
    estimatedCost: '$0.20-0.80',
    successRate: '20-35%',
    category: 'automated'
  },
  {
    id: 'cold-outreach',
    name: 'Cold Outreach Campaign',
    description: 'Alcance propriedades nunca contactadas',
    icon: '❄️',
    channels: ['sms', 'call'],
    estimatedCost: '$0.30-1.50',
    successRate: '5-15%',
    category: 'advanced'
  },
  {
    id: 'hot-lead-nurture',
    name: 'Hot Lead Nurture',
    description: 'Nutra leads quentes com conteúdo personalizado',
    icon: '🔥',
    channels: ['email', 'call'],
    estimatedCost: '$0.40-2.50',
    successRate: '25-40%',
    category: 'advanced'
  },
  {
    id: 'market-update',
    name: 'Market Update Campaign',
    description: 'Atualizações de mercado para proprietários existentes',
    icon: '📊',
    channels: ['email'],
    estimatedCost: '$0.10-0.30',
    successRate: '10-20%',
    category: 'quick'
  }
];

// Helper functions for template preview
const getDefaultTemplateForChannel = (channel: string): SavedTemplate | null => {
  return DEFAULT_TEMPLATES.find(template => template.channel === channel && template.is_default) || null;
};

const renderTemplateContent = (content: string, property: any): string => {
  if (!property || typeof property !== 'object') {
    // Fallback values when no property is available
    const fallbackReplacements: Record<string, string> = {
      '{name}': 'João Silva',
      '{address}': '123 Main Street, Orlando, FL',
      '{city}': 'Orlando',
      '{state}': 'FL',
      '{cash_offer}': '$250,000',
      '{company_name}': 'Your Real Estate Company',
      '{phone}': '(555) 123-4567',
      '{seller_name}': 'Alex Johnson',
      '{estimated_value}': '$300,000',
      '{offer_percentage}': '83'
    };
    return content.replace(/{([^}]+)}/g, (match, key) => {
      return fallbackReplacements[key] || match;
    });
  }

  const replacements: Record<string, string> = {
    '{name}': property.owner_name || 'João Silva',
    '{address}': property.address || '123 Main Street',
    '{city}': property.city || 'Orlando',
    '{state}': property.state || 'FL',
    '{cash_offer}': `$${property.cash_offer_amount?.toLocaleString() || '250,000'}`,
    '{company_name}': 'Your Real Estate Company',
    '{phone}': property.preferred_phones?.[0] || property.owner_phone || '(555) 123-4567',
    '{seller_name}': 'Alex Johnson',
    '{estimated_value}': `$${property.estimated_value?.toLocaleString() || '300,000'}`,
    '{offer_percentage}': property.estimated_value && property.cash_offer_amount
      ? Math.round((property.cash_offer_amount / property.estimated_value) * 100).toString()
      : '83'
  };

  return content.replace(/{([^}]+)}/g, (match, key) => {
    return replacements[key] || match;
  });
};

type WizardStep = 'template' | 'properties' | 'configure' | 'preview' | 'send';

export const CampaignWizard = () => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [campaignConfig, setCampaignConfig] = useState({
    message: '',
    subject: '',
    channels: [] as string[],
    schedule: 'now' as 'now' | 'scheduled',
    scheduledDate: '',
    budget: 50
  });
  const [showOnlyWithPreferredContacts, setShowOnlyWithPreferredContacts] = useState(false);
  const { toast } = useToast();

  const steps = [
    { id: 'template', title: 'Choose Template', icon: Sparkles },
    { id: 'properties', title: 'Select Properties', icon: Target },
    { id: 'configure', title: 'Configure', icon: Settings },
    { id: 'preview', title: 'Preview', icon: Eye },
    { id: 'send', title: 'Send Campaign', icon: SendIcon }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  useEffect(() => {
    if (currentStep === 'properties') {
      fetchAvailableProperties();
    }
  }, [currentStep, showOnlyWithPreferredContacts]);

  const fetchAvailableProperties = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('properties').select('*');

      // Filter based on template
      if (selectedTemplate?.id === 'approved-blast') {
        query = query.eq('approval_status', 'approved');
      } else if (selectedTemplate?.id === 'cold-outreach') {
        query = query.or('lead_status.is.null,lead_status.eq.new');
      } else if (selectedTemplate?.id === 'hot-lead-nurture') {
        query = query.in('lead_status', ['interested', 'contacted']);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;

      let filteredData = data || [];

      // Filter for preferred contacts only (client-side filter)
      if (showOnlyWithPreferredContacts) {
        filteredData = filteredData.filter(property =>
          (property.preferred_phones && property.preferred_phones.length > 0) ||
          (property.preferred_emails && property.preferred_emails.length > 0)
        );
      }

      setAvailableProperties(filteredData);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    setCampaignConfig(prev => ({
      ...prev,
      channels: template.channels
    }));
  };

  const handlePropertyToggle = (property: Property) => {
    setSelectedProperties(prev =>
      prev.find(p => p.id === property.id)
        ? prev.filter(p => p.id !== property.id)
        : [...prev, property]
    );
  };

  const handleSendCampaign = async () => {
    if (!selectedTemplate || selectedProperties.length === 0) return;

    setIsSending(true);
    try {
      // Here you would integrate with your marketing API
      // For now, just simulate sending
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Campaign Sent! 🚀",
        description: `Successfully sent ${selectedTemplate.name} to ${selectedProperties.length} properties`,
      });

      // Reset wizard
      setCurrentStep('template');
      setSelectedTemplate(null);
      setSelectedProperties([]);
      setCampaignConfig({
        message: '',
        subject: '',
        channels: [],
        schedule: 'now',
        scheduledDate: '',
        budget: 50
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send campaign",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 'template': return !!selectedTemplate;
      case 'properties': return selectedProperties.length > 0;
      case 'configure': return campaignConfig.channels.length > 0;
      case 'preview': return true;
      case 'send': return true;
      default: return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'template':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Choose Your Campaign Template</h2>
              <p className="text-muted-foreground">Select a campaign type that fits your goals</p>
            </div>

            <Tabs defaultValue="quick" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="quick">⚡ Quick Start</TabsTrigger>
                <TabsTrigger value="advanced">🎯 Advanced</TabsTrigger>
                <TabsTrigger value="automated">🤖 Automated</TabsTrigger>
              </TabsList>

              {(['quick', 'advanced', 'automated'] as const).map(category => (
                <TabsContent key={category} value={category} className="mt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {CAMPAIGN_TEMPLATES
                      .filter(template => template.category === category)
                      .map(template => (
                        <Card
                          key={template.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="text-2xl">{template.icon}</div>
                              {selectedTemplate?.id === template.id && (
                                <CheckCircle className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <CardDescription>{template.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {template.channels.map(channel => (
                                <Badge key={channel} variant="secondary" className="text-xs">
                                  {channel === 'sms' && <MessageSquare className="h-3 w-3 mr-1" />}
                                  {channel === 'email' && <Mail className="h-3 w-3 mr-1" />}
                                  {channel === 'call' && <Phone className="h-3 w-3 mr-1" />}
                                  {channel}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Cost: {template.estimatedCost}</span>
                              <span>Success: {template.successRate}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        );

      case 'properties':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Select Target Properties</h2>
              <p className="text-muted-foreground">
                Choose which properties to include in your campaign
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  {availableProperties.length} available
                </Badge>
                <Badge variant="default">
                  {selectedProperties.length} selected
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showOnlyWithPreferredContacts}
                    onChange={(e) => setShowOnlyWithPreferredContacts(e.target.checked)}
                    className="rounded"
                  />
                  Only with preferred contacts
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProperties(availableProperties)}
                >
                  Select All
                </Button>
              </div>
            </div>

            <ScrollArea className="h-96 border rounded-lg">
              <div className="p-4 space-y-3">
                {isLoading ? (
                  <div className="text-center py-8">Loading properties...</div>
                ) : availableProperties.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No properties match the selected template criteria
                  </div>
                ) : (
                  availableProperties.map(property => (
                    <Card
                      key={property.id}
                      className={`cursor-pointer transition-all ${
                        selectedProperties.find(p => p.id === property.id)
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:shadow-sm'
                      }`}
                      onClick={() => handlePropertyToggle(property)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{property.address}</h4>
                            <p className="text-sm text-muted-foreground">
                              {property.city}, {property.state} {property.zip_code}
                            </p>
                            {property.owner_name && (
                              <p className="text-sm">Owner: {property.owner_name}</p>
                            )}
                            
                            {/* Contact Information */}
                            <div className="mt-2 space-y-1">
                              {/* Primary Phone */}
                              {property.owner_phone && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <span>{property.owner_phone}</span>
                                </div>
                              )}
                              
                              {/* Primary Email */}
                              {property.owner_email && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  <span>{property.owner_email}</span>
                                </div>
                              )}

                              {/* Preferred Phones */}
                              {property.preferred_phones && property.preferred_phones.length > 0 && (
                                <div className="space-y-1">
                                  {property.preferred_phones.slice(0, 2).map((phone, idx) => (
                                    <div key={idx} className="flex items-center gap-1 text-xs text-blue-600">
                                      <Phone className="h-3 w-3" />
                                      <span className="font-medium">{phone} (preferred)</span>
                                    </div>
                                  ))}
                                  {property.preferred_phones.length > 2 && (
                                    <div className="text-xs text-blue-600">
                                      +{property.preferred_phones.length - 2} mais telefones preferidos
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Preferred Emails */}
                              {property.preferred_emails && property.preferred_emails.length > 0 && (
                                <div className="space-y-1">
                                  {property.preferred_emails.slice(0, 2).map((email, idx) => (
                                    <div key={idx} className="flex items-center gap-1 text-xs text-green-600">
                                      <Mail className="h-3 w-3" />
                                      <span className="font-medium">{email} (preferred)</span>
                                    </div>
                                  ))}
                                  {property.preferred_emails.length > 2 && (
                                    <div className="text-xs text-green-600">
                                      +{property.preferred_emails.length - 2} mais emails preferidos
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Skip Tracing Phones */}
                              {property.skip_tracing_data?.phones && property.skip_tracing_data.phones.length > 0 && (
                                <div className="space-y-1">
                                  {property.skip_tracing_data.phones.slice(0, 2).map((phone, idx) => (
                                    <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Phone className="h-3 w-3" />
                                      <span>{phone.number} ({phone.type})</span>
                                    </div>
                                  ))}
                                  {property.skip_tracing_data.phones.length > 2 && (
                                    <div className="text-xs text-muted-foreground">
                                      +{property.skip_tracing_data.phones.length - 2} mais telefones
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Skip Tracing Emails */}
                              {property.skip_tracing_data?.emails && property.skip_tracing_data.emails.length > 0 && (
                                <div className="space-y-1">
                                  {property.skip_tracing_data.emails.slice(0, 2).map((email, idx) => (
                                    <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Mail className="h-3 w-3" />
                                      <span>{email}</span>
                                    </div>
                                  ))}
                                  {property.skip_tracing_data.emails.length > 2 && (
                                    <div className="text-xs text-muted-foreground">
                                      +{property.skip_tracing_data.emails.length - 2} mais emails
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {property.approval_status && (
                              <Badge variant={property.approval_status === 'approved' ? 'default' : 'secondary'}>
                                {property.approval_status}
                              </Badge>
                            )}
                            <Checkbox
                              checked={selectedProperties.some(p => p.id === property.id)}
                              onChange={() => handlePropertyToggle(property)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        );

      case 'configure':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Configure Your Campaign</h2>
              <p className="text-muted-foreground">Customize the message and delivery options</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Campaign Name</Label>
                  <div className="text-sm text-muted-foreground mt-1">
                    {selectedTemplate?.name} - {selectedProperties.length} properties
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Delivery Channels</Label>
                  <div className="flex gap-2 mt-2">
                    {selectedTemplate?.channels.map(channel => (
                      <Badge key={channel} variant="outline">
                        {channel === 'sms' && <MessageSquare className="h-3 w-3 mr-1" />}
                        {channel === 'email' && <Mail className="h-3 w-3 mr-1" />}
                        {channel === 'call' && <Phone className="h-3 w-3 mr-1" />}
                        {channel}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Estimated Cost</Label>
                  <div className="text-lg font-semibold text-green-600 mt-1">
                    ${selectedProperties.length * 0.75} - ${selectedProperties.length * 2.50}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on {selectedProperties.length} properties × {selectedTemplate?.estimatedCost}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Message Preview */}
            {selectedProperties.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Message Preview
                  </CardTitle>
                  <CardDescription>
                    Quick preview of messages that will be sent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedTemplate?.channels.map((channel) => {
                      const template = getDefaultTemplateForChannel(channel);
                      if (!template) return null;

                      return (
                        <div key={channel} className="border rounded p-3">
                          <div className="flex items-center gap-2 mb-2">
                            {channel === 'sms' && <MessageSquare className="h-3 w-3 text-blue-500" />}
                            {channel === 'email' && <Mail className="h-3 w-3 text-green-500" />}
                            {channel === 'call' && <Phone className="h-3 w-3 text-purple-500" />}
                            <span className="text-sm font-medium capitalize">{channel}</span>
                          </div>
                          <div className="text-xs text-muted-foreground overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                            {channel === 'email' && template.subject && (
                              <div className="font-medium mb-1">{renderTemplateContent(template.subject, selectedProperties[0])}</div>
                            )}
                            {renderTemplateContent(template.body, selectedProperties[0]).substring(0, 100)}...
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Campaign Preview</h2>
              <p className="text-muted-foreground">Review your campaign before sending</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Target Audience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Properties:</span>
                      <span className="font-semibold">{selectedProperties.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Approved:</span>
                      <span className="font-semibold text-green-600">
                        {selectedProperties.filter(p => p.approval_status === 'approved').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Preferred Phones:</span>
                      <span className="font-semibold text-blue-600">
                        {selectedProperties.filter(p => p.preferred_phones && p.preferred_phones.length > 0).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Primary Phones:</span>
                      <span className="font-semibold text-blue-600">
                        {selectedProperties.filter(p => p.owner_phone).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Skip Tracing Phones:</span>
                      <span className="font-semibold text-blue-600">
                        {selectedProperties.filter(p => p.skip_tracing_data?.phones && p.skip_tracing_data.phones.length > 0).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Phone Contacts:</span>
                      <span className="font-semibold text-blue-600">
                        {selectedProperties.reduce((total, p) => {
                          let count = p.owner_phone ? 1 : 0;
                          if (p.preferred_phones) count += p.preferred_phones.length;
                          if (p.skip_tracing_data?.phones) count += p.skip_tracing_data.phones.length;
                          return total + count;
                        }, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Preferred Emails:</span>
                      <span className="font-semibold text-purple-600">
                        {selectedProperties.filter(p => p.preferred_emails && p.preferred_emails.length > 0).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Primary Emails:</span>
                      <span className="font-semibold text-purple-600">
                        {selectedProperties.filter(p => p.owner_email).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Skip Tracing Emails:</span>
                      <span className="font-semibold text-purple-600">
                        {selectedProperties.filter(p => p.skip_tracing_data?.emails && p.skip_tracing_data.emails.length > 0).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Email Contacts:</span>
                      <span className="font-semibold text-purple-600">
                        {selectedProperties.reduce((total, p) => {
                          let count = p.owner_email ? 1 : 0;
                          if (p.preferred_emails) count += p.preferred_emails.length;
                          if (p.skip_tracing_data?.emails) count += p.skip_tracing_data.emails.length;
                          return total + count;
                        }, 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Campaign Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Template:</span>
                      <span className="font-semibold">{selectedTemplate?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Channels:</span>
                      <span className="font-semibold">{selectedTemplate?.channels.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expected Success:</span>
                      <span className="font-semibold text-green-600">{selectedTemplate?.successRate}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Message Content Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Message Content Preview
                </CardTitle>
                <CardDescription>
                  Preview of actual messages that will be sent to recipients
                  {selectedProperties.length === 0 && " (showing sample data)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedTemplate?.channels.map((channel) => {
                    const template = getDefaultTemplateForChannel(channel);
                    if (!template) {
                      return (
                        <div key={channel} className="border rounded-lg p-4 border-dashed border-muted-foreground/30">
                          <div className="flex items-center gap-2 mb-2">
                            {channel === 'sms' && <MessageSquare className="h-4 w-4 text-muted-foreground" />}
                            {channel === 'email' && <Mail className="h-4 w-4 text-muted-foreground" />}
                            {channel === 'call' && <Phone className="h-4 w-4 text-muted-foreground" />}
                            <span className="font-medium capitalize text-muted-foreground">{channel} Message</span>
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              No template available
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Template for {channel} channel is not configured yet.
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={channel} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          {channel === 'sms' && <MessageSquare className="h-4 w-4 text-blue-500" />}
                          {channel === 'email' && <Mail className="h-4 w-4 text-green-500" />}
                          {channel === 'call' && <Phone className="h-4 w-4 text-purple-500" />}
                          <span className="font-medium capitalize">{channel} Message</span>
                          <Badge variant="outline" className="text-xs">
                            {template.name}
                          </Badge>
                        </div>

                        {channel === 'email' && template.subject && (
                          <div className="mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Subject: </span>
                            <span className="text-sm">{renderTemplateContent(template.subject, selectedProperties[0] || {})}</span>
                          </div>
                        )}

                        <div className="bg-muted/50 p-3 rounded text-sm">
                          {channel === 'email' && template.body.includes('<!DOCTYPE') ? (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: renderTemplateContent(template.body, selectedProperties[0] || {})
                              }}
                              className="max-h-32 overflow-y-auto"
                            />
                          ) : (
                            <div className="whitespace-pre-wrap">
                              {renderTemplateContent(template.body, selectedProperties[0] || {})}
                            </div>
                          )}
                        </div>

                        <div className="mt-2 text-xs text-muted-foreground">
                          {channel === 'sms' && `~${renderTemplateContent(template.body, selectedProperties[0] || {}).length} characters`}
                          {channel === 'email' && 'HTML email with professional formatting'}
                          {channel === 'call' && 'Voicemail message for unanswered calls'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This campaign will be sent to {selectedProperties.length} properties using {selectedTemplate?.channels.length} communication channels.
                Make sure your marketing API is configured before proceeding.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'send':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Ready to Launch! 🚀</h2>
              <p className="text-muted-foreground">Your campaign is configured and ready to send</p>
            </div>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="text-6xl">🎯</div>
                  <div>
                    <h3 className="text-xl font-semibold">Campaign Summary</h3>
                    <p className="text-muted-foreground mt-2">
                      {selectedTemplate?.name} targeting {selectedProperties.length} properties
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{selectedProperties.length}</div>
                      <div className="text-sm text-muted-foreground">Properties</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{selectedTemplate?.channels.length}</div>
                      <div className="text-sm text-muted-foreground">Channels</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{selectedTemplate?.successRate}</div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Campaign is ready to send. Click "Launch Campaign" to start reaching your target audience.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Rocket className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Campaign Creator</h1>
              <p className="text-muted-foreground">Create and launch marketing campaigns step by step</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                    index <= currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <span className={index <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
            <Progress value={(currentStepIndex + 1) / steps.length * 100} className="h-2" />
          </div>
        </div>

        {/* Main Content */}
        <Card className="min-h-[600px]">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => {
              const prevIndex = Math.max(0, currentStepIndex - 1);
              setCurrentStep(steps[prevIndex].id as WizardStep);
            }}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                // Reset wizard
                setCurrentStep('template');
                setSelectedTemplate(null);
                setSelectedProperties([]);
              }}
            >
              Start Over
            </Button>

            {currentStep === 'send' ? (
              <Button
                onClick={handleSendCampaign}
                disabled={isSending}
                className="gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Launch Campaign
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  const nextIndex = Math.min(steps.length - 1, currentStepIndex + 1);
                  setCurrentStep(steps[nextIndex].id as WizardStep);
                }}
                disabled={!canProceedToNext()}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
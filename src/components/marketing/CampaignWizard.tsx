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
  Star,
  TrendingUp,
  Crown,
  Home,
  Shield,
  Heart,
  Activity,
  Trophy,
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
  email1?: string;
  approval_status?: string;
  lead_status?: string;
  estimated_value?: number;
  cash_offer_amount?: number;
  tags?: string[];
}

// Helper functions to extract preferred contacts from tags
const getPreferredPhones = (property: Property): string[] => {
  const tags = Array.isArray(property.tags) ? property.tags : [];
  const prefPhones = tags
    .filter((t): t is string => typeof t === 'string' && t.startsWith('pref_phone:'))
    .map(t => t.replace('pref_phone:', ''));
  const manualPhones = tags
    .filter((t): t is string => typeof t === 'string' && t.startsWith('manual_phone:'))
    .map(t => t.replace('manual_phone:', ''));
  return [...prefPhones, ...manualPhones];
};

const getPreferredEmails = (property: Property): string[] => {
  const tags = Array.isArray(property.tags) ? property.tags : [];
  const prefEmails = tags
    .filter((t): t is string => typeof t === 'string' && t.startsWith('pref_email:'))
    .map(t => t.replace('pref_email:', ''));
  const manualEmails = tags
    .filter((t): t is string => typeof t === 'string' && t.startsWith('manual_email:'))
    .map(t => t.replace('manual_email:', ''));
  return [...prefEmails, ...manualEmails];
};

const hasPreferredContacts = (property: Property): boolean => {
  return getPreferredPhones(property).length > 0 || getPreferredEmails(property).length > 0;
};

const getTotalContacts = (property: Property): number => {
  return (
    getPreferredPhones(property).length +
    getPreferredEmails(property).length +
    (property.owner_phone ? 1 : 0) +
    (property.owner_email || property.email1 ? 1 : 0)
  );
};

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

// Helper function to create SEO-friendly URL slug from address
const createPropertySlug = (address: string, city: string, zip: string): string => {
  // Convert "25217 MATHEW ST" -> "25217-mathew-st"
  const addressSlug = address
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Remove duplicate hyphens
    .trim();

  // Convert "UNINCORPORATED" -> "unincorporated"
  const citySlug = city
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();

  // Result: "25217-mathew-st-unincorporated-32709"
  return `${addressSlug}-${citySlug}-${zip}`;
};

const renderTemplateContent = (content: string, property: any, channel?: string): string => {
  if (!property || typeof property !== 'object') {
    // Fallback values when no property is available
    const fallbackPropertyUrl = 'https://offer.mylocalinvest.com/property/sample?src=preview';
    const fallbackQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fallbackPropertyUrl)}`;

    const fallbackReplacements: Record<string, string> = {
      '{name}': 'João Silva',
      '{address}': '123 Main Street, Orlando, FL',
      '{city}': 'Orlando',
      '{state}': 'FL',
      '{cash_offer}': '$250,000',
      '{company_name}': 'MyLocalInvest',
      '{phone}': '(786) 882-8251',
      '{seller_name}': 'Alex Johnson',
      '{estimated_value}': '$300,000',
      '{offer_percentage}': '83',
      '{property_url}': fallbackPropertyUrl,
      '{qr_code_url}': fallbackQrCodeUrl,
      '{unsubscribe_url}': 'https://offer.mylocalinvest.com/unsubscribe',
      '{tracking_pixel}': '',
      '{source_channel}': channel || 'email'
    };
    return content.replace(/{([^}]+)}/g, (match, key) => {
      return fallbackReplacements[key] || match;
    });
  }

  // Create SEO-friendly URL slug: "25217-mathew-st-unincorporated-32709"
  const propertySlug = createPropertySlug(
    property.address || 'property',
    property.city || 'orlando',
    property.zip_code || '00000'
  );

  // Build tracking URL based on channel
  const sourceParam = channel ? `?src=${channel}` : '?src=campaign';
  const propertyUrl = `https://offer.mylocalinvest.com/property/${propertySlug}${sourceParam}`;

  // Generate QR code with tracking URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(propertyUrl)}`;

  // Unsubscribe URL (can be improved with property-specific tokens)
  const unsubscribeUrl = `https://offer.mylocalinvest.com/unsubscribe?email=${encodeURIComponent(property.owner_email || '')}`;

  // Tracking pixel for email opens (1x1 transparent image)
  const trackingPixel = channel === 'email'
    ? `<img src="https://offer.mylocalinvest.com/track/open/${property.id}?t=${Date.now()}" width="1" height="1" style="display:none;" alt="" />`
    : '';

  const replacements: Record<string, string> = {
    '{name}': property.owner_name || 'Homeowner',
    '{address}': property.address || '123 Main Street',
    '{city}': property.city || 'Orlando',
    '{state}': property.state || 'FL',
    '{zip_code}': property.zip_code || '',
    '{cash_offer}': `$${property.cash_offer_amount?.toLocaleString() || '250,000'}`,
    '{company_name}': 'MyLocalInvest',
    '{phone}': '(786) 882-8251',
    '{seller_name}': 'Alex Johnson',
    '{estimated_value}': `$${property.estimated_value?.toLocaleString() || '300,000'}`,
    '{offer_percentage}': property.estimated_value && property.cash_offer_amount
      ? Math.round((property.cash_offer_amount / property.estimated_value) * 100).toString()
      : '83',
    '{property_url}': propertyUrl,
    '{qr_code_url}': qrCodeUrl,
    '{unsubscribe_url}': unsubscribeUrl,
    '{tracking_pixel}': trackingPixel,
    '{source_channel}': channel || 'campaign'
  };

  return content.replace(/{([^}]+)}/g, (match, key) => {
    return replacements[key] || match;
  });
};

type WizardStep = 'template' | 'properties' | 'configure' | 'preview' | 'send';

// Helper component for metric cards
const MetricCard = ({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  description
}: {
  title: string;
  value: number | string;
  icon: any;
  iconBgColor: string;
  iconColor: string;
  description: string;
}) => (
  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${iconBgColor} flex items-center justify-center`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-600 font-medium">{title}</div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-500 truncate">{description}</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

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
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
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
    if (currentStep === 'preview') {
      setCurrentPreviewIndex(0);
    }
  }, [currentStep]);

  const fetchAvailableProperties = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('properties').select(`
        id,
        address,
        city,
        state,
        zip_code,
        owner_name,
        owner_phone,
        email1,
        approval_status,
        lead_status,
        tags,
        estimated_value,
        cash_offer_amount
      `);

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
        filteredData = filteredData.filter(property => {
          return hasPreferredContacts(property as Property);
        });
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
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Choose Your Campaign Template
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Select a campaign type that fits your goals and target audience
              </p>
            </div>

            {/* Quick Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <MetricCard
                title="Available Templates"
                value={CAMPAIGN_TEMPLATES.length}
                icon={<Star className="h-5 w-5" />}
                iconBgColor="bg-yellow-100"
                iconColor="text-yellow-600"
                description="Ready-to-use campaigns"
              />
              <MetricCard
                title="Success Rate Range"
                value="5-40%"
                icon={<TrendingUp className="h-5 w-5" />}
                iconBgColor="bg-green-100"
                iconColor="text-green-600"
                description="Average conversion rates"
              />
              <MetricCard
                title="Cost Efficiency"
                value="$0.10-2.50"
                icon={<Zap className="h-5 w-5" />}
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
                description="Per contact cost range"
              />
            </div>

            <Tabs defaultValue="quick" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-12">
                <TabsTrigger value="quick" className="flex items-center gap-2 text-sm font-medium">
                  <Zap className="h-4 w-4" />
                  ⚡ Quick Start
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center gap-2 text-sm font-medium">
                  <Target className="h-4 w-4" />
                  🎯 Advanced
                </TabsTrigger>
                <TabsTrigger value="automated" className="flex items-center gap-2 text-sm font-medium">
                  <Crown className="h-4 w-4" />
                  🤖 Automated
                </TabsTrigger>
              </TabsList>

              {(['quick', 'advanced', 'automated'] as const).map(category => (
                <TabsContent key={category} value={category} className="mt-8">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {CAMPAIGN_TEMPLATES
                      .filter(template => template.category === category)
                      .map(template => (
                        <Card
                          key={template.id}
                          className={`group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 bg-gradient-to-br from-white to-gray-50 ${
                            selectedTemplate?.id === template.id
                              ? 'ring-2 ring-blue-500 shadow-2xl shadow-blue-500/20 bg-gradient-to-br from-blue-50 to-purple-50'
                              : 'hover:border-gray-200'
                          }`}
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <CardHeader className="pb-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className={`p-3 rounded-xl transition-all duration-300 ${
                                selectedTemplate?.id === template.id
                                  ? 'bg-blue-100 scale-110'
                                  : 'bg-gray-100 group-hover:bg-blue-50'
                              }`}>
                                <span className="text-2xl">{template.icon}</span>
                              </div>
                              {selectedTemplate?.id === template.id && (
                                <div className="flex items-center gap-1 text-blue-600 font-medium text-sm">
                                  <CheckCircle className="h-4 w-4" />
                                  Selected
                                </div>
                              )}
                            </div>
                            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {template.name}
                            </CardTitle>
                            <CardDescription className="text-gray-600 leading-relaxed">
                              {template.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              {template.channels.map(channel => (
                                <Badge
                                  key={channel}
                                  variant="secondary"
                                  className={`text-xs font-medium px-2 py-1 transition-all ${
                                    selectedTemplate?.id === template.id
                                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {channel === 'sms' && <MessageSquare className="h-3 w-3 mr-1" />}
                                  {channel === 'email' && <Mail className="h-3 w-3 mr-1" />}
                                  {channel === 'call' && <Phone className="h-3 w-3 mr-1" />}
                                  {channel}
                                </Badge>
                              ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                              <div className="text-center">
                                <div className="text-sm font-semibold text-green-600">{template.estimatedCost}</div>
                                <div className="text-xs text-gray-500">Est. Cost</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-semibold text-blue-600">{template.successRate}</div>
                                <div className="text-xs text-gray-500">Success Rate</div>
                              </div>
                            </div>

                            {selectedTemplate?.id === template.id && (
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 text-blue-700 text-sm font-medium">
                                  <Heart className="h-4 w-4" />
                                  Perfect for your campaign goals!
                                </div>
                              </div>
                            )}
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
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-blue-600 mb-4">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Select Target Properties
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Choose which properties to include in your campaign from the available database
              </p>
            </div>

            {/* Enhanced Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <MetricCard
                title="Available Properties"
                value={availableProperties.length}
                icon={<Home className="h-5 w-5" />}
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
                description="Matching your criteria"
              />
              <MetricCard
                title="Selected"
                value={selectedProperties.length}
                icon={<CheckCircle className="h-5 w-5" />}
                iconBgColor="bg-green-100"
                iconColor="text-green-600"
                description="Ready for campaign"
              />
              <MetricCard
                title="With Preferred Contacts"
                value={availableProperties.filter(p => hasPreferredContacts(p)).length}
                icon={<Star className="h-5 w-5" />}
                iconBgColor="bg-yellow-100"
                iconColor="text-yellow-600"
                description="High-quality contacts"
              />
              <MetricCard
                title="Approved Properties"
                value={availableProperties.filter(p => p.approval_status === 'approved').length}
                icon={<Shield className="h-5 w-5" />}
                iconBgColor="bg-purple-100"
                iconColor="text-purple-600"
                description="Ready to contact"
              />
            </div>

            {/* Enhanced Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                  {availableProperties.length} available
                </Badge>
                <Badge variant="default" className="px-3 py-1 text-sm font-medium bg-blue-600">
                  {selectedProperties.length} selected
                </Badge>
                {selectedProperties.length > 0 && (
                  <Badge variant="secondary" className="px-3 py-1 text-sm font-medium bg-green-100 text-green-700">
                    {Math.round((selectedProperties.length / availableProperties.length) * 100)}% coverage
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={showOnlyWithPreferredContacts}
                    onChange={(e) => setShowOnlyWithPreferredContacts(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Star className="h-4 w-4 text-yellow-500" />
                  Only preferred contacts
                </label>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProperties(availableProperties)}
                  className="hover:bg-blue-50 hover:border-blue-300"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Select All
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProperties([])}
                  className="hover:bg-red-50 hover:border-red-300"
                >
                  Clear All
                </Button>
              </div>
            </div>

            {/* Enhanced Property Grid */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-hidden">
                <ScrollArea className="h-[600px]">
                  <div className="p-6 space-y-4">
                    {isLoading ? (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                        </div>
                        <div className="text-lg font-medium text-gray-900">Loading properties...</div>
                        <div className="text-sm text-gray-600 mt-1">Searching your database</div>
                      </div>
                    ) : availableProperties.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                          <Target className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="text-lg font-medium text-gray-900">No properties found</div>
                        <div className="text-sm text-gray-600 mt-1">Try adjusting your template criteria</div>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {availableProperties.map(property => {
                          const isSelected = selectedProperties.some(p => p.id === property.id);
                          const prefPhones = getPreferredPhones(property);
                          const prefEmails = getPreferredEmails(property);
                          const totalContacts = getTotalContacts(property);

                          return (
                            <Card
                              key={property.id}
                              className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-gray-50 ${
                                isSelected
                                  ? 'ring-2 ring-blue-500 shadow-2xl shadow-blue-500/20 bg-gradient-to-br from-blue-50 to-green-50'
                                  : 'hover:border-gray-200'
                              }`}
                              onClick={() => handlePropertyToggle(property)}
                            >
                              <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Home className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                      <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                        {property.address}
                                      </h4>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                      {property.city}, {property.state} {property.zip_code}
                                    </p>
                                    {property.owner_name && (
                                      <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {property.owner_name}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 ml-4">
                                    {property.approval_status && (
                                      <Badge
                                        variant={property.approval_status === 'approved' ? 'default' : 'secondary'}
                                        className={`text-xs ${
                                          property.approval_status === 'approved'
                                            ? 'bg-green-100 text-green-700 border-green-200'
                                            : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                        }`}
                                      >
                                        {property.approval_status === 'approved' && <Shield className="h-3 w-3 mr-1" />}
                                        {property.approval_status}
                                      </Badge>
                                    )}

                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                      isSelected
                                        ? 'bg-blue-600 border-blue-600'
                                        : 'border-gray-300 group-hover:border-blue-400'
                                    }`}>
                                      {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                                    </div>
                                  </div>
                                </div>

                                {/* Property Values */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                  <div className="text-center p-2 bg-orange-50 rounded-lg">
                                    <div className="text-sm font-bold text-orange-600">
                                      ${property.estimated_value?.toLocaleString() || 'N/A'}
                                    </div>
                                    <div className="text-xs text-orange-700 font-medium">Est. Value</div>
                                  </div>
                                  <div className="text-center p-2 bg-red-50 rounded-lg">
                                    <div className="text-sm font-bold text-red-600">
                                      ${property.cash_offer_amount?.toLocaleString() || 'N/A'}
                                    </div>
                                    <div className="text-xs text-red-700 font-medium">Cash Offer</div>
                                  </div>
                                </div>

                                {/* Contact Summary */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                                    <div className="text-lg font-bold text-blue-600">
                                      {prefPhones.length}
                                    </div>
                                    <div className="text-xs text-blue-700 font-medium">Preferred Phones</div>
                                  </div>
                                  <div className="text-center p-2 bg-green-50 rounded-lg">
                                    <div className="text-lg font-bold text-green-600">
                                      {prefEmails.length}
                                    </div>
                                    <div className="text-xs text-green-700 font-medium">Preferred Emails</div>
                                  </div>
                                  <div className="text-center p-2 bg-purple-50 rounded-lg">
                                    <div className="text-lg font-bold text-purple-600">{totalContacts}</div>
                                    <div className="text-xs text-purple-700 font-medium">Total Contacts</div>
                                  </div>
                                </div>

                                {/* Contact Details */}
                                <div className="space-y-2">
                                  {/* Primary Owner Contacts */}
                                  {(property.owner_phone || property.owner_email || property.email1) && (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                                        <Users className="h-3 w-3" />
                                        Owner Contacts:
                                      </div>
                                      <div className="space-y-1">
                                        {property.owner_phone && (
                                          <div className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-mono text-gray-700 mr-1">
                                            <Phone className="h-3 w-3 mr-1" />
                                            {property.owner_phone}
                                          </div>
                                        )}
                                        {(property.owner_email || property.email1) && (
                                          <div className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-mono text-gray-700">
                                            <Mail className="h-3 w-3 mr-1" />
                                            {property.owner_email || property.email1}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Preferred Phones with Values */}
                                  {prefPhones.length > 0 && (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1 text-xs font-semibold text-blue-700">
                                        <Phone className="h-3 w-3" />
                                        Preferred Phones:
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {prefPhones.map((phone: string, idx: number) => (
                                          <div key={idx} className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-mono text-blue-700">
                                            {phone}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Preferred Emails with Values */}
                                  {prefEmails.length > 0 && (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1 text-xs font-semibold text-green-700">
                                        <Mail className="h-3 w-3" />
                                        Preferred Emails:
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {prefEmails.map((email: string, idx: number) => (
                                          <div key={idx} className="inline-flex items-center rounded-md border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-mono text-green-700">
                                            {email}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Fallback message if no preferred contacts */}
                                  {prefPhones.length === 0 && prefEmails.length === 0 && (
                                    <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1.5 rounded border border-amber-200">
                                      <AlertCircle className="h-3 w-3 inline mr-1" />
                                      No preferred contacts selected. Open Skip Trace to select.
                                    </div>
                                  )}
                                </div>

                                {/* Selection Indicator */}
                                {isSelected && (
                                  <div className="mt-4 p-2 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-2 text-blue-700 text-sm font-medium">
                                      <CheckCircle className="h-4 w-4" />
                                      Selected for campaign
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Selected Properties Panel */}
              <div className="w-full md:w-[420px] bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b">
                  <div className="font-semibold text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Selected Properties ({selectedProperties.length})
                  </div>
                  <div className="text-xs text-gray-500">Properties that will receive your campaign</div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    {selectedProperties.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Users className="mx-auto mb-2 w-8 h-8" />
                        Nenhuma propriedade selecionada
                        <div className="text-xs mt-2">Selecione propriedades na lista ao lado para continuar</div>
                      </div>
                    ) : (
                      selectedProperties.map((property) => (
                        <div key={property.id} className="border rounded p-3 bg-gray-50">
                          <div className="font-semibold text-sm mb-1">{property.address}</div>
                          <div className="text-xs text-gray-600 mb-2">{property.city}, {property.state} {property.zip_code}</div>
                          
                          {/* Property Values */}
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div className="text-xs">
                              <span className="font-medium text-orange-700">Est. Value:</span>
                              <div className="font-semibold">${property.estimated_value?.toLocaleString() || 'N/A'}</div>
                            </div>
                            <div className="text-xs">
                              <span className="font-medium text-red-700">Cash Offer:</span>
                              <div className="font-semibold">${property.cash_offer_amount?.toLocaleString() || 'N/A'}</div>
                            </div>
                          </div>
                          
                          {/* Owner Info */}
                          {property.owner_name && (
                            <div className="text-xs text-gray-700 mb-1">
                              <span className="font-medium">Owner:</span> {property.owner_name}
                            </div>
                          )}
                          
                          {/* Contact Information */}
                          <div className="space-y-1">
                            {/* Owner Contacts */}
                            {(property.owner_phone || property.owner_email) && (
                              <div>
                                <div className="text-xs font-medium text-gray-700 mb-1">Owner Contacts:</div>
                                <div className="space-y-0.5">
                                  {property.owner_phone && (
                                    <div className="text-xs text-blue-700 flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {property.owner_phone}
                                    </div>
                                  )}
                                  {property.owner_email && (
                                    <div className="text-xs text-green-700 flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {property.owner_email}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Preferred Contacts */}
                            {(() => {
                              const propPhones = getPreferredPhones(property);
                              const propEmails = getPreferredEmails(property);
                              if (propPhones.length === 0 && propEmails.length === 0) return null;
                              return (
                                <div>
                                  <div className="text-xs font-medium text-purple-700 mb-1">Preferred Contacts:</div>
                                  <div className="space-y-0.5">
                                    {propPhones.map((phone, idx) => (
                                      <div key={idx} className="text-xs text-blue-700 flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {phone}
                                      </div>
                                    ))}
                                    {propEmails.map((email, idx) => (
                                      <div key={idx} className="text-xs text-green-700 flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {email}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        );

      case 'configure':
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 mb-4">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Campaign Summary
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Review your campaign configuration before preview
              </p>
            </div>

            {/* Campaign Overview Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-3xl font-bold text-blue-600 mb-2">{selectedProperties.length}</div>
                    <div className="text-sm font-medium text-blue-700">Target Properties</div>
                    <div className="text-xs text-blue-600 mt-1">Selected for outreach</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-4">
                      <MessageSquare className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="text-3xl font-bold text-purple-600 mb-2">{selectedTemplate?.channels.length}</div>
                    <div className="text-sm font-medium text-purple-700">Communication Channels</div>
                    <div className="text-xs text-purple-600 mt-1">{selectedTemplate?.channels.join(', ')}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-3xl font-bold text-green-600 mb-2">{selectedTemplate?.successRate}</div>
                    <div className="text-sm font-medium text-green-700">Expected Success Rate</div>
                    <div className="text-xs text-green-600 mt-1">Based on campaign type</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Campaign Details Card */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Campaign Configuration
                </CardTitle>
                <CardDescription>Complete overview of your campaign settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Template Info */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-600">Campaign Template</div>
                        <div className="text-lg font-semibold text-gray-900">{selectedTemplate?.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{selectedTemplate?.description}</div>
                      </div>
                    </div>
                  </div>

                  {/* Channels */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-600">Communication Channels</div>
                        <div className="flex gap-2 mt-2">
                          {selectedTemplate?.channels.map(channel => (
                            <Badge key={channel} className="bg-purple-100 text-purple-700 border-purple-200">
                              {channel === 'sms' && <MessageSquare className="h-3 w-3 mr-1" />}
                              {channel === 'email' && <Mail className="h-3 w-3 mr-1" />}
                              {channel === 'call' && <Phone className="h-3 w-3 mr-1" />}
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cost Estimate */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-600">Estimated Cost</div>
                        <div className="text-lg font-semibold text-green-600">
                          ${(selectedProperties.length * 0.75).toFixed(2)} - ${(selectedProperties.length * 2.50).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {selectedProperties.length} properties × {selectedTemplate?.estimatedCost}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Summary */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-600">Total Contacts</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {selectedProperties.reduce((total, p) => {
                            return total + getTotalContacts(p);
                          }, 0)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Across all channels</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Message Preview */}
            {selectedProperties.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-purple-600" />
                    Message Preview
                  </CardTitle>
                  <CardDescription>
                    Quick preview of messages that will be sent to contacts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedTemplate?.channels.map((channel) => {
                      const template = getDefaultTemplateForChannel(channel);
                      if (!template) return null;

                      return (
                        <div key={channel} className="border rounded-lg p-4 bg-gradient-to-br from-white to-gray-50">
                          <div className="flex items-center gap-2 mb-3">
                            {channel === 'sms' && <MessageSquare className="h-4 w-4 text-blue-500" />}
                            {channel === 'email' && <Mail className="h-4 w-4 text-green-500" />}
                            {channel === 'call' && <Phone className="h-4 w-4 text-purple-500" />}
                            <span className="text-sm font-semibold capitalize">{channel} Message</span>
                            <Badge variant="outline" className="ml-auto">{template.name}</Badge>
                          </div>
                          <div className="text-sm text-gray-700 line-clamp-3 bg-white p-3 rounded border">
                            {channel === 'email' && template.subject && (
                              <div className="font-medium text-gray-900 mb-2">
                                📧 {renderTemplateContent(template.subject, selectedProperties[0], channel)}
                              </div>
                            )}
                            {renderTemplateContent(template.body, selectedProperties[0], channel).substring(0, 150)}...
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ready to Preview Alert */}
            <Alert className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              <AlertDescription className="text-base">
                <div className="font-semibold text-purple-900 mb-1">
                  Configuration Complete! ✓
                </div>
                <div className="text-purple-800">
                  Your campaign is configured and ready. Click "Next Step" to see a detailed preview before launching.
                </div>
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 mb-4">
                <Eye className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Campaign Preview
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Review your campaign configuration and message content before launching
              </p>
            </div>

            {/* Enhanced Campaign Overview */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Target Properties"
                value={selectedProperties.length}
                icon={<Target className="h-5 w-5" />}
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
                description="Properties selected"
              />
              <MetricCard
                title="Total Contacts"
                value={selectedProperties.reduce((total, p) => {
                  return total + getTotalContacts(p);
                }, 0)}
                icon={<Users className="h-5 w-5" />}
                iconBgColor="bg-green-100"
                iconColor="text-green-600"
                description="Available contacts"
              />
              <MetricCard
                title="Communication Channels"
                value={selectedTemplate?.channels.length || 0}
                icon={<MessageSquare className="h-5 w-5" />}
                iconBgColor="bg-purple-100"
                iconColor="text-purple-600"
                description="SMS, Email, Call"
              />
              <MetricCard
                title="Expected Success"
                value={selectedTemplate?.successRate || 'N/A'}
                icon={<TrendingUp className="h-5 w-5" />}
                iconBgColor="bg-yellow-100"
                iconColor="text-yellow-600"
                description="Conversion rate"
              />
            </div>

            {/* Detailed Contact Breakdown */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Phone className="h-5 w-5" />
                    Phone Contact Breakdown
                  </CardTitle>
                  <CardDescription>Distribution of phone numbers across contact sources</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">Preferred Phones</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700">
                        {selectedProperties.reduce((total, p) => total + getPreferredPhones(p).length, 0)}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Primary Phones</span>
                      </div>
                      <Badge className="bg-gray-100 text-gray-700">
                        {selectedProperties.filter(p => p.owner_phone).length}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">Skip Tracing Phones</span>
                      </div>
                      <Badge className="bg-purple-100 text-purple-700">
                        0
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg border-2 border-blue-300">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <span className="font-bold text-blue-700">Total Phone Contacts</span>
                      </div>
                      <Badge className="bg-blue-600 text-white font-bold">
                        {selectedProperties.reduce((total, p) => {
                          let count = p.owner_phone ? 1 : 0;
                          count += getPreferredPhones(p).length;
                          return total + count;
                        }, 0)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Mail className="h-5 w-5" />
                    Email Contact Breakdown
                  </CardTitle>
                  <CardDescription>Distribution of email addresses across contact sources</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">Preferred Emails</span>
                      </div>
                      <Badge className="bg-green-100 text-green-700">
                        {selectedProperties.reduce((total, p) => total + getPreferredEmails(p).length, 0)}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Primary Emails</span>
                      </div>
                      <Badge className="bg-gray-100 text-gray-700">
                        {selectedProperties.filter(p => p.owner_email).length}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">Skip Tracing Emails</span>
                      </div>
                      <Badge className="bg-purple-100 text-purple-700">
                        0
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-lg border-2 border-green-300">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-green-600" />
                        <span className="font-bold text-green-700">Total Email Contacts</span>
                      </div>
                      <Badge className="bg-green-600 text-white font-bold">
                        {selectedProperties.reduce((total, p) => {
                          let count = (p.owner_email || p.email1) ? 1 : 0;
                          count += getPreferredEmails(p).length;
                          return total + count;
                        }, 0)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Campaign Configuration Summary */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <BarChart3 className="h-5 w-5" />
                  Campaign Configuration Summary
                </CardTitle>
                <CardDescription>Final overview of your campaign settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-white rounded-xl border shadow-sm">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{selectedTemplate?.name}</div>
                    <div className="text-sm text-gray-600 font-medium">Campaign Template</div>
                    <div className="text-xs text-gray-500 mt-1">{selectedTemplate?.description}</div>
                  </div>

                  <div className="text-center p-4 bg-white rounded-xl border shadow-sm">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{selectedTemplate?.channels.join(', ')}</div>
                    <div className="text-sm text-gray-600 font-medium">Communication Channels</div>
                    <div className="text-xs text-gray-500 mt-1">Multi-channel approach</div>
                  </div>

                  <div className="text-center p-4 bg-white rounded-xl border shadow-sm">
                    <div className="text-2xl font-bold text-green-600 mb-1">{selectedTemplate?.successRate}</div>
                    <div className="text-sm text-gray-600 font-medium">Expected Success Rate</div>
                    <div className="text-xs text-gray-500 mt-1">Based on historical data</div>
                  </div>

                  <div className="text-center p-4 bg-white rounded-xl border shadow-sm">
                    <div className="text-2xl font-bold text-orange-600 mb-1">{selectedTemplate?.estimatedCost}</div>
                    <div className="text-sm text-gray-600 font-medium">Estimated Cost Range</div>
                    <div className="text-xs text-gray-500 mt-1">Per contact pricing</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Message Content Preview */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-purple-600" />
                  Message Content Preview
                </CardTitle>
                <CardDescription className="text-base">
                  Live preview of messages that will be sent to your contacts
                  {selectedProperties.length === 0 && " (showing sample data)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {selectedTemplate?.channels.map((channel) => {
                    const template = getDefaultTemplateForChannel(channel);
                    if (!template) {
                      return (
                        <div key={channel} className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50">
                          <div className="flex items-center gap-3 mb-3">
                            {channel === 'sms' && <MessageSquare className="h-5 w-5 text-gray-400" />}
                            {channel === 'email' && <Mail className="h-5 w-5 text-gray-400" />}
                            {channel === 'call' && <Phone className="h-5 w-5 text-gray-400" />}
                            <span className="font-semibold text-gray-600 capitalize">{channel} Message</span>
                            <Badge variant="outline" className="text-gray-500 border-gray-300">
                              Template not configured
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            No template available for {channel} channel. Please configure templates first.
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={channel} className="border rounded-xl p-6 bg-gradient-to-br from-white to-gray-50 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          {channel === 'sms' && <MessageSquare className="h-5 w-5 text-blue-500" />}
                          {channel === 'email' && <Mail className="h-5 w-5 text-green-500" />}
                          {channel === 'call' && <Phone className="h-5 w-5 text-purple-500" />}
                          <span className="font-semibold text-lg capitalize">{channel} Message</span>
                          <Badge variant="outline" className="bg-white border-gray-300">
                            {template.name}
                          </Badge>
                          <div className="ml-auto flex items-center gap-2">
                            <Badge className={`${
                              channel === 'sms' ? 'bg-blue-100 text-blue-700' :
                              channel === 'email' ? 'bg-green-100 text-green-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {channel.toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        {channel === 'email' && template.subject && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Mail className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-semibold text-blue-700">Email Subject:</span>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {renderTemplateContent(template.subject, selectedProperties[0] || {}, channel)}
                            </div>
                          </div>
                        )}

                        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                          {channel === 'email' && /<([a-z][\s\S]*?)>/i.test(template.body) ? (
                            <div className="relative w-full" style={{ minHeight: '500px' }}>
                              <iframe
                                srcDoc={renderTemplateContent(template.body, selectedProperties[0] || {}, channel)}
                                className="w-full h-full border-0"
                                style={{ height: '600px', minHeight: '500px' }}
                                title="Email Preview"
                                sandbox="allow-same-origin"
                              />
                            </div>
                          ) : (
                            <div className="whitespace-pre-wrap text-sm leading-relaxed p-4">
                              {renderTemplateContent(template.body, selectedProperties[0] || {}, channel)}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center gap-4">
                            {channel === 'sms' && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                ~{renderTemplateContent(template.body, selectedProperties[0] || {}, channel).length} characters
                              </span>
                            )}
                            {channel === 'email' && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                HTML email with professional formatting
                              </span>
                            )}
                            {channel === 'call' && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                Voicemail message for unanswered calls
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {selectedProperties.length > 0 ? 'Personalized' : 'Sample Data'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Launch Alert */}
            <Alert className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <Rocket className="h-5 w-5 text-blue-600" />
              <AlertDescription className="text-base">
                <div className="space-y-2">
                  <div className="font-semibold text-blue-900">
                    Campaign Ready for Launch! 🚀
                  </div>
                  <div className="text-blue-800">
                    This campaign will reach <strong>{selectedProperties.length} properties</strong> using{' '}
                    <strong>{selectedTemplate?.channels.length} communication channels</strong>.
                    Expected success rate: <strong className="text-green-600">{selectedTemplate?.successRate}</strong>.
                  </div>
                  <div className="text-sm text-blue-700 mt-2">
                    💡 Tip: Make sure your marketing API is configured and you have sufficient credits before proceeding.
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 mb-4">
                <Eye className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Campaign Preview
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Review your campaign before sending
              </p>
            </div>

            {/* Target Audience Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedProperties.length}</div>
                  <div className="text-sm text-gray-600">Total Properties</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedProperties.filter(p => p.approval_status === 'approved').length}
                  </div>
                  <div className="text-sm text-gray-600">Approved</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {selectedProperties.reduce((total, p) => total + getPreferredPhones(p).length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Preferred Phones</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedProperties.reduce((total, p) => total + getPreferredEmails(p).length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Preferred Emails</div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-blue-600" />
                    Phone Contact Breakdown
                  </CardTitle>
                  <CardDescription>Distribution of phone numbers across contact sources</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium">Primary Phones</span>
                      <Badge className="bg-blue-100 text-blue-700">
                        {selectedProperties.filter(p => p.owner_phone).length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium">Preferred Phones</span>
                      <Badge className="bg-green-100 text-green-700">
                        {selectedProperties.reduce((total, p) => total + getPreferredPhones(p).length, 0)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="font-medium">Skip Tracing Phones</span>
                      <Badge className="bg-purple-100 text-purple-700">
                        0
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg border-2 border-blue-300">
                      <span className="font-bold text-blue-700">Total Phone Contacts</span>
                      <Badge className="bg-blue-600 text-white font-bold">
                        {selectedProperties.reduce((total, p) => {
                          let count = p.owner_phone ? 1 : 0;
                          count += getPreferredPhones(p).length;
                          return total + count;
                        }, 0)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-green-600" />
                    Email Contact Breakdown
                  </CardTitle>
                  <CardDescription>Distribution of email addresses across contact sources</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium">Primary Emails</span>
                      <Badge className="bg-green-100 text-green-700">
                        {selectedProperties.filter(p => p.owner_email).length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="font-medium">Preferred Emails</span>
                      <Badge className="bg-yellow-100 text-yellow-700">
                        {selectedProperties.reduce((total, p) => total + getPreferredEmails(p).length, 0)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="font-medium">Skip Tracing Emails</span>
                      <Badge className="bg-purple-100 text-purple-700">
                        0
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-lg border-2 border-green-300">
                      <span className="font-bold text-green-700">Total Email Contacts</span>
                      <Badge className="bg-green-600 text-white font-bold">
                        {selectedProperties.reduce((total, p) => {
                          let count = (p.owner_email || p.email1) ? 1 : 0;
                          count += getPreferredEmails(p).length;
                          return total + count;
                        }, 0)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Campaign Stats */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Campaign Stats
                </CardTitle>
                <CardDescription>Template: {selectedTemplate?.name} | Channels: {selectedTemplate?.channels.join(', ')} | Expected Success: {selectedTemplate?.successRate}</CardDescription>
              </CardHeader>
            </Card>

            {/* Message Content Preview */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  Message Content Preview
                </CardTitle>
                <CardDescription>
                  Preview of actual messages that will be sent to recipients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {selectedProperties.length > 0 ? `${currentPreviewIndex + 1} / ${selectedProperties.length}` : 'No properties selected'}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPreviewIndex === 0}
                        onClick={() => setCurrentPreviewIndex(prev => Math.max(0, prev - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPreviewIndex >= selectedProperties.length - 1}
                        onClick={() => setCurrentPreviewIndex(prev => Math.min(selectedProperties.length - 1, prev + 1))}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Current Property Preview */}
                  {selectedProperties.length > 0 && (
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="font-semibold text-blue-900">
                          Previewing: {selectedProperties[currentPreviewIndex].address}
                        </div>
                        <div className="text-sm text-blue-700 mt-1">
                          {selectedProperties[currentPreviewIndex].city}, {selectedProperties[currentPreviewIndex].state} {selectedProperties[currentPreviewIndex].zip_code}
                        </div>
                      </div>

                      {/* Message Previews by Channel */}
                      <div className="grid gap-6">
                        {selectedTemplate?.channels.map((channel) => {
                          const template = getDefaultTemplateForChannel(channel);
                          if (!template) return null;

                          const currentProperty = selectedProperties[currentPreviewIndex];

                          return (
                            <div key={channel} className="border rounded-lg p-6 bg-gradient-to-br from-white to-gray-50">
                              <div className="flex items-center gap-2 mb-4">
                                {channel === 'sms' && <MessageSquare className="h-5 w-5 text-blue-500" />}
                                {channel === 'email' && <Mail className="h-5 w-5 text-green-500" />}
                                {channel === 'call' && <Phone className="h-5 w-5 text-purple-500" />}
                                <span className="text-lg font-semibold capitalize">{channel} Message</span>
                                <Badge variant="outline" className="ml-auto">{template.name}</Badge>
                              </div>

                              <div className="bg-white p-4 rounded-lg border shadow-sm">
                                {channel === 'email' && template.subject && (
                                  <div className="font-medium text-gray-900 mb-3 border-b pb-2">
                                    📧 Subject: {renderTemplateContent(template.subject, currentProperty, channel)}
                                  </div>
                                )}
                                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                  {renderTemplateContent(template.body, currentProperty, channel)}
                                </div>
                              </div>

                              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                                <div className="flex items-center gap-4">
                                  {channel === 'sms' && (
                                    <span className="flex items-center gap-1">
                                      <MessageSquare className="h-4 w-4" />
                                      ~{renderTemplateContent(template.body, currentProperty, channel).length} characters
                                    </span>
                                  )}
                                  {channel === 'email' && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-4 w-4" />
                                      HTML email with professional formatting
                                    </span>
                                  )}
                                  {channel === 'call' && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-4 w-4" />
                                      Voicemail message for unanswered calls
                                    </span>
                                  )}
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  Personalized for this property
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Campaign Summary & Validation */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Campaign Summary & Validation
                </CardTitle>
                <CardDescription>Final checklist before sending your campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium">Template</div>
                          <div className="text-sm text-gray-600">Name: {selectedTemplate?.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium">Channel</div>
                          <div className="text-sm text-gray-600">{selectedTemplate?.channels.join(', ')}</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium">Recipients</div>
                          <div className="text-sm text-gray-600">Total Selected: {selectedProperties.length}</div>
                        </div>
                      </div>
                      <div className={`flex items-center gap-3 p-3 bg-white rounded-lg border ${
                        selectedProperties.some(p =>
                          hasPreferredContacts(p) ||
                          p.owner_phone ||
                          p.owner_email ||
                          p.email1
                        ) ? 'border-green-200' : 'border-amber-200'
                      }`}>
                        {selectedProperties.some(p =>
                          hasPreferredContacts(p) ||
                          p.owner_phone ||
                          p.owner_email ||
                          p.email1
                        ) ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                        )}
                        <div>
                          <div className="font-medium">With Contact</div>
                          <div className="text-sm text-gray-600">
                            {selectedProperties.filter(p =>
                              hasPreferredContacts(p) ||
                              p.owner_phone ||
                              p.owner_email ||
                              p.email1
                            ).length} / {selectedProperties.length}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedProperties.some(p =>
                    !(hasPreferredContacts(p) ||
                      p.owner_phone ||
                      p.owner_email ||
                      p.email1)
                  ) && (
                    <Alert className="border-amber-200 bg-amber-50">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        <strong>Warning:</strong> {selectedProperties.filter(p =>
                          !(hasPreferredContacts(p) ||
                            p.owner_phone ||
                            p.owner_email ||
                            p.email1)
                        ).length} propriedades sem contato
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="text-center pt-4">
                    <div className="text-sm text-gray-600 mb-4">
                      Campaign ready to send
                    </div>
                    <div className="flex justify-center gap-4">
                      <Button variant="outline" onClick={() => setCurrentStep('configure')}>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Voltar
                      </Button>
                      <Button onClick={() => setCurrentStep('send')} className="bg-green-600 hover:bg-green-700">
                        Próximo
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Passo 4 de 5
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'send':
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 mb-6 animate-pulse">
                <Rocket className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Ready to Launch! 🚀
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Your campaign is fully configured and ready to reach your target audience
              </p>
            </div>

            {/* Campaign Success Prediction */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 text-center">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-2">{selectedTemplate?.successRate}</div>
                  <div className="text-sm font-medium text-green-700">Expected Success Rate</div>
                  <div className="text-xs text-green-600 mt-1">Based on campaign type</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-center">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {selectedProperties.reduce((total, p) => {
                      return total + getTotalContacts(p);
                    }, 0)}
                  </div>
                  <div className="text-sm font-medium text-blue-700">Total Contacts</div>
                  <div className="text-xs text-blue-600 mt-1">Across all channels</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50 text-center">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-4">
                    <Zap className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">{selectedTemplate?.estimatedCost}</div>
                  <div className="text-sm font-medium text-purple-700">Estimated Cost</div>
                  <div className="text-xs text-purple-600 mt-1">Per contact pricing</div>
                </CardContent>
              </Card>
            </div>

            {/* Campaign Summary Card */}
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 mb-4">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Campaign Summary</h3>
                    <p className="text-gray-600 text-lg">
                      <span className="font-semibold text-green-600">{selectedTemplate?.name}</span> targeting{' '}
                      <span className="font-semibold text-blue-600">{selectedProperties.length} properties</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                      <div className="text-3xl font-bold text-blue-600 mb-2">{selectedProperties.length}</div>
                      <div className="text-sm font-medium text-gray-600 mb-1">Target Properties</div>
                      <div className="text-xs text-gray-500">Properties selected for outreach</div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                      <div className="text-3xl font-bold text-purple-600 mb-2">{selectedTemplate?.channels.length}</div>
                      <div className="text-sm font-medium text-gray-600 mb-1">Communication Channels</div>
                      <div className="text-xs text-gray-500">Multi-channel approach</div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                      <div className="text-3xl font-bold text-green-600 mb-2">{selectedTemplate?.successRate}</div>
                      <div className="text-sm font-medium text-gray-600 mb-1">Expected Success Rate</div>
                      <div className="text-xs text-gray-500">Based on historical data</div>
                    </div>
                  </div>

                  {/* Campaign Details */}
                  <div className="bg-white p-6 rounded-xl border shadow-sm mt-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Campaign Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Template:</span>
                        <span className="font-medium text-gray-900">{selectedTemplate?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Channels:</span>
                        <span className="font-medium text-gray-900">{selectedTemplate?.channels.join(', ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Approved Properties:</span>
                        <span className="font-medium text-green-600">
                          {selectedProperties.filter(p => p.approval_status === 'approved').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contact Quality:</span>
                        <span className="font-medium text-blue-600">
                          {selectedProperties.filter(p => hasPreferredContacts(p)).length} high-quality
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievement Badges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardContent className="p-4 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 mb-3">
                    <Star className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="font-semibold text-yellow-800">Campaign Optimized</div>
                  <div className="text-sm text-yellow-700">Using preferred contacts</div>
                </CardContent>
              </Card>

              <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-4 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mb-3">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="font-semibold text-blue-800">Quality Assured</div>
                  <div className="text-sm text-blue-700">Approved properties only</div>
                </CardContent>
              </Card>

              <Card className="border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <CardContent className="p-4 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mb-3">
                    <Heart className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="font-semibold text-green-800">Personalized</div>
                  <div className="text-sm text-green-700">Property-specific offers</div>
                </CardContent>
              </Card>
            </div>

            {/* Final Launch Alert */}
            <Alert className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-base">
                <div className="space-y-3">
                  <div className="font-bold text-green-900 text-lg">
                    🎯 Campaign Ready for Launch!
                  </div>
                  <div className="text-green-800">
                    Everything looks perfect! Your campaign is configured with the best practices and ready to reach your target audience.
                    Click "Launch Campaign" to start your outreach.
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-green-200 mt-4">
                    <div className="text-sm text-green-700">
                      <strong>💡 Pro Tip:</strong> Monitor your campaign performance in the Analytics dashboard after launch to track opens, clicks, and conversions in real-time.
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Enhanced Header */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full">
                <Rocket className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Campaign Creator
              </h1>
              <p className="text-gray-600 text-lg mt-2">
                Create and launch marketing campaigns step by step
              </p>
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="flex items-center gap-2 bg-white p-4 rounded-2xl shadow-lg border">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-500 ${
                      index < currentStepIndex
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                        : index === currentStepIndex
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 animate-pulse'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {index < currentStepIndex ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <step.icon className="h-6 w-6" />
                      )}

                      {/* Step number overlay for current step */}
                      {index === currentStepIndex && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
                          <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                        </div>
                      )}
                    </div>

                    {/* Connector line */}
                    {index < steps.length - 1 && (
                      <div className={`w-16 h-1 mx-4 rounded-full transition-all duration-500 ${
                        index < currentStepIndex
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                          : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Progress text and percentage */}
            <div className="text-center space-y-2">
              <div className="text-sm font-medium text-gray-600">
                Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex].title}
              </div>
              <div className="w-full max-w-md mx-auto">
                <Progress
                  value={(currentStepIndex + 1) / steps.length * 100}
                  className="h-3 bg-gray-200"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round((currentStepIndex + 1) / steps.length * 100)}% Complete
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Card className="min-h-[700px] border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Enhanced Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={() => {
              const prevIndex = Math.max(0, currentStepIndex - 1);
              setCurrentStep(steps[prevIndex].id as WizardStep);
            }}
            disabled={currentStepIndex === 0}
            className="hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-4">
            {/* Current step indicator */}
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
              <div className={`w-2 h-2 rounded-full ${
                currentStepIndex === 0 ? 'bg-blue-500' :
                currentStepIndex === 1 ? 'bg-green-500' :
                currentStepIndex === 2 ? 'bg-purple-500' :
                currentStepIndex === 3 ? 'bg-pink-500' : 'bg-gray-500'
              }`} />
              <span>{steps[currentStepIndex].title}</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
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
                }}
                className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200"
              >
                <Crown className="h-4 w-4 mr-2" />
                Start Over
              </Button>

              {currentStep === 'send' ? (
                <Button
                  onClick={handleSendCampaign}
                  disabled={isSending}
                  className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-105"
                  size="lg"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Launching Campaign...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-5 w-5" />
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
                  className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105"
                  size="lg"
                >
                  Next Step
                  <ChevronRight className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
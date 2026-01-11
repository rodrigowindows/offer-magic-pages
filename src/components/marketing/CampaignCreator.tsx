/**
 * Campaign Creator - Step-by-step campaign creation wizard
 * Modern wizard interface for creating and launching marketing campaigns
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, AlertTriangle, Zap, Shield, TestTube, Copy, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Rocket,
  MessageSquare,
  Mail,
  Phone,
  AlertCircle,
  Filter,
  Send,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Target,
  Settings,
  RefreshCw,
  FileText,
  Play,
  QrCode,
  Link,
  BarChart3,
} from 'lucide-react';
import { sendSMS, sendEmail, initiateCall } from '@/services/marketingService';
import { useMarketingStore } from '@/store/marketingStore';
import { useTemplates } from '@/hooks/useTemplates';
import type { SavedTemplate, Channel } from '@/types/marketing.types';
import type { Property } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

type WizardStep = 'template' | 'properties' | 'configure' | 'preview' | 'send';

interface CampaignConfig {
  template: SavedTemplate | null;
  properties: Property[];
  channels: Channel[];
  trackingId: string;
  phoneColumns: string[];
  emailColumns: string[];
  scheduleDate?: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  maxContactsPerProperty: number;
  testMode: boolean;
  complianceCheck: boolean;
}

export default function CampaignCreator() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('template');
  const [campaignConfig, setCampaignConfig] = useState<CampaignConfig>({
    template: null,
    properties: [],
    channels: [],
    trackingId: '',
    phoneColumns: ['preferred_phones', 'phone1', 'phone2', 'skip_tracing_phones'],
    emailColumns: ['preferred_emails', 'email1', 'email2', 'skip_tracing_emails'],
    priority: 'normal',
    maxContactsPerProperty: 1,
    testMode: false,
    complianceCheck: true,
  });
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<{success: number, failed: number} | null>(null);
  const [propertiesList, setPropertiesList] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Load properties from database
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('approval_status', 'approved')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading properties:', error);
          toast({
            title: 'Erro ao carregar propriedades',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          setPropertiesList(data || []);
        }
      } catch (error) {
        console.error('Error loading properties:', error);
        toast({
          title: 'Erro ao carregar propriedades',
          description: 'Não foi possível carregar as propriedades.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [toast]);
  const { templates } = useTemplates();
  const { settings } = useMarketingStore();

  const steps = [
    { id: 'template', title: 'Choose Template', icon: FileText },
    { id: 'properties', title: 'Select Properties', icon: Target },
    { id: 'configure', title: 'Configure', icon: Settings },
    { id: 'preview', title: 'Preview', icon: Eye },
    { id: 'send', title: 'Send Campaign', icon: Send },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  // Generate tracking ID
  useEffect(() => {
    if (!campaignConfig.trackingId) {
      const trackingId = `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCampaignConfig(prev => ({ ...prev, trackingId }));
    }
  }, [campaignConfig.trackingId]);

  const getSelectedProperties = () => {
    return propertiesList.filter(prop => selectedPropertyIds.includes(prop.id));
  };

  const getAllPhones = (property: Property): string[] => {
    const phones: string[] = [];

    // Preferred phones first (from skip tracing data)
    if (property.skip_tracing_data?.preferred_phones) {
      phones.push(...property.skip_tracing_data.preferred_phones);
    }

    // Preferred phones from direct fields
    if (property.preferred_phone) phones.push(property.preferred_phone);
    if (property.preferred_phone_2) phones.push(property.preferred_phone_2);

    // Primary phones
    if (property.phone) phones.push(property.phone);
    if (property.phone_2) phones.push(property.phone_2);

    // Skip tracing phones (additional ones)
    if (property.skip_tracing_phone) phones.push(property.skip_tracing_phone);
    if (property.skip_tracing_phone_2) phones.push(property.skip_tracing_phone_2);

    return [...new Set(phones)]; // Remove duplicates
  };

  const getAllEmails = (property: Property): string[] => {
    const emails: string[] = [];

    // Preferred emails first (from skip tracing data)
    if (property.skip_tracing_data?.preferred_emails) {
      emails.push(...property.skip_tracing_data.preferred_emails);
    }

    // Preferred emails from direct fields
    if (property.preferred_email) emails.push(property.preferred_email);
    if (property.preferred_email_2) emails.push(property.preferred_email_2);

    // Primary emails
    if (property.email) emails.push(property.email);
    if (property.email_2) emails.push(property.email_2);

    // Skip tracing emails (additional ones)
    if (property.skip_tracing_email) emails.push(property.skip_tracing_email);
    if (property.skip_tracing_email_2) emails.push(property.skip_tracing_email_2);

    return [...new Set(emails)]; // Remove duplicates
  };

  const generateTemplateContent = (template: SavedTemplate, property: Property) => {
    let content = template.body || template.message_template || '';
    let subject = template.subject || '';

    // Generate property URL with tracking
    const propertyUrl = `${settings.company.website}/property/${property.id}?source=${campaignConfig.channels.join(',')}&tracking=${campaignConfig.trackingId}`;

    // Generate QR code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(propertyUrl)}`;

    // Replace variables
    const replacements = {
      '{name}': property.owner_name || 'Owner',
      '{address}': property.address,
      '{city}': property.city,
      '{state}': property.state,
      '{zip_code}': property.zip_code,
      '{cash_offer}': property.cash_offer_amount ? `$${property.cash_offer_amount.toLocaleString()}` : '$XXX,XXX',
      '{property_url}': propertyUrl,
      '{qr_code_url}': qrCodeUrl,
      '{phone}': settings.company.contact_phone,
      '{company_name}': settings.company.company_name,
      '{seller_name}': settings.company.company_name,
      '{source_channel}': campaignConfig.channels.join(','),
    };

    Object.entries(replacements).forEach(([key, value]) => {
      content = content.replace(new RegExp(key, 'g'), value);
      subject = subject.replace(new RegExp(key, 'g'), value);
    });

    return { content, subject };
  };

  const getContactStats = () => {
    const selectedProps = getSelectedProperties();
    let preferredPhones = 0, primaryPhones = 0, skipPhones = 0;
    let preferredEmails = 0, primaryEmails = 0, skipEmails = 0;

    selectedProps.forEach(prop => {
      const allPhones = getAllPhones(prop);
      const allEmails = getAllEmails(prop);

      // Count phones by source
      const preferredPhoneCount = (prop.skip_tracing_data?.preferred_phones?.length || 0) +
                                 (prop.preferred_phone ? 1 : 0) +
                                 (prop.preferred_phone_2 ? 1 : 0);
      const primaryPhoneCount = (prop.phone ? 1 : 0) + (prop.phone_2 ? 1 : 0);
      const skipPhoneCount = (prop.skip_tracing_phone ? 1 : 0) +
                            (prop.skip_tracing_phone_2 ? 1 : 0) +
                            ((prop.skip_tracing_data?.preferred_phones?.length || 0) - (preferredPhoneCount - (prop.preferred_phone ? 1 : 0) - (prop.preferred_phone_2 ? 1 : 0)));

      // Count emails by source
      const preferredEmailCount = (prop.skip_tracing_data?.preferred_emails?.length || 0) +
                                 (prop.preferred_email ? 1 : 0) +
                                 (prop.preferred_email_2 ? 1 : 0);
      const primaryEmailCount = (prop.email ? 1 : 0) + (prop.email_2 ? 1 : 0);
      const skipEmailCount = (prop.skip_tracing_email ? 1 : 0) +
                            (prop.skip_tracing_email_2 ? 1 : 0) +
                            ((prop.skip_tracing_data?.preferred_emails?.length || 0) - (preferredEmailCount - (prop.preferred_email ? 1 : 0) - (prop.preferred_email_2 ? 1 : 0)));

      preferredPhones += preferredPhoneCount > 0 ? 1 : 0; // Count properties with preferred phones
      primaryPhones += primaryPhoneCount > 0 ? 1 : 0; // Count properties with primary phones
      skipPhones += skipPhoneCount > 0 ? 1 : 0; // Count properties with skip tracing phones
      preferredEmails += preferredEmailCount > 0 ? 1 : 0; // Count properties with preferred emails
      primaryEmails += primaryEmailCount > 0 ? 1 : 0; // Count properties with primary emails
      skipEmails += skipEmailCount > 0 ? 1 : 0; // Count properties with skip tracing emails
    });

    return {
      totalProperties: selectedProps.length,
      preferredPhones,
      primaryPhones,
      skipPhones,
      totalPhones: selectedProps.reduce((sum, prop) => sum + getAllPhones(prop).length, 0),
      preferredEmails,
      primaryEmails,
      skipEmails,
      totalEmails: selectedProps.reduce((sum, prop) => sum + getAllEmails(prop).length, 0),
    };
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id as WizardStep);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id as WizardStep);
    }
  };

  const handleTemplateSelect = (template: SavedTemplate) => {
    setCampaignConfig(prev => ({ ...prev, template }));
  };

  const handlePropertyToggle = (propertyId: string) => {
    setSelectedPropertyIds(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleChannelToggle = (channel: Channel) => {
    setCampaignConfig(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  const handleSendCampaign = async () => {
    const selectedProps = getSelectedProperties();
    setSending(true);
    setSendResults(null);

    let successCount = 0;
    let failCount = 0;

    // Log campaign start
    await supabase.from('campaign_logs').insert({
      campaign_id: campaignConfig.trackingId,
      template_id: campaignConfig.template?.id,
      channels: campaignConfig.channels,
      total_properties: selectedProps.length,
      status: 'started',
      metadata: {
        template_name: campaignConfig.template?.name,
        channels: campaignConfig.channels,
        tracking_id: campaignConfig.trackingId,
      }
    });

    for (const prop of selectedProps) {
      try {
        const fullAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;
        const allPhones = getAllPhones(prop);
        const allEmails = getAllEmails(prop);

        let sent = false;
        let lastError: any = null;

        if (campaignConfig.channels.includes('sms') && allPhones.length > 0) {
          const { content } = generateTemplateContent(campaignConfig.template!, prop);

          for (const phone of allPhones) {
            try {
              await sendSMS({
                phone_number: phone,
                body: content,
              });
              sent = true;

              // Log individual send
              await supabase.from('campaign_logs').insert({
                campaign_id: campaignConfig.trackingId,
                property_id: prop.id,
                channel: 'sms',
                contact_info: phone,
                status: 'sent',
                template_content: content,
                metadata: {
                  template_name: campaignConfig.template?.name,
                  property_address: fullAddress,
                  contact_type: 'phone',
                }
              });

              break;
            } catch (error) {
              lastError = error;
            }
          }
        }

        if (campaignConfig.channels.includes('email') && allEmails.length > 0) {
          const { content, subject } = generateTemplateContent(campaignConfig.template!, prop);

          for (const email of allEmails) {
            try {
              await sendEmail({
                receiver_email: email,
                subject: subject,
                message_body: content,
              });
              sent = true;

              // Log individual send
              await supabase.from('campaign_logs').insert({
                campaign_id: campaignConfig.trackingId,
                property_id: prop.id,
                channel: 'email',
                contact_info: email,
                status: 'sent',
                template_content: content,
                metadata: {
                  template_name: campaignConfig.template?.name,
                  property_address: fullAddress,
                  contact_type: 'email',
                  subject: subject,
                }
              });

              break;
            } catch (error) {
              lastError = error;
            }
          }
        }

        if (campaignConfig.channels.includes('call') && allPhones.length > 0) {
          const { content } = generateTemplateContent(campaignConfig.template!, prop);

          for (const phone of allPhones) {
            try {
              await initiateCall({
                name: prop.owner_name || 'Owner',
                address: fullAddress,
                from_number: settings.company.contact_phone,
                to_number: phone,
                voicemail_drop: content,
                seller_name: settings.company.company_name,
              });
              sent = true;

              // Log individual send
              await supabase.from('campaign_logs').insert({
                campaign_id: campaignConfig.trackingId,
                property_id: prop.id,
                channel: 'call',
                contact_info: phone,
                status: 'sent',
                template_content: content,
                metadata: {
                  template_name: campaignConfig.template?.name,
                  property_address: fullAddress,
                  contact_type: 'phone',
                }
              });

              break;
            } catch (error) {
              lastError = error;
            }
          }
        }

        if (sent) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error: any) {
        console.error(`Error sending to ${prop.id}:`, error);
        failCount++;
      }
    }

    // Log campaign completion
    await supabase.from('campaign_logs').insert({
      campaign_id: campaignConfig.trackingId,
      status: 'completed',
      metadata: {
        success_count: successCount,
        fail_count: failCount,
        total_sent: successCount + failCount,
      }
    });

    setSending(false);
    setSendResults({ success: successCount, failed: failCount });
    setShowSendDialog(false);

    toast({
      title: 'Campanha Finalizada',
      description: `✅ ${successCount} enviados com sucesso, ❌ ${failCount} falharam`,
      variant: successCount > 0 ? 'default' : 'destructive',
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'template':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Choose Template</h2>
              <p className="text-muted-foreground">Select a template for your campaign</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    campaignConfig.template?.id === template.id
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {template.name}
                    </CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">{template.channel}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'properties':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Select Properties</h2>
              <p className="text-muted-foreground">Choose properties to include in your campaign</p>
            </div>

            {/* Resumo dinâmico */}
            {!loading && (
              <div className="flex flex-wrap gap-4 items-center justify-between border-b pb-2 mb-2">
                <div className="text-sm text-muted-foreground">
                  Selecionados: <span className="font-semibold">{selectedPropertyIds.length}</span> |
                  Com telefone: <span className="font-semibold">{properties.filter(p => getAllPhones(p).length > 0).length}</span> |
                  Com email: <span className="font-semibold">{properties.filter(p => getAllEmails(p).length > 0).length}</span>
                </div>
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading properties...</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-96">
              <div className="space-y-2">
                {properties.map((property) => (
                  <Card key={property.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedPropertyIds.includes(property.id)}
                        onCheckedChange={() => handlePropertyToggle(property.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{property.address}</div>
                        <div className="text-sm text-muted-foreground">
                          {property.city}, {property.state} {property.zip_code}
                        </div>
                        <div className="flex gap-2 mt-2">
                          {getAllPhones(property).length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Phone className="w-3 h-3 mr-1" />
                              {getAllPhones(property).length} phones
                            </Badge>
                          )}
                          {getAllEmails(property).length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Mail className="w-3 h-3 mr-1" />
                              {getAllEmails(property).length} emails
                            </Badge>
                          )}
                          {property.cash_offer_amount && (
                            <Badge variant="default" className="text-xs">
                              ${property.cash_offer_amount.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                        {/* Contatos detalhados */}
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2 text-xs text-gray-700">
                            <Phone className="w-3 h-3" />
                            {getAllPhones(property).length > 0
                              ? getAllPhones(property).map((phone, idx) => (
                                  <TooltipProvider key={idx}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="mr-2 flex items-center gap-1 cursor-pointer group">
                                          {phone}
                                          <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100 hover:text-blue-600" onClick={() => navigator.clipboard.writeText(phone)} />
                                          <Info className="w-3 h-3 opacity-60" />
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <span>Origem: {phone.includes('skip') ? 'Skip tracing' : 'Principal/Preferencial'}</span>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ))
                              : <Badge variant="destructive" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" />Sem telefone</Badge>
                            }
                            <Button size="sm" variant="ghost" className="ml-2 px-2 py-0 h-6">Editar</Button>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-700">
                            <Mail className="w-3 h-3" />
                            {getAllEmails(property).length > 0
                              ? getAllEmails(property).map((email, idx) => (
                                  <TooltipProvider key={idx}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="mr-2 flex items-center gap-1 cursor-pointer group">
                                          {email}
                                          <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100 hover:text-blue-600" onClick={() => navigator.clipboard.writeText(email)} />
                                          <Info className="w-3 h-3 opacity-60" />
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <span>Origem: {email.includes('skip') ? 'Skip tracing' : 'Principal/Preferencial'}</span>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ))
                              : <Badge variant="destructive" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" />Sem email</Badge>
                            }
                            <Button size="sm" variant="ghost" className="ml-2 px-2 py-0 h-6">Editar</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
            )}
          </div>
        );

      case 'configure':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Configure Campaign</h2>
              <p className="text-muted-foreground">Choose communication channels</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Communication Channels</CardTitle>
                <CardDescription>Select how you want to reach your audience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card
                    className={`cursor-pointer transition-all ${
                      campaignConfig.channels.includes('sms')
                        ? 'ring-2 ring-primary border-primary'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handleChannelToggle('sms')}
                  >
                    <CardContent className="p-4 text-center">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                      <div className="font-medium">SMS</div>
                      <div className="text-sm text-muted-foreground">Text messages</div>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all ${
                      campaignConfig.channels.includes('email')
                        ? 'ring-2 ring-primary border-primary'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handleChannelToggle('email')}
                  >
                    <CardContent className="p-4 text-center">
                      <Mail className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <div className="font-medium">Email</div>
                      <div className="text-sm text-muted-foreground">Email messages</div>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all ${
                      campaignConfig.channels.includes('call')
                        ? 'ring-2 ring-primary border-primary'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handleChannelToggle('call')}
                  >
                    <CardContent className="p-4 text-center">
                      <Phone className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                      <div className="font-medium">Call</div>
                      <div className="text-sm text-muted-foreground">Phone calls</div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Phone Column Selection */}
            {(campaignConfig.channels.includes('sms') || campaignConfig.channels.includes('call')) && (
              <Card>
                <CardHeader>
                  <CardTitle>Phone Contact Settings</CardTitle>
                  <CardDescription>Select which phone columns to use for SMS and calls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Phone Columns</Label>
                      <div className="space-y-2">
                        {[
                          { value: 'preferred_phones', label: 'Preferred Phones (Skip Tracing)' },
                          { value: 'phone1', label: 'Phone 1 (Principal)' },
                          { value: 'phone2', label: 'Phone 2' },
                          { value: 'skip_tracing_phones', label: 'Skip Tracing Phones' },
                        ].map((column) => (
                          <div key={column.value} className="flex items-center space-x-2">
                            <Checkbox
                              checked={campaignConfig.phoneColumns.includes(column.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setCampaignConfig(prev => ({
                                    ...prev,
                                    phoneColumns: [...prev.phoneColumns, column.value]
                                  }));
                                } else {
                                  setCampaignConfig(prev => ({
                                    ...prev,
                                    phoneColumns: prev.phoneColumns.filter(c => c !== column.value)
                                  }));
                                }
                              }}
                            />
                            <Label className="text-sm">{column.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {(campaignConfig.channels.includes('email')) && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Email Columns</Label>
                        <div className="space-y-2">
                          {[
                            { value: 'preferred_emails', label: 'Preferred Emails (Skip Tracing)' },
                            { value: 'email1', label: 'Email 1 (Principal)' },
                            { value: 'email2', label: 'Email 2' },
                            { value: 'skip_tracing_emails', label: 'Skip Tracing Emails' },
                          ].map((column) => (
                            <div key={column.value} className="flex items-center space-x-2">
                              <Checkbox
                                checked={campaignConfig.emailColumns.includes(column.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setCampaignConfig(prev => ({
                                      ...prev,
                                      emailColumns: [...prev.emailColumns, column.value]
                                    }));
                                  } else {
                                    setCampaignConfig(prev => ({
                                      ...prev,
                                      emailColumns: prev.emailColumns.filter(c => c !== column.value)
                                    }));
                                  }
                                }}
                              />
                              <Label className="text-sm">{column.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Advanced Settings
                </CardTitle>
                <CardDescription>Configure sending behavior and compliance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Priority & Contact Limits */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Campaign Priority</Label>
                      <Select
                        value={campaignConfig.priority}
                        onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') =>
                          setCampaignConfig(prev => ({ ...prev, priority: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                              Low Priority
                            </div>
                          </SelectItem>
                          <SelectItem value="normal">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              Normal Priority
                            </div>
                          </SelectItem>
                          <SelectItem value="high">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                              High Priority
                            </div>
                          </SelectItem>
                          <SelectItem value="urgent">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              Urgent Priority
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Max Contacts per Property</Label>
                      <Select
                        value={campaignConfig.maxContactsPerProperty.toString()}
                        onValueChange={(value) =>
                          setCampaignConfig(prev => ({ ...prev, maxContactsPerProperty: parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 contact (Recommended)</SelectItem>
                          <SelectItem value="2">2 contacts</SelectItem>
                          <SelectItem value="3">3 contacts</SelectItem>
                          <SelectItem value="5">5 contacts (Aggressive)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Compliance & Testing */}
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={campaignConfig.testMode}
                          onCheckedChange={(checked) =>
                            setCampaignConfig(prev => ({ ...prev, testMode: Boolean(checked) }))
                          }
                        />
                        <div className="flex items-center gap-2">
                          <TestTube className="w-4 h-4 text-blue-500" />
                          <Label className="text-sm">Test Mode (No actual sending)</Label>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={campaignConfig.complianceCheck}
                          onCheckedChange={(checked) =>
                            setCampaignConfig(prev => ({ ...prev, complianceCheck: Boolean(checked) }))
                          }
                        />
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-green-500" />
                          <Label className="text-sm">Compliance Check</Label>
                        </div>
                      </div>
                    </div>

                    {campaignConfig.testMode && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Test mode enabled. Messages will be logged but not actually sent.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Template:</Label>
                    <div className="font-medium">{campaignConfig.template?.name || 'None selected'}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Channel:</Label>
                    <div className="font-medium">{campaignConfig.channels.join(', ') || 'None selected'}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Properties:</Label>
                    <div className="font-medium">{getSelectedProperties().length}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Mode:</Label>
                    <div className="font-medium">Production</div>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-sm text-muted-foreground">
                    URL: https://offer.mylocalinvest.com/marketing/campaigns
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'preview':
        const stats = getContactStats();
        const sampleProperty = getSelectedProperties()[0];

        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Campaign Preview</h2>
              <p className="text-muted-foreground">Review your campaign before sending</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Target Audience */}
              <Card className="bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg border-b">
                  <CardTitle className="flex items-center gap-3 text-gray-800">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    Target Audience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Properties:</span>
                    <Badge variant="secondary">{stats.totalProperties}</Badge>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Preferred Phones:</span>
                      <span>{stats.preferredPhones}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Primary Phones:</span>
                      <span>{stats.primaryPhones}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Skip Tracing Phones:</span>
                      <span>{stats.skipPhones}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total Phone Contacts:</span>
                      <span>{stats.totalPhones}</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Preferred Emails:</span>
                      <span>{stats.preferredEmails}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Primary Emails:</span>
                      <span>{stats.primaryEmails}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Skip Tracing Emails:</span>
                      <span>{stats.skipEmails}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total Email Contacts:</span>
                      <span>{stats.totalEmails}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Campaign Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Template:</span>
                    <span className="font-medium">{campaignConfig.template?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Channels:</span>
                    <div className="flex gap-1">
                      {campaignConfig.channels.map(channel => (
                        <Badge key={channel} variant="outline" className="text-xs">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Expected Success:</span>
                    <Badge variant="default">15-25%</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Cost & Delivery Estimation */}
              <Card className="bg-gradient-to-br from-white to-amber-50/30 border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-gray-800">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Zap className="w-5 h-5 text-amber-600" />
                    </div>
                    Cost & Delivery Estimate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        ${((stats.totalPhones * 0.02) + (stats.totalEmails * 0.01)).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">Estimated Cost</div>
                      <div className="flex justify-center gap-4 text-xs text-gray-500">
                        <span>{stats.totalPhones} SMS</span>
                        <span>{stats.totalEmails} Email</span>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {Math.ceil((stats.totalPhones + stats.totalEmails) / 50)} min
                      </div>
                      <div className="text-sm text-gray-600 mb-2">Delivery Time</div>
                      <div className="text-xs text-gray-500">~50 messages/minute</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Message Content Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Message Content Preview</CardTitle>
                <CardDescription>Preview of actual messages that will be sent to recipients</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sampleProperty && campaignConfig.template && (
                  <>
                    {campaignConfig.channels.includes('sms') && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <MessageSquare className="w-4 h-4" />
                          SMS Message
                        </div>
                        <div className="text-sm bg-gray-50 p-3 rounded border">
                          {generateTemplateContent(campaignConfig.template, sampleProperty).content}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ~{generateTemplateContent(campaignConfig.template, sampleProperty).content.length} characters
                        </div>
                      </div>
                    )}

                    {campaignConfig.channels.includes('call') && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Phone className="w-4 h-4" />
                          Call Message
                        </div>
                        <div className="text-sm bg-gray-50 p-3 rounded border">
                          {generateTemplateContent(campaignConfig.template, sampleProperty).content}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Voicemail message for unanswered calls
                        </div>
                      </div>
                    )}

                    {campaignConfig.channels.includes('email') && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Mail className="w-4 h-4" />
                          Email Message
                        </div>
                        <div className="text-sm bg-white p-4 rounded border space-y-3 border-gray-200">
                          <div className="font-medium text-gray-900 border-b pb-2">
                            Subject: {generateTemplateContent(campaignConfig.template, sampleProperty).subject}
                          </div>
                          <div
                            className="text-gray-800 leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: generateTemplateContent(campaignConfig.template, sampleProperty).content
                            }}
                          />
                          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                            <QrCode className="w-3 h-3" />
                            <Link className="w-3 h-3" />
                            QR Code and trackable links included
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          HTML email with professional formatting
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This campaign will be sent to {stats.totalProperties} properties using {campaignConfig.channels.length} communication channels.
                Make sure your marketing API is configured before proceeding.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'send':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Send Campaign</h2>
              <p className="text-muted-foreground">Launch your campaign to reach potential sellers</p>
            </div>

            <Card className="text-center">
              <CardContent className="p-8">
                <Rocket className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Ready to Launch!</h3>
                <p className="text-muted-foreground mb-6">
                  Your campaign is configured and ready to send to {getSelectedProperties().length} properties
                  via {campaignConfig.channels.join(', ')}.
                </p>

                {sendResults && (
                  <div className="mb-6 p-4 bg-muted rounded-lg">
                    <div className="flex justify-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{sendResults.success}</div>
                        <div className="text-sm text-muted-foreground">Success</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{sendResults.failed}</div>
                        <div className="text-sm text-muted-foreground">Failed</div>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  size="lg"
                  onClick={() => setShowSendDialog(true)}
                  disabled={sending || getSelectedProperties().length === 0}
                  className="w-full max-w-xs"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending Campaign...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Launch Campaign
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'template':
        return campaignConfig.template !== null;
      case 'properties':
        return selectedPropertyIds.length > 0;
      case 'configure':
        return campaignConfig.channels.length > 0;
      case 'preview':
        return true;
      case 'send':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-lg -z-10"></div>
        <div className="p-6">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Campaign Creator
          </h1>
          <p className="text-muted-foreground text-lg">Create and launch marketing campaigns step by step</p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card className="bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="relative">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStepIndex > index;

                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isCompleted
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                            : isActive
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg animate-pulse'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <Icon className="w-6 h-6" />
                        )}
                      </div>
                      <div className="text-xs mt-2 text-center max-w-20">
                        <div className={`font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                          {step.title}
                        </div>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-4 rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentStepIndex < steps.length - 1 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={() => setShowSendDialog(true)} disabled={!canProceed()}>
            <Send className="w-4 h-4 mr-2" />
            Send Campaign
          </Button>
        )}
      </div>

      {/* Send Confirmation Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Campaign Launch</DialogTitle>
            <DialogDescription>
              Are you ready to send this campaign to {getSelectedProperties().length} properties?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Template:</span>
                <div>{campaignConfig.template?.name}</div>
              </div>
              <div>
                <span className="font-medium">Channels:</span>
                <div>{campaignConfig.channels.join(', ')}</div>
              </div>
              <div>
                <span className="font-medium">Properties:</span>
                <div>{getSelectedProperties().length}</div>
              </div>
              <div>
                <span className="font-medium">Tracking ID:</span>
                <div className="font-mono text-xs">{campaignConfig.trackingId}</div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendCampaign} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Launch Campaign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
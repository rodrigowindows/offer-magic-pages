/**
 * Campaign Manager - Tela dedicada para criar e gerenciar campanhas
 * Fluxo claro: Selecionar Propriedades → Escolher Canal → Configurar → Enviar
 * Updated: 2026-01-08
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
import { Label } from '@/components/ui/label';
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
  Users,
  Target,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { sendSMS, sendEmail, initiateCall } from '@/services/marketingService';
import { useMarketingStore } from '@/store/marketingStore';
import { useTemplates } from '@/hooks/useTemplates';
import type { SavedTemplate, Channel } from '@/types/marketing.types';

// Colunas de telefone disponíveis na tabela properties
const PHONE_COLUMNS = [
  { value: 'phone1', label: 'Phone 1 (Principal)' },
  { value: 'phone2', label: 'Phone 2' },
  { value: 'phone3', label: 'Phone 3' },
  { value: 'phone4', label: 'Phone 4' },
  { value: 'phone5', label: 'Phone 5' },
  { value: 'phone6', label: 'Phone 6' },
  { value: 'phone7', label: 'Phone 7' },
  { value: 'owner_phone', label: 'Owner Phone' },
  { value: 'person2_phone1', label: 'Person 2 - Phone 1' },
  { value: 'person2_phone2', label: 'Person 2 - Phone 2' },
  { value: 'person3_phone1', label: 'Person 3 - Phone 1' },
];

// Colunas de email disponíveis na tabela properties
const EMAIL_COLUMNS = [
  { value: 'email1', label: 'Email 1 (Principal)' },
  { value: 'email2', label: 'Email 2' },
  { value: 'person2_email1', label: 'Person 2 - Email 1' },
  { value: 'person2_email2', label: 'Person 2 - Email 2' },
  { value: 'person3_email1', label: 'Person 3 - Email 1' },
  { value: 'person3_email2', label: 'Person 3 - Email 2' },
];

interface CampaignProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  owner_name?: string;
  cash_offer_amount?: number;
  approval_status?: string;
  tags?: string[];
  // Dynamic columns
  [key: string]: string | number | boolean | null | undefined | string[] | object;
}

export const CampaignManager = () => {
  const { toast } = useToast();
  const testMode = useMarketingStore((state) => state.settings.defaults.test_mode);
  const settings = useMarketingStore((state) => state.settings);
  const { templates, getTemplatesByChannel, getDefaultTemplate } = useTemplates();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // State
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [properties, setProperties] = useState<CampaignProperty[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel>('sms');
  const [filterStatus, setFilterStatus] = useState<string>('approved');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showSendPreview, setShowSendPreview] = useState(false);
  
  // Set default template when channel changes
  useEffect(() => {
    const defaultTemplate = getDefaultTemplate(selectedChannel);
    if (defaultTemplate) {
      setSelectedTemplateId(defaultTemplate.id);
    }
  }, [selectedChannel, getDefaultTemplate]);

  // Get selected template
  const selectedTemplate = selectedTemplateId 
    ? templates.find(t => t.id === selectedTemplateId) 
    : getDefaultTemplate(selectedChannel);

  // Helper function to render template preview
  const renderTemplatePreview = (prop: CampaignProperty, type: 'body' | 'subject' = 'body') => {
    if (!selectedTemplate) {
      return 'Selecione um template';
    }

    const fullAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;
    const propertyUrl = `https://offer.mylocalinvest.com/property/${prop.id}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(propertyUrl)}`;
    
    if (type === 'subject' && selectedTemplate.subject) {
      let subject = selectedTemplate.subject;
      subject = subject.replace(/\{address\}/g, prop.address);
      subject = subject.replace(/\{name\}/g, prop.owner_name || 'Owner');
      subject = subject.replace(/\{city\}/g, prop.city);
      subject = subject.replace(/\{state\}/g, prop.state);
      return subject;
    }

    // Replace template variables for body
    let content = selectedTemplate.body;
    content = content.replace(/\{name\}/g, prop.owner_name || 'Owner');
    content = content.replace(/\{address\}/g, prop.address);
    content = content.replace(/\{city\}/g, prop.city);
    content = content.replace(/\{state\}/g, prop.state);
    content = content.replace(/\{cash_offer\}/g, prop.cash_offer_amount?.toLocaleString() || '0');
    content = content.replace(/\{company_name\}/g, settings.company.company_name);
    content = content.replace(/\{phone\}/g, settings.company.contact_phone);
    content = content.replace(/\{seller_name\}/g, settings.company.company_name);
    content = content.replace(/\{full_address\}/g, fullAddress);
    content = content.replace(/\{property_url\}/g, propertyUrl);
    content = content.replace(/\{qr_code_url\}/g, qrCodeUrl);
    content = content.replace(/\{source_channel\}/g, selectedChannel);

    return content;
  };

  // Helper function to generate template content for sending
  const generateTemplateContent = (template: any, prop: CampaignProperty, trackingId?: string) => {
    const fullAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;
    const propertyUrl = `https://offer.mylocalinvest.com/property/${prop.id}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(propertyUrl)}`;

    // Generate trackable link if tracking ID is provided
    const trackablePropertyUrl = trackingId
      ? `${window.location.origin}/track/click?tid=${trackingId}&url=${encodeURIComponent(propertyUrl)}`
      : propertyUrl;

    const trackingPixel = trackingId ? `<img src="${window.location.origin}/track/open?tid=${trackingId}" width="1" height="1" style="display:none;" alt="" />` : '';
    const unsubscribeUrl = `${window.location.origin}/unsubscribe?property=${prop.id}`;

    let content = template.body;
    content = content.replace(/\{name\}/g, prop.owner_name || 'Owner');
    content = content.replace(/\{address\}/g, prop.address);
    content = content.replace(/\{city\}/g, prop.city);
    content = content.replace(/\{state\}/g, prop.state);
    content = content.replace(/\{cash_offer\}/g, prop.cash_offer_amount?.toLocaleString() || '0');
    content = content.replace(/\{company_name\}/g, settings.company.company_name);
    content = content.replace(/\{phone\}/g, settings.company.contact_phone);
    content = content.replace(/\{seller_name\}/g, settings.company.company_name);
    content = content.replace(/\{full_address\}/g, fullAddress);
    content = content.replace(/\{property_url\}/g, trackablePropertyUrl);
    content = content.replace(/\{qr_code_url\}/g, qrCodeUrl);
    content = content.replace(/\{source_channel\}/g, selectedChannel);
    content = content.replace(/\{tracking_pixel\}/g, trackingPixel);
    content = content.replace(/\{unsubscribe_url\}/g, unsubscribeUrl);

    const subject = template.subject?.replace(/\{address\}/g, prop.address) || `Cash Offer for ${prop.address}`;

    return { content, subject };
  };
  
  // Column selection state
  const [selectedPhoneColumn, setSelectedPhoneColumn] = useState('phone1');
  const [selectedEmailColumn, setSelectedEmailColumn] = useState('email1');
  const [showContactInfo, setShowContactInfo] = useState(false);

  // Build select columns based on selected phone/email columns
  const getSelectColumns = () => {
    const baseColumns = ['id', 'address', 'city', 'state', 'zip_code', 'owner_name', 'cash_offer_amount', 'approval_status', 'tags'];
    const phoneCol = selectedPhoneColumn;
    const emailCol = selectedEmailColumn;
    
    // Add unique columns
    const allColumns = [...baseColumns];
    if (!allColumns.includes(phoneCol)) allColumns.push(phoneCol);
    if (!allColumns.includes(emailCol)) allColumns.push(emailCol);
    
    return allColumns.join(', ');
  };

  // Fetch properties on mount and when columns change
  useEffect(() => {
    fetchProperties();
  }, [filterStatus, selectedPhoneColumn, selectedEmailColumn]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const selectColumns = getSelectColumns();
      
      let query = supabase
        .from('properties')
        .select(selectColumns)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('approval_status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      // Cast data to unknown first, then to Property[] to satisfy TypeScript
      setProperties((data as unknown as CampaignProperty[]) || []);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      toast({
        title: 'Erro ao carregar propriedades',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === properties.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(properties.map((p) => p.id));
    }
  };

  const getSelectedProperties = () => {
    return properties.filter((p) => selectedIds.includes(p.id));
  };

  // Get phone/email from property based on selected column
  const getPhone = (prop: CampaignProperty): string | undefined => {
    // Priority 1: Get from tags (pref_phone:)
    const prefPhones = (prop.tags || []).filter((t: string) => t.startsWith('pref_phone:')).map((t: string) => t.replace('pref_phone:', ''));
    if (prefPhones.length > 0) {
      return prefPhones[0];
    }
    // Priority 2: Fall back to selected column
    return prop[selectedPhoneColumn] as string | undefined;
  };

  const getEmail = (prop: CampaignProperty): string | undefined => {
    // Priority 1: Get from tags (pref_email:)
    const prefEmails = (prop.tags || []).filter((t: string) => t.startsWith('pref_email:')).map((t: string) => t.replace('pref_email:', ''));
    if (prefEmails.length > 0) {
      return prefEmails[0];
    }
    // Priority 2: Fall back to selected column
    return prop[selectedEmailColumn] as string | undefined;
  };

  const getAllPhones = (prop: CampaignProperty): string[] => {
    // Priority 1: Get from tags
    const prefPhones = (prop.tags || []).filter((t: string) => t.startsWith('pref_phone:')).map((t: string) => t.replace('pref_phone:', ''));
    if (prefPhones.length > 0) {
      return prefPhones;
    }
    // Priority 2: Selected column
    const phone = prop[selectedPhoneColumn] as string | undefined;
    return phone ? [phone] : [];
  };

  const getAllEmails = (prop: CampaignProperty): string[] => {
    // Priority 1: Get from tags
    const prefEmails = (prop.tags || []).filter((t: string) => t.startsWith('pref_email:')).map((t: string) => t.replace('pref_email:', ''));
    if (prefEmails.length > 0) {
      return prefEmails;
    }
    // Priority 2: Selected column
    const email = prop[selectedEmailColumn] as string | undefined;
    return email ? [email] : [];
  };

  // Wizard navigation functions
  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1: return selectedTemplateId !== '';
      case 2: return selectedIds.length > 0;
      case 3: return true; // Configuration is always valid
      case 4: return true; // Preview is always valid
      case 5: return true; // Send step
      default: return false;
    }
  };

  // Campaign statistics calculations
  const getCampaignStats = () => {
    const selectedProps = getSelectedProperties();
    const approvedProps = selectedProps.filter(p => p.approval_status === 'approved');
    const propsWithPhones = selectedProps.filter(p => getAllPhones(p).length > 0);
    const propsWithEmails = selectedProps.filter(p => getAllEmails(p).length > 0);

    return {
      totalProperties: selectedProps.length,
      approvedProperties: approvedProps.length,
      propertiesWithPhones: propsWithPhones.length,
      propertiesWithEmails: propsWithEmails.length,
      totalPhoneContacts: propsWithPhones.reduce((sum, p) => sum + getAllPhones(p).length, 0),
      totalEmailContacts: propsWithEmails.reduce((sum, p) => sum + getAllEmails(p).length, 0),
    };
  };

  const handleSendCampaign = async () => {
    const selectedProps = getSelectedProperties();
    if (selectedProps.length === 0) {
      toast({
        title: 'Nenhuma propriedade selecionada',
        description: 'Selecione pelo menos uma propriedade',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedTemplate) {
      toast({
        title: 'Nenhum template selecionado',
        description: 'Selecione um template antes de enviar',
        variant: 'destructive',
      });
      return;
    }

    // Show preview modal instead of sending directly
    setShowSendPreview(true);
  };

  const handleConfirmSendCampaign = async () => {
    const selectedProps = getSelectedProperties();
    setShowSendPreview(false);

    setSending(true);
    let successCount = 0;
    let failCount = 0;
    let completedCount = 0;

    // Inicializar progresso
    updateProgress(0, selectedProps.length, 0, 0);

    for (let i = 0; i < selectedProps.length; i++) {
      const prop = selectedProps[i];

      try {
        const fullAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;
        const allPhones = getAllPhones(prop);
        const allEmails = getAllEmails(prop);

        let sent = false;
        let lastError: any = null;

        if (selectedChannel === 'sms') {
          if (allPhones.length === 0) {
            failCount++;
            completedCount++;
            updateProgress(completedCount, selectedProps.length, successCount, failCount);
            continue;
          }

          if (!selectedTemplate) {
            failCount++;
            completedCount++;
            updateProgress(completedCount, selectedProps.length, successCount, failCount);
            continue;
          }

          const trackingId = crypto.randomUUID();
          const { content } = generateTemplateContent(selectedTemplate, prop, trackingId);

          for (const phone of allPhones) {
            try {
              await sendSMS({
                phone_number: phone,
                body: content,
              });

              // Log successful SMS send
              await supabase.from('campaign_logs').insert({
                tracking_id: trackingId,
                campaign_type: 'manual',
                channel: 'sms',
                property_id: prop.id,
                recipient_phone: phone,
                sent_at: new Date().toISOString(),
                metadata: {
                  template_id: selectedTemplate.id,
                  template_name: selectedTemplate.name,
                  contact_index: allPhones.indexOf(phone),
                  total_contacts: allPhones.length
                }
              });

              sent = true;
              break;
            } catch (error) {
              lastError = error;
            }
          }

          if (!sent) {
            failCount++;
            continue;
          }
        } else if (selectedChannel === 'email') {
          if (allEmails.length === 0) {
            failCount++;
            continue;
          }

          if (!selectedTemplate) {
            failCount++;
            continue;
          }

          const trackingId = crypto.randomUUID();
          const { content, subject } = generateTemplateContent(selectedTemplate, prop, trackingId);

          for (const email of allEmails) {
            try {
              await sendEmail({
                receiver_email: email,
                subject: subject,
                message_body: content,
              });

              // Log successful email send
              await supabase.from('campaign_logs').insert({
                tracking_id: trackingId,
                campaign_type: 'manual',
                channel: 'email',
                property_id: prop.id,
                recipient_email: email,
                sent_at: new Date().toISOString(),
                metadata: {
                  template_id: selectedTemplate.id,
                  template_name: selectedTemplate.name,
                  contact_index: allEmails.indexOf(email),
                  total_contacts: allEmails.length,
                  subject: subject
                }
              });

              sent = true;
              break;
            } catch (error) {
              lastError = error;
            }
          }

          if (!sent) {
            failCount++;
            continue;
          }
        } else if (selectedChannel === 'call') {
          if (allPhones.length === 0) {
            failCount++;
            continue;
          }

          if (!selectedTemplate) {
            failCount++;
            continue;
          }

          const trackingId = crypto.randomUUID();
          const { content } = generateTemplateContent(selectedTemplate, prop, trackingId);

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

              // Log successful call initiation
              await supabase.from('campaign_logs').insert({
                tracking_id: trackingId,
                campaign_type: 'manual',
                channel: 'call',
                property_id: prop.id,
                recipient_phone: phone,
                sent_at: new Date().toISOString(),
                metadata: {
                  template_id: selectedTemplate.id,
                  template_name: selectedTemplate.name,
                  contact_index: allPhones.indexOf(phone),
                  total_contacts: allPhones.length
                }
              });

              sent = true;
              break;
            } catch (error) {
              lastError = error;
            }
          }

          if (!sent) {
            failCount++;
            continue;
          }
        }

        completedCount++;
        updateProgress(completedCount, selectedProps.length, successCount, failCount);
      } catch (error: any) {
        console.error(`Error sending to ${prop.id}:`, error);
        failCount++;
        completedCount++;
        updateProgress(completedCount, selectedProps.length, successCount, failCount);
      }
    }

    setSending(false);

    // Toast aprimorado com mais detalhes
    toast({
      title: '🎉 Campanha Finalizada!',
      description: `${successCount} mensagens enviadas com sucesso, ${failCount} falharam. Taxa de sucesso: ${Math.round((successCount / (successCount + failCount)) * 100)}%`,
      action: {
        altText: 'Ver relatório detalhado',
        onClick: () => {
          // Futuramente: abrir modal de relatório detalhado
          console.log('Abrir relatório detalhado');
        },
      },
      duration: 8000,
    });

    setSelectedIds([]);
    setProgressStats({ completed: 0, total: 0, successCount: 0, failCount: 0, estimatedTimeRemaining: '0s' });
  };

  const selectedCount = selectedIds.length;
  const selectedProps = getSelectedProperties();
  const propsWithPhone = selectedProps.filter((p) => getAllPhones(p).length > 0).length;
  const propsWithEmail = selectedProps.filter((p) => getAllEmails(p).length > 0).length;

  return (
    <TooltipProvider>
      <div className={`space-y-6 transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🚀 Campaign Creator</h1>
            <p className="text-muted-foreground">
              Create and launch marketing campaigns step by step
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle {theme === 'dark' ? 'light' : 'dark'} mode</p>
              </TooltipContent>
            </Tooltip>
            <Button variant="outline" onClick={fetchProperties}>
              <Filter className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

      {/* Test Mode Warning */}
      {testMode && (
        <Alert className="border-orange-500 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            🧪 <strong>Test Mode Active:</strong> Messages will be simulated (not actually sent)
          </AlertDescription>
        </Alert>
      )}

      {/* Wizard Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-8">
            {[
              { step: 1, title: 'Choose Template', icon: Target },
              { step: 2, title: 'Select Properties', icon: Users },
              { step: 3, title: 'Configure', icon: Filter },
              { step: 4, title: 'Preview', icon: Eye },
              { step: 5, title: 'Send Campaign', icon: Send },
            ].map(({ step, title, icon: Icon }, index) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-muted-foreground/30 text-muted-foreground'
                }`}>
                  {currentStep > step ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="ml-3">
                  <div className={`text-sm font-medium ${
                    currentStep >= step ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step}
                  </div>
                  <div className={`text-xs ${
                    currentStep >= step ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {title}
                  </div>
                </div>
                {index < 4 && (
                  <ArrowRight className={`w-4 h-4 mx-4 ${
                    currentStep > step ? 'text-primary' : 'text-muted-foreground/30'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[600px]">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Choose Template</h2>
                  <p className="text-muted-foreground">Select a template for your campaign</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['sms', 'email', 'call'].map((channel) => (
                    <div key={channel} className="space-y-3">
                      <Label className="text-sm font-medium capitalize flex items-center gap-2">
                        {channel === 'sms' && <MessageSquare className="w-4 h-4" />}
                        {channel === 'email' && <Mail className="w-4 h-4" />}
                        {channel === 'call' && <Phone className="w-4 h-4" />}
                        {channel.toUpperCase()} Templates
                      </Label>
                      <div className="space-y-2">
                        {getTemplatesByChannel(channel as Channel).map((template) => (
                          <div
                            key={template.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedTemplateId === template.id && selectedChannel === channel
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => {
                              setSelectedChannel(channel as Channel);
                              setSelectedTemplateId(template.id);
                            }}
                          >
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {template.subject || template.body.substring(0, 50)}...
                            </div>
                            {template.is_default && (
                              <Badge variant="secondary" className="text-xs mt-1">Default</Badge>
                            )}
                          </div>
                        ))}
                        {getTemplatesByChannel(channel as Channel).length === 0 && (
                          <div className="p-3 border rounded-lg text-center text-muted-foreground">
                            No templates available for {channel}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">🎯 Select Properties</h2>
                  <p className="text-muted-foreground">Choose the properties you want to target with your campaign</p>
                </div>

                {/* Filtros e Busca Avançados */}
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Buscar propriedades por endereço, nome ou cidade..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filtros Avançados
                    </Button>
                  </div>

                  {/* Filtros de Status */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={filterStatus === 'approved' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('approved')}
                    >
                      ✅ Approved ({properties.filter(p => p.approval_status === 'approved').length})
                    </Button>
                    <Button
                      variant={filterStatus === 'pending' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('pending')}
                    >
                      ⏳ Pending ({properties.filter(p => p.approval_status === 'pending').length})
                    </Button>
                    <Button
                      variant={filterStatus === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('all')}
                    >
                      📋 All ({properties.length})
                    </Button>
                  </div>

                  {/* Filtros Ativos */}
                  {activeFilters.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {activeFilters.map(filter => (
                        <Badge key={filter.id} variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors" onClick={() => removeFilter(filter.id)}>
                          {filter.label} ×
                        </Badge>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => setActiveFilters([])}>
                        <X className="w-3 h-3 mr-1" />
                        Limpar filtros
                      </Button>
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2 flex-1">
                                  <Skeleton className="h-4 w-3/4" />
                                  <Skeleton className="h-3 w-1/2" />
                                </div>
                                <Skeleton className="h-5 w-5" />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-32 w-full" />
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : getFilteredProperties().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Target className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm ? 'Nenhuma propriedade encontrada' : 'Nenhuma propriedade disponível'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm
                        ? `Não encontramos propriedades que correspondam à sua busca "${searchTerm}".`
                        : `Não há propriedades com status "${filterStatus}" disponíveis para campanhas.`
                      }
                    </p>
                    <div className="flex gap-2 justify-center">
                      {searchTerm && (
                        <Button variant="outline" onClick={() => setSearchTerm('')}>
                          Limpar busca
                        </Button>
                      )}
                      <Button onClick={() => setFilterStatus('all')}>
                        Ver todas as propriedades
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="group hover:shadow-lg transition-all duration-300">
                      <CardHeader>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          📋 Available Properties
                        </CardTitle>
                        <CardDescription>
                          {getFilteredProperties().length} properties found
                          {searchTerm && ` for "${searchTerm}"`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[400px] pr-4">
                          <div className="space-y-2">
                            {getFilteredProperties().map((property) => {
                                const phones = getAllPhones(property);
                                const emails = getAllEmails(property);
                                return (
                                  <div
                                    key={property.id}
                                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                                    onClick={() => toggleSelection(property.id)}
                                  >
                                    <Avatar className="h-10 w-10 flex-shrink-0">
                                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                        {property.owner_name?.charAt(0) || property.address.charAt(0) || 'P'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium truncate group-hover:text-primary transition-colors">
                                          {property.address}
                                        </p>
                                        <Badge
                                          variant={property.approval_status === 'approved' ? 'default' : 'secondary'}
                                          className="text-xs flex-shrink-0"
                                        >
                                          {property.approval_status}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="flex items-center gap-1 cursor-help">
                                              <Phone className="w-3 h-3" />
                                              {phones.length}
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{phones.length} números de telefone disponíveis</p>
                                          </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="flex items-center gap-1 cursor-help">
                                              <Mail className="w-3 h-3" />
                                              {emails.length}
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{emails.length} endereços de email disponíveis</p>
                                          </TooltipContent>
                                        </Tooltip>
                                        {property.cash_offer_amount && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <span className="flex items-center gap-1 cursor-help">
                                                <DollarSign className="w-3 h-3" />
                                                {property.cash_offer_amount.toLocaleString()}
                                              </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Oferta de cash: ${property.cash_offer_amount.toLocaleString()}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                      </div>
                                    </div>
                                    <Checkbox
                                      checked={selectedIds.includes(property.id)}
                                      onChange={() => {}}
                                      className="flex-shrink-0"
                                    />
                                  </div>
                                );
                              })}
                                      <div className="text-sm text-muted-foreground">
                                        {property.city}, {property.state}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        {property.approval_status === 'approved' && (
                                          <Badge variant="default" className="text-xs">Approved</Badge>
                                        )}
                                        {phones.length > 0 && (
                                          <Badge variant="secondary" className="text-xs gap-1">
                                            <Phone className="w-3 h-3" />
                                            {phones.length}
                                          </Badge>
                                        )}
                                        {emails.length > 0 && (
                                          <Badge variant="secondary" className="text-xs gap-1">
                                            <Mail className="w-3 h-3" />
                                            {emails.length}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    {property.cash_offer_amount && (
                                      <div className="text-right">
                                        <div className="text-sm font-semibold text-green-600">
                                          ${property.cash_offer_amount.toLocaleString()}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Selected Properties ({selectedIds.length})</CardTitle>
                        <CardDescription>
                          Properties that will receive your campaign
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {selectedIds.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            No properties selected
                          </div>
                        ) : (
                          <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-2">
                              {selectedProps.map((property) => (
                                <div
                                  key={property.id}
                                  className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium">{property.address}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {property.owner_name || 'No Owner'}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleSelection(property.id)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Configure Campaign</h2>
                  <p className="text-muted-foreground">Set up your campaign settings</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Channel Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Communication Channel</Label>
                        <Tabs value={selectedChannel} onValueChange={(v) => setSelectedChannel(v as Channel)}>
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="sms" className="gap-1">
                              <MessageSquare className="w-4 h-4" />
                              SMS
                            </TabsTrigger>
                            <TabsTrigger value="email" className="gap-1">
                              <Mail className="w-4 h-4" />
                              Email
                            </TabsTrigger>
                            <TabsTrigger value="call" className="gap-1">
                              <Phone className="w-4 h-4" />
                              Call
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>

                      {(selectedChannel === 'sms' || selectedChannel === 'call') && (
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Phone Column</Label>
                          <Select value={selectedPhoneColumn} onValueChange={setSelectedPhoneColumn}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PHONE_COLUMNS.map((col) => (
                                <SelectItem key={col.value} value={col.value}>
                                  {col.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {selectedChannel === 'email' && (
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Email Column</Label>
                          <Select value={selectedEmailColumn} onValueChange={setSelectedEmailColumn}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {EMAIL_COLUMNS.map((col) => (
                                <SelectItem key={col.value} value={col.value}>
                                  {col.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Campaign Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Template:</span>
                          <span className="font-medium">{selectedTemplate?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Channel:</span>
                          <span className="font-medium capitalize">{selectedChannel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Properties:</span>
                          <span className="font-medium">{selectedIds.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mode:</span>
                          <span className="font-medium">{testMode ? '🧪 Test' : '🚀 Live'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Campaign Preview</h2>
                  <p className="text-muted-foreground">Review your campaign before sending</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Target Audience</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(() => {
                          const stats = getCampaignStats();
                          return (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Total Properties:</span>
                                <span className="font-semibold">{stats.totalProperties}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Approved:</span>
                                <span className="font-semibold text-green-600">{stats.approvedProperties}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Preferred Phones:</span>
                                <span className="font-semibold">{stats.propertiesWithPhones}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Primary Phones:</span>
                                <span className="font-semibold">{stats.totalPhoneContacts}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Skip Tracing Phones:</span>
                                <span className="font-semibold">0</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Total Phone Contacts:</span>
                                <span className="font-semibold">{stats.totalPhoneContacts}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Preferred Emails:</span>
                                <span className="font-semibold">{stats.propertiesWithEmails}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Primary Emails:</span>
                                <span className="font-semibold">{stats.totalEmailContacts}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Skip Tracing Emails:</span>
                                <span className="font-semibold">0</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Total Email Contacts:</span>
                                <span className="font-semibold">{stats.totalEmailContacts}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Campaign Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Template:</span>
                          <span className="font-semibold">{selectedTemplate?.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Channels:</span>
                          <span className="font-semibold">{selectedChannel}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Expected Success:</span>
                          <span className="font-semibold text-green-600">15-25%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>📧 Message Content Preview</span>
                      {selectedProps.length > 1 && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={prevPreview}
                            disabled={previewIndex === 0}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                            {previewIndex + 1} / {selectedProps.length}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={nextPreview}
                            disabled={previewIndex === selectedProps.length - 1}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Preview of actual messages that will be sent to recipients
                      {selectedProps.length > 0 && (
                        <span className="block text-sm font-medium text-foreground mt-1">
                          Previewing: {selectedProps[previewIndex]?.address || 'N/A'}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedProps.length > 0 && selectedTemplate ? (
                      <div className="space-y-6">
                        {selectedChannel === 'sms' && (
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="w-4 h-4" />
                              <span className="font-medium">SMS Message</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded border text-sm">
                              {renderTemplatePreview(selectedProps[0])}
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              ~{renderTemplatePreview(selectedProps[0]).length} characters
                            </div>
                          </div>
                        )}

                        {selectedChannel === 'email' && (
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Mail className="w-4 h-4" />
                              <span className="font-medium">Email Message</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded border text-sm">
                              <div className="font-medium mb-2">
                                Subject: {renderTemplatePreview(selectedProps[0], 'subject')}
                              </div>
                              <div className="whitespace-pre-line">
                                {renderTemplatePreview(selectedProps[0])}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              HTML email with professional formatting
                            </div>
                          </div>
                        )}

                        {selectedChannel === 'call' && (
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Phone className="w-4 h-4" />
                              <span className="font-medium">Call Message</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded border text-sm">
                              {renderTemplatePreview(selectedProps[0])}
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              Voicemail message for unanswered calls
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Select properties and template to see preview
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Send Campaign</h2>
                  <p className="text-muted-foreground">Launch your campaign to selected properties</p>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <Rocket className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Ready to Send</h3>
                        <p className="text-muted-foreground">
                          Your campaign will be sent to {selectedIds.length} properties using {selectedChannel.toUpperCase()}
                        </p>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm">
                          Make sure your marketing API is configured before proceeding.
                        </p>
                      </div>
                      <Button
                        size="lg"
                        onClick={handleSendCampaign}
                        disabled={sending || selectedIds.length === 0}
                        className="w-full max-w-xs"
                      >
                        {sending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Campaign ({selectedIds.length} properties)
                          </>
                        )}
                      </Button>

                      {/* Progress Bar */}
                      {sending && (
                        <div className="space-y-3 mt-6">
                          <div className="flex justify-between text-sm">
                            <span>Enviando campanha...</span>
                            <span>{progressStats.completed}/{progressStats.total} ({Math.round((progressStats.completed/progressStats.total)*100) || 0}%)</span>
                          </div>
                          <Progress
                            value={(progressStats.completed/progressStats.total)*100 || 0}
                            className="h-3"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>✅ {progressStats.successCount} sucesso</span>
                            <span>❌ {progressStats.failCount} falhas</span>
                            <span>⏱️ {progressStats.estimatedTimeRemaining}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              Step {currentStep} of 5
            </div>

            {currentStep < 5 ? (
              <Button
                onClick={nextStep}
                disabled={!canProceedToNext()}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <div></div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Send Preview Modal */}
      <Dialog open={showSendPreview} onOpenChange={setShowSendPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar Envio da Campanha</DialogTitle>
            <DialogDescription>
              Revise os detalhes antes de enviar a campanha para {selectedProps.length} propriedades via {selectedChannel.toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Campaign Summary */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Resumo da Campanha</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Template:</span>
                  <p className="font-medium">{selectedTemplate?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Canal:</span>
                  <p className="font-medium">{selectedChannel.toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Propriedades:</span>
                  <p className="font-medium">{selectedProps.length}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Contatos válidos:</span>
                  <p className="font-medium">
                    {selectedProps.filter(p => 
                      selectedChannel === 'email' ? getAllEmails(p).length > 0 : getAllPhones(p).length > 0
                    ).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div>
              <h3 className="font-semibold mb-3">Contatos que receberão a mensagem</h3>
              <ScrollArea className="h-64 border rounded-lg">
                <div className="p-4 space-y-3">
                  {selectedProps.map((prop) => {
                    const phones = getAllPhones(prop);
                    const emails = getAllEmails(prop);
                    const contacts = selectedChannel === 'email' ? emails : phones;
                    
                    if (contacts.length === 0) return null;
                    
                    return (
                      <div key={prop.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div>
                          <div className="font-medium text-sm">{prop.address}</div>
                          <div className="text-xs text-muted-foreground">{prop.owner_name || 'No Owner'}</div>
                        </div>
                        <div className="text-right">
                          {contacts.map((contact, idx) => (
                            <div key={idx} className="text-xs font-mono">{contact}</div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Template Preview */}
            {selectedTemplate && selectedProps.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Preview do Template</h3>
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <div className="text-sm">
                    {selectedChannel === 'email' && selectedTemplate.subject && (
                      <div className="mb-2">
                        <span className="font-medium">Assunto:</span> {renderTemplatePreview(selectedProps[0], 'subject')}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Mensagem:</span>
                      <div className="mt-2 p-3 bg-white rounded border text-sm whitespace-pre-wrap">
                        {renderTemplatePreview(selectedProps[0], 'body')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendPreview(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmSendCampaign} 
              disabled={sending}
              className="bg-green-600 hover:bg-green-700"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Confirmar Envio ({selectedProps.filter(p => 
                    selectedChannel === 'email' ? getAllEmails(p).length > 0 : getAllPhones(p).length > 0
                  ).length} mensagens)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignManager;

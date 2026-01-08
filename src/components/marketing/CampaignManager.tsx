/**
 * Campaign Manager - Tela dedicada para criar e gerenciar campanhas
 * Fluxo claro: Selecionar Propriedades → Escolher Canal → Configurar → Enviar
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
} from 'lucide-react';
import { sendSMS, sendEmail, initiateCall } from '@/services/marketingService';
import { useMarketingStore } from '@/store/marketingStore';
import { useTemplates } from '@/hooks/useTemplates';
import type { SavedTemplate, Property, Channel } from '@/types/marketing.types';

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

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  owner_name?: string;
  cash_offer_amount?: number;
  approval_status?: string;
  preferred_phones?: string[];  // Root level - from properties table
  preferred_emails?: string[];  // Root level - from properties table
  skip_tracing_data?: {
    preferred_phones?: string[];
    preferred_emails?: string[];
  };
  // Dynamic columns
  [key: string]: string | number | boolean | null | undefined | object;
}

type Channel = 'sms' | 'email' | 'call';

export const CampaignManager = () => {
  const { toast } = useToast();
  const testMode = useMarketingStore((state) => state.settings.defaults.test_mode);
  const settings = useMarketingStore((state) => state.settings);
  const { templates, getTemplatesByChannel, getDefaultTemplate } = useTemplates();

  // State
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
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
  const renderTemplatePreview = (prop: Property, type: 'body' | 'subject' = 'body') => {
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
  const generateTemplateContent = (template: any, prop: Property, trackingId?: string) => {
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
    const baseColumns = ['id', 'address', 'city', 'state', 'zip_code', 'owner_name', 'cash_offer_amount', 'approval_status', 'skip_tracing_data', 'preferred_phones', 'preferred_emails'];
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
      setProperties((data as unknown as Property[]) || []);
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
  const getPhone = (prop: Property): string | undefined => {
    // Priority 1: Root level preferred_phones (from properties table)
    if (prop.preferred_phones && prop.preferred_phones.length > 0) {
      return prop.preferred_phones[0];
    }
    // Priority 2: Skip tracing data preferred phones
    if (prop.skip_tracing_data?.preferred_phones && prop.skip_tracing_data.preferred_phones.length > 0) {
      return prop.skip_tracing_data.preferred_phones[0];
    }
    // Priority 3: Fall back to selected column
    return prop[selectedPhoneColumn] as string | undefined;
  };

  const getEmail = (prop: Property): string | undefined => {
    // Priority 1: Root level preferred_emails (from properties table)
    if (prop.preferred_emails && prop.preferred_emails.length > 0) {
      return prop.preferred_emails[0];
    }
    // Priority 2: Skip tracing data preferred emails
    if (prop.skip_tracing_data?.preferred_emails && prop.skip_tracing_data.preferred_emails.length > 0) {
      return prop.skip_tracing_data.preferred_emails[0];
    }
    // Priority 3: Fall back to selected column
    return prop[selectedEmailColumn] as string | undefined;
  };

  const getAllPhones = (prop: Property): string[] => {
    // Priority 1: Root level preferred_phones
    if (prop.preferred_phones && prop.preferred_phones.length > 0) {
      return prop.preferred_phones;
    }
    // Priority 2: Skip tracing data
    if (prop.skip_tracing_data?.preferred_phones && prop.skip_tracing_data.preferred_phones.length > 0) {
      return prop.skip_tracing_data.preferred_phones;
    }
    // Priority 3: Selected column
    const phone = prop[selectedPhoneColumn] as string | undefined;
    return phone ? [phone] : [];
  };

  const getAllEmails = (prop: Property): string[] => {
    // Priority 1: Root level preferred_emails
    if (prop.preferred_emails && prop.preferred_emails.length > 0) {
      return prop.preferred_emails;
    }
    // Priority 2: Skip tracing data
    if (prop.skip_tracing_data?.preferred_emails && prop.skip_tracing_data.preferred_emails.length > 0) {
      return prop.skip_tracing_data.preferred_emails;
    }
    // Priority 3: Selected column
    const email = prop[selectedEmailColumn] as string | undefined;
    return email ? [email] : [];
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

    for (const prop of selectedProps) {
      try {
        const fullAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;
        const allPhones = getAllPhones(prop);
        const allEmails = getAllEmails(prop);

        let sent = false;
        let lastError: any = null;

        if (selectedChannel === 'sms') {
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

        successCount++;
      } catch (error: any) {
        console.error(`Error sending to ${prop.id}:`, error);
        failCount++;
      }
    }

    setSending(false);

    toast({
      title: 'Campanha Finalizada',
      description: `✅ ${successCount} enviados com sucesso, ❌ ${failCount} falharam`,
      variant: successCount > 0 ? 'default' : 'destructive',
    });

    setSelectedIds([]);
  };

  const selectedCount = selectedIds.length;
  const selectedProps = getSelectedProperties();
  const propsWithPhone = selectedProps.filter((p) => getAllPhones(p).length > 0).length;
  const propsWithEmail = selectedProps.filter((p) => getAllEmails(p).length > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Campaign Manager</h1>
          <p className="text-muted-foreground">
            Selecione propriedades e crie campanhas de marketing
          </p>
        </div>
        <Button variant="outline" onClick={fetchProperties}>
          <Filter className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Test Mode Warning */}
      {testMode && (
        <Alert className="border-orange-500 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            🧪 <strong>Test Mode Ativo:</strong> As mensagens serão simuladas (não enviadas de verdade)
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Property List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Propriedades Disponíveis</CardTitle>
                  <CardDescription>
                    {properties.length} propriedades encontradas
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterStatus === 'approved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('approved')}
                  >
                    Aprovadas
                  </Button>
                  <Button
                    variant={filterStatus === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('pending')}
                  >
                    Pendentes
                  </Button>
                  <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                  >
                    Todas
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Show/Hide Contact Info Toggle */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowContactInfo(!showContactInfo)}
                  className="gap-2"
                >
                  {showContactInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showContactInfo ? 'Ocultar Contatos' : 'Mostrar Contatos'}
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : properties.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhuma propriedade encontrada
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                    <Checkbox
                      checked={selectedIds.length === properties.length && properties.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-sm font-medium">
                      Selecionar Todas ({properties.length})
                    </span>
                  </div>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-2">
                      {properties.map((property) => {
                        const phones = getAllPhones(property);
                        const emails = getAllEmails(property);
                        return (
                          <div
                            key={property.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                              selectedIds.includes(property.id)
                                ? 'bg-primary/5 border-primary'
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <Checkbox
                              checked={selectedIds.includes(property.id)}
                              onCheckedChange={() => toggleSelection(property.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {property.address}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {property.city}, {property.state} {property.zip_code}
                              </div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {property.owner_name || 'No Owner'}
                                </Badge>
                                {phones.length > 0 ? (
                                  phones.map((phone, index) => (
                                    <Badge key={`phone-${index}`} variant="secondary" className="text-xs gap-1">
                                      <Phone className="w-3 h-3" />
                                      {showContactInfo ? phone : '•••••••'}
                                      {phones.length > 1 && <span className="ml-1 text-xs opacity-70">#{index + 1}</span>}
                                    </Badge>
                                  ))
                                ) : (
                                  <Badge variant="destructive" className="text-xs gap-1">
                                    <Phone className="w-3 h-3" />
                                    Sem telefone
                                  </Badge>
                                )}
                                {emails.length > 0 ? (
                                  emails.map((email, index) => (
                                    <Badge key={`email-${index}`} variant="secondary" className="text-xs gap-1">
                                      <Mail className="w-3 h-3" />
                                      {showContactInfo ? email : '•••@•••'}
                                      {emails.length > 1 && <span className="ml-1 text-xs opacity-70">#{index + 1}</span>}
                                    </Badge>
                                  ))
                                ) : (
                                  <Badge variant="destructive" className="text-xs gap-1">
                                    <Mail className="w-3 h-3" />
                                    Sem email
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {property.cash_offer_amount && (
                              <div className="text-right">
                                <div className="text-sm font-semibold text-green-600">
                                  ${property.cash_offer_amount.toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground">Offer</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Campaign Config */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                Configurar Campanha
              </CardTitle>
              <CardDescription>
                {selectedCount} propriedade{selectedCount !== 1 ? 's' : ''} selecionada
                {selectedCount !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Channel Selection */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Canal</Label>
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

              {/* Template Selection */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Template</Label>
                <Select value={selectedTemplateId || ''} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {getTemplatesByChannel(selectedChannel).length > 0 ? (
                      getTemplatesByChannel(selectedChannel).map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} {template.is_default ? '(Padrão)' : ''}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        Nenhum template disponível para {selectedChannel}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {getTemplatesByChannel(selectedChannel).length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Crie templates na página de Templates primeiro
                  </p>
                )}
              </div>

              <Separator />

              {/* Column Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Colunas de Contato</Label>
                
                {/* Phone Column */}
                {(selectedChannel === 'sms' || selectedChannel === 'call') && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Coluna de Telefone
                    </Label>
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

                {/* Email Column */}
                {selectedChannel === 'email' && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Coluna de Email
                    </Label>
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
              </div>

              <Separator />

              {/* Template Preview */}
              {selectedCount > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Preview do Template</Label>
                  <div className="bg-muted/50 rounded-lg p-3 border">
                    {selectedChannel === 'sms' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MessageSquare className="w-3 h-3" />
                          SMS Preview
                        </div>
                        <div className="text-sm bg-white p-2 rounded border text-gray-800">
                          {selectedProps.length > 0 ? renderTemplatePreview(selectedProps[0]) : 'Selecione uma propriedade'}
                        </div>
                      </div>
                    )}

                    {selectedChannel === 'email' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          Email Preview
                        </div>
                        {selectedProps.length > 0 ? (
                          <div className="text-sm bg-white p-3 rounded border space-y-2">
                            <div className="font-medium text-gray-900">
                              Subject: {renderTemplatePreview(selectedProps[0], 'subject')}
                            </div>
                            <div className="text-gray-800 whitespace-pre-line">
                              {renderTemplatePreview(selectedProps[0])}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">Selecione uma propriedade</div>
                        )}
                      </div>
                    )}

                    {selectedChannel === 'call' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          Voicemail Preview
                        </div>
                        <div className="text-sm bg-white p-2 rounded border text-gray-800">
                          {selectedProps.length > 0 ? renderTemplatePreview(selectedProps[0]) : 'Selecione uma propriedade'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Propriedades:</span>
                  <span className="font-medium">{selectedCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Canal:</span>
                  <span className="font-medium capitalize">{selectedChannel}</span>
                </div>
                {(selectedChannel === 'sms' || selectedChannel === 'call') && selectedCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Com telefone:</span>
                    <span className={`font-medium ${propsWithPhone === selectedCount ? 'text-green-600' : 'text-orange-600'}`}>
                      {propsWithPhone}/{selectedCount}
                    </span>
                  </div>
                )}
                {selectedChannel === 'email' && selectedCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Com email:</span>
                    <span className={`font-medium ${propsWithEmail === selectedCount ? 'text-green-600' : 'text-orange-600'}`}>
                      {propsWithEmail}/{selectedCount}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Modo:</span>
                  <span className="font-medium">{testMode ? '🧪 Test' : '🚀 Live'}</span>
                </div>
              </div>

              <Separator />

              {/* Validation Warnings */}
              {selectedCount > 0 && (
                <div className="space-y-2">
                  {(selectedChannel === 'sms' || selectedChannel === 'call') &&
                    propsWithPhone < selectedCount && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {selectedCount - propsWithPhone} propriedade(s) sem telefone disponível
                        </AlertDescription>
                      </Alert>
                    )}
                  {selectedChannel === 'email' &&
                    propsWithEmail < selectedCount && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {selectedCount - propsWithEmail} propriedade(s) sem email disponível
                        </AlertDescription>
                      </Alert>
                    )}
                </div>
              )}

              {/* Send Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleSendCampaign}
                disabled={selectedCount === 0 || sending || !selectedTemplate}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando... ({selectedCount})
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Campanha ({selectedCount})
                  </>
                )}
              </Button>

              {selectedCount === 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Selecione propriedades à esquerda
                </p>
              )}
              {selectedCount > 0 && !selectedTemplate && (
                <p className="text-xs text-center text-muted-foreground">
                  Selecione um template para enviar
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
                    const hasValidContact = selectedChannel === 'email' ? emails.length > 0 : phones.length > 0;

                    return (
                      <div key={prop.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{prop.address}</div>
                          <div className="text-sm text-muted-foreground">{prop.owner_name || 'Proprietário não informado'}</div>
                          {hasValidContact ? (
                            <div className="mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {selectedChannel === 'email' ? (
                                  <>
                                    <Mail className="w-3 h-3 mr-1" />
                                    {emails[0]} {/* Mostra apenas o primeiro email que será usado */}
                                  </>
                                ) : (
                                  <>
                                    <Phone className="w-3 h-3 mr-1" />
                                    {phones[0]} {/* Mostra apenas o primeiro telefone que será usado */}
                                  </>
                                )}
                              </Badge>
                              {(selectedChannel === 'email' ? emails.length : phones.length) > 1 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  +{(selectedChannel === 'email' ? emails.length : phones.length) - 1} contatos alternativos disponíveis
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge variant="destructive" className="text-xs mt-2">
                              Sem contato válido
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          {prop.cash_offer_amount && (
                            <div className="text-sm font-semibold text-green-600">
                              ${prop.cash_offer_amount.toLocaleString()}
                            </div>
                          )}
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

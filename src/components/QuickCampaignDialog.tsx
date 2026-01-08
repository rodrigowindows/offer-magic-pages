/**
 * QuickCampaignDialog - Fluxo Simplificado de Campanha
 * 1 clique → Seleciona template → Envia automaticamente
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useMarketingStore } from '@/store/marketingStore';
import { useMarketing } from '@/hooks/useMarketing';
import { useTemplates } from '@/hooks/useTemplates';
import { sendSMS, sendEmail, initiateCall } from '@/services/marketingService';
import { supabase } from '@/integrations/supabase/client';
import {
  Rocket,
  MessageSquare,
  Mail,
  Phone,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Zap,
  TrendingUp,
  Target
} from 'lucide-react';

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  owner_name?: string;
  cash_offer_amount?: number;
  owner_phone?: string;
  owner_email?: string;
  preferred_phones?: string[];
  preferred_emails?: string[];
  skip_tracing_data?: {
    phones?: string[];
    emails?: string[];
    preferred_phones?: string[];
    preferred_emails?: string[];
  };
}

interface QuickCampaignDialogProps {
  properties: Property[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type QuickTemplate = {
  id: string;
  name: string;
  channel: 'sms' | 'email' | 'call';
  icon: any;
  color: string;
  description: string;
  estimatedTime: string;
};

type SequenceStep = {
  id: string;
  channel: 'sms' | 'email' | 'call';
  delay: number; // hours from previous step
  templateId: string;
};

type CampaignSequence = {
  id: string;
  name: string;
  description: string;
  steps: SequenceStep[];
  estimatedDuration: string;
  expectedConversion: string;
};

const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    id: 'sms-quick',
    name: 'SMS Rápido',
    channel: 'sms',
    icon: MessageSquare,
    color: 'bg-blue-500',
    description: 'Mensagem de texto simples e direta',
    estimatedTime: 'Instantâneo'
  },
  {
    id: 'email-offer',
    name: 'Email Oferta',
    channel: 'email',
    icon: Mail,
    color: 'bg-green-500',
    description: 'Email profissional com oferta detalhada',
    estimatedTime: '2-5 min'
  },
  {
    id: 'call-voicemail',
    name: 'Ligação + Voicemail',
    channel: 'call',
    icon: Phone,
    color: 'bg-purple-500',
    description: 'Chamada automática com mensagem gravada',
    estimatedTime: 'Imediato'
  }
];

const CAMPAIGN_SEQUENCES: CampaignSequence[] = [
  {
    id: 'sequence-basic',
    name: 'Sequência Básica',
    description: 'SMS → Email → Call (estratégia comprovada)',
    steps: [
      { id: 'step1', channel: 'sms', delay: 0, templateId: 'sms-quick' },
      { id: 'step2', channel: 'email', delay: 48, templateId: 'email-offer' },
      { id: 'step3', channel: 'call', delay: 72, templateId: 'call-voicemail' }
    ],
    estimatedDuration: '5 dias',
    expectedConversion: '+45%'
  },
  {
    id: 'sequence-aggressive',
    name: 'Sequência Agressiva',
    description: 'Contatos mais frequentes para resposta rápida',
    steps: [
      { id: 'step1', channel: 'sms', delay: 0, templateId: 'sms-quick' },
      { id: 'step2', channel: 'call', delay: 24, templateId: 'call-voicemail' },
      { id: 'step3', channel: 'email', delay: 24, templateId: 'email-offer' },
      { id: 'step4', channel: 'call', delay: 48, templateId: 'call-voicemail' }
    ],
    estimatedDuration: '3 dias',
    expectedConversion: '+60%'
  },
  {
    id: 'sequence-gentle',
    name: 'Sequência Suave',
    description: 'Contatos espaçados para não incomodar',
    steps: [
      { id: 'step1', channel: 'email', delay: 0, templateId: 'email-offer' },
      { id: 'step2', channel: 'sms', delay: 72, templateId: 'sms-quick' },
      { id: 'step3', channel: 'call', delay: 96, templateId: 'call-voicemail' }
    ],
    estimatedDuration: '7 dias',
    expectedConversion: '+35%'
  }
];

export const QuickCampaignDialog = ({
  properties,
  open,
  onOpenChange,
  onSuccess
}: QuickCampaignDialogProps) => {
  const { toast } = useToast();
  const testMode = useMarketingStore((state) => state.settings.defaults.test_mode);
  const addToHistory = useMarketingStore((state) => state.addToHistory);
  const { templates } = useTemplates();
  const { sendIndividualCommunication } = useMarketing();

  const [selectedTemplate, setSelectedTemplate] = useState<QuickTemplate | null>(null);
  const [selectedSequence, setSelectedSequence] = useState<CampaignSequence | null>(null);
  const [campaignMode, setCampaignMode] = useState<'single' | 'sequence' | 'ab-test'>('single');
  const [sending, setSending] = useState(false);
  const [selectedEmailColumn, setSelectedEmailColumn] = useState<string>('owner_email');
  const [selectedPhoneColumn, setSelectedPhoneColumn] = useState<string>('owner_phone');
  const [enableFallback, setEnableFallback] = useState<boolean>(true);
  const [rateLimitDelay, setRateLimitDelay] = useState<number>(1000); // 1 second between sends
  const [progress, setProgress] = useState<{ current: number; total: number; currentProperty?: string }>({
    current: 0,
    total: 0
  });

  // A/B Testing state
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [abTestVariantA, setAbTestVariantA] = useState('');
  const [abTestVariantB, setAbTestVariantB] = useState('');
  const [abTestSplit, setAbTestSplit] = useState(50); // 50/50 split

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      console.log('QuickCampaignDialog opened with properties:', properties.length);
      setSelectedTemplate(null);
      setSelectedSequence(null);
      setCampaignMode('single');
      setSending(false);
      setProgress({ current: 0, total: 0 });
      setAbTestEnabled(false);
      setAbTestVariantA('');
      setAbTestVariantB('');
      setAbTestSplit(50);
    }
  }, [open]);

  // Get default template for channel
  const getDefaultTemplate = (channel: 'sms' | 'email' | 'call') => {
    return templates.find(t => t.channel === channel && t.is_default);
  };

  // Validate contact data
  const validateContact = (property: Property, type: 'email' | 'phone') => {
    const column = type === 'email' ? selectedEmailColumn : selectedPhoneColumn;
    const value = (property as any)[column];
    
    if (!value) return null;
    
    if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? value : null;
    } else {
      // Basic phone validation (remove non-digits and check length)
      const cleanPhone = value.replace(/\D/g, '');
      return cleanPhone.length >= 10 ? cleanPhone : null;
    }
  };

  // Get best available contact with fallback
  const getBestContact = (property: Property, type: 'email' | 'phone') => {
    // First priority: preferred contacts
    if (type === 'phone' && property.preferred_phones && property.preferred_phones.length > 0) {
      return property.preferred_phones[0]; // Use first preferred phone
    }
    if (type === 'email' && property.preferred_emails && property.preferred_emails.length > 0) {
      return property.preferred_emails[0]; // Use first preferred email
    }

    // Second priority: preferred contacts from skip tracing data
    if (type === 'phone' && property.skip_tracing_data?.preferred_phones && property.skip_tracing_data.preferred_phones.length > 0) {
      return property.skip_tracing_data.preferred_phones[0];
    }
    if (type === 'email' && property.skip_tracing_data?.preferred_emails && property.skip_tracing_data.preferred_emails.length > 0) {
      return property.skip_tracing_data.preferred_emails[0];
    }

    // Third priority: primary column
    const primary = validateContact(property, type);
    if (primary) return primary;

    if (!enableFallback) return null;

    // Fourth priority: fallback columns
    const fallbackColumns = type === 'email'
      ? ['email1', 'email2', 'email3', 'owner_email']
      : ['phone1', 'phone2', 'phone3', 'phone4', 'phone5', 'owner_phone'];

    for (const col of fallbackColumns) {
      if (col !== (type === 'email' ? selectedEmailColumn : selectedPhoneColumn)) {
        const value = (property as any)[col];
        if (value) {
          const validated = type === 'email'
            ? (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null)
            : (value.replace(/\D/g, '').length >= 10 ? value.replace(/\D/g, '') : null);
          if (validated) return validated;
        }
      }
    }

    return null;
  };

  // Remove duplicates based on contact
  const removeDuplicateContacts = (properties: Property[], type: 'email' | 'phone') => {
    const seen = new Set<string>();
    return properties.filter(property => {
      const contact = getBestContact(property, type);
      if (!contact || seen.has(contact)) return false;
      seen.add(contact);
      return true;
    });
  };

  // Send campaign
  const handleSendCampaign = async () => {
    // Validation based on campaign mode
    if (campaignMode === 'single' && !selectedTemplate) {
      toast({
        title: 'Selecione um template',
        description: 'Escolha um tipo de campanha para continuar.',
        variant: 'destructive'
      });
      return;
    }

    if (campaignMode === 'sequence' && !selectedSequence) {
      toast({
        title: 'Selecione uma sequência',
        description: 'Escolha uma sequência de campanha para continuar.',
        variant: 'destructive'
      });
      return;
    }

    if (campaignMode === 'ab-test' && (!abTestVariantA || !abTestVariantB || !selectedTemplate)) {
      toast({
        title: 'Configure o A/B Test',
        description: 'Preencha ambas as variantes e selecione o canal.',
        variant: 'destructive'
      });
      return;
    }

    setSending(true);

    try {
      if (campaignMode === 'sequence') {
        await handleSendSequence();
      } else if (campaignMode === 'ab-test') {
        await handleSendABTest();
      } else {
        await handleSendSingle();
      }
    } catch (error) {
      console.error('Campaign error:', error);
      toast({
        title: 'Erro na campanha',
        description: 'Ocorreu um erro ao enviar a campanha.',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendSingle = async () => {
    // Filter and deduplicate properties based on contact availability
    const validProperties = removeDuplicateContacts(properties, selectedTemplate!.channel === 'email' ? 'email' : 'phone');

    if (validProperties.length === 0) {
      toast({
        title: 'Nenhum contato válido',
        description: `Nenhuma propriedade tem ${selectedTemplate!.channel === 'email' ? 'email' : 'telefone'} válido na coluna selecionada`,
        variant: 'destructive'
      });
      return;
    }

    setProgress({ current: 0, total: validProperties.length });

    const template = getDefaultTemplate(selectedTemplate!.channel);
    if (!template) {
      toast({
        title: 'Template não encontrado',
        description: `Configure um template padrão para ${selectedTemplate!.channel}`,
        variant: 'destructive'
      });
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < validProperties.length; i++) {
      const property = validProperties[i];
      setProgress({
        current: i + 1,
        total: validProperties.length,
        currentProperty: property.address
      });

      try {
        await sendSingleMessage(property, selectedTemplate!.channel, template);
        successCount++;
      } catch (error) {
        console.error(`Error sending to ${property.address}:`, error);
        errorCount++;
      }

      // Rate limiting delay
      if (i < validProperties.length - 1) {
        await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
      }
    }

    showResults(successCount, validProperties.length, errorCount);
  };

  const handleSendSequence = async () => {
    if (!selectedSequence) return;

    setProgress({ current: 0, total: selectedSequence.steps.length * properties.length });

    let totalSuccess = 0;
    let totalError = 0;

    for (const step of selectedSequence.steps) {
      const template = getDefaultTemplate(step.channel);
      if (!template) continue;

      const validProperties = removeDuplicateContacts(properties, step.channel === 'email' ? 'email' : 'phone');

      for (let i = 0; i < validProperties.length; i++) {
        const property = validProperties[i];
        setProgress(prev => ({
          ...prev,
          current: prev.current + 1,
          currentProperty: `${step.channel.toUpperCase()}: ${property.address}`
        }));

        try {
          await sendSingleMessage(property, step.channel, template);
          totalSuccess++;
        } catch (error) {
          console.error(`Error in sequence step ${step.channel}:`, error);
          totalError++;
        }

        // Rate limiting delay
        if (i < validProperties.length - 1) {
          await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
        }
      }

      // Delay between sequence steps (except for the first one)
      if (selectedSequence.steps.indexOf(step) < selectedSequence.steps.length - 1) {
        const nextStep = selectedSequence.steps[selectedSequence.steps.indexOf(step) + 1];
        if (nextStep.delay > 0) {
          // In real implementation, this would be scheduled for later
          // For now, we'll just add a small delay for demonstration
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    showResults(totalSuccess, selectedSequence.steps.length * properties.length, totalError);
  };

  const handleSendABTest = async () => {
    if (!selectedTemplate) return;

    const validProperties = removeDuplicateContacts(properties, selectedTemplate.channel === 'email' ? 'email' : 'phone');
    const template = getDefaultTemplate(selectedTemplate.channel);

    if (!template || validProperties.length === 0) return;

    setProgress({ current: 0, total: validProperties.length });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < validProperties.length; i++) {
      const property = validProperties[i];
      setProgress({
        current: i + 1,
        total: validProperties.length,
        currentProperty: property.address
      });

      try {
        // Determine which variant to use (A/B split)
        const useVariantA = Math.random() * 100 < abTestSplit;
        const messageBody = useVariantA ? abTestVariantA : abTestVariantB;

        await sendSingleMessage(property, selectedTemplate.channel, { ...template, body: messageBody });
        successCount++;
      } catch (error) {
        console.error(`Error in A/B test:`, error);
        errorCount++;
      }

      // Rate limiting delay
      if (i < validProperties.length - 1) {
        await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
      }
    }

    showResults(successCount, validProperties.length, errorCount);
  };

  const generateTrackingPixel = (propertyId: string, sourceChannel: string = 'email') => {
    const trackingUrl = `${window.location.origin}/api/track/email-open?property=${propertyId}&channel=${sourceChannel}&t=${Date.now()}`;
    return `<img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />`;
  };

  const generateUnsubscribeUrl = (propertyId: string) => {
    return `${window.location.origin}/unsubscribe?property=${propertyId}`;
  };

  const sendSingleMessage = async (property: Property, channel: 'sms' | 'email' | 'call', template: any) => {
    // Get best available contact
    const contact = getBestContact(property, channel === 'email' ? 'email' : 'phone');
    if (!contact) throw new Error('No contact available');

    // Prepare message with variables
    let message = template.body;
    let subject = template.subject || '';

    const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;
    const propertyUrl = `https://offer.mylocalinvest.com/property/${property.id}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(propertyUrl)}`;
    const trackingPixel = generateTrackingPixel(property.id, channel);
    const unsubscribeUrl = generateUnsubscribeUrl(property.id);

    const variables = {
      '{name}': property.owner_name || 'Valued Homeowner',
      '{address}': property.address,
      '{city}': property.city,
      '{state}': property.state,
      '{cash_offer}': property.cash_offer_amount ? `$${property.cash_offer_amount.toLocaleString()}` : '$XXX,XXX',
      '{company_name}': 'Your Real Estate Company',
      '{phone}': '(555) 123-4567',
      '{seller_name}': 'Your Agent Name',
      '{full_address}': fullAddress,
      '{property_url}': propertyUrl,
      '{qr_code_url}': qrCodeUrl,
      '{source_channel}': channel,
      '{tracking_pixel}': trackingPixel,
      '{unsubscribe_url}': unsubscribeUrl
    };

    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(new RegExp(key, 'g'), value);
      subject = subject.replace(new RegExp(key, 'g'), value);
    });

    // Send based on channel
    let response: any = { message: 'Sent successfully' };
    if (channel === 'sms') {
      response = await sendSMS({ phone_number: contact, body: message });
    } else if (channel === 'email') {
      response = await sendEmail({ receiver_email: contact, subject, message_body: message });
    } else if (channel === 'call') {
      response = await initiateCall({
        name: property.owner_name || 'Homeowner',
        address: property.address,
        from_number: '(555) 123-4567',
        to_number: contact,
        voicemail_drop: message,
        seller_name: 'Your Agent Name'
      });
    }

    // Add to marketing history
    const historyItem = {
      id: `${Date.now()}-${property.id}-${channel}`,
      timestamp: new Date(),
      recipient: {
        name: property.owner_name || 'Homeowner',
        phone_number: channel === 'sms' ? contact : property.owner_phone || '',
        email: channel === 'email' ? contact : property.owner_email || '',
        address: property.address,
        seller_name: 'Your Agent Name',
      },
      channels: [channel],
      response,
      status: 'sent' as const,
      test_mode: testMode,
    };
    addToHistory(historyItem);

    // Update property communication status
    await supabase
      .from('properties')
      .update({
        [`${channel}_sent`]: true,
        [`${channel}_sent_at`]: new Date().toISOString()
      })
      .eq('id', property.id);
  };

  const showResults = (successCount: number, total: number, errorCount: number) => {
    toast({
      title: testMode ? 'Modo Teste - Simulação Completa' : 'Campanha Enviada!',
      description: `${successCount} de ${total} mensagens enviadas com sucesso${errorCount > 0 ? ` (${errorCount} erros)` : ''}`,
      variant: successCount > 0 ? 'default' : 'destructive'
    });

    if (successCount > 0) {
      onSuccess?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {sending ? (
          /* Sending Progress */
          <div className="space-y-6">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <h3 className="font-medium">Enviando campanha...</h3>
              <p className="text-sm text-muted-foreground">
                {progress.current} de {progress.total} mensagens
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>

            {progress.currentProperty && (
              <p className="text-xs text-center text-muted-foreground">
                Enviando para: {progress.currentProperty}
              </p>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Não feche esta janela até a campanha terminar. Isso pode levar alguns minutos.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                Campanha Rápida
              </DialogTitle>
              <DialogDescription>
                Envie uma campanha automática para {properties.length} propriedade{properties.length !== 1 ? 's' : ''} aprovada{properties.length !== 1 ? 's' : ''}
              </DialogDescription>
            </DialogHeader>

            {/* Debug info */}
            <div className="mb-4 p-2 bg-yellow-100 rounded text-xs">
              Debug: sending={sending ? 'true' : 'false'}, templates={templates.length}, properties={properties.length}, open={open ? 'true' : 'false'}
            </div>

            {/* CAMPANHA SEQUENCIAL - MELHORIA SUGERIDA */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">💡 Sugestão: Campanha Sequencial</h3>
              <p className="text-sm text-blue-800 mb-2">
                Em vez de escolher apenas 1 canal, que tal uma sequência inteligente?
              </p>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• <strong>Dia 1:</strong> SMS rápido (imediato)</p>
                <p>• <strong>Dia 3:</strong> Email profissional (se SMS não respondeu)</p>
                <p>• <strong>Dia 7:</strong> Ligação pessoal (último esforço)</p>
              </div>
            </div>

            {/* CAMPANHA A/B TESTING - MELHORIA SUGERIDA */}
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">🧪 Sugestão: A/B Testing</h3>
              <p className="text-sm text-green-800 mb-2">
                Teste diferentes abordagens para descobrir o que funciona melhor:
              </p>
              <div className="text-xs text-green-700 space-y-1">
                <p>• <strong>Grupo A:</strong> "Oferta urgente - apenas hoje!"</p>
                <p>• <strong>Grupo B:</strong> "Proposta personalizada para você"</p>
                <p>• <strong>Métrica:</strong> Taxa de resposta por abordagem</p>
              </div>
            </div>

            {/* FORCE SHOW FIELDS FOR DEBUGGING */}
            <div className="space-y-4">
              {/* Column Selection */}
              <div>
                <h3 className="font-medium mb-3">Selecionar Colunas de Contato:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-column">Coluna de Email</Label>
                    <Select value={selectedEmailColumn} onValueChange={setSelectedEmailColumn}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione coluna de email" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner_email">owner_email</SelectItem>
                        <SelectItem value="email1">email1</SelectItem>
                        <SelectItem value="email2">email2</SelectItem>
                        <SelectItem value="email3">email3</SelectItem>
                        <SelectItem value="email">email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone-column">Coluna de Telefone</Label>
                    <Select value={selectedPhoneColumn} onValueChange={setSelectedPhoneColumn}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione coluna de telefone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner_phone">owner_phone</SelectItem>
                        <SelectItem value="phone1">phone1</SelectItem>
                        <SelectItem value="phone2">phone2</SelectItem>
                        <SelectItem value="phone3">phone3</SelectItem>
                        <SelectItem value="phone4">phone4</SelectItem>
                        <SelectItem value="phone5">phone5</SelectItem>
                        <SelectItem value="phone">phone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Data Availability Status */}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Data Availability:</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-700">Email ({selectedEmailColumn}):</span>
                      <Badge variant={properties.filter(p => (p as any)[selectedEmailColumn]).length > 0 ? "default" : "secondary"}>
                        {properties.filter(p => (p as any)[selectedEmailColumn]).length} / {properties.length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-700">Phone ({selectedPhoneColumn}):</span>
                      <Badge variant={properties.filter(p => (p as any)[selectedPhoneColumn]).length > 0 ? "default" : "secondary"}>
                        {properties.filter(p => (p as any)[selectedPhoneColumn]).length} / {properties.length}
                      </Badge>
                    </div>
                  </div>
                  {enableFallback && (
                    <p className="text-xs text-blue-600 mt-2">
                      ✓ Fallback enabled - will try alternate columns if primary is empty
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <input
                    type="checkbox"
                    id="enable-fallback"
                    checked={enableFallback}
                    onChange={(e) => setEnableFallback(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="enable-fallback" className="text-sm">
                    Usar fallback para colunas alternativas se a principal não tiver dados
                  </Label>
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="rate-limit">Delay entre envios (ms)</Label>
                  <Select value={rateLimitDelay.toString()} onValueChange={(value) => setRateLimitDelay(parseInt(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">500ms</SelectItem>
                      <SelectItem value="1000">1s</SelectItem>
                      <SelectItem value="2000">2s</SelectItem>
                      <SelectItem value="5000">5s</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Template Selection */}
              <div>
                <h3 className="font-medium mb-3">Escolha o tipo de campanha:</h3>
                <div className="grid grid-cols-1 gap-3">
                  {QUICK_TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    const isSelected = selectedTemplate?.id === template.id;
                    const defaultTemplate = getDefaultTemplate(template.channel);

                    return (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${template.color} text-white`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{template.name}</h4>
                                {defaultTemplate ? (
                                  <Badge variant="secondary" className="text-xs">
                                    Template configurado
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-orange-600">
                                    Template necessário
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {template.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                ⏱️ {template.estimatedTime}
                              </p>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-primary" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Properties Preview */}
              <div>
                <h3 className="font-medium mb-3">Propriedades selecionadas:</h3>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {properties.slice(0, 5).map((property) => (
                    <div key={property.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm font-medium">{property.address}</span>
                      <div className="flex gap-2">
                        {(property as any)[selectedPhoneColumn] && <Badge variant="outline" className="text-xs">📱</Badge>}
                        {(property as any)[selectedEmailColumn] && <Badge variant="outline" className="text-xs">✉️</Badge>}
                      </div>
                    </div>
                  ))}
                  {properties.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      +{properties.length - 5} mais propriedades...
                    </p>
                  )}
                </div>
              </div>

              {/* Validation Summary */}
              {((campaignMode === 'single' && selectedTemplate) ||
                (campaignMode === 'ab-test' && selectedTemplate)) && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Resumo da Validação:</h4>
                  <div className="text-xs text-blue-800 space-y-1">
                    <p>• {removeDuplicateContacts(properties, selectedTemplate!.channel === 'email' ? 'email' : 'phone').length}
                      de {properties.length} propriedades têm {selectedTemplate!.channel === 'email' ? 'email' : 'telefone'} válido</p>
                    {enableFallback && <p>• Fallback ativado para colunas alternativas</p>}
                    <p>• Delay de {rateLimitDelay}ms entre envios</p>
                    {campaignMode === 'ab-test' && (
                      <p>• Teste A/B: {abTestSplit}% recebem variante A, {100 - abTestSplit}% recebem variante B</p>
                    )}
                  </div>
                </div>
              )}

              {campaignMode === 'sequence' && selectedSequence && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900 mb-2">Sequência Selecionada:</h4>
                  <div className="text-xs text-green-800 space-y-1">
                    <p>• <strong>{selectedSequence.name}</strong> - {selectedSequence.expectedConversion}</p>
                    <p>• Duração estimada: {selectedSequence.estimatedDuration}</p>
                    <p>• {selectedSequence.steps.length} passos automatizados</p>
                  </div>
                </div>
              )}

            {/* Test Mode Warning */}
              {testMode && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Modo Teste Ativado:</strong> As mensagens serão simuladas, não serão enviadas realmente.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSendCampaign}
                disabled={
                  (campaignMode === 'single' && (!selectedTemplate || !getDefaultTemplate(selectedTemplate.channel))) ||
                  (campaignMode === 'sequence' && !selectedSequence) ||
                  (campaignMode === 'ab-test' && (!selectedTemplate || !abTestVariantA || !abTestVariantB))
                }
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                {campaignMode === 'single' && (selectedTemplate ? `Enviar ${selectedTemplate.name}` : 'Selecionar Template')}
                {campaignMode === 'sequence' && (selectedSequence ? `Enviar ${selectedSequence.name}` : 'Selecionar Sequência')}
                {campaignMode === 'ab-test' && (selectedTemplate ? `Executar A/B Test` : 'Configurar Teste')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

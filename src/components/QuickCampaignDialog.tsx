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
  AlertCircle
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

export const QuickCampaignDialog = ({
  properties,
  open,
  onOpenChange,
  onSuccess
}: QuickCampaignDialogProps) => {
  const { toast } = useToast();
  const testMode = useMarketingStore((state) => state.settings.defaults.test_mode);
  const { templates } = useTemplates();

  const [selectedTemplate, setSelectedTemplate] = useState<QuickTemplate | null>(null);
  const [sending, setSending] = useState(false);
  const [selectedEmailColumn, setSelectedEmailColumn] = useState<string>('owner_email');
  const [selectedPhoneColumn, setSelectedPhoneColumn] = useState<string>('owner_phone');
  const [enableFallback, setEnableFallback] = useState<boolean>(true);
  const [rateLimitDelay, setRateLimitDelay] = useState<number>(1000); // 1 second between sends
  const [progress, setProgress] = useState<{ current: number; total: number; currentProperty?: string }>({
    current: 0,
    total: 0
  });

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTemplate(null);
      setSending(false);
      setProgress({ current: 0, total: 0 });
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
    // Try primary column first
    const primary = validateContact(property, type);
    if (primary) return primary;
    
    if (!enableFallback) return null;
    
    // Try fallback columns
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
    if (!selectedTemplate) return;

    // Filter and deduplicate properties based on contact availability
    const validProperties = removeDuplicateContacts(properties, selectedTemplate.channel === 'email' ? 'email' : 'phone');
    
    if (validProperties.length === 0) {
      toast({
        title: 'Nenhum contato válido',
        description: `Nenhuma propriedade tem ${selectedTemplate.channel === 'email' ? 'email' : 'telefone'} válido na coluna selecionada`,
        variant: 'destructive'
      });
      return;
    }

    setSending(true);
    setProgress({ current: 0, total: validProperties.length });

    const template = getDefaultTemplate(selectedTemplate.channel);
    if (!template) {
      toast({
        title: 'Template não encontrado',
        description: `Configure um template padrão para ${selectedTemplate.channel}`,
        variant: 'destructive'
      });
      setSending(false);
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
        // Get best available contact
        const contact = getBestContact(property, selectedTemplate.channel === 'email' ? 'email' : 'phone');
        if (!contact) {
          errorCount++;
          continue;
        }

        // Prepare message with variables
        let message = template.body;
        let subject = template.subject || '';

        // Replace variables
        const variables = {
          '{name}': property.owner_name || 'Valued Homeowner',
          '{address}': property.address,
          '{city}': property.city,
          '{state}': property.state,
          '{cash_offer}': property.cash_offer_amount ? `$${property.cash_offer_amount.toLocaleString()}` : '$XXX,XXX',
          '{company_name}': 'Your Real Estate Company',
          '{phone}': '(555) 123-4567',
          '{seller_name}': 'Your Agent Name'
        };

        Object.entries(variables).forEach(([key, value]) => {
          message = message.replace(new RegExp(key, 'g'), value);
          subject = subject.replace(new RegExp(key, 'g'), value);
        });

        // Send based on channel
        if (selectedTemplate.channel === 'sms') {
          await sendSMS({ phone_number: contact, body: message });
        } else if (selectedTemplate.channel === 'email') {
          await sendEmail({ receiver_email: contact, subject, message_body: message });
        } else if (selectedTemplate.channel === 'call') {
          await initiateCall({
            name: property.owner_name || 'Homeowner',
            address: property.address,
            from_number: '(555) 123-4567',
            to_number: contact,
            voicemail_drop: message,
            seller_name: 'Your Agent Name'
          });
        }

        successCount++;

        // Update property communication status
        await supabase
          .from('properties')
          .update({
            [`${selectedTemplate.channel}_sent`]: true,
            [`${selectedTemplate.channel}_sent_at`]: new Date().toISOString()
          })
          .eq('id', property.id);

      } catch (error) {
        console.error(`Error sending to ${property.address}:`, error);
        errorCount++;
      }

      // Rate limiting delay
      if (i < validProperties.length - 1) {
        await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
      }
    }

    setSending(false);

    // Show results
    toast({
      title: testMode ? 'Modo Teste - Simulação Completa' : 'Campanha Enviada!',
      description: `${successCount} de ${validProperties.length} mensagens enviadas com sucesso${errorCount > 0 ? ` (${errorCount} erros)` : ''}`,
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
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Campanha Rápida
          </DialogTitle>
          <DialogDescription>
            Envie uma campanha automática para {properties.length} propriedade{properties.length !== 1 ? 's' : ''} aprovada{properties.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        {!sending ? (
          <>
            {/* Column Selection */}
            <div className="space-y-4">
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
            </div>

            {/* Template Selection */}
            <div className="space-y-4">
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
              {selectedTemplate && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Resumo da Validação:</h4>
                  <div className="text-xs text-blue-800 space-y-1">
                    <p>• {removeDuplicateContacts(properties, selectedTemplate.channel === 'email' ? 'email' : 'phone').length} 
                      de {properties.length} propriedades têm {selectedTemplate.channel === 'email' ? 'email' : 'telefone'} válido</p>
                    {enableFallback && <p>• Fallback ativado para colunas alternativas</p>}
                    <p>• Delay de {rateLimitDelay}ms entre envios</p>
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
                disabled={!selectedTemplate || !getDefaultTemplate(selectedTemplate.channel)}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                {selectedTemplate ? `Enviar ${selectedTemplate.name}` : 'Selecionar Template'}
              </Button>
            </DialogFooter>
          </>
        ) : (
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
        )}
      </DialogContent>
    </Dialog>
  );
};

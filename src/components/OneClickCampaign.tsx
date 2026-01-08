/**
 * OneClickCampaign - Botão mágico que faz tudo automaticamente
 * 1 clique = Seleciona propriedades aprovadas + Template padrão + Envia
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMarketingStore } from '@/store/marketingStore';
import { useTemplates } from '@/hooks/useTemplates';
import { sendSMS, sendEmail, initiateCall } from '@/services/marketingService';
import { supabase } from '@/integrations/supabase/client';
import { Rocket, Zap, Loader2 } from 'lucide-react';

interface OneClickCampaignProps {
  selectedProperties: Array<{
    id: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    owner_name?: string;
    cash_offer_amount?: number;
    owner_phone?: string;
    owner_email?: string;
  }>;
  onSuccess?: () => void;
}

export const OneClickCampaign = ({ selectedProperties, onSuccess }: OneClickCampaignProps) => {
  const { toast } = useToast();
  const testMode = useMarketingStore((state) => state.settings.defaults.test_mode);
  const { templates } = useTemplates();
  const [sending, setSending] = useState(false);

  // Estratégia inteligente: tenta SMS primeiro, depois email, depois call
  const getBestChannelAndTemplate = () => {
    // 1. Prefer SMS (mais rápido, mais barato)
    const smsTemplate = templates.find(t => t.channel === 'sms' && t.is_default);
    if (smsTemplate) return { channel: 'sms' as const, template: smsTemplate };

    // 2. Depois Email (mais profissional)
    const emailTemplate = templates.find(t => t.channel === 'email' && t.is_default);
    if (emailTemplate) return { channel: 'email' as const, template: emailTemplate };

    // 3. Por último Call (mais caro, mas pessoal)
    const callTemplate = templates.find(t => t.channel === 'call' && t.is_default);
    if (callTemplate) return { channel: 'call' as const, template: callTemplate };

    return null;
  };

  const handleOneClickCampaign = async () => {
    if (selectedProperties.length === 0) {
      toast({
        title: 'Nenhuma propriedade selecionada',
        description: 'Selecione pelo menos uma propriedade para enviar campanha.',
        variant: 'destructive'
      });
      return;
    }

    const campaignConfig = getBestChannelAndTemplate();
    if (!campaignConfig) {
      toast({
        title: 'Nenhum template configurado',
        description: 'Configure pelo menos um template padrão em Templates.',
        variant: 'destructive'
      });
      return;
    }

    setSending(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const property of selectedProperties) {
        try {
          // Prepare message with variables
          let message = campaignConfig.template.body;
          let subject = campaignConfig.template.subject || '';

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
          if (campaignConfig.channel === 'sms') {
            const phoneNumber = property.owner_phone;
            if (phoneNumber) {
              await sendSMS(phoneNumber, message);
            } else {
              throw new Error('No phone number');
            }
          } else if (campaignConfig.channel === 'email') {
            const email = property.owner_email;
            if (email) {
              await sendEmail(email, subject, message);
            } else {
              throw new Error('No email');
            }
          } else if (campaignConfig.channel === 'call') {
            const phoneNumber = property.owner_phone;
            if (phoneNumber) {
              await initiateCall(
                property.owner_name || 'Homeowner',
                property.address,
                '(555) 123-4567',
                phoneNumber,
                message,
                'Your Agent Name'
              );
            } else {
              throw new Error('No phone number');
            }
          }

          successCount++;

          // Update property status
          await supabase
            .from('properties')
            .update({
              [`${campaignConfig.channel}_sent`]: true,
              [`${campaignConfig.channel}_sent_at`]: new Date().toISOString()
            })
            .eq('id', property.id);

        } catch (error) {
          console.error(`Error sending to ${property.address}:`, error);
          errorCount++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Success feedback
      const channelName = {
        sms: 'SMS',
        email: 'Email',
        call: 'Ligação'
      }[campaignConfig.channel];

      toast({
        title: testMode ? '🎭 Modo Teste - Simulação Completa!' : '🚀 Campanha Enviada Automaticamente!',
        description: `${successCount} mensagens ${channelName} enviadas${errorCount > 0 ? ` (${errorCount} erros)` : ''}`,
        variant: successCount > 0 ? 'default' : 'destructive'
      });

      if (successCount > 0) {
        onSuccess?.();
      }

    } catch (error) {
      toast({
        title: 'Erro na campanha',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const campaignConfig = getBestChannelAndTemplate();
  const hasValidSetup = selectedProperties.length > 0 && campaignConfig;

  return (
    <Button
      onClick={handleOneClickCampaign}
      disabled={sending || !hasValidSetup}
      className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
      size="lg"
    >
      {sending ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Enviando...
        </>
      ) : (
        <>
          <Zap className="w-5 h-5" />
          1-Click Campaign
          {campaignConfig && (
            <span className="ml-2 text-xs opacity-90">
              ({campaignConfig.channel.toUpperCase()})
            </span>
          )}
        </>
      )}
    </Button>
  );
};</content>
<parameter name="filePath">g:\My Drive\Sell House - code\Orlando\Step 5 - Outreach & Campaigns\src\components\OneClickCampaign.tsx
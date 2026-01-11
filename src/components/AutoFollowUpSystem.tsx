/**
 * Auto Follow-up System
 * Detecta cliques nas páginas de propriedades e dispara follow-ups automáticos
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendSMS, sendEmail, initiateCall } from "@/services/marketingService";

interface ClickEvent {
  id: string;
  property_id: string;
  property_address: string;
  recipient_name: string;
  recipient_email: string;
  recipient_phone: string;
  channel: string;
  click_source: string; // 'sms', 'email', 'call', etc.
  clicked_at: string;
  follow_up_sent?: boolean;
  follow_up_sent_at?: string;
}

interface AutoFollowUpProps {
  propertyId?: string;
  clickSource?: string;
  onFollowUpTriggered?: (followUp: any) => void;
}

export const AutoFollowUpSystem = ({
  propertyId,
  clickSource,
  onFollowUpTriggered
}: AutoFollowUpProps) => {
  const { toast } = useToast();
  const [lastClick, setLastClick] = useState<ClickEvent | null>(null);

  // Detectar cliques na página da propriedade
  useEffect(() => {
    const detectClick = async () => {
      if (!propertyId || !clickSource) return;

      try {
        // Registrar o clique
        const { data: clickData, error } = await supabase
          .from("campaign_clicks")
          .insert({
            property_id: propertyId,
            click_source: clickSource,
            clicked_at: new Date().toISOString(),
            user_agent: navigator.userAgent,
            referrer: document.referrer,
          })
          .select()
          .single();

        if (error) throw error;

        setLastClick(clickData);

        // Agendar follow-up automático após 5 minutos
        setTimeout(() => {
          triggerAutoFollowUp(clickData);
        }, 5 * 60 * 1000); // 5 minutos

      } catch (error) {
        console.error("Error registering click:", error);
      }
    };

    detectClick();
  }, [propertyId, clickSource]);

  const triggerAutoFollowUp = async (clickEvent: ClickEvent) => {
    try {
      // Verificar se já foi enviado follow-up
      if (clickEvent.follow_up_sent) return;

      // Buscar dados da propriedade e contato
      const { data: property } = await supabase
        .from("properties")
        .select("*, owner_name, owner_phone, owner_email, preferred_phones, preferred_emails")
        .eq("id", clickEvent.property_id)
        .single();

      if (!property) return;

      // Preparar dados para follow-up
      const followUpData = {
        name: property.owner_name || "Property Owner",
        address: property.address,
        city: property.city,
        state: property.state,
        phone: property.owner_phone || (property.preferred_phones ? JSON.parse(property.preferred_phones)[0] : null),
        email: property.owner_email || (property.preferred_emails ? JSON.parse(property.preferred_emails)[0] : null),
        property_url: `${window.location.origin}/property/${property.slug}?src=followup`,
        cash_offer: property.cash_offer_amount?.toLocaleString() || "TBD",
        estimated_value: property.estimated_value?.toLocaleString() || "TBD",
        company_name: "MyLocalInvest",
        seller_name: "Mike Johnson",
      };

      // Escolher canal baseado no clique original
      let followUpChannel = 'sms'; // default
      let contactInfo = followUpData.phone;

      if (clickEvent.click_source === 'email' && followUpData.email) {
        followUpChannel = 'email';
        contactInfo = followUpData.email;
      } else if (clickEvent.click_source === 'call' && followUpData.phone) {
        followUpChannel = 'call';
        contactInfo = followUpData.phone;
      }

      if (!contactInfo) return; // Sem contato disponível

      // Enviar follow-up baseado no canal
      let success = false;

      if (followUpChannel === 'sms' && followUpData.phone) {
        const smsBody = `Hi ${followUpData.name}! Thanks for checking our offer. We noticed you viewed details for ${followUpData.address}. Our ${followUpData.cash_offer} offer is still available. Ready to move forward? Call us: ${followUpData.phone}`;

        success = await sendSMS({
          phone_number: followUpData.phone,
          body: smsBody,
          test_mode: false,
        });
      }

      else if (followUpChannel === 'email' && followUpData.email) {
        const emailSubject = `Following up on ${followUpData.address} - Our offer is waiting`;
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Thank you for your interest in ${followUpData.address}</h2>
            <p>Hi ${followUpData.name},</p>
            <p>We noticed you viewed our cash offer details. Our offer of <strong>$${followUpData.cash_offer}</strong> is still available!</p>
            <p>Estimated property value: <strong>$${followUpData.estimated_value}</strong></p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="tel:+17868828251" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Call Now: (786) 882-8251</a>
            </div>
            <p>We're ready to move forward quickly and can close in as little as 7 days.</p>
            <p>Best regards,<br>Mike Johnson<br>MyLocalInvest</p>
          </div>
        `;

        success = await sendEmail({
          receiver_email: followUpData.email,
          subject: emailSubject,
          message_body: emailBody,
        });
      }

      else if (followUpChannel === 'call' && followUpData.phone) {
        const voicemailBody = `Hi ${followUpData.name}, this is Mike from MyLocalInvest following up. We noticed you viewed our cash offer for ${followUpData.address}. Our $${followUpData.cash_offer} offer is still available and we're ready to move forward quickly. Please call us back at your convenience. Thank you!`;

        success = await initiateCall({
          name: followUpData.name,
          address: followUpData.address,
          from_number: "+17868828251",
          to_number: followUpData.phone,
          voicemail_drop: voicemailBody,
          seller_name: "Mike Johnson",
          test_mode: false,
        });
      }

      if (success) {
        // Registrar follow-up enviado
        await supabase
          .from("campaign_clicks")
          .update({
            follow_up_sent: true,
            follow_up_sent_at: new Date().toISOString(),
            follow_up_channel: followUpChannel,
          })
          .eq("id", clickEvent.id);

        // Notificar callback
        if (onFollowUpTriggered) {
          onFollowUpTriggered({
            ...clickEvent,
            follow_up_channel: followUpChannel,
            follow_up_sent_at: new Date().toISOString(),
          });
        }

        toast({
          title: "Auto Follow-up Sent",
          description: `Follow-up ${followUpChannel} sent to ${followUpData.name}`,
        });
      }

    } catch (error) {
      console.error("Error sending auto follow-up:", error);
    }
  };

  // Este componente não renderiza nada visualmente
  return null;
};

// Hook para usar o sistema de follow-up automático
export const useAutoFollowUp = (propertyId?: string, clickSource?: string) => {
  const [followUps, setFollowUps] = useState<any[]>([]);

  const triggerFollowUp = (followUp: any) => {
    setFollowUps(prev => [...prev, followUp]);
  };

  return {
    followUps,
    AutoFollowUpComponent: () => (
      <AutoFollowUpSystem
        propertyId={propertyId}
        clickSource={clickSource}
        onFollowUpTriggered={triggerFollowUp}
      />
    ),
  };
};
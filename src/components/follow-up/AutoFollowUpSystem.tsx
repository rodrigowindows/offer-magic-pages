/**
 * Auto Follow-up System
 * Detecta cliques nas páginas de propriedades e dispara follow-ups automáticos
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [lastClickId, setLastClickId] = useState<string | null>(null);

  // Detectar cliques na página da propriedade (via edge function — anon-safe)
  useEffect(() => {
    const detectClick = async () => {
      if (!propertyId || !clickSource) return;

      try {
        const { data, error } = await supabase.functions.invoke("track-analytics", {
          body: {
            propertyId,
            eventType: "click",
            source: clickSource,
            referrer: document.referrer || window.location.href,
            userAgent: navigator.userAgent,
          },
        });

        if (error) throw error;

        const clickId =
          (data as { id?: string; eventId?: string } | null)?.id ??
          (data as { eventId?: string } | null)?.eventId ??
          `click-${Date.now()}-${propertyId}`;

        setLastClickId(clickId);

        // Agendar follow-up automático após 5 minutos
        setTimeout(() => {
          triggerAutoFollowUp(clickId, propertyId);
        }, 5 * 60 * 1000);
      } catch (error) {
        console.error("Error registering click:", error);
      }
    };

    detectClick();
  }, [propertyId, clickSource]);

  const triggerAutoFollowUp = async (clickId: string, propId: string) => {
    try {
      // Buscar dados da propriedade
      const { data: property } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propId)
        .single();

      if (!property) return;

      // Preparar dados para follow-up usando campos que existem na tabela
      const followUpData = {
        name: property.owner_name || property.matched_first_name || "Property Owner",
        address: property.address,
        city: property.city,
        state: property.state,
        phone: property.owner_phone || property.phone1,
        email: property.email1,
        property_url: `${window.location.origin}/property/${property.slug}?src=followup`,
        cash_offer: property.cash_offer_amount?.toLocaleString() || "TBD",
        estimated_value: property.estimated_value?.toLocaleString() || "TBD",
        company_name: "MyLocalInvest",
        seller_name: "Mike Johnson",
      };

      if (!followUpData.phone && !followUpData.email) return; // Sem contato disponível

      // Registrar follow-up enviado
      await supabase
        .from("campaign_logs")
        .update({
          metadata: {
            follow_up_sent: true,
            follow_up_sent_at: new Date().toISOString(),
            follow_up_data: followUpData
          }
        })
        .eq("id", clickId);

      // Notificar callback
      if (onFollowUpTriggered) {
        onFollowUpTriggered({
          clickId,
          propertyId: propId,
          follow_up_sent_at: new Date().toISOString(),
          followUpData
        });
      }

      toast({
        title: "Auto Follow-up Scheduled",
        description: `Follow-up prepared for ${followUpData.name}`,
      });

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

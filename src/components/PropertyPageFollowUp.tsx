/**
 * Property Page Follow-up Integration
 * Componente para integrar follow-up automático nas páginas de propriedades
 */

import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AutoFollowUpSystem } from "./AutoFollowUpSystem";

interface PropertyPageFollowUpProps {
  propertyId: string;
  propertyAddress: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
}

export const PropertyPageFollowUp = ({
  propertyId,
  propertyAddress,
  ownerName,
  ownerEmail,
  ownerPhone,
}: PropertyPageFollowUpProps) => {
  const [searchParams] = useSearchParams();
  const clickSource = searchParams.get('src') || 'direct';

  // Registrar clique quando a página carrega
  useEffect(() => {
    const registerPageView = async () => {
      try {
        // Aqui você pode adicionar lógica para registrar visualizações de página
        // Por exemplo, enviar para analytics ou salvar no banco
        console.log(`Property page viewed: ${propertyId} from source: ${clickSource}`);
      } catch (error) {
        console.error('Error registering page view:', error);
      }
    };

    registerPageView();
  }, [propertyId, clickSource]);

  return (
    <AutoFollowUpSystem
      propertyId={propertyId}
      clickSource={clickSource}
      onFollowUpTriggered={(followUp) => {
        console.log('Auto follow-up triggered:', followUp);
        // Aqui você pode adicionar notificações ou outras ações
      }}
    />
  );
};
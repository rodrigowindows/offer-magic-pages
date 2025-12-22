import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useMarketingStore } from '@/store/marketingStore';
import {
  sendCommunication,
  sendBatchCommunication,
  checkHealth,
} from '@/services/marketingService';
import type {
  CommunicationPayload,
  CommunicationResponse,
  CommunicationHistory,
} from '@/types/marketing.types';

export const useMarketing = () => {
  const store = useMarketingStore();
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Health Check
  const performHealthCheck = useCallback(async () => {
    try {
      const result = await checkHealth();
      const isHealthy = result.status === 'healthy';
      store.setApiHealthy(isHealthy);
      return isHealthy;
    } catch (error) {
      console.error('Health check failed:', error);
      store.setApiHealthy(false);
      return false;
    }
  }, [store]);

  // Enviar comunicado individual
  const sendIndividualCommunication = useCallback(
    async (payload: Partial<CommunicationPayload>): Promise<CommunicationResponse> => {
      store.setIsSending(true);
      try {
        const response = await sendCommunication(payload);

        // Adicionar ao histórico
        const historyItem: CommunicationHistory = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          recipient: {
            name: payload.name || '',
            phone_number: payload.phone_number || '',
            email: payload.email || '',
            address: payload.address || '',
            seller_name: payload.seller_name,
          },
          channels: payload.channels || [],
          response,
          status: response.error ? 'failed' : 'sent',
          test_mode: payload.test_mode,
        };

        store.addToHistory(historyItem);

        if (payload.test_mode) {
          toast.success('🧪 Test communication sent (simulated)!');
        } else {
          toast.success('Communication sent successfully!');
        }

        return response;
      } catch (error: any) {
        toast.error(error.message || 'Failed to send communication');
        throw error;
      } finally {
        store.setIsSending(false);
      }
    },
    [store]
  );

  // Enviar comunicados em lote
  const sendBatchCommunications = useCallback(
    async (payloads: Array<Partial<CommunicationPayload>>): Promise<CommunicationResponse[]> => {
      store.setIsSending(true);
      setBatchProgress({ current: 0, total: payloads.length });

      try {
        const results = await sendBatchCommunication(payloads, (current, total) => {
          setBatchProgress({ current, total });
        });

        // Adicionar todos ao histórico
        results.forEach((response, index) => {
          const payload = payloads[index];
          const historyItem: CommunicationHistory = {
            id: `${Date.now()}-${index}`,
            timestamp: new Date(),
            recipient: {
              name: payload.name || '',
              phone_number: payload.phone_number || '',
              email: payload.email || '',
              address: payload.address || '',
              seller_name: payload.seller_name,
            },
            channels: payload.channels || [],
            response,
            status: response.error ? 'failed' : 'sent',
            test_mode: payload.test_mode,
          };

          store.addToHistory(historyItem);
        });

        const successful = results.filter((r) => !r.error).length;
        const failed = results.filter((r) => r.error).length;
        const isTestMode = payloads[0]?.test_mode;

        toast.success(
          `${isTestMode ? '🧪 Test batch' : 'Batch'} complete: ${successful} successful, ${failed} failed`
        );

        return results;
      } catch (error: any) {
        toast.error(error.message || 'Batch send failed');
        throw error;
      } finally {
        store.setIsSending(false);
        setBatchProgress({ current: 0, total: 0 });
      }
    },
    [store]
  );

  // Construir payload a partir do wizard
  const buildPayloadFromWizard = useCallback((): Partial<CommunicationPayload> => {
    const { wizard, settings } = store;

    const payload: Partial<CommunicationPayload> = {
      // Recipient info
      name: wizard.recipientInfo.name,
      phone_number: wizard.recipientInfo.phone_number,
      email: wizard.recipientInfo.email,
      address: wizard.recipientInfo.address,
      seller_name: wizard.recipientInfo.seller_name,

      // Channels
      channels: wizard.selectedChannels,

      // Company config
      ...wizard.companyConfig,

      // LLM config
      ...wizard.llmConfig,

      // Voicemail style
      voicemail_style: wizard.voicemailStyle,

      // Custom messages
      custom_sms_body: wizard.customMessages.sms,
      custom_email_subject: wizard.customMessages.emailSubject,
      custom_email_body: wizard.customMessages.emailBody,
      custom_voicemail: wizard.customMessages.voicemail,

      // NOVO: Test mode
      test_mode: settings.defaults.test_mode,
    };

    return payload;
  }, [store]);

  // Enviar do wizard
  const sendFromWizard = useCallback(async () => {
    const { wizard } = store;

    if (wizard.isBatchMode) {
      // Batch send
      const payloads = wizard.batchRecipients.map((recipient) => ({
        ...buildPayloadFromWizard(),
        name: recipient.name,
        phone_number: recipient.phone_number,
        email: recipient.email,
        address: recipient.address,
        seller_name: recipient.seller_name,
      }));

      return sendBatchCommunications(payloads);
    } else {
      // Individual send
      const payload = buildPayloadFromWizard();
      return sendIndividualCommunication(payload);
    }
  }, [store, buildPayloadFromWizard, sendBatchCommunications, sendIndividualCommunication]);

  return {
    // Estado
    isSending: store.isSending,
    apiHealthy: store.apiHealthy,
    batchProgress,

    // Ações
    performHealthCheck,
    sendIndividualCommunication,
    sendBatchCommunications,
    sendFromWizard,
    buildPayloadFromWizard,
  };
};

export default useMarketing;

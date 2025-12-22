import { getApiInstance, createFormData } from './api';
import type {
  CommunicationPayload,
  CommunicationResponse,
  SendSMSRequest,
  SendEmailRequest,
  InitiateCallRequest,
  HealthCheckResponse,
} from '@/types/marketing.types';

// ===== HEALTH CHECK =====

export const checkHealth = async (): Promise<HealthCheckResponse> => {
  const api = getApiInstance();
  const response = await api.get<HealthCheckResponse>('/health');
  return response.data;
};

// ===== ENVIAR COMUNICADO COMPLETO =====

export const sendCommunication = async (
  payload: Partial<CommunicationPayload>
): Promise<CommunicationResponse> => {
  const api = getApiInstance();

  try {
    const response = await api.post<CommunicationResponse>('/start', payload);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

// ===== ENVIAR SMS INDIVIDUAL =====

export const sendSMS = async (data: SendSMSRequest): Promise<{ message: string }> => {
  const api = getApiInstance();

  try {
    const response = await api.post<{ message: string }>('/send_sms', data);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

// ===== ENVIAR EMAIL INDIVIDUAL =====

export const sendEmail = async (
  data: SendEmailRequest
): Promise<{ message: string }> => {
  const api = getApiInstance();

  try {
    // Se houver imagem, usar FormData
    if (data.image) {
      const formData = createFormData({
        receiver_email: data.receiver_email,
        subject: data.subject,
        message_body: data.message_body,
        image: data.image,
      });

      const response = await api.post<{ message: string }>('/send_email', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }

    // Sem imagem, enviar JSON
    const response = await api.post<{ message: string }>('/send_email', {
      receiver_email: data.receiver_email,
      subject: data.subject,
      message_body: data.message_body,
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

// ===== INICIAR CHAMADA INDIVIDUAL =====

export const initiateCall = async (
  data: InitiateCallRequest
): Promise<{ call_id: string; status: string }> => {
  const api = getApiInstance();

  try {
    const response = await api.post<{ call_id: string; status: string }>(
      '/initiate_call',
      data
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

// ===== ENVIO EM LOTE =====

export const sendBatchCommunication = async (
  recipients: Array<Partial<CommunicationPayload>>,
  onProgress?: (current: number, total: number) => void
): Promise<CommunicationResponse[]> => {
  const results: CommunicationResponse[] = [];

  for (let i = 0; i < recipients.length; i++) {
    try {
      const result = await sendCommunication(recipients[i]);
      results.push(result);

      if (onProgress) {
        onProgress(i + 1, recipients.length);
      }
    } catch (error: any) {
      // Em caso de erro, adicionar resposta de erro
      results.push({
        error: error.message || 'Unknown error',
      });

      if (onProgress) {
        onProgress(i + 1, recipients.length);
      }
    }

    // Pequeno delay entre requisições para não sobrecarregar a API
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
};

// ===== SUBSTITUIÇÃO DE VARIÁVEIS =====

export const replaceVariables = (
  template: string,
  variables: Record<string, string>
): string => {
  let result = template;

  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, variables[key] || '');
  });

  return result;
};

// ===== PREVIEW DE MENSAGEM =====

export const generateMessagePreview = (
  template: string,
  recipient: {
    name: string;
    address: string;
    seller_name?: string;
  },
  company: {
    company_name: string;
    contact_phone: string;
    contact_phone_alt: string;
    city: string;
  }
): string => {
  const variables = {
    name: recipient.name,
    address: recipient.address,
    seller_name: recipient.seller_name || company.company_name,
    company_name: company.company_name,
    contact_phone: company.contact_phone,
    contact_phone_alt: company.contact_phone_alt,
    city: company.city,
    region: company.city,
  };

  return replaceVariables(template, variables);
};

export default {
  checkHealth,
  sendCommunication,
  sendSMS,
  sendEmail,
  initiateCall,
  sendBatchCommunication,
  replaceVariables,
  generateMessagePreview,
};

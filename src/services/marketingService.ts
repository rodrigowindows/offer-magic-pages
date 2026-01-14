import { getApiInstance, createFormData } from './api';
import { supabase } from '@/integrations/supabase/client';
import type {
  CommunicationPayload,
  CommunicationResponse,
  SendSMSRequest,
  SendEmailRequest,
  InitiateCallRequest,
  HealthCheckResponse,
} from '@/types/marketing.types';

// Get Supabase URL from environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;


// ===== PHONE NUMBER CLEANING UTILITY =====
/**
 * Removes all non-numeric characters from phone number
 * @param phone - Phone number with formatting like "(786)882-8251" or "(240) 581-4595"
 * @returns Clean phone number like "7868828251" or "2405814595"
 */
const cleanPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  // Remove all non-numeric characters
  return phone.replace(/\D/g, '');
};
// ===== SKIP TRACE DATA TYPES =====
export interface SkipTracePhone {
  number: string;
  type: string;
  formatted: string;
}

export interface SkipTraceEmail {
  email: string;
  type: string;
}

export interface SkipTracePropertyData {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  // All other property columns are included dynamically
  [key: string]: any;
  skip_trace_summary: {
    total_phones: number;
    total_emails: number;
    has_owner_info: boolean;
    phones: SkipTracePhone[];
    emails: SkipTraceEmail[];
    preferred_phones: string[];
    preferred_emails: string[];
    dnc_status: 'DNC' | 'Clear';
    deceased_status: 'Deceased' | 'Active';
  };
}

export interface SkipTraceResponse {
  success: boolean;
  data: SkipTracePropertyData[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
  };
  summary: {
    total_properties: number;
    properties_with_phones: number;
    properties_with_emails: number;
    properties_with_owner_info: number;
  };
  error?: string;
}

// ===== SKIP TRACE API =====
export const getSkipTracePhones = async (options?: {
  propertyId?: string;
  limit?: number;
  offset?: number;
  hasSkipTraceData?: boolean;
  search?: string;
}): Promise<SkipTraceResponse> => {
  try {
    // Build query parameters
    const params = new URLSearchParams();

    if (options?.propertyId) params.append('propertyId', options.propertyId);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset !== undefined) params.append('offset', options.offset.toString());
    if (options?.hasSkipTraceData) params.append('hasSkipTraceData', 'true');
    if (options?.search) params.append('search', options.search);

    // Call the Supabase Edge Function using environment variables
    const queryString = params.toString();
    const functionUrl = `${SUPABASE_URL}/functions/v1/get-skip-trace-data${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: SkipTraceResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch skip trace data');
    }

    return result;
  } catch (error: any) {
    console.error('Error fetching skip trace phones:', error);
    throw new Error(error.message || 'Failed to fetch skip trace data');
  }
};

// ===== HEALTH CHECK (mantém endpoint antigo) =====
export const checkHealth = async (): Promise<HealthCheckResponse> => {
  const api = getApiInstance();
  const response = await api.get<HealthCheckResponse>('/health');
  return response.data;
};

// ===== ENVIAR COMUNICADO COMPLETO (via MCP) =====
export const sendCommunication = async (
  payload: Partial<CommunicationPayload>
): Promise<CommunicationResponse> => {
  const api = getApiInstance();
  try {
    const response = await api.post('/mcp', {
      operation: 'echo', // ou outro comando, se desejar customizar
      data: payload,
    });
    if (response.data.status === 'ok') {
      return response.data.result;
    } else {
      throw new Error(response.data.error || 'Erro desconhecido na comunicação');
    }
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

// ===== ENVIAR SMS INDIVIDUAL (via MCP) =====
export const sendSMS = async (data: SendSMSRequest): Promise<{ message: string }> => {
  const api = getApiInstance();
  try {
    const response = await api.post('/mcp', {
      operation: 'send_sms',
      data,
    });
    if (response.data.status === 'ok') {
      return { message: 'SMS enviado com sucesso', ...response.data.result };
    } else {
      throw new Error(response.data.error || 'Erro ao enviar SMS');
    }
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

// ===== ENVIAR EMAIL INDIVIDUAL (Híbrido: MCP ou endpoint direto) =====
export const sendEmail = async (
  data: SendEmailRequest
): Promise<{ message: string }> => {
  const api = getApiInstance();
  try {
    // Se houver imagem, usa endpoint DIRETO /send_email com FormData
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

    // Sem imagem, usa endpoint MCP (mais simples e padronizado)
    const response = await api.post('/mcp', {
      operation: 'send_email',
      data: {
        receiver_email: data.receiver_email,
        subject: data.subject,
        message_body: data.message_body,
      },
    });
    if (response.data.status === 'ok') {
      return { message: 'Email enviado com sucesso', ...response.data.result };
    } else {
      throw new Error(response.data.error || 'Erro ao enviar email');
    }
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

// ===== INICIAR CHAMADA INDIVIDUAL (via MCP com Retell API) =====
export const initiateCall = async (
  data: InitiateCallRequest
): Promise<{ call_id: string; status: string }> => {
  const api = getApiInstance();

  // Ensure phone numbers have + prefix for international format
  const formatPhone = (phone: string): string => {
    const cleaned = cleanPhoneNumber(phone);
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  };

  const requestPayload = {
    operation: 'initiate_call',
    phone: formatPhone(data.phone),
    agent_id: data.agent_id,
    from_number: formatPhone(data.from_number),
    dynamic_variables: data.dynamic_variables,
  };

  console.log('📞 [initiateCall] ===== START =====');
  console.log('📞 [initiateCall] API Base URL:', api.defaults.baseURL);
  console.log('📞 [initiateCall] Full URL:', `${api.defaults.baseURL}/mcp`);
  console.log('📞 [initiateCall] Request payload:', JSON.stringify(requestPayload, null, 2));

  try {
    const response = await api.post('/mcp', requestPayload);

    console.log('✅ [initiateCall] Response status:', response.status);
    console.log('✅ [initiateCall] Response data:', JSON.stringify(response.data, null, 2));

    if (response.data.status === 'ok') {
      const result = response.data.result;
      return {
        call_id: result.call_id,
        status: result.call_status || 'registered',
        ...result
      };
    } else {
      throw new Error(response.data.error || 'Failed to initiate call');
    }
  } catch (error: any) {
    console.error('❌ [initiateCall] Error:', error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

// ===== ENVIO EM LOTE (via MCP) =====
export const sendBatchCommunication = async (
  recipients: Array<Partial<CommunicationPayload>>,
  onProgress?: (current: number, total: number) => void
): Promise<CommunicationResponse[]> => {
  const results: CommunicationResponse[] = [];
  for (let i = 0; i < recipients.length; i++) {
    try {
      // Aqui você pode customizar a operação conforme o canal desejado
      const result = await sendCommunication(recipients[i]);
      results.push(result);
      if (onProgress) {
        onProgress(i + 1, recipients.length);
      }
    } catch (error: any) {
      results.push({ error: error.message || 'Unknown error' });
      if (onProgress) {
        onProgress(i + 1, recipients.length);
      }
    }
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
  getSkipTracePhones,
};

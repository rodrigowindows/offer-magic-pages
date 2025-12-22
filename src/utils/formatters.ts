import { format, formatDistance, formatDistanceToNow } from 'date-fns';

/**
 * Formata data para exibição
 */
export const formatDate = (date: Date | string, formatStr: string = 'MM/dd/yyyy'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
};

/**
 * Formata data e hora para exibição
 */
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MM/dd/yyyy HH:mm:ss');
};

/**
 * Formata distância de tempo relativa
 * Ex: "2 hours ago", "in 3 days"
 */
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

/**
 * Formata número de telefone
 * Ex: 7868828251 -> (786) 882-8251
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length !== 10) {
    return phone;
  }

  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
};

/**
 * Trunca texto com reticências
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
};

/**
 * Formata número com separador de milhares
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

/**
 * Formata porcentagem
 */
export const formatPercentage = (value: number, total: number, decimals: number = 1): string => {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Formata status de código HTTP
 */
export const formatStatusCode = (code: number): { label: string; color: string } => {
  if (code >= 200 && code < 300) {
    return { label: 'Success', color: 'green' };
  } else if (code >= 400 && code < 500) {
    return { label: 'Client Error', color: 'orange' };
  } else if (code >= 500) {
    return { label: 'Server Error', color: 'red' };
  }
  return { label: 'Unknown', color: 'gray' };
};

/**
 * Capitaliza primeira letra de cada palavra
 */
export const capitalizeWords = (str: string): string => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Formata canal para exibição
 */
export const formatChannel = (channel: 'sms' | 'email' | 'call'): string => {
  const channelMap = {
    sms: 'SMS',
    email: 'Email',
    call: 'Phone Call',
  };
  return channelMap[channel] || channel;
};

/**
 * Formata estilo de LLM para exibição
 */
export const formatLLMStyle = (style: string): string => {
  return capitalizeWords(style);
};

/**
 * Formata modelo de LLM para exibição
 */
export const formatLLMModel = (model: string): string => {
  const modelMap: Record<string, string> = {
    mistral: 'Mistral AI',
    llama: 'Llama',
    'gpt-4': 'GPT-4',
  };
  return modelMap[model] || model;
};

/**
 * Formata duração em segundos para legível
 * Ex: 65 -> "1m 5s"
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Estima tempo de envio em lote
 */
export const estimateBatchTime = (count: number, delayPerItem: number = 500): string => {
  const totalSeconds = Math.ceil((count * delayPerItem) / 1000);
  return formatDuration(totalSeconds);
};

/**
 * Formata resposta da API para exibição
 */
export const formatAPIResponse = (response: any): string => {
  if (typeof response === 'string') {
    return response;
  }

  if (typeof response === 'object') {
    return JSON.stringify(response, null, 2);
  }

  return String(response);
};

/**
 * Extrai variáveis de um template
 * Ex: "Hello {name}" -> ["name"]
 */
export const extractTemplateVariables = (template: string): string[] => {
  const regex = /\{(\w+)\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
};

/**
 * Formata tamanho de arquivo
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Sanitiza HTML para prevenir XSS
 * (Básico - use biblioteca como DOMPurify em produção)
 */
export const sanitizeHTML = (html: string): string => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

export default {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatPhone,
  truncateText,
  formatNumber,
  formatPercentage,
  formatStatusCode,
  capitalizeWords,
  formatChannel,
  formatLLMStyle,
  formatLLMModel,
  formatDuration,
  estimateBatchTime,
  formatAPIResponse,
  extractTemplateVariables,
  formatFileSize,
  sanitizeHTML,
};

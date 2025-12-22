import { z } from 'zod';
import type { ValidationResult, ValidationError } from '@/types/marketing.types';

// ===== SCHEMAS ZOD =====

// Validação de telefone (10 dígitos)
export const phoneSchema = z
  .string()
  .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits')
  .transform((val) => val.replace(/\D/g, '')); // Remove não-dígitos

// Validação de email
export const emailSchema = z.string().email('Invalid email format');

// Validação de nome
export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters');

// Validação de endereço
export const addressSchema = z
  .string()
  .min(5, 'Address must be at least 5 characters')
  .max(200, 'Address must not exceed 200 characters');

// Schema completo de RecipientInfo
export const recipientInfoSchema = z.object({
  name: nameSchema,
  phone_number: phoneSchema,
  email: emailSchema,
  address: addressSchema,
  seller_name: z.string().optional(),
});

// Schema de CompanyConfig
export const companyConfigSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  contact_phone: z.string().min(1, 'Contact phone is required'),
  contact_phone_alt: z.string().min(1, 'Alternative contact phone is required'),
  from_phone_number: phoneSchema,
  city: z.string().min(1, 'City is required'),
  region: z.string().min(1, 'Region is required'),
});

// Schema de LLMConfig
export const llmConfigSchema = z.object({
  use_llm: z.boolean(),
  llm_model: z.enum(['mistral', 'llama', 'gpt-4']),
  llm_prompt_style: z.enum(['persuasive', 'friendly', 'professional', 'casual']),
  llm_max_words_voicemail: z.number().min(10).max(100),
});

// Schema de Channels
export const channelsSchema = z
  .array(z.enum(['sms', 'email', 'call']))
  .min(1, 'At least one channel must be selected');

// ===== FUNÇÕES DE VALIDAÇÃO =====

/**
 * Valida formato de telefone (10 dígitos)
 */
export const validatePhoneNumber = (phone: string): ValidationResult => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length !== 10) {
    return {
      isValid: false,
      errors: [
        {
          field: 'phone_number',
          message: 'Phone number must be exactly 10 digits',
        },
      ],
    };
  }

  return { isValid: true, errors: [] };
};

/**
 * Valida formato de email
 */
export const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      errors: [
        {
          field: 'email',
          message: 'Invalid email format',
        },
      ],
    };
  }

  return { isValid: true, errors: [] };
};

/**
 * Valida informações do destinatário
 */
export const validateRecipientInfo = (data: any): ValidationResult => {
  try {
    recipientInfoSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return { isValid: false, errors };
    }
    return {
      isValid: false,
      errors: [{ field: 'unknown', message: 'Validation failed' }],
    };
  }
};

/**
 * Valida configuração de empresa
 */
export const validateCompanyConfig = (data: any): ValidationResult => {
  try {
    companyConfigSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return { isValid: false, errors };
    }
    return {
      isValid: false,
      errors: [{ field: 'unknown', message: 'Validation failed' }],
    };
  }
};

/**
 * Valida seleção de canais
 */
export const validateChannels = (channels: any): ValidationResult => {
  try {
    channelsSchema.parse(channels);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: 'channels',
        message: err.message,
      }));
      return { isValid: false, errors };
    }
    return {
      isValid: false,
      errors: [{ field: 'channels', message: 'Invalid channels selection' }],
    };
  }
};

/**
 * Valida formato de arquivo de imagem
 */
export const validateImageFile = (file: File): ValidationResult => {
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      errors: [
        {
          field: 'image',
          message: 'Image must be PNG, JPG, JPEG, or GIF format',
        },
      ],
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      errors: [
        {
          field: 'image',
          message: 'Image size must not exceed 5MB',
        },
      ],
    };
  }

  return { isValid: true, errors: [] };
};

/**
 * Valida CSV de upload em lote
 * Verifica se tem as colunas necessárias
 */
export const validateBatchCSV = (headers: string[]): ValidationResult => {
  const requiredHeaders = ['name', 'phone_number', 'email', 'address'];
  const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

  if (missingHeaders.length > 0) {
    return {
      isValid: false,
      errors: [
        {
          field: 'csv',
          message: `Missing required columns: ${missingHeaders.join(', ')}`,
        },
      ],
    };
  }

  return { isValid: true, errors: [] };
};

/**
 * Limpa número de telefone (remove caracteres não numéricos)
 */
export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

/**
 * Formata número de telefone para exibição
 * Ex: 7868828251 -> (786) 882-8251
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = cleanPhoneNumber(phone);

  if (cleaned.length !== 10) {
    return phone;
  }

  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
};

export default {
  validatePhoneNumber,
  validateEmail,
  validateRecipientInfo,
  validateCompanyConfig,
  validateChannels,
  validateImageFile,
  validateBatchCSV,
  cleanPhoneNumber,
  formatPhoneNumber,
};

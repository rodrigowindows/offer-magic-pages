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

// ===== FUNÇÕES DE VALIDAÇÃO =====

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

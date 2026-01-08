/**
 * Template Validator - Valida templates e sugere melhorias
 */

import { SavedTemplate } from '@/types/marketing.types';

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  suggestions: string[];
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  field?: 'subject' | 'body';
}

const REQUIRED_VARIABLES = {
  sms: ['{cash_offer}', '{phone}'],
  email: ['{name}', '{cash_offer}', '{phone}'],
  call: ['{name}', '{cash_offer}', '{phone}']
};

const RECOMMENDED_VARIABLES = {
  sms: ['{name}', '{address}'],
  email: ['{address}', '{city}', '{state}', '{company_name}', '{seller_name}'],
  call: ['{address}', '{seller_name}', '{company_name}']
};

export const validateTemplate = (template: SavedTemplate): ValidationResult => {
  const issues: ValidationIssue[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Check required variables
  const requiredVars = REQUIRED_VARIABLES[template.channel];
  const missingRequired = requiredVars.filter(v => !template.body.includes(v));

  if (missingRequired.length > 0) {
    issues.push({
      type: 'error',
      message: `Variáveis obrigatórias faltando: ${missingRequired.join(', ')}`,
      field: 'body'
    });
    score -= missingRequired.length * 20;
  }

  // Check recommended variables
  const recommendedVars = RECOMMENDED_VARIABLES[template.channel];
  const missingRecommended = recommendedVars.filter(v => !template.body.includes(v));

  if (missingRecommended.length > 0) {
    suggestions.push(`Considere adicionar: ${missingRecommended.join(', ')}`);
    score -= missingRecommended.length * 5;
  }

  // Channel-specific validations
  if (template.channel === 'sms') {
    // SMS length check
    const charCount = template.body.length;
    if (charCount > 160) {
      issues.push({
        type: 'warning',
        message: `SMS muito longo (${charCount} caracteres). Pode ser dividido em múltiplas mensagens.`,
        field: 'body'
      });
      score -= 10;
    }

    // Check for emojis (good for SMS)
    const hasEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(template.body);
    if (!hasEmoji && charCount < 100) {
      suggestions.push('Considere adicionar emojis para aumentar engajamento 📱');
    }
  }

  if (template.channel === 'email') {
    // Check subject line
    if (!template.subject || template.subject.trim().length === 0) {
      issues.push({
        type: 'error',
        message: 'Assunto é obrigatório para emails',
        field: 'subject'
      });
      score -= 25;
    } else if (template.subject.length > 60) {
      issues.push({
        type: 'warning',
        message: `Assunto muito longo (${template.subject.length} caracteres). Ideal: 30-50 caracteres.`,
        field: 'subject'
      });
      score -= 5;
    }

    // Check HTML content
    const isHtml = template.body.includes('<!DOCTYPE') || template.body.includes('<html');
    if (!isHtml) {
      suggestions.push('Considere usar HTML para emails mais profissionais e visualmente atrativos');
      score -= 10;
    }

    // Check for call-to-action
    const hasCTA = /call|ligue|contact|contato|phone|telefone/i.test(template.body);
    if (!hasCTA) {
      suggestions.push('Adicione um call-to-action claro (ex: "Ligue agora")');
      score -= 5;
    }
  }

  if (template.channel === 'call') {
    // Voicemail should be conversational
    const wordCount = template.body.split(' ').length;
    if (wordCount > 50) {
      issues.push({
        type: 'warning',
        message: `Mensagem muito longa (${wordCount} palavras). Voicemails ideais: 20-40 palavras.`,
        field: 'body'
      });
      score -= 10;
    }

    // Check greeting
    const hasGreeting = /^(Olá|Oi|Bom dia|Boa tarde)/i.test(template.body.trim());
    if (!hasGreeting) {
      suggestions.push('Comece com uma saudação amigável (ex: "Olá {name}")');
      score -= 5;
    }
  }

  // General validations
  // Check for proper spacing
  if (template.body.includes('  ') || template.body.includes('\t')) {
    issues.push({
      type: 'info',
      message: 'Remova espaços duplos ou tabs desnecessários',
      field: 'body'
    });
    score -= 2;
  }

  // Ensure score is between 0-100
  score = Math.max(0, Math.min(100, score));

  return {
    isValid: issues.filter(i => i.type === 'error').length === 0,
    score,
    issues,
    suggestions
  };
};

export const getTemplateScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

export const getTemplateScoreLabel = (score: number): string => {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Bom';
  if (score >= 40) return 'Regular';
  return 'Precisa Melhorar';
};

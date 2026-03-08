/**
 * Completeness score utility.
 * Calculates how complete a property's data is.
 */
import type { QueueProperty } from '@/components/review/types';

const COMPLETENESS_FIELDS: { key: keyof QueueProperty; weight: number; label: string }[] = [
  { key: 'address', weight: 1, label: 'Endereço' },
  { key: 'owner_name', weight: 1, label: 'Proprietário' },
  { key: 'owner_phone', weight: 1.5, label: 'Telefone' },
  { key: 'estimated_value', weight: 1, label: 'Valor Est.' },
  { key: 'cash_offer_amount', weight: 1, label: 'Oferta' },
  { key: 'property_image_url', weight: 1, label: 'Foto' },
  { key: 'year_built', weight: 0.5, label: 'Ano' },
  { key: 'square_feet', weight: 0.5, label: 'Área' },
  { key: 'bedrooms', weight: 0.5, label: 'Quartos' },
  { key: 'bathrooms', weight: 0.5, label: 'Banheiros' },
  { key: 'lot_size', weight: 0.5, label: 'Lote' },
  { key: 'evaluation', weight: 0.5, label: 'Avaliação' },
  { key: 'zillow_url', weight: 0.3, label: 'Zillow' },
  { key: 'ai_score', weight: 0.5, label: 'AI Score' },
  { key: 'lead_score', weight: 0.5, label: 'Lead Score' },
];

export interface CompletenessResult {
  score: number; // 0-100
  filled: number;
  total: number;
  missing: string[];
}

export const getCompletenessScore = (property: QueueProperty): CompletenessResult => {
  let totalWeight = 0;
  let filledWeight = 0;
  let filled = 0;
  const missing: string[] = [];

  for (const field of COMPLETENESS_FIELDS) {
    totalWeight += field.weight;
    const value = property[field.key];
    const hasValue = value !== null && value !== undefined && value !== '' && value !== 0;
    if (hasValue) {
      filledWeight += field.weight;
      filled++;
    } else {
      missing.push(field.label);
    }
  }

  return {
    score: Math.round((filledWeight / totalWeight) * 100),
    filled,
    total: COMPLETENESS_FIELDS.length,
    missing,
  };
};

export const getCompletenessColor = (score: number) => {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
};

export const getCompletenessProgressColor = (score: number) => {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
};

/**
 * Utilitários para formatação e manipulação de ofertas
 */

export interface OfferData {
  cash_offer_amount?: number;
  cash_offer_min?: number;
  cash_offer_max?: number;
  min_offer_amount?: number; // legacy, para compatibilidade
  max_offer_amount?: number; // legacy, para compatibilidade
}

export type OfferType = 'fixed' | 'range';

/**
 * Determina o tipo de oferta baseado nos valores disponíveis
 */
export const getOfferType = (offer: OfferData): OfferType => {
  // Suporta tanto cash_offer_min/max quanto min_offer_amount/max_offer_amount
  const min = offer.cash_offer_min ?? offer.min_offer_amount;
  const max = offer.cash_offer_max ?? offer.max_offer_amount;
  if (min && max) {
    return 'range';
  }
  if (offer.cash_offer_amount) {
    return 'fixed';
  }
  return 'fixed'; // fallback
};

/**
 * Formata a oferta para exibição (fixa ou faixa)
 */
export const formatOffer = (offer: OfferData, options?: {
  currency?: string;
  locale?: string;
  shortForm?: boolean;
}): string => {
  const { currency = 'USD', locale = 'en-US', shortForm = false } = options || {};

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  });

  const offerType = getOfferType(offer);

  if (offerType === 'range' && offer.min_offer_amount && offer.max_offer_amount) {
    if (shortForm) {
      return `${formatter.format(offer.min_offer_amount)} - ${formatter.format(offer.max_offer_amount)}`;
    }
    return `$${offer.min_offer_amount.toLocaleString()} - $${offer.max_offer_amount.toLocaleString()}`;
  }

  const amount = offer.cash_offer_amount || 0;
  if (shortForm) {
    return formatter.format(amount);
  }
  return `$${amount.toLocaleString()}`;
};

/**
 * Formata a oferta para uso em templates (substitui {cash_offer})
 */
export const formatOfferForTemplate = (offer: OfferData): string => {
  const offerType = getOfferType(offer);
  const min = offer.cash_offer_min ?? offer.min_offer_amount;
  const max = offer.cash_offer_max ?? offer.max_offer_amount;
  if (offerType === 'range' && min && max) {
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  }
  const amount = offer.cash_offer_amount || 0;
  return `$${amount.toLocaleString()}`;
};

/**
 * Calcula o valor médio da oferta (para cálculos)
 */
export const getOfferAverage = (offer: OfferData): number => {
  const offerType = getOfferType(offer);

  if (offerType === 'range' && offer.min_offer_amount && offer.max_offer_amount) {
    return (offer.min_offer_amount + offer.max_offer_amount) / 2;
  }

  return offer.cash_offer_amount || 0;
};

/**
 * Valida se a oferta tem dados suficientes
 */
export const isValidOffer = (offer: OfferData): boolean => {
  const offerType = getOfferType(offer);

  if (offerType === 'range') {
    return !!(offer.min_offer_amount && offer.max_offer_amount &&
             offer.min_offer_amount > 0 && offer.max_offer_amount > offer.min_offer_amount);
  }

  return !!(offer.cash_offer_amount && offer.cash_offer_amount > 0);
};

/**
 * Cria uma descrição da oferta para analytics
 */
export const getOfferDescription = (offer: OfferData): string => {
  const offerType = getOfferType(offer);

  if (offerType === 'range') {
    return `Range: $${offer.min_offer_amount} - $${offer.max_offer_amount}`;
  }

  return `Fixed: $${offer.cash_offer_amount}`;
};
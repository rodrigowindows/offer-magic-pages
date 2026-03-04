import type { QueueProperty, PreDenialSuggestion } from './types';
import { DETAIL_FIELDS, VISIBLE_FIELDS_STORAGE_KEY } from './constants';

/** Extract Visual category (HOT/WARM/COLD/LAND) from evaluation string */
export const getVisualCategory = (evaluation: string | null): string | null => {
  const m = evaluation?.match(/Visual:(\S+)/);
  return m ? m[1] : null;
};

/** Parse tags field into a string array */
export const parseTags = (tags: string[] | string | null): string[] => {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string' && tags.startsWith('[')) {
    try { return JSON.parse(tags.replace(/'/g, '"')); } catch { return []; }
  }
  return [];
};

/** Check if a formatted value has real data */
export const hasRealValue = (formatted: string | null): boolean => {
  if (formatted === null || formatted === undefined) return false;
  const trimmed = formatted.trim();
  return trimmed !== '' && trimmed !== '—' && trimmed !== '-' && trimmed !== '$0' && trimmed !== '$0.00' && trimmed !== '0';
};

/** Compute fill rates (% of properties with data) for each detail field */
export const computeFillRates = (props: QueueProperty[]): Map<string, number> => {
  const rates = new Map<string, number>();
  if (props.length === 0) return rates;
  for (const field of DETAIL_FIELDS) {
    const filled = props.filter(p => hasRealValue(field.format(p))).length;
    rates.set(field.key, Math.round((filled / props.length) * 100));
  }
  return rates;
};

/** Get pre-denial suggestions based on property data */
export const getPreDenialSuggestions = (prop: QueueProperty): PreDenialSuggestion[] => {
  const suggestions: PreDenialSuggestion[] = [];
  const currentYear = new Date().getFullYear();
  const addr = (prop.address || '').toUpperCase();
  const propType = (prop.property_type || '').toLowerCase();
  const ownerName = (prop.owner_name || '').toUpperCase();

  // Address without house number
  if (!/^\d/.test(addr.trim())) {
    suggestions.push({ reason: 'no-address-number', label: 'Endereço sem Número' });
  }

  // New construction
  if (prop.year_built && (currentYear - prop.year_built) < 20) {
    suggestions.push({ reason: 'new-construction', label: `Casa Nova (${prop.year_built})` });
  }

  // Multi-family
  if (propType.includes('multi') || propType.includes('duplex') || propType.includes('triplex')) {
    suggestions.push({ reason: 'multi-family', label: 'Multi-Family' });
  }

  // Land
  const tagsStr = Array.isArray(prop.tags) ? prop.tags.join(',') : (prop.tags || '');
  if (propType === 'land' || propType === 'vacant land' || tagsStr.includes('LAND')) {
    suggestions.push({ reason: 'land', label: 'Terreno (Land)' });
  }

  // Condominium / Apartment detection
  if (addr.includes(' APT ') || addr.includes(' UNIT ') || addr.includes(' STE ') ||
      propType.includes('condo') || propType.includes('apartment') || propType.includes('townhouse')) {
    suggestions.push({ reason: 'condominium', label: 'Condomínio / Apartamento' });
  }

  // Commercial (but NOT if already flagged as condo)
  if ((propType.includes('commercial') || propType.includes('comercial') ||
       propType.includes('warehouse') || propType.includes('industrial')) &&
      !suggestions.some(s => s.reason === 'condominium')) {
    suggestions.push({ reason: 'commercial', label: 'Imóvel Comercial' });
  }

  // LLC / Company owner
  if (ownerName.includes(' LLC') || ownerName.includes(' INC') || ownerName.includes(' CORP') ||
      ownerName.includes(' TRUST') || ownerName.includes(' LP') || ownerName.includes(' PARTNERS')) {
    suggestions.push({ reason: 'llc-owned', label: 'Proprietário LLC/Empresa' });
  }

  return suggestions;
};

/** Count properties per Visual category */
export const countByVisual = (properties: QueueProperty[]): Record<string, number> => {
  return properties.reduce((acc, p) => {
    const v = getVisualCategory(p.evaluation);
    if (v) acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

/** Load visible fields from localStorage */
export const loadVisibleFields = (): Set<string> => {
  try {
    const saved = localStorage.getItem(VISIBLE_FIELDS_STORAGE_KEY);
    if (saved) return new Set(JSON.parse(saved));
  } catch {}
  return new Set(DETAIL_FIELDS.filter(f => f.defaultVisible).map(f => f.key));
};

/** Save visible fields to localStorage */
export const saveVisibleFields = (fields: Set<string>) => {
  localStorage.setItem(VISIBLE_FIELDS_STORAGE_KEY, JSON.stringify([...fields]));
};

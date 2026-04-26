/**
 * Resolves a property's mailing address into normalized parts.
 *
 * Priority:
 *   1. confirmed_mailing_* fields (already split)
 *   2. owner_address (single string) — parsed via parseUsAddress
 *   3. property address fallback (city/state/zip from the property itself)
 *
 * Used by AveryLabelsPrintDialog and BatchOfferPrintDialog to guarantee that
 * the printed letter and its envelope label show the EXACT same address.
 */

export interface MailingParts {
  name: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
  /** Where the data came from — used for the audit banner. */
  source: 'confirmed' | 'owner_address' | 'property_fallback';
}

export interface PropertyForMailing {
  owner_name?: string | null;
  confirmed_mailing_address?: string | null;
  confirmed_mailing_city?: string | null;
  confirmed_mailing_state?: string | null;
  confirmed_mailing_zip?: string | null;
  owner_address?: string | null;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

const STREET_SUFFIXES = new Set([
  'ST', 'AVE', 'BLVD', 'RD', 'DR', 'CT', 'TER', 'TERR', 'PL', 'LN', 'WAY',
  'HWY', 'PKWY', 'CIR', 'TRL', 'TRCE', 'PATH', 'PLZ', 'SQ', 'XING', 'LOOP',
  'RUN', 'ROW', 'AVENUE', 'STREET', 'ROAD', 'DRIVE', 'COURT', 'PLACE',
  'LANE', 'BOULEVARD', 'HIGHWAY', 'PARKWAY', 'CIRCLE', 'TRAIL',
]);

const UNIT_KEYWORDS = new Set([
  'APT', 'STE', 'SUITE', 'UNIT', 'OFFICE', '#', 'FL', 'BLDG', 'RM', 'ROOM',
  'LOT', 'TRLR',
]);

/**
 * Parses a US address string of shape "STREET[ UNIT] CITY, ST ZIP[-4][ USA]".
 * Returns null if the string can't be parsed into the expected shape.
 */
export function parseUsAddress(raw: string | null | undefined): {
  line1: string;
  city: string;
  state: string;
  zip: string;
} | null {
  if (!raw) return null;
  let s = String(raw).trim().replace(/\s+/g, ' ');
  // Strip trailing " USA" or ", USA"
  s = s.replace(/[,\s]+USA\.?$/i, '').trim();

  // Match: <stuff>, <ST 2-letter> <ZIP 5 or 5-4>
  const tail = s.match(/^(.*?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (!tail) return null;

  const beforeComma = tail[1].trim();
  const state = tail[2];
  const zip = tail[3];

  // Walk tokens from the right; collect city tokens until we hit a numeric
  // token (street number / unit number), a street suffix, or a unit keyword.
  const tokens = beforeComma.split(/\s+/);
  const cityParts: string[] = [];
  let cutIndex = tokens.length;
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i];
    const tUp = t.toUpperCase().replace(/\.$/, '');
    const isNumeric = /^\d/.test(t) || /^#/.test(t);
    const isSuffix = STREET_SUFFIXES.has(tUp);
    const isUnit = UNIT_KEYWORDS.has(tUp);
    if (isNumeric || isSuffix || isUnit) {
      cutIndex = i + 1;
      break;
    }
    cityParts.unshift(t);
    cutIndex = i;
  }

  const city = cityParts.join(' ');
  const line1 = tokens.slice(0, cutIndex).join(' ');
  if (!city || !line1) return null;
  return { line1, city, state, zip };
}

/** Returns the unified mailing parts for a property. Never throws. */
export function resolveMailingAddress(p: PropertyForMailing): MailingParts {
  const name = (p.owner_name && p.owner_name.trim()) || 'Current Resident';

  // 1. Prefer confirmed_mailing_* (already split)
  const confirmedAddr = p.confirmed_mailing_address?.trim();
  if (confirmedAddr) {
    return {
      name,
      line1: confirmedAddr,
      city: (p.confirmed_mailing_city || '').trim(),
      state: (p.confirmed_mailing_state || '').trim(),
      zip: (p.confirmed_mailing_zip || '').trim(),
      source: 'confirmed',
    };
  }

  // 2. Try parsing owner_address (single string with everything)
  const parsed = parseUsAddress(p.owner_address);
  if (parsed) {
    return { name, ...parsed, source: 'owner_address' };
  }

  // 3. Fallback to the property's own address
  return {
    name,
    line1: p.address,
    city: p.city,
    state: p.state,
    zip: p.zip_code,
    source: 'property_fallback',
  };
}

/** Convenience formatter for the bottom line of an address block. */
export function formatCityStateZip(parts: Pick<MailingParts, 'city' | 'state' | 'zip'>): string {
  const cityState = [parts.city, parts.state].filter(Boolean).join(', ');
  return [cityState, parts.zip].filter(Boolean).join(' ').trim();
}

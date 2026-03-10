/**
 * Hook for campaign contact extraction and normalization logic.
 * Extracted from CampaignManager to improve modularity.
 */

export interface CampaignProperty {
  id: string;
  slug?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  owner_name?: string;
  cash_offer_amount?: number;
  approval_status?: string;
  tags?: string[];
  [key: string]: string | number | boolean | null | undefined | string[] | object;
}

// Phone columns available in the properties table
export const PHONE_COLUMNS = [
  { value: 'phone1', label: 'Phone 1 (Principal)' },
  { value: 'phone2', label: 'Phone 2' },
  { value: 'phone3', label: 'Phone 3' },
  { value: 'phone4', label: 'Phone 4' },
  { value: 'phone5', label: 'Phone 5' },
  { value: 'phone6', label: 'Phone 6' },
  { value: 'phone7', label: 'Phone 7' },
  { value: 'owner_phone', label: 'Owner Phone' },
  { value: 'person2_phone1', label: 'Person 2 - Phone 1' },
  { value: 'person2_phone2', label: 'Person 2 - Phone 2' },
  { value: 'person3_phone1', label: 'Person 3 - Phone 1' },
];

// Email columns available in the properties table
export const EMAIL_COLUMNS = [
  { value: 'email1', label: 'Email 1 (Principal)' },
  { value: 'email2', label: 'Email 2' },
  { value: 'person2_email1', label: 'Person 2 - Email 1' },
  { value: 'person2_email2', label: 'Person 2 - Email 2' },
  { value: 'person3_email1', label: 'Person 3 - Email 1' },
  { value: 'person3_email2', label: 'Person 3 - Email 2' },
];

export const normalizeContactValue = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const dedupeContacts = (contacts: string[]): string[] => {
  const unique = new Set<string>();
  for (const contact of contacts) {
    const normalized = normalizeContactValue(contact);
    if (normalized) {
      unique.add(normalized);
    }
  }
  return [...unique];
};

export const extractTaggedContacts = (prop: CampaignProperty) => {
  const tags = Array.isArray(prop.tags) ? prop.tags : [];
  const preferredPhones: string[] = [];
  const manualPhones: string[] = [];
  const preferredEmails: string[] = [];
  const manualEmails: string[] = [];

  for (const rawTag of tags) {
    if (typeof rawTag !== 'string') continue;
    const tag = rawTag.trim();
    if (tag.startsWith('pref_phone:')) {
      const value = normalizeContactValue(tag.replace('pref_phone:', ''));
      if (value) preferredPhones.push(value);
      continue;
    }
    if (tag.startsWith('manual_phone:')) {
      const value = normalizeContactValue(tag.replace('manual_phone:', ''));
      if (value) manualPhones.push(value);
      continue;
    }
    if (tag.startsWith('pref_email:')) {
      const value = normalizeContactValue(tag.replace('pref_email:', '').toLowerCase());
      if (value) preferredEmails.push(value);
      continue;
    }
    if (tag.startsWith('manual_email:')) {
      const value = normalizeContactValue(tag.replace('manual_email:', '').toLowerCase());
      if (value) manualEmails.push(value);
    }
  }

  return {
    preferredPhones: dedupeContacts(preferredPhones),
    manualPhones: dedupeContacts(manualPhones),
    preferredEmails: dedupeContacts(preferredEmails),
    manualEmails: dedupeContacts(manualEmails),
  };
};

export const hasSkiptracePhones = (prop: CampaignProperty): boolean => {
  if (prop.phone1 || prop.phone2 || prop.phone3 || prop.phone4 || prop.phone5 || prop.phone6 || prop.phone7) return true;
  if (prop.owner_phone) return true;
  if (prop.person2_phone1 || prop.person2_phone2 || prop.person2_phone3 || prop.person2_phone4 || prop.person2_phone5 || prop.person2_phone6 || prop.person2_phone7) return true;
  if (prop.person3_phone1 || prop.person3_phone2 || prop.person3_phone3 || prop.person3_phone4 || prop.person3_phone5 || prop.person3_phone6 || prop.person3_phone7) return true;
  if (Array.isArray(prop.tags) && prop.tags.some(t => typeof t === 'string' && (t.startsWith('pref_phone:') || t.startsWith('manual_phone:')))) return true;
  return false;
};

export const hasSkiptraceEmails = (prop: CampaignProperty): boolean => {
  if (prop.email1 || prop.email2) return true;
  if (prop.person2_email1 || prop.person2_email2) return true;
  if (prop.person3_email1 || prop.person3_email2) return true;
  if (Array.isArray(prop.tags) && prop.tags.some(t => typeof t === 'string' && (t.startsWith('pref_email:') || t.startsWith('manual_email:')))) return true;
  return false;
};

export const getAllPhones = (prop: CampaignProperty, phoneFieldFilter: string[]): string[] => {
  if (phoneFieldFilter.length > 0) {
    const phones: string[] = [];
    for (const field of phoneFieldFilter) {
      const val = normalizeContactValue(prop[field]);
      if (val) phones.push(val);
    }
    // Also include tagged phones (pref_phone/manual_phone) since filter allows them through
    const { preferredPhones, manualPhones } = extractTaggedContacts(prop);
    phones.push(...preferredPhones, ...manualPhones);
    return dedupeContacts(phones);
  }

  const { preferredPhones, manualPhones } = extractTaggedContacts(prop);
  const fromTags = dedupeContacts([...preferredPhones, ...manualPhones]);
  if (fromTags.length > 0) return fromTags;

  const allPhones: string[] = [];
  const phoneCols = ['owner_phone', 'phone1', 'phone2', 'phone3', 'phone4', 'phone5', 'phone6', 'phone7'];
  for (const col of phoneCols) {
    const val = normalizeContactValue(prop[col]);
    if (val) allPhones.push(val);
  }
  return dedupeContacts(allPhones);
};

export const getAllEmails = (prop: CampaignProperty): string[] => {
  const { preferredEmails, manualEmails } = extractTaggedContacts(prop);
  const fromTags = dedupeContacts([...preferredEmails, ...manualEmails]);
  if (fromTags.length > 0) return fromTags;

  const allEmails: string[] = [];
  const emailCols = ['email1', 'email2'];
  for (const col of emailCols) {
    const val = normalizeContactValue(prop[col]);
    if (val) allEmails.push(val);
  }
  return dedupeContacts(allEmails);
};

export const getPhoneFieldCounts = (properties: CampaignProperty[]) => ({
  phone1: properties.filter(p => !!p.phone1).length,
  phone2: properties.filter(p => !!p.phone2).length,
  phone3: properties.filter(p => !!p.phone3).length,
  phone4: properties.filter(p => !!p.phone4).length,
  phone5: properties.filter(p => !!p.phone5).length,
  phone6: properties.filter(p => !!p.phone6).length,
  phone7: properties.filter(p => !!p.phone7).length,
  owner_phone: properties.filter(p => !!p.owner_phone).length,
  person2_phone1: properties.filter(p => !!p.person2_phone1).length,
  person2_phone2: properties.filter(p => !!p.person2_phone2).length,
  person3_phone1: properties.filter(p => !!p.person3_phone1).length,
});

/** Build the SELECT columns string for Supabase query */
export const getSelectColumns = (selectedPhoneColumn: string, selectedEmailColumn: string) => {
  const baseColumns = ['id', 'slug', 'address', 'city', 'state', 'zip_code', 'owner_name', 'cash_offer_amount', 'approval_status', 'tags', 'property_image_url', 'estimated_value'];
  const allColumns = [...baseColumns];
  
  if (!allColumns.includes(selectedPhoneColumn)) allColumns.push(selectedPhoneColumn);
  if (!allColumns.includes(selectedEmailColumn)) allColumns.push(selectedEmailColumn);
  
  const allPhoneCols = ['owner_phone', 'phone1', 'phone2', 'phone3', 'phone4', 'phone5', 'phone6', 'phone7', 'person2_phone1', 'person2_phone2', 'person3_phone1'];
  allPhoneCols.forEach(col => { if (!allColumns.includes(col)) allColumns.push(col); });
  
  const skiptraceEmailCols = ['email1', 'email2', 'person2_email1', 'person2_email2', 'person3_email1', 'person3_email2'];
  skiptraceEmailCols.forEach(col => { if (!allColumns.includes(col)) allColumns.push(col); });
  
  return allColumns.join(', ');
};

/** Create SEO-friendly slug from property address */
export const createPropertySlug = (address: string): string => {
  return address
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

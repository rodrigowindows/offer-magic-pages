/**
 * Utilitários para geração de URLs e slugs
 */

/**
 * Gera um slug amigável para URL a partir do endereço da propriedade
 */
export const generatePropertySlug = (property: {
  address: string;
  city?: string;
  state?: string;
  zip_code?: string;
}): string => {
  // Apenas o endereço, sem cidade/estado/zip
  return property.address
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais exceto espaços e hífens
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens múltiplos
    .trim();
};

/**
 * Gera URL completa da propriedade com parâmetros de tracking
 */
export const generatePropertyUrl = (
  property: {
    id: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
  },
  sourceChannel: 'sms' | 'email' | 'call' = 'sms'
): string => {
  const slug = generatePropertySlug(property);
  const baseUrl = 'https://offer.mylocalinvest.com';
  return `${baseUrl}/property/${slug}?src=${sourceChannel}`;
};

/**
 * Gera URL de tracking para cliques em links
 * Note: Tracking is now handled via pixel and analytics, not URL redirect
 * Returns direct property URL for better user experience
 */
export const generateTrackableUrl = (
  property: {
    id: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
  },
  sourceChannel: 'sms' | 'email' | 'call' = 'sms',
  trackingId?: string
): string => {
  // Always return direct property URL
  // Tracking is handled via pixel and analytics, not URL redirect
  const propertyUrl = generatePropertyUrl(property, sourceChannel);
  return propertyUrl;
};
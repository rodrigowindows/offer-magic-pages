/**
 * Utilitários para geração de URLs e slugs
 */

/**
 * Gera um slug amigável para URL a partir do endereço da propriedade
 */
export const generatePropertySlug = (property: {
  address: string;
  city: string;
  state: string;
  zip_code: string;
}): string => {
  // Remove caracteres especiais e converte para lowercase
  const cleanAddress = property.address
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais exceto espaços e hífens
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens múltiplos
    .trim();

  const cleanCity = property.city
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  const cleanState = property.state.toLowerCase().trim();

  // Formato: endereço-cidade-estado-zip
  return `${cleanAddress}-${cleanCity}-${cleanState}-${property.zip_code}`;
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
  const propertyUrl = generatePropertyUrl(property, sourceChannel);

  if (trackingId) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/functions/v1/track-link-click?id=${trackingId}&redirect=${encodeURIComponent(propertyUrl)}`;
  }

  return propertyUrl;
};
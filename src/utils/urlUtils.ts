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
/**
 * URL da edge function de tracking server-side
 * Captura source/campaign no servidor antes de redirecionar (funciona 100% no mobile)
 */
const TRACK_CLICK_URL = `https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/track-link-click`;

const normalizeSourceChannel = (sourceChannel: string): string => {
  const normalized = sourceChannel.trim().toLowerCase();
  return normalized || 'direct';
};

/**
 * Gera URL trackável a partir de slug da propriedade.
 * Recomendado para campanhas (SMS, email, call, QR, etc.).
 */
export const generateTrackedPropertyUrlBySlug = (
  slug: string,
  sourceChannel: string = 'sms',
  campaign?: string
): string => {
  const params = new URLSearchParams({
    slug: slug.trim(),
    src: normalizeSourceChannel(sourceChannel),
  });
  if (campaign) params.set('campaign', campaign);
  return `${TRACK_CLICK_URL}?${params.toString()}`;
};

export const generatePropertyUrl = (
  property: {
    id: string;
    slug?: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
  },
  sourceChannel: string = 'sms'
): string => {
  const slug = property.slug || generatePropertySlug(property);
  const baseUrl = 'https://offer.mylocalinvest.com';
  return `${baseUrl}/property/${slug}?src=${normalizeSourceChannel(sourceChannel)}`;
};

/**
 * Gera URL trackável via server-side redirect (recomendado para SMS/email campaigns)
 * O clique passa pela edge function que salva analytics antes de redirecionar
 */
export const generateTrackedPropertyUrl = (
  property: {
    id: string;
    slug?: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
  },
  sourceChannel: string = 'sms',
  campaign?: string
): string => {
  const slug = property.slug || generatePropertySlug(property);
  return generateTrackedPropertyUrlBySlug(slug, sourceChannel, campaign);
};

/**
 * Gera URL de tracking para cliques em links
 * Note: Tracking is now handled via pixel and analytics, not URL redirect
 * Returns direct property URL for better user experience
 */
/**
 * @deprecated Use generateTrackedPropertyUrl instead for server-side tracking
 */
export const generateTrackableUrl = (
  property: {
    id: string;
    slug?: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
  },
  sourceChannel: string = 'sms',
  trackingId?: string
): string => {
  // Use server-side tracking for reliable mobile capture
  return generateTrackedPropertyUrl(property, sourceChannel);
};

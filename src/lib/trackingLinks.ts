// Trackable links generator utility

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface TrackableLink {
  originalUrl: string;
  trackingUrl: string;
  trackingId: string;
}

/**
 * Generate a trackable link
 * Note: Tracking is now handled via pixel and analytics, not URL redirect
 * Returns direct URL for better user experience
 */
export function generateTrackableLink(
  originalUrl: string,
  trackingId: string
): TrackableLink {
  // Return direct URL instead of wrapping in tracking redirect
  // Tracking is handled via pixel and analytics
  return {
    originalUrl,
    trackingUrl: originalUrl, // Use direct URL instead of redirect
    trackingId,
  };
}

/**
 * Generate a property offer link with optional tracking parameters
 */
export function generatePropertyOfferLink(
  slug: string,
  params?: {
    src?: string;
    campaign?: string;
    phone?: string;
    email?: string;
    name?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }
): string {
  const baseUrl = `${window.location.origin}/property/${slug}`;

  if (!params) {
    return baseUrl;
  }

  const searchParams = new URLSearchParams();

  if (params.src) searchParams.append('src', params.src);
  if (params.campaign) searchParams.append('campaign', params.campaign);
  if (params.phone) searchParams.append('phone', params.phone);
  if (params.email) searchParams.append('email', params.email);
  if (params.name) searchParams.append('name', params.name);
  if (params.utm_source) searchParams.append('utm_source', params.utm_source);
  if (params.utm_medium) searchParams.append('utm_medium', params.utm_medium);
  if (params.utm_campaign) searchParams.append('utm_campaign', params.utm_campaign);

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Generate a trackable property offer link
 */
export function generateTrackablePropertyLink(
  slug: string,
  trackingId: string
): TrackableLink {
  const propertyUrl = generatePropertyOfferLink(slug);
  return generateTrackableLink(propertyUrl, trackingId);
}

/**
 * Generate email open tracking pixel URL
 */
export function generateEmailTrackingPixel(trackingId: string): string {
  return `${SUPABASE_URL}/functions/v1/track-email-open?id=${trackingId}`;
}

/**
 * Generate HTML for tracking pixel to embed in emails
 */
export function generateTrackingPixelHtml(trackingId: string): string {
  const pixelUrl = generateEmailTrackingPixel(trackingId);
  return `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;" />`;
}

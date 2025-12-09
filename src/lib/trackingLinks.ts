// Trackable links generator utility

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface TrackableLink {
  originalUrl: string;
  trackingUrl: string;
  trackingId: string;
}

/**
 * Generate a trackable link that goes through our edge function
 * When clicked, it will update the campaign_logs table and redirect
 */
export function generateTrackableLink(
  originalUrl: string,
  trackingId: string
): TrackableLink {
  const encodedRedirect = encodeURIComponent(originalUrl);
  const trackingUrl = `${SUPABASE_URL}/functions/v1/track-link-click?id=${trackingId}&redirect=${encodedRedirect}`;
  
  return {
    originalUrl,
    trackingUrl,
    trackingId,
  };
}

/**
 * Generate a property offer link
 */
export function generatePropertyOfferLink(slug: string): string {
  return `${window.location.origin}/property/${slug}`;
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

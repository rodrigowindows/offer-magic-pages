/**
 * Generates a Google Street View Static API URL for a given property address.
 * This provides real photos of the actual property instead of generic stock images.
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

/**
 * Get a Google Street View image URL for a property address.
 * @param address - Full property address (e.g., "123 Main St, Orlando, FL 32801")
 * @param width - Image width (default: 600)
 * @param height - Image height (default: 400)
 * @returns Street View URL or null if no API key
 */
export function getStreetViewUrl(
  address: string,
  width = 600,
  height = 400
): string | null {
  if (!GOOGLE_MAPS_API_KEY || !address) return null;

  const params = new URLSearchParams({
    size: `${width}x${height}`,
    location: address,
    key: GOOGLE_MAPS_API_KEY,
    source: 'outdoor',
  });

  return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
}

/**
 * Get a Google Street View image URL with higher resolution for hero/detail views.
 */
export function getStreetViewHeroUrl(address: string): string | null {
  return getStreetViewUrl(address, 1200, 800);
}

/**
 * Get a Google Street View image URL for card/thumbnail views.
 */
export function getStreetViewThumbnailUrl(address: string): string | null {
  return getStreetViewUrl(address, 400, 300);
}

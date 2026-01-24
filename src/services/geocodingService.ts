/**
 * Geocoding Service
 * Provides address geocoding through Supabase edge function
 * Handles Google Maps API, Nominatim, rate limiting, and fallbacks server-side
 */

import { supabase } from '@/integrations/supabase/client';

interface GeocodeResult {
  lat: number;
  lng: number;
}

interface GeocodingResponse {
  lat: number;
  lng: number;
  source: 'google' | 'nominatim' | 'city_approximate' | 'default_fallback';
  address: string;
}

// In-memory cache for geocoded locations
const geocodeCache = new Map<string, GeocodeResult>();

/**
 * Geocode an address using the edge function
 * Edge function handles:
 * - Google Maps API (if key configured)
 * - Nominatim fallback with rate limiting
 * - City/state approximate coordinates
 * - Default fallback to Orlando
 *
 * @param address Full address string
 * @param city Optional city name (for fallback)
 * @param state Optional state (for fallback)
 * @returns Coordinates or null if failed
 */
export const geocodeAddress = async (
  address: string,
  city?: string,
  state?: string
): Promise<GeocodeResult | null> => {
  // Check cache first
  const cacheKey = address.toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    console.log('📍 Using cached location for:', address);
    return geocodeCache.get(cacheKey)!;
  }

  try {
    console.log('🌐 Geocoding:', address);

    // Call edge function for geocoding
    const { data, error } = await supabase.functions.invoke<GeocodingResponse>('geocode', {
      body: { address, city, state },
    });

    if (error) {
      console.error('❌ Geocoding edge function error:', error);
      return null;
    }

    if (data && data.lat && data.lng) {
      const location: GeocodeResult = {
        lat: data.lat,
        lng: data.lng,
      };

      console.log(`✅ Geocoded (${data.source}):`, address, location);

      // Cache the result
      geocodeCache.set(cacheKey, location);

      return location;
    } else {
      console.warn('❌ No results for:', address);
      return null;
    }
  } catch (error) {
    console.error('❌ Geocoding error:', error);
    return null;
  }
};

/**
 * Geocode multiple addresses with automatic delays
 * The edge function handles rate limiting server-side,
 * but we add a small delay to avoid overwhelming it
 *
 * @param addresses Array of address strings
 * @param onProgress Optional progress callback
 * @returns Map of address -> coordinates
 */
export const geocodeAddresses = async (
  addresses: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<Record<string, GeocodeResult>> => {
  const results: Record<string, GeocodeResult> = {};

  console.log(`🗺️ Geocoding ${addresses.length} addresses...`);

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];

    try {
      // Add small delay between requests (edge function handles heavy rate limiting)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const result = await geocodeAddress(address);

      if (result) {
        results[address] = result;
      }

      // Report progress
      if (onProgress) {
        onProgress(i + 1, addresses.length);
      }

      console.log(`  Progress: ${i + 1}/${addresses.length}`);
    } catch (error) {
      console.error(`❌ Failed to geocode ${address}:`, error);
    }
  }

  console.log(`✅ Geocoding complete! ${Object.keys(results).length}/${addresses.length} successful`);

  return results;
};

/**
 * Clear the geocoding cache
 */
export const clearGeocodeCache = (): void => {
  geocodeCache.clear();
  console.log('🗑️ Geocoding cache cleared');
};

/**
 * Clear invalid cached coordinates that are too far from subject property
 * This helps fix stale cache issues when demo addresses are re-geocoded to wrong locations
 */
export const clearInvalidCachedCoordinates = (
  subjectLat: number = 28.5383,
  subjectLng: number = -81.3792,
  maxDistanceDegrees: number = 0.7
): number => {
  let removed = 0;
  const entries = Array.from(geocodeCache.entries());

  entries.forEach(([address, coords]) => {
    const latDiff = Math.abs(coords.lat - subjectLat);
    const lngDiff = Math.abs(coords.lng - subjectLng);

    if (latDiff > maxDistanceDegrees || lngDiff > maxDistanceDegrees) {
      geocodeCache.delete(address);
      removed++;
      console.log(`🗑️ Removed invalid cached coord for: ${address} (${latDiff.toFixed(2)}, ${lngDiff.toFixed(2)} from subject)`);
    }
  });

  if (removed > 0) {
    console.log(`✅ Cleared ${removed} invalid cached coordinates`);
  }

  return removed;
};

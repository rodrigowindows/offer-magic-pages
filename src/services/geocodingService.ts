/**
 * Geocoding Service
 * Uses Nominatim (OpenStreetMap) with proper rate limiting and caching
 */

import { getGeocodeFromCache, saveGeocodeToCache } from '@/utils/geocodingCache';

interface GeocodeResult {
  lat: number;
  lng: number;
}

// Rate limiting: 1 request per second for Nominatim
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

/**
 * Geocode an address using Nominatim (OpenStreetMap)
 * Includes automatic caching and rate limiting
 */
export const geocodeAddress = async (address: string): Promise<GeocodeResult | null> => {
  // Check cache first
  const cached = getGeocodeFromCache(address);
  if (cached) {
    console.log('📍 Using cached location for:', address);
    return cached;
  }

  try {
    // Rate limiting: ensure minimum 1 second between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${delay}ms before geocoding...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    console.log('🌐 Geocoding:', address);

    // Update last request time
    lastRequestTime = Date.now();

    // Nominatim API request
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=us`,
      {
        headers: {
          'User-Agent': 'MyLocalInvest-CMA/1.0 (contact@mylocalinvest.com)' // Required by Nominatim
        }
      }
    );

    // Check HTTP status
    if (!response.ok) {
      console.error('❌ Nominatim API error:', response.status, response.statusText);
      return null;
    }

    // Check Content-Type to ensure we got JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ Response is not JSON:', contentType);
      return null;
    }

    // Parse JSON response
    const data = await response.json();

    if (data && Array.isArray(data) && data.length > 0) {
      const location = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };

      console.log('✅ Geocoded (Nominatim):', address, location);

      // Save to cache
      saveGeocodeToCache(address, location.lat, location.lng);

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
 * Geocode multiple addresses with automatic rate limiting
 * Returns a map of address -> coordinates
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

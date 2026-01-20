/**
 * Geocoding Cache Utilities
 * Persistent localStorage cache for geocoding results with 30-day expiration
 */

interface GeocodeResult {
  lat: number;
  lng: number;
  timestamp: number;
}

type GeocodeCache = Record<string, GeocodeResult>;

const CACHE_KEY = 'geocoding_cache';
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

/**
 * Load geocoding cache from localStorage
 * Automatically removes expired entries (older than 30 days)
 */
export const loadGeocodeCache = (): GeocodeCache => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return {};

    const cache = JSON.parse(cached);
    const now = Date.now();
    const filtered: GeocodeCache = {};

    // Filter out expired entries
    Object.entries(cache).forEach(([key, value]: [string, any]) => {
      if (value.timestamp && (now - value.timestamp) < CACHE_DURATION) {
        filtered[key] = value;
      }
    });

    // Save cleaned cache back
    if (Object.keys(filtered).length !== Object.keys(cache).length) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
    }

    return filtered;
  } catch (error) {
    console.error('Error loading geocoding cache:', error);
    return {};
  }
};

/**
 * Save geocoding result to cache
 */
export const saveGeocodeToCache = (address: string, lat: number, lng: number): void => {
  try {
    const cache = loadGeocodeCache();
    cache[address] = {
      lat,
      lng,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving to geocoding cache:', error);
  }
};

/**
 * Get geocoding result from cache
 * Returns null if not found or expired
 */
export const getGeocodeFromCache = (address: string): { lat: number; lng: number } | null => {
  try {
    const cache = loadGeocodeCache();
    const result = cache[address];

    if (!result) return null;

    // Check if expired
    if (Date.now() - result.timestamp > CACHE_DURATION) {
      return null;
    }

    return { lat: result.lat, lng: result.lng };
  } catch (error) {
    console.error('Error reading from geocoding cache:', error);
    return null;
  }
};

/**
 * Clear entire geocoding cache
 */
export const clearGeocodeCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing geocoding cache:', error);
  }
};

/**
 * Get cache statistics
 */
export const getGeocodeStats = (): { total: number; oldest: Date | null; newest: Date | null } => {
  try {
    const cache = loadGeocodeCache();
    const entries = Object.values(cache);

    if (entries.length === 0) {
      return { total: 0, oldest: null, newest: null };
    }

    const timestamps = entries.map(e => e.timestamp);
    return {
      total: entries.length,
      oldest: new Date(Math.min(...timestamps)),
      newest: new Date(Math.max(...timestamps))
    };
  } catch (error) {
    console.error('Error getting geocoding stats:', error);
    return { total: 0, oldest: null, newest: null };
  }
};

/**
 * Comparables Data Service
 * Fetches real comparable sales data from edge function
 */

import { supabase } from '@/integrations/supabase/client';

// Simple in-memory cache (5 minutes TTL)
interface CacheEntry {
  data: ComparableData[];
  timestamp: number;
  source: string;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Haversine formula to calculate distance between two coordinates (in miles)
const EARTH_RADIUS_MILES = 3958.8;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2))
    * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
}

export interface ComparableData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  saleDate: string;
  salePrice: number;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  propertyType: string;
  latitude?: number;
  longitude?: number;
  distance: number; // Required to match avmService
  source: 'attom' | 'attom-v1' | 'attom-v2' | 'county' | 'county-csv' | 'zillow' | 'zillow-api' | 'manual' | 'redfin' | 'realtymole' | 'demo';
}

export class CompsDataService {
  /**
   * Clear cache (useful for testing or forcing refresh)
   */
  static clearCache() {
    cache.clear();
    console.log('🗑️ Comps cache cleared');
  }

  /**
   * Get current data source status
   */
  static async getDataSourceStatus(): Promise<{ source: string; count: number; apiKeysConfigured: any }> {
    try {
      const { data } = await supabase.functions.invoke('fetch-comps', {
        body: {
          address: 'test',
          city: 'Orlando',
          state: 'FL',
          basePrice: 250000
        }
      });

      return {
        source: data?.source || 'unknown',
        count: data?.count || 0,
        apiKeysConfigured: data?.apiKeysConfigured || { attom: false, rapidapi: false }
      };
    } catch {
      return {
        source: 'error',
        count: 0,
        apiKeysConfigured: { attom: false, rapidapi: false }
      };
    }
  }

  /**
   * Main function to get comparables via edge function (with cache)
   */
  static async getComparables(
    address: string,
    city: string,
    state: string,
    radius: number = 1,
    limit: number = 10,
    basePrice: number = 250000,
    useCache: boolean = true,
    latitude?: number,
    longitude?: number
  ): Promise<ComparableData[]> {
    // Get saved radius from localStorage if not provided
    const savedRadius = localStorage.getItem('comps_search_radius');
    const searchRadius = savedRadius ? parseFloat(savedRadius) : radius;

    const cacheKey = `${address}-${city}-${state}-${basePrice}-${searchRadius}-${latitude}-${longitude}`;

    // Check cache first
    if (useCache) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`💾 Cache hit for ${address} (source: ${cached.source}, radius: ${searchRadius}mi)`);
        return cached.data.slice(0, limit);
      }
    }

    console.log(`🔍 Fetching comparables for: ${address}, ${city}, ${state} (radius: ${searchRadius}mi)`);
    if (latitude && longitude) {
      console.log(`📍 Using property coordinates: ${latitude}, ${longitude}`);
    }

    try {
      const { data, error } = await supabase.functions.invoke('fetch-comps', {
        body: { 
          address, 
          city, 
          state, 
          basePrice, 
          radius: searchRadius,
          latitude,
          longitude
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        return this.generateFallbackComps(basePrice, city, address, latitude, longitude);
      }

      if (data?.comps && data.comps.length > 0) {
        console.log(`✅ Found ${data.comps.length} comps (source: ${data.source})`);

        // Cache the results
        cache.set(cacheKey, {
          data: data.comps,
          timestamp: Date.now(),
          source: data.source
        });

        // Return with metadata and ensure coordinates are preserved
        const compsWithSource = data.comps.map((comp: any) => ({
          ...comp,
          latitude: comp.latitude,
          longitude: comp.longitude,
          source: comp.source || data.source // Preserve individual source or use global
        }));

        console.log(`📍 First comp coordinates:`, compsWithSource[0]?.latitude, compsWithSource[0]?.longitude);
        return compsWithSource.slice(0, limit);
      }

      console.warn('⚠️ No comps returned, using fallback');
      return this.generateFallbackComps(basePrice, city, address, latitude, longitude);
    } catch (error) {
      console.error('❌ Error fetching comparables:', error);
      return this.generateFallbackComps(basePrice, city, address, latitude, longitude);
    }
  }

  /**
   * Generate fallback demo data if API fails
   * Generates comps near the actual property location using geocoding
   */
  private static generateFallbackComps(basePrice: number, city: string, subjectAddress?: string, subjectLat?: number, subjectLng?: number): ComparableData[] {
    // Use subject property coordinates if available, otherwise use city center
    const baseLat = subjectLat || 28.5383; // Default: Orlando downtown
    const baseLng = subjectLng || -81.3792;

    // Extract ZIP from subject address if available
    const zipMatch = subjectAddress?.match(/\b\d{5}\b/);
    const subjectZip = zipMatch ? zipMatch[0] : '32801';

    console.log(`📍 Generating fallback comps near (${baseLat}, ${baseLng}) in ZIP ${subjectZip}`);

    // Generate 6 addresses within 1 mile radius of subject property
    const streetNames = ['Park Ave', 'Main St', 'Lake View Dr', 'Maple Dr', 'Oak St', 'Washington Ave'];
    const addresses = streetNames.map((street, i) => {
      // Generate random offset within ~1 mile (0.014 degrees ≈ 1 mile)
      const latOffset = (Math.random() - 0.5) * 0.028; // ±1 mile
      const lngOffset = (Math.random() - 0.5) * 0.028;

      return {
        address: `${Math.floor(Math.random() * 9000) + 1000} ${street}`,
        zip: subjectZip, // Use same ZIP as subject property
        lat: baseLat + latOffset,
        lng: baseLng + lngOffset,
      };
    });

    const comps: ComparableData[] = [];

    for (let i = 0; i < addresses.length; i++) {
      const variance = (Math.random() - 0.5) * 0.3;
      const price = Math.round(basePrice * (1 + variance));
      const daysAgo = Math.floor(Math.random() * 180);
      const saleDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const location = addresses[i];

      // Calculate REAL distance using haversine formula
      const calculatedDistance = haversineMiles(baseLat, baseLng, location.lat, location.lng);

      comps.push({
        address: `${location.address}, ${city || 'Orlando'}, FL ${location.zip}`,
        city: city || 'Orlando',
        state: 'FL',
        zipCode: location.zip,
        saleDate: saleDate.toISOString().split('T')[0],
        salePrice: price,
        beds: Math.floor(2 + Math.random() * 3),
        baths: Math.floor(1 + Math.random() * 2.5),
        sqft: Math.round(1200 + Math.random() * 1500),
        yearBuilt: Math.floor(1970 + Math.random() * 50),
        propertyType: 'Single Family',
        latitude: location.lat,
        longitude: location.lng,
        distance: Math.round(calculatedDistance * 10) / 10, // Round to 1 decimal (e.g., 0.7 miles)
        source: 'demo'
      });
    }

    console.log(`📍 Generated ${comps.length} demo comps near ${baseLat}, ${baseLng}`);
    return comps.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
  }

  /**
   * Calculate investment metrics for a comp
   */
  static calculateInvestmentMetrics(comp: ComparableData, units: number = 1) {
    const monthlyRent = comp.salePrice * 0.008; // 0.8% rule
    const rentPerUnit = monthlyRent / units;
    const totalRent = monthlyRent;
    const expenseRatio = 0.55; // 55% default
    const noi = totalRent * 12 * (1 - expenseRatio);
    const capRate = comp.salePrice > 0 ? (noi / comp.salePrice) * 100 : 0;

    return {
      units,
      totalRent,
      rentPerUnit,
      expenseRatio,
      noi,
      capRate: Math.round(capRate * 100) / 100,
    };
  }
}

/**
 * Comparables Data Service
 * Fetches real comparable sales data from edge function
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

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
  distance?: number;
  source: 'attom' | 'county' | 'county-csv' | 'zillow' | 'zillow-api' | 'manual' | 'redfin' | 'realtymole' | 'demo';
}

export class CompsDataService {
  /**
   * Clear cache (useful for testing or forcing refresh)
   */
  static clearCache() {
    cache.clear();
    logger.info('🗑️ [CompsDataService] Comps cache cleared');
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
        logger.info('💾 [CompsDataService] Cache hit', { address, city, state, basePrice, searchRadius, source: cached.source });
        return cached.data.slice(0, limit);
      }
    }

    logger.info('🔍 [CompsDataService] Fetching comparables', { address, city, state, basePrice, searchRadius, latitude, longitude });

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
        logger.error('❌ [CompsDataService] Edge function error', { error, address, city, state });
        logger.warn('⚠️ [CompsDataService] No comps available from API - returning empty array', { address, city, state });
        return [];
      }

      if (data?.comps && data.comps.length > 0) {
        logger.info('✅ [CompsDataService] Found comps', { count: data.comps.length, source: data.source, address, city, state });

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

      // No comps found - check if it's an address not found error
      if (data?.addressNotFound) {
        console.warn(`⚠️ Address not found: ${address}, ${city}`);
      } else if (data?.noResultsFound) {
        console.warn(`⚠️ No comparables found in area for: ${address}, ${city}`);
      } else {
        console.warn('⚠️ No comps returned from API');
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error fetching comparables:', error);
      console.warn('⚠️ No comps available from API - returning empty array');
      return [];
    }
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

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
    useCache: boolean = true
  ): Promise<ComparableData[]> {
    // Get saved radius from localStorage if not provided
    const savedRadius = localStorage.getItem('comps_search_radius');
    const searchRadius = savedRadius ? parseFloat(savedRadius) : radius;

    const cacheKey = `${address}-${city}-${state}-${basePrice}-${searchRadius}`;

    // Check cache first
    if (useCache) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`💾 Cache hit for ${address} (source: ${cached.source}, radius: ${searchRadius}mi)`);
        return cached.data.slice(0, limit);
      }
    }

    console.log(`🔍 Fetching comparables for: ${address}, ${city}, ${state} (radius: ${searchRadius}mi)`);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-comps', {
        body: { address, city, state, basePrice, radius: searchRadius }
      });

      if (error) {
        console.error('Edge function error:', error);
        return this.generateFallbackComps(basePrice, city);
      }

      if (data?.comps && data.comps.length > 0) {
        console.log(`✅ Found ${data.comps.length} comps (source: ${data.source})`);

        // Cache the results
        cache.set(cacheKey, {
          data: data.comps,
          timestamp: Date.now(),
          source: data.source
        });

        // Return with metadata
        const compsWithSource = data.comps.map((comp: any) => ({
          ...comp,
          source: comp.source || data.source // Preserve individual source or use global
        }));

        return compsWithSource.slice(0, limit);
      }

      console.warn('⚠️ No comps returned, using fallback');
      return this.generateFallbackComps(basePrice, city);
    } catch (error) {
      console.error('❌ Error fetching comparables:', error);
      return this.generateFallbackComps(basePrice, city);
    }
  }

  /**
   * Generate fallback demo data if API fails
   */
  private static generateFallbackComps(basePrice: number, city: string): ComparableData[] {
    const streets = ['Oak St', 'Pine Ave', 'Maple Dr', 'Cedar Ln', 'Palm Way', 'Sunset Blvd'];
    const comps: ComparableData[] = [];
    
    for (let i = 0; i < 6; i++) {
      const variance = (Math.random() - 0.5) * 0.3;
      const price = Math.round(basePrice * (1 + variance));
      const daysAgo = Math.floor(Math.random() * 180);
      const saleDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      comps.push({
        address: `${Math.floor(100 + Math.random() * 9900)} ${streets[i % streets.length]}`,
        city: city || 'Orlando',
        state: 'FL',
        zipCode: `328${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
        saleDate: saleDate.toISOString().split('T')[0],
        salePrice: price,
        beds: Math.floor(2 + Math.random() * 3),
        baths: Math.floor(1 + Math.random() * 2.5),
        sqft: Math.round(1200 + Math.random() * 1500),
        yearBuilt: Math.floor(1970 + Math.random() * 50),
        propertyType: 'Single Family',
        source: 'demo'
      });
    }
    
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

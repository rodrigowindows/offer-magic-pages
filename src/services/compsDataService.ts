/**
 * Comparables Data Service
 * Fetches real comparable sales data from edge function
 */

import { supabase } from '@/integrations/supabase/client';

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
  source: 'attom' | 'county' | 'zillow' | 'manual' | 'redfin' | 'realtymole' | 'demo';
}

export class CompsDataService {
  /**
   * Main function to get comparables via edge function
   */
  static async getComparables(
    address: string,
    city: string,
    state: string,
    radius: number = 1,
    limit: number = 10,
    basePrice: number = 250000
  ): Promise<ComparableData[]> {
    console.log(`🔍 Fetching comparables for: ${address}, ${city}, ${state}`);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-comps', {
        body: { address, city, state, basePrice }
      });

      if (error) {
        console.error('Edge function error:', error);
        return this.generateFallbackComps(basePrice, city);
      }

      if (data?.comps && data.comps.length > 0) {
        console.log(`✅ Found ${data.comps.length} comps (source: ${data.source})`);
        return data.comps.slice(0, limit);
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

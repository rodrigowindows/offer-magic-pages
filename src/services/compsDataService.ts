/**
 * Comparables Data Service
 * Fetches real comparable sales data from multiple sources
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
  distance?: number; // miles from subject property
  source: 'attom' | 'county' | 'zillow' | 'manual';
}

export class CompsDataService {
  private static ATTOM_API_KEY = import.meta.env.VITE_ATTOM_API_KEY;
  private static ZILLOW_RAPID_API_KEY = import.meta.env.VITE_RAPID_API_KEY;

  /**
   * Main function to get comparables from multiple sources
   */
  static async getComparables(
    address: string,
    city: string,
    state: string,
    radius: number = 1, // miles
    limit: number = 10
  ): Promise<ComparableData[]> {
    console.log(`🔍 Fetching comparables for: ${address}, ${city}, ${state}`);

    // Try sources in priority order
    try {
      // 1. Try Supabase database first (manual entries)
      const dbComps = await this.getFromDatabase(address, city, state, limit);
      if (dbComps.length >= 3) {
        console.log(`✅ Found ${dbComps.length} comps in database`);
        return dbComps;
      }

      // 2. Try Attom Data API (best quality, 1000/month free)
      if (this.ATTOM_API_KEY) {
        const attomComps = await this.getFromAttomData(address, city, state, radius, limit);
        if (attomComps.length > 0) {
          console.log(`✅ Found ${attomComps.length} comps from Attom Data`);
          // Save to database for future use
          await this.saveToDatabase(attomComps);
          return attomComps;
        }
      }

      // 3. Try Orange County Property Appraiser (free, public data)
      const countyComps = await this.getFromOrangeCounty(address, city, radius, limit);
      if (countyComps.length > 0) {
        console.log(`✅ Found ${countyComps.length} comps from Orange County`);
        await this.saveToDatabase(countyComps);
        return countyComps;
      }

      // 4. Try Zillow via RapidAPI (backup)
      if (this.ZILLOW_RAPID_API_KEY) {
        const zillowComps = await this.getFromZillow(address, city, state, limit);
        if (zillowComps.length > 0) {
          console.log(`✅ Found ${zillowComps.length} comps from Zillow`);
          await this.saveToDatabase(zillowComps);
          return zillowComps;
        }
      }

      console.warn('⚠️ No real data found, returning database comps');
      return dbComps;
    } catch (error) {
      console.error('❌ Error fetching comparables:', error);
      return [];
    }
  }

  /**
   * Get comparables from Supabase database
   */
  private static async getFromDatabase(
    address: string,
    city: string,
    state: string,
    limit: number
  ): Promise<ComparableData[]> {
    try {
      const { data, error } = await supabase
        .from('comparables')
        .select('*')
        .eq('city', city)
        .eq('state', state)
        .order('sale_date', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(comp => ({
        address: comp.address,
        city: comp.city,
        state: comp.state,
        zipCode: comp.zip_code || '',
        saleDate: comp.sale_date,
        salePrice: Number(comp.sale_price),
        beds: comp.beds || 0,
        baths: comp.baths || 0,
        sqft: comp.sqft,
        yearBuilt: comp.year_built || 0,
        propertyType: 'Single Family',
        latitude: comp.latitude ? Number(comp.latitude) : undefined,
        longitude: comp.longitude ? Number(comp.longitude) : undefined,
        distance: comp.distance_miles ? Number(comp.distance_miles) : undefined,
        source: 'manual' as const,
      }));
    } catch (error) {
      console.error('Database query error:', error);
      return [];
    }
  }

  /**
   * Get comparables from Attom Data API
   * Free tier: 1000 requests/month
   * Signup: https://api.developer.attomdata.com/
   */
  private static async getFromAttomData(
    address: string,
    city: string,
    state: string,
    radius: number,
    limit: number
  ): Promise<ComparableData[]> {
    if (!this.ATTOM_API_KEY) {
      console.log('⏭️ Skipping Attom Data (no API key)');
      return [];
    }

    try {
      // Step 1: Get property ID for the address
      const searchUrl = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/address?address1=${encodeURIComponent(address)}&address2=${encodeURIComponent(city + ', ' + state)}`;

      const searchResponse = await fetch(searchUrl, {
        headers: {
          'apikey': this.ATTOM_API_KEY,
          'Accept': 'application/json',
        },
      });

      if (!searchResponse.ok) {
        console.warn('Attom API search failed:', searchResponse.status);
        return [];
      }

      const searchData = await searchResponse.json();
      const propertyId = searchData?.property?.[0]?.identifier?.attomId;

      if (!propertyId) {
        console.warn('Property ID not found in Attom Data');
        return [];
      }

      // Step 2: Get comparable sales
      const compsUrl = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/snapshot?attomid=${propertyId}&radius=${radius}&minsaleamt=10000`;

      const compsResponse = await fetch(compsUrl, {
        headers: {
          'apikey': this.ATTOM_API_KEY,
          'Accept': 'application/json',
        },
      });

      if (!compsResponse.ok) {
        console.warn('Attom API comps failed:', compsResponse.status);
        return [];
      }

      const compsData = await compsResponse.json();
      const sales = compsData?.property || [];

      return sales.slice(0, limit).map((sale: any) => ({
        address: sale.address?.oneLine || '',
        city: sale.address?.locality || city,
        state: sale.address?.countrySubd || state,
        zipCode: sale.address?.postal1 || '',
        saleDate: sale.sale?.saleTransDate || new Date().toISOString(),
        salePrice: sale.sale?.amount?.saleAmt || 0,
        beds: sale.building?.rooms?.beds || 0,
        baths: sale.building?.rooms?.bathsFull || 0,
        sqft: sale.building?.size?.livingSize || 0,
        yearBuilt: sale.summary?.yearBuilt || 0,
        propertyType: sale.summary?.propType || 'Single Family',
        latitude: sale.location?.latitude,
        longitude: sale.location?.longitude,
        distance: sale.distance?.value,
        source: 'attom' as const,
      }));
    } catch (error) {
      console.error('Attom Data API error:', error);
      return [];
    }
  }

  /**
   * Get comparables from Orange County Property Appraiser
   * Public data, free to use
   */
  private static async getFromOrangeCounty(
    address: string,
    city: string,
    radius: number,
    limit: number
  ): Promise<ComparableData[]> {
    try {
      // Orange County Property Appraiser has a public API
      // This is a simplified example - you'll need to adjust based on actual API
      const apiUrl = `https://ocpafl.org/api/Sales?address=${encodeURIComponent(address)}&city=${encodeURIComponent(city)}&radius=${radius}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.warn('Orange County API failed:', response.status);
        return [];
      }

      const data = await response.json();

      // Parse county data format (adjust based on actual response)
      return (data.sales || []).slice(0, limit).map((sale: any) => ({
        address: sale.PropertyAddress || '',
        city: sale.City || city,
        state: 'FL',
        zipCode: sale.ZipCode || '',
        saleDate: sale.SaleDate || new Date().toISOString(),
        salePrice: Number(sale.SalePrice) || 0,
        beds: Number(sale.Bedrooms) || 0,
        baths: Number(sale.Bathrooms) || 0,
        sqft: Number(sale.LivingArea) || 0,
        yearBuilt: Number(sale.YearBuilt) || 0,
        propertyType: sale.PropertyType || 'Single Family',
        source: 'county' as const,
      }));
    } catch (error) {
      console.error('Orange County API error:', error);
      return [];
    }
  }

  /**
   * Get comparables from Zillow via RapidAPI
   * RapidAPI free tier: 500 requests/month
   * Signup: https://rapidapi.com/apimaker/api/zillow-com1
   */
  private static async getFromZillow(
    address: string,
    city: string,
    state: string,
    limit: number
  ): Promise<ComparableData[]> {
    if (!this.ZILLOW_RAPID_API_KEY) {
      console.log('⏭️ Skipping Zillow (no RapidAPI key)');
      return [];
    }

    try {
      // Search for recently sold properties in the area
      const searchQuery = `${city}, ${state}`;
      const url = `https://zillow-com1.p.rapidapi.com/similarSales?zpid=YOUR_ZPID`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.ZILLOW_RAPID_API_KEY,
          'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com',
        },
      });

      if (!response.ok) {
        console.warn('Zillow RapidAPI failed:', response.status);
        return [];
      }

      const data = await response.json();

      // Parse Zillow format
      return (data.comparables || []).slice(0, limit).map((comp: any) => ({
        address: comp.address || '',
        city: comp.city || city,
        state: comp.state || state,
        zipCode: comp.zipcode || '',
        saleDate: comp.dateSold || new Date().toISOString(),
        salePrice: comp.price || 0,
        beds: comp.bedrooms || 0,
        baths: comp.bathrooms || 0,
        sqft: comp.livingArea || 0,
        yearBuilt: comp.yearBuilt || 0,
        propertyType: comp.homeType || 'Single Family',
        latitude: comp.latitude,
        longitude: comp.longitude,
        source: 'zillow' as const,
      }));
    } catch (error) {
      console.error('Zillow API error:', error);
      return [];
    }
  }

  /**
   * Save comparables to database for caching
   */
  private static async saveToDatabase(comps: ComparableData[]): Promise<void> {
    try {
      const records = comps.map(comp => ({
        address: comp.address,
        city: comp.city,
        state: comp.state,
        zip_code: comp.zipCode,
        sale_date: comp.saleDate,
        sale_price: comp.salePrice,
        beds: comp.beds,
        baths: comp.baths,
        sqft: comp.sqft,
        year_built: comp.yearBuilt,
        latitude: comp.latitude,
        longitude: comp.longitude,
        distance_miles: comp.distance,
        source: comp.source,
      }));

      const { error } = await supabase.from('comparables').upsert(records, {
        onConflict: 'address,city,sale_date',
        ignoreDuplicates: true,
      });

      if (error) {
        console.warn('Failed to cache comps:', error);
      } else {
        console.log(`💾 Cached ${records.length} comps to database`);
      }
    } catch (error) {
      console.error('Database save error:', error);
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

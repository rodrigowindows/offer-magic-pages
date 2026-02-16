/**
 * Manual Comps Service
 * Fetches and processes manual comps links from database
 */

import { supabase } from '@/integrations/supabase/client';
import { extractDataFromUrl as extractFromListingUrl, formatExtractedAddress } from '@/utils/urlDataExtractor';

export interface ManualCompsLink {
  id: string;
  property_address: string;
  property_id?: string | null;
  url: string;
  source: 'trulia' | 'zillow' | 'redfin' | 'realtor' | 'other';
  notes?: string | null;
  created_at: string;
  user_id?: string;
}

export interface ManualCompData {
  id: string;
  address: string;
  url: string;
  source: 'trulia' | 'zillow' | 'redfin' | 'realtor' | 'other';
  notes?: string;
  isManualLink: true;
  // Data from comp_data JSONB column
  salePrice?: number;
  sqft?: number;
  beds?: number;
  baths?: number;
  yearBuilt?: number;
  saleDate?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

/**
 * Fetch manual comps links for a specific property
 */
export async function getManualCompsForProperty(propertyId: string): Promise<ManualCompData[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('manual_comps_links' as any)
      .select('*')
      .eq('property_id', propertyId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching manual comps:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Convert to ManualCompData format, extracting data from comp_data JSONB
    const manualComps: ManualCompData[] = data.map((link: any) => {
      const compData = link.comp_data || {};
      const converted: ManualCompData = {
        id: `manual-${link.id}`,
        address: link.property_address,
        url: link.url,
        source: link.source,
        notes: link.notes,
        isManualLink: true,
        // Extract numeric values from comp_data - handle both snake_case and camelCase
        salePrice: Number(compData.salePrice || compData.sale_price) || undefined,
        sqft: Number(compData.squareFeet || compData.square_feet || compData.sqft) || undefined,
        beds: Number(compData.bedrooms || compData.beds) || undefined,
        baths: Number(compData.bathrooms || compData.baths) || undefined,
        yearBuilt: Number(compData.yearBuilt || compData.year_built) || undefined,
        saleDate: compData.saleDate || compData.sale_date,
        city: compData.city,
        state: compData.state,
        zipCode: compData.zipCode || compData.zip_code,
      };
      
      return converted;
    });

    return manualComps;
  } catch (error) {
    console.error('❌ Error in getManualCompsForProperty:', error);
    return [];
  }
}

/**
 * Get count of manual comps for a property
 */
export async function getManualCompsCount(propertyId: string): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 0;

    const { count, error } = await supabase
      .from('manual_comps_links' as any)
      .select('*', { count: 'exact', head: true })
      .eq('property_id', propertyId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error getting manual comps count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getManualCompsCount:', error);
    return 0;
  }
}

/**
 * Extract structured data from listing URL using deterministic parsing.
 * This is fast and does not depend on scraping external sites.
 */
export async function extractDataFromUrl(url: string): Promise<Partial<ManualCompData> | null> {
  try {
    const extracted = extractFromListingUrl(url);
    const hasUsefulData =
      !!extracted.address ||
      !!extracted.city ||
      !!extracted.state ||
      !!extracted.zipCode ||
      Number.isFinite(extracted.price) ||
      Number.isFinite(extracted.sqft) ||
      Number.isFinite(extracted.beds) ||
      Number.isFinite(extracted.baths);

    if (!hasUsefulData) {
      return null;
    }

    return {
      address: formatExtractedAddress(extracted) || extracted.address,
      source: extracted.source,
      salePrice: extracted.price,
      sqft: extracted.sqft,
      beds: extracted.beds,
      baths: extracted.baths,
      city: extracted.city,
      state: extracted.state,
      zipCode: extracted.zipCode,
    };
  } catch (error) {
    console.error('Error extracting URL data:', error);
    return null;
  }
}

/**
 * Get source icon emoji
 */
export function getSourceIcon(source: ManualCompData['source']): string {
  const icons = {
    trulia: '🏡',
    zillow: '🏠',
    redfin: '🔴',
    realtor: '🏘️',
    other: '🔗'
  };
  return icons[source];
}

/**
 * Get source label
 */
export function getSourceLabel(source: ManualCompData['source']): string {
  const labels = {
    trulia: 'Trulia',
    zillow: 'Zillow',
    redfin: 'Redfin',
    realtor: 'Realtor.com',
    other: 'Outro'
  };
  return labels[source];
}

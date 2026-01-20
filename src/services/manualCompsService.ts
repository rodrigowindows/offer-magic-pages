/**
 * Manual Comps Service
 * Fetches and processes manual comps links from database
 */

import { supabase } from '@/integrations/supabase/client';

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
  // Estimated data (will be null if not scraped)
  salePrice?: number;
  sqft?: number;
  beds?: number;
  baths?: number;
  yearBuilt?: number;
}

/**
 * Fetch manual comps links for a specific property
 */
export async function getManualCompsForProperty(propertyId: string): Promise<ManualCompData[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('⚠️ No user logged in');
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
      console.log('📭 No manual comps found for property:', propertyId);
      return [];
    }

    console.log(`✅ Found ${data.length} manual comps links`);

    // Convert to ManualCompData format
    const manualComps: ManualCompData[] = data.map((link: any) => ({
      id: `manual-${link.id}`,
      address: link.property_address,
      url: link.url,
      source: link.source,
      notes: link.notes,
      isManualLink: true,
    }));

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
 * Extract basic data from URL (future implementation with scraping)
 * For now, returns null - can be enhanced with web scraping
 */
export async function extractDataFromUrl(url: string): Promise<Partial<ManualCompData> | null> {
  // TODO: Implement web scraping or use APIs
  // Trulia, Zillow, Redfin have APIs that could be used
  // For now, return null and rely on manual data entry

  console.log('⚠️ URL data extraction not yet implemented for:', url);
  return null;
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

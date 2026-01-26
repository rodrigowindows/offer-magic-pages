/**
 * Unified ComparableData interface
 * Used across frontend and backend (edge functions)
 * 
 * IMPORTANT: Keep this in sync with supabase/functions/fetch-comps/index.ts
 */

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
  source: 'attom-v2' | 'attom-v1' | 'attom' | 'zillow-api' | 'county-csv' | 'demo' | 'none';
  latitude?: number;
  longitude?: number;
  distance: number; // Always required, not optional
}

/**
 * Response from fetch-comps edge function
 */
export interface FetchCompsResponse {
  success: boolean;
  comps: ComparableData[];
  source: ComparableData['source'];
  isDemo: boolean;
  count: number;
  message: string;
  error?: string;
  apiKeysConfigured: {
    attom: boolean;
    rapidapi: boolean;
  };
  // Additional metadata for better error handling
  addressNotFound?: boolean;
  apiError?: boolean;
  noResultsFound?: boolean;
}

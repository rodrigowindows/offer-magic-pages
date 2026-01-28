/**
 * Shared TypeScript types for Comps Analysis
 */

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  estimated_value: number;
  cash_offer_amount: number;
  property_image_url?: string | null;
  approval_status?: string | null;
  approved_at?: string | null;
  square_feet?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  year_built?: number | null;
  lot_size?: number | null;
  property_type?: string | null;
  comps_count?: number;
  last_analysis_date?: string | null;
  analysis_status?: 'complete' | 'partial' | 'pending';
  // Coordinates for map and location-based comps
  latitude?: number | null;
  longitude?: number | null;
  // Extended fields for PropertySelector
  full_address?: string;
  comps_status?: string;
  comps_source?: string;
}

export interface ComparableProperty {
  id: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  // Primary field names (camelCase)
  salePrice: number;
  saleDate: string;
  beds: number;
  baths: number;
  sqft: number;
  pricePerSqft: number;
  distance: number;
  latitude?: number;
  longitude?: number;
  source?: string;
  // Legacy field names for backward compatibility (snake_case)
  sale_price?: number;
  sale_date?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  price_per_sqft?: number;
  property_type?: string;
  similarity_score?: number;
  listing_url?: string;
  days_on_market?: number;
  // Additional fields
  lotSize?: number;
  yearBuilt?: number;
  propertyType?: string;
  capRate?: number;
  noi?: number;
  units?: number;
  condition?: string;
  qualityScore?: number;
  similarityScore?: number;
  listingUrl?: string;
  distanceMiles?: number;
  adjustment?: number;
  adjustments?: {
    location?: number;
    size?: number;
    condition?: number;
    age?: number;
    total?: number;
  };
  // Manual comps fields
  url?: string;
  notes?: string;
}

export interface MarketAnalysis {
  avgSalePrice: number;
  medianSalePrice: number;
  avgPricePerSqft: number;
  suggestedValueMin: number;
  suggestedValueMax: number;
  avgDaysOnMarket?: number;
  trendPercentage: number;
  marketTrend: 'up' | 'down' | 'stable';
  comparablesCount: number;
  dataSource?: string;
  isDemo?: boolean;
}

export interface AnalysisHistoryItem {
  id: string;
  property_id: string;
  analyst_user_id: string | null;
  analysis_data: Record<string, unknown>;
  comparables_count: number | null;
  suggested_value_min: number | null;
  suggested_value_max: number | null;
  notes?: string | null;
  search_radius_miles: number | null;
  data_source: string | null;
  created_at: string;
  expires_at?: string | null;
}

export interface OfferHistoryItem {
  id: string;
  property_id: string;
  old_value: number | null;
  new_value: number;
  changed_by: string;
  changed_at: string;
  change_type: 'created' | 'updated' | 'approved' | 'rejected';
  notes?: string | null;
}

export interface SmartInsights {
  marketHeat: 'hot' | 'cold' | 'stable';
  trend: number;
  avgDays: number;
  offerVsMarket: number;
  suggestion: string;
  avgDaysOnMarket?: number;
}

export interface CompsFiltersConfig {
  maxDistance?: number;
  maxResults?: number;
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  maxBaths?: number;
  minSqft?: number;
  maxSqft?: number;
  minPrice?: number;
  maxPrice?: number;
  saleWithin?: number; // months
  propertyType?: string;
  propertyTypes?: string[];
  condition?: string;
  maxAge?: number;
  minSaleDate?: string;
}

export type OfferStatusFilter = 'all' | 'approved' | 'manual' | 'none';
export type TabType = 'auto' | 'manual' | 'combined';
export type SortBy = 'date' | 'capRate' | 'price' | 'noi';
export type DataSource = 'attom' | 'zillow' | 'csv' | 'demo';

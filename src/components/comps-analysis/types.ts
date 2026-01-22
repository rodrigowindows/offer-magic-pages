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
}

export interface ComparableProperty {
  id: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  salePrice: number;
  saleDate: string;
  beds: number;
  baths: number;
  sqft: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType?: string;
  distance: number;
  pricePerSqft: number;
  capRate?: number;
  noi?: number;
  units?: number;
  condition?: string;
  qualityScore?: number;
  adjustments?: {
    location?: number;
    size?: number;
    condition?: number;
    age?: number;
    total?: number;
  };
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
}

export interface AnalysisHistoryItem {
  id: string;
  property_id: string;
  analyst_user_id: string;
  analysis_data: {
    comps: ComparableProperty[];
    analysis: MarketAnalysis;
  };
  comparables_count: number;
  suggested_value_min: number;
  suggested_value_max: number;
  notes?: string | null;
  search_radius_miles: number;
  data_source: 'attom' | 'zillow' | 'csv' | 'demo';
  created_at: string;
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
}

export type OfferStatusFilter = 'all' | 'approved' | 'manual' | 'none';
export type TabType = 'auto' | 'manual' | 'combined';
export type SortBy = 'date' | 'capRate' | 'price' | 'noi';
export type DataSource = 'attom' | 'zillow' | 'csv' | 'demo';

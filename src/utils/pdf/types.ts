/**
 * Shared types for PDF export modules
 */

export interface PropertyData {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  estimated_value: number;
  cash_offer_amount: number;
  min_offer_amount?: number;
  max_offer_amount?: number;
  property_image_url?: string | null;
  latitude?: number;
  longitude?: number;
  square_feet?: number;
}

export interface ComparableProperty {
  id: string;
  address: string;
  saleDate: Date;
  salePrice: number;
  sqft: number;
  beds: number;
  baths: number;
  yearBuilt: number;
  lotSize?: number;
  distanceMiles: number;
  daysOnMarket?: number;
  adjustment: number;
  pricePerSqft: number;
  latitude?: number;
  longitude?: number;
  source?: string;
}

export interface MarketAnalysis {
  avgSalePrice: number;
  avgPricePerSqft: number;
  suggestedValueMin: number;
  suggestedValueMax: number;
  marketTrend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  dataSource?: string;
  isDemo?: boolean;
  comparablesCount?: number;
}

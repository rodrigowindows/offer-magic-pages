export interface QueueProperty {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  neighborhood: string | null;
  owner_name: string;
  property_image_url: string | null;
  estimated_value: number;
  cash_offer_amount: number;
  approval_status: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  decision_photos: string[] | null;
  property_type: string | null;
  year_built: number | null;
  square_feet: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  lot_size: number | null;
  owner_phone: string | null;
  lead_score: number | null;
  zillow_url: string | null;
  focar: string | null;
  evaluation: string | null;
  tags: string[] | string | null;
  owner_address: string | null;
  origem: string | null;
  ai_score: number | null;
  ai_reasoning: string | null;
}

export type ApprovePhase = 'choose' | 'comps' | 'offer' | null;

export type StatusFilter = 'pending' | 'approved' | 'rejected';

export interface DailyStats {
  reviewed_today: number;
  approved_today: number;
  rejected_today: number;
}

export interface StatusCounts {
  pending: number;
  approved: number;
  rejected: number;
}

export interface DetailField {
  key: string;
  label: string;
  category: 'decisao' | 'imovel' | 'dono' | 'financeiro';
  format: (prop: QueueProperty) => string | null;
  highlight?: (prop: QueueProperty) => boolean;
  defaultVisible?: boolean;
}

export interface PreDenialSuggestion {
  reason: string;
  label: string;
}

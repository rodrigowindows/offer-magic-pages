-- Create comparables table for Comparative Market Analysis
CREATE TABLE public.comparables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,

  -- Basic property info
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'FL',
  zip_code TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Sale details
  sale_date DATE NOT NULL,
  sale_price DECIMAL(12, 2) NOT NULL,

  -- Property characteristics
  sqft INTEGER NOT NULL,
  beds INTEGER,
  baths DECIMAL(3, 1),
  year_built INTEGER,
  lot_size INTEGER,

  -- Distance and market metrics
  distance_miles DECIMAL(5, 2),
  days_on_market INTEGER,
  price_per_sqft DECIMAL(8, 2) GENERATED ALWAYS AS (
    CASE WHEN sqft > 0 THEN ROUND(sale_price / sqft, 2) ELSE 0 END
  ) STORED,

  -- Investment analysis fields
  units INTEGER DEFAULT 1,
  total_rent DECIMAL(10, 2),
  rent_per_unit DECIMAL(10, 2) GENERATED ALWAYS AS (
    CASE WHEN units > 0 AND total_rent IS NOT NULL THEN ROUND(total_rent / units, 2) ELSE NULL END
  ) STORED,
  expense_ratio DECIMAL(4, 3) DEFAULT 0.550, -- Default 55%
  noi DECIMAL(12, 2) GENERATED ALWAYS AS (
    CASE WHEN total_rent IS NOT NULL AND expense_ratio IS NOT NULL
    THEN ROUND((total_rent * 12) * (1 - expense_ratio), 2)
    ELSE NULL END
  ) STORED,
  cap_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE
      WHEN sale_price > 0 AND total_rent IS NOT NULL AND expense_ratio IS NOT NULL
      THEN ROUND(((total_rent * 12 * (1 - expense_ratio)) / sale_price) * 100, 2)
      ELSE NULL
    END
  ) STORED,

  -- Property condition
  condition TEXT CHECK (condition IN ('reformed', 'good', 'needs_work', 'as-is')),

  -- Additional info
  property_image_url TEXT,
  notes TEXT,
  adjustment DECIMAL(12, 2) DEFAULT 0,

  -- Source tracking
  source TEXT, -- 'manual', 'mls', 'zillow', 'propstream', etc.
  external_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.comparables ENABLE ROW LEVEL SECURITY;

-- Create policies for comparables
CREATE POLICY "Anyone can view comparables"
ON public.comparables
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert comparables"
ON public.comparables
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update comparables"
ON public.comparables
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete comparables"
ON public.comparables
FOR DELETE
TO authenticated
USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_comparables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER comparables_updated_at_trigger
BEFORE UPDATE ON public.comparables
FOR EACH ROW
EXECUTE FUNCTION public.update_comparables_updated_at();

-- Create indexes for faster queries
CREATE INDEX idx_comparables_property_id ON public.comparables(property_id);
CREATE INDEX idx_comparables_sale_date ON public.comparables(sale_date DESC);
CREATE INDEX idx_comparables_location ON public.comparables(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_comparables_cap_rate ON public.comparables((
  CASE
    WHEN sale_price > 0 AND total_rent IS NOT NULL AND expense_ratio IS NOT NULL
    THEN ((total_rent * 12 * (1 - expense_ratio)) / sale_price) * 100
    ELSE NULL
  END
)) WHERE total_rent IS NOT NULL;

-- Create a view for easy comp analysis
CREATE OR REPLACE VIEW public.comparables_analysis AS
SELECT
  c.*,
  p.address as subject_address,
  p.city as subject_city,
  p.estimated_value as subject_value,
  p.cash_offer_amount as subject_offer
FROM public.comparables c
LEFT JOIN public.properties p ON c.property_id = p.id;

COMMENT ON TABLE public.comparables IS 'Comparable properties for Comparative Market Analysis (CMA)';
COMMENT ON COLUMN public.comparables.noi IS 'Net Operating Income: (Total Rent × 12) × (1 - Expense Ratio)';
COMMENT ON COLUMN public.comparables.cap_rate IS 'Capitalization Rate: (NOI / Sale Price) × 100';
COMMENT ON COLUMN public.comparables.expense_ratio IS 'Operating expense ratio (default 55% = 0.550)';

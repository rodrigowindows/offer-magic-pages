-- ========================================
-- MIGRATION: Add Property Coordinates and Comparables Cache
-- ========================================

-- 1. Add latitude and longitude to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

CREATE INDEX IF NOT EXISTS idx_properties_coords ON public.properties(latitude, longitude);

COMMENT ON COLUMN public.properties.latitude IS 'Property latitude for accurate mapping';
COMMENT ON COLUMN public.properties.longitude IS 'Property longitude for accurate mapping';

-- 2. Create comparables_cache table to store fetched comps
CREATE TABLE IF NOT EXISTS public.comparables_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,

  -- Comparable data
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,

  sale_price DECIMAL(12, 2),
  sale_date DATE,

  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1),
  square_feet INTEGER,
  year_built INTEGER,
  property_type TEXT,

  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  distance DECIMAL(5, 2), -- Distance in km/miles

  -- Metadata
  data_source TEXT DEFAULT 'demo', -- 'attom', 'zillow', 'demo', etc
  quality_score DECIMAL(3, 2), -- 0.0 to 1.0
  search_radius DECIMAL(5, 2), -- Radius used when fetching

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_comps_cache_property ON public.comparables_cache(property_id);
CREATE INDEX IF NOT EXISTS idx_comps_cache_coords ON public.comparables_cache(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_comps_cache_created ON public.comparables_cache(created_at DESC);

-- RLS Policies
ALTER TABLE public.comparables_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cached comparables"
  ON public.comparables_cache FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert cached comparables"
  ON public.comparables_cache FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update cached comparables"
  ON public.comparables_cache FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete cached comparables"
  ON public.comparables_cache FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Comments
COMMENT ON TABLE public.comparables_cache IS 'Cached comparables to avoid redundant API calls';
COMMENT ON COLUMN public.comparables_cache.property_id IS 'Reference to the subject property';
COMMENT ON COLUMN public.comparables_cache.data_source IS 'Source of the comparable data (attom, zillow, demo)';
COMMENT ON COLUMN public.comparables_cache.quality_score IS 'Similarity score between 0.0 and 1.0';
COMMENT ON COLUMN public.comparables_cache.search_radius IS 'Search radius used when fetching (in miles or km)';

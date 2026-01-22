-- ========================================
-- MIGRATION: Add Offer History and Comps Analysis History Tables
-- ========================================

-- Table 1: Property Offer History
CREATE TABLE IF NOT EXISTS public.property_offer_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  previous_amount DECIMAL(12,2),
  new_amount DECIMAL(12,2) NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offer_history_property_id ON public.property_offer_history(property_id);
CREATE INDEX IF NOT EXISTS idx_offer_history_changed_at ON public.property_offer_history(changed_at DESC);

ALTER TABLE public.property_offer_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view offer history"
  ON public.property_offer_history FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert offer history"
  ON public.property_offer_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Table 2: Comps Analysis History
CREATE TABLE IF NOT EXISTS public.comps_analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  analyst_user_id UUID,
  analysis_data JSONB NOT NULL DEFAULT '{}',
  comparables_count INTEGER DEFAULT 0,
  suggested_value_min DECIMAL(12,2),
  suggested_value_max DECIMAL(12,2),
  notes TEXT,
  search_radius_miles DECIMAL(5,2),
  data_source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comps_history_property_id ON public.comps_analysis_history(property_id);
CREATE INDEX IF NOT EXISTS idx_comps_history_created_at ON public.comps_analysis_history(created_at DESC);

ALTER TABLE public.comps_analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view comps history"
  ON public.comps_analysis_history FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert comps history"
  ON public.comps_analysis_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update comps history"
  ON public.comps_analysis_history FOR UPDATE
  USING (auth.uid() IS NOT NULL);

COMMENT ON TABLE public.property_offer_history IS 'Tracks historical changes to property cash offer amounts';
COMMENT ON TABLE public.comps_analysis_history IS 'Stores comps analysis results for properties';
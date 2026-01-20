-- Add Comps Analysis History Table
-- Allows saving and comparing analyses over time

CREATE TABLE IF NOT EXISTS public.comps_analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  analyst_user_id UUID,

  -- Analysis data
  comparables_data JSONB NOT NULL, -- Array of comparable properties used
  market_analysis JSONB, -- Market analysis results
  suggested_value_min DECIMAL(12, 2),
  suggested_value_max DECIMAL(12, 2),

  -- Metadata
  notes TEXT,
  analysis_date TIMESTAMPTZ DEFAULT NOW(),
  search_radius_miles DECIMAL(4, 2),
  data_source TEXT, -- 'attom', 'zillow', 'manual', 'demo'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comps_history_property ON comps_analysis_history(property_id);
CREATE INDEX IF NOT EXISTS idx_comps_history_date ON comps_analysis_history(analysis_date DESC);

-- RLS
ALTER TABLE comps_analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analysis history" ON comps_analysis_history
  FOR SELECT USING (auth.uid() = analyst_user_id OR auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own analysis" ON comps_analysis_history
  FOR INSERT WITH CHECK (auth.uid() = analyst_user_id);

CREATE POLICY "Users can update their own analysis" ON comps_analysis_history
  FOR UPDATE USING (auth.uid() = analyst_user_id);

-- Comments
COMMENT ON TABLE comps_analysis_history IS 'Historical record of comp analyses for tracking changes over time';
COMMENT ON COLUMN comps_analysis_history.comparables_data IS 'JSON array of comparable properties used in this analysis';
COMMENT ON COLUMN comps_analysis_history.market_analysis IS 'Market analysis results including trends and metrics';

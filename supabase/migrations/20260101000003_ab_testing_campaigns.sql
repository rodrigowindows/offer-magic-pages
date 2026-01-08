-- Automated A/B Testing Tables Migration

-- Main A/B tests table
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'paused')),
  variants JSONB NOT NULL DEFAULT '[]',
  target_metric TEXT NOT NULL DEFAULT 'open_rate' CHECK (target_metric IN ('open_rate', 'click_rate', 'conversion_rate', 'response_rate')),
  sample_size INTEGER DEFAULT 1000,
  confidence_threshold INTEGER DEFAULT 95,
  winner TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B test results table
CREATE TABLE IF NOT EXISTS ab_test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  response_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(test_id, variant_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_tests_created_at ON ab_tests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_test_id ON ab_test_results(test_id);

-- Enable RLS
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;

-- Policies for ab_tests
CREATE POLICY "Users can view their own ab_tests"
  ON ab_tests
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own ab_tests"
  ON ab_tests
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own ab_tests"
  ON ab_tests
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Policies for ab_test_results
CREATE POLICY "Users can view their own ab_test_results"
  ON ab_test_results
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own ab_test_results"
  ON ab_test_results
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own ab_test_results"
  ON ab_test_results
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_ab_tests_updated_at
  BEFORE UPDATE ON ab_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_test_results_updated_at
  BEFORE UPDATE ON ab_test_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE ab_tests IS 'A/B testing campaigns for marketing optimization';
COMMENT ON TABLE ab_test_results IS 'Results and metrics for A/B test variants';
COMMENT ON COLUMN ab_tests.variants IS 'JSON array of test variants with their configurations';
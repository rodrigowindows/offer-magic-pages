-- Create table to track property page visits and their source
-- This allows seeing which marketing channel (SMS, Email, etc) drove traffic

CREATE TABLE IF NOT EXISTS property_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id TEXT NOT NULL,
  visit_source TEXT, -- 'email', 'sms', 'direct', 'social', etc
  campaign_name TEXT, -- 'followup', 'urgent', 'default', etc
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  user_agent TEXT,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_property_visits_property_id ON property_visits(property_id);
CREATE INDEX IF NOT EXISTS idx_property_visits_source ON property_visits(visit_source);
CREATE INDEX IF NOT EXISTS idx_property_visits_campaign ON property_visits(campaign_name);
CREATE INDEX IF NOT EXISTS idx_property_visits_visited_at ON property_visits(visited_at DESC);

-- RLS
ALTER TABLE property_visits ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to insert visit tracking
CREATE POLICY "Anyone can track visits" ON property_visits
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to read visit data
CREATE POLICY "Authenticated users can view visits" ON property_visits
  FOR SELECT USING (auth.role() = 'authenticated');

-- Comments
COMMENT ON TABLE property_visits IS 'Tracks all property page visits with source attribution (email, SMS, etc)';
COMMENT ON COLUMN property_visits.visit_source IS 'Source of the visit: email, sms, direct, social, etc';
COMMENT ON COLUMN property_visits.campaign_name IS 'Campaign identifier: followup, urgent, default, etc';

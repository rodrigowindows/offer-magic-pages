-- Migration: Add Marketing System Tables
-- Date: 2026-01-11
-- Description: Create tables for marketing automation, lead scoring, and campaign analytics

-- ============================================================================
-- 1. CAMPAIGN SEQUENCES (for automated follow-ups)
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  trigger_event TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. CAMPAIGN CLICKS (track property page clicks for follow-up)
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  click_source TEXT, -- 'sms', 'email', 'call', etc.
  user_agent TEXT,
  referrer TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  follow_up_sent BOOLEAN DEFAULT false,
  follow_up_sent_at TIMESTAMPTZ
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_property ON campaign_clicks(property_id);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_clicked_at ON campaign_clicks(clicked_at DESC);

-- ============================================================================
-- 3. SCHEDULED FOLLOW-UPS (for auto follow-ups after clicks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS scheduled_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  trigger_event TEXT NOT NULL, -- 'click', 'email_open', 'no_response', etc.
  channel TEXT NOT NULL, -- 'sms', 'email', 'call'
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_scheduled_followups_scheduled_for ON scheduled_followups(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_followups_sent ON scheduled_followups(sent);

-- ============================================================================
-- 4. MARKETING SETTINGS (store user preferences)
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Can be NULL for global settings
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. ADD MISSING COLUMNS TO PROPERTIES TABLE
-- ============================================================================
-- Add lead_score column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'lead_score'
  ) THEN
    ALTER TABLE properties ADD COLUMN lead_score INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add email columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'email1'
  ) THEN
    ALTER TABLE properties ADD COLUMN email1 TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'email2'
  ) THEN
    ALTER TABLE properties ADD COLUMN email2 TEXT;
  END IF;
END $$;

-- Add owner contact columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'owner_phone'
  ) THEN
    ALTER TABLE properties ADD COLUMN owner_phone TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'owner_email'
  ) THEN
    ALTER TABLE properties ADD COLUMN owner_email TEXT;
  END IF;
END $$;

-- ============================================================================
-- 6. ADD MISSING COLUMNS TO CAMPAIGN_LOGS TABLE
-- ============================================================================
-- Add link_clicked column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaign_logs' AND column_name = 'link_clicked'
  ) THEN
    ALTER TABLE campaign_logs ADD COLUMN link_clicked BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add click_count column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaign_logs' AND column_name = 'click_count'
  ) THEN
    ALTER TABLE campaign_logs ADD COLUMN click_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add first_response_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaign_logs' AND column_name = 'first_response_at'
  ) THEN
    ALTER TABLE campaign_logs ADD COLUMN first_response_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- 7. CREATE FUNCTION TO AUTO-UPDATE updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
DROP TRIGGER IF EXISTS update_campaign_sequences_updated_at ON campaign_sequences;
CREATE TRIGGER update_campaign_sequences_updated_at
  BEFORE UPDATE ON campaign_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketing_settings_updated_at ON marketing_settings;
CREATE TRIGGER update_marketing_settings_updated_at
  BEFORE UPDATE ON marketing_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. INSERT DEFAULT MARKETING SETTINGS
-- ============================================================================
INSERT INTO marketing_settings (user_id, settings)
VALUES (
  NULL, -- Global settings
  '{
    "sms_enabled": true,
    "email_enabled": true,
    "call_enabled": true,
    "auto_followup_enabled": true,
    "followup_delay_minutes": 5,
    "daily_limit_sms": 100,
    "daily_limit_email": 200,
    "daily_limit_call": 50,
    "company_name": "MyLocalInvest",
    "sender_name": "Mike Johnson",
    "sender_phone": "+17868828251",
    "sender_email": "info@mylocalinvest.com"
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE campaign_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_settings ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all on campaign_sequences" ON campaign_sequences FOR ALL USING (true);
CREATE POLICY "Allow all on campaign_clicks" ON campaign_clicks FOR ALL USING (true);
CREATE POLICY "Allow all on scheduled_followups" ON scheduled_followups FOR ALL USING (true);
CREATE POLICY "Allow all on marketing_settings" ON marketing_settings FOR ALL USING (true);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Tables created:
--   - campaign_sequences (automated follow-up sequences)
--   - campaign_clicks (track clicks for follow-ups)
--   - scheduled_followups (scheduled auto follow-ups)
--   - marketing_settings (user preferences)
--
-- Columns added to properties:
--   - lead_score (for lead scoring dashboard)
--   - email1, email2 (additional email fields)
--   - owner_phone, owner_email (owner contact info)
--
-- Columns added to campaign_logs:
--   - link_clicked (track if property link was clicked)
--   - click_count (number of clicks)
--   - first_response_at (first response timestamp)
-- ============================================================================

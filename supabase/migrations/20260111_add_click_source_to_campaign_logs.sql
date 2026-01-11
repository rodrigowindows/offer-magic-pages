-- Add click_source column to campaign_logs table
-- Migration: 20260111_add_click_source_to_campaign_logs.sql

ALTER TABLE campaign_logs ADD COLUMN IF NOT EXISTS click_source TEXT DEFAULT 'direct';

-- Add index for click_source queries
CREATE INDEX IF NOT EXISTS idx_campaign_logs_click_source ON campaign_logs(click_source);

-- Update existing records to have a default source
UPDATE campaign_logs SET click_source = 'direct' WHERE click_source IS NULL;

-- Add comment
COMMENT ON COLUMN campaign_logs.click_source IS 'Source of the click (sms, email, call, direct)';
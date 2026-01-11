-- Migration: Add button click tracking to campaign_logs table
-- Date: January 10, 2026

-- Add button click tracking columns to campaign_logs table
ALTER TABLE campaign_logs
ADD COLUMN IF NOT EXISTS button_clicked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS button_clicked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS button_click_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS button_click_source TEXT;

-- Create index for button click queries
CREATE INDEX IF NOT EXISTS idx_campaign_logs_button_clicked ON campaign_logs (button_clicked);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_button_clicked_at ON campaign_logs (button_clicked_at);

-- Add comments for documentation
COMMENT ON COLUMN campaign_logs.button_clicked IS 'Whether a button in the campaign was clicked';
COMMENT ON COLUMN campaign_logs.button_clicked_at IS 'Timestamp when button was first clicked';
COMMENT ON COLUMN campaign_logs.button_click_count IS 'Total number of button clicks';
COMMENT ON COLUMN campaign_logs.button_click_source IS 'Source/channel where button was clicked (sms, email, etc.)';
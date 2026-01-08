-- Migration: Add webhook support to campaign_logs table
-- Date: January 8, 2026

-- Add webhook-related columns to campaign_logs table
ALTER TABLE campaign_logs
ADD COLUMN IF NOT EXISTS webhook_events JSONB[] DEFAULT ARRAY[]::JSONB[],
ADD COLUMN IF NOT EXISTS call_received BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS link_clicked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS link_clicked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sms_reply_received BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sms_reply_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sms_reply_content TEXT,
ADD COLUMN IF NOT EXISTS email_opened BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_opened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_clicked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_clicked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ;

-- Add webhook_url column to email_settings table
ALTER TABLE email_settings
ADD COLUMN IF NOT EXISTS webhook_url TEXT;

-- Create index for better performance on webhook queries
CREATE INDEX IF NOT EXISTS idx_campaign_logs_webhook_events ON campaign_logs USING GIN (webhook_events);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_call_received ON campaign_logs (call_received);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_link_clicked ON campaign_logs (link_clicked);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_first_response ON campaign_logs (first_response_at);

-- Add comments for documentation
COMMENT ON COLUMN campaign_logs.webhook_events IS 'Array of webhook events received from marketing APIs';
COMMENT ON COLUMN campaign_logs.call_received IS 'Whether a call was received in response to this campaign';
COMMENT ON COLUMN campaign_logs.link_clicked IS 'Whether the campaign link was clicked';
COMMENT ON COLUMN campaign_logs.link_clicked_at IS 'Timestamp when link was clicked';
COMMENT ON COLUMN campaign_logs.sms_reply_received IS 'Whether an SMS reply was received';
COMMENT ON COLUMN campaign_logs.sms_reply_at IS 'Timestamp of SMS reply';
COMMENT ON COLUMN campaign_logs.sms_reply_content IS 'Content of the SMS reply';
COMMENT ON COLUMN campaign_logs.email_opened IS 'Whether the email was opened';
COMMENT ON COLUMN campaign_logs.email_opened_at IS 'Timestamp when email was opened';
COMMENT ON COLUMN campaign_logs.email_clicked IS 'Whether the email link was clicked';
COMMENT ON COLUMN campaign_logs.email_clicked_at IS 'Timestamp when email link was clicked';
COMMENT ON COLUMN campaign_logs.first_response_at IS 'Timestamp of first response (call, click, etc.)';
COMMENT ON COLUMN email_settings.webhook_url IS 'URL to receive webhook callbacks from marketing APIs';
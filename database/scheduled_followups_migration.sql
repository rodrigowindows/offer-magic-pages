-- Migration: Add scheduled follow-ups table for automatic follow-ups after link clicks
-- This table stores follow-ups to be sent after a delay (e.g., 5 minutes after click)

CREATE TABLE IF NOT EXISTS scheduled_followups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    campaign_log_id UUID NOT NULL REFERENCES campaign_logs(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    message_type VARCHAR(20) DEFAULT 'sms' CHECK (message_type IN ('sms', 'email', 'call')),
    contacts JSONB NOT NULL, -- Array of contact objects: [{phone: string, email: string, type: string}]
    follow_up_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    error_message TEXT
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_scheduled_followups_scheduled_at ON scheduled_followups(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_followups_status ON scheduled_followups(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_followups_property_id ON scheduled_followups(property_id);

-- Function to automatically schedule follow-up after button click
-- This will be called from the track-button-click function
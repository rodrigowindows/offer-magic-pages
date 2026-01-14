-- Migration: Enhance property_analytics table to track source, contact info, IP and location
-- Created: 2026-01-14

-- Add new columns to property_analytics table
ALTER TABLE property_analytics
ADD COLUMN IF NOT EXISTS source TEXT,                    -- 'sms', 'email', 'call', 'direct', etc
ADD COLUMN IF NOT EXISTS campaign_name TEXT,             -- Nome da campanha
ADD COLUMN IF NOT EXISTS contact_phone TEXT,             -- Telefone de quem clicou
ADD COLUMN IF NOT EXISTS contact_email TEXT,             -- Email de quem clicou
ADD COLUMN IF NOT EXISTS contact_name TEXT,              -- Nome de quem clicou
ADD COLUMN IF NOT EXISTS property_address TEXT,          -- Endereço da propriedade
ADD COLUMN IF NOT EXISTS utm_source TEXT,                -- UTM source
ADD COLUMN IF NOT EXISTS utm_medium TEXT,                -- UTM medium
ADD COLUMN IF NOT EXISTS utm_campaign TEXT;              -- UTM campaign

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_property_analytics_source ON property_analytics(source);
CREATE INDEX IF NOT EXISTS idx_property_analytics_campaign_name ON property_analytics(campaign_name);
CREATE INDEX IF NOT EXISTS idx_property_analytics_contact_phone ON property_analytics(contact_phone);

-- Add comment to table
COMMENT ON COLUMN property_analytics.source IS 'Source of the click: sms, email, call, direct, etc';
COMMENT ON COLUMN property_analytics.contact_phone IS 'Phone number of the person who clicked (from URL parameter)';
COMMENT ON COLUMN property_analytics.contact_email IS 'Email of the person who clicked (from URL parameter)';
COMMENT ON COLUMN property_analytics.contact_name IS 'Name of the property owner who clicked';
COMMENT ON COLUMN property_analytics.campaign_name IS 'Marketing campaign name that generated this click';

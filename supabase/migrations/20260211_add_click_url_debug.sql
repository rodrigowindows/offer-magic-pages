-- Migration: Add full click URL for debugging mobile tracking issues
-- Created: 2026-02-11

-- Add column to store the complete URL that was clicked
ALTER TABLE property_analytics
ADD COLUMN IF NOT EXISTS click_url TEXT;

-- Add column to store the full query string separately
ALTER TABLE property_analytics
ADD COLUMN IF NOT EXISTS query_params TEXT;

-- Add index for searching by specific URLs
CREATE INDEX IF NOT EXISTS idx_property_analytics_click_url ON property_analytics(click_url);

-- Add comments
COMMENT ON COLUMN property_analytics.click_url IS 'Complete URL that was clicked (for mobile debugging)';
COMMENT ON COLUMN property_analytics.query_params IS 'Full query string from the click URL (for debugging param loss)';

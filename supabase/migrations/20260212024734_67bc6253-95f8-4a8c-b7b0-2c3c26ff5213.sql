-- Add click_url and query_params columns for debugging mobile tracking
ALTER TABLE property_analytics
ADD COLUMN IF NOT EXISTS click_url TEXT;

ALTER TABLE property_analytics
ADD COLUMN IF NOT EXISTS query_params TEXT;

CREATE INDEX IF NOT EXISTS idx_property_analytics_click_url ON property_analytics(click_url);

COMMENT ON COLUMN property_analytics.click_url IS 'Complete URL that was clicked (for mobile debugging)';
COMMENT ON COLUMN property_analytics.query_params IS 'Full query string from the click URL (for debugging param loss)';
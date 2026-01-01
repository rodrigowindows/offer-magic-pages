-- Update property_leads table for simpler progressive flow
-- Make phone and name optional (only required if interested)

ALTER TABLE property_leads
  ALTER COLUMN full_name DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL,
  ALTER COLUMN is_owner DROP NOT NULL,
  ALTER COLUMN selling_timeline DROP NOT NULL;

-- Add interest level field
ALTER TABLE property_leads
  ADD COLUMN IF NOT EXISTS interest_level TEXT DEFAULT 'email-only';
  -- 'email-only' = just viewed offer
  -- 'interested' = clicked "I'm interested" button
  -- 'contacted' = we called them
  -- 'qualified' = serious buyer

-- Add offer viewed timestamp
ALTER TABLE property_leads
  ADD COLUMN IF NOT EXISTS offer_viewed_at TIMESTAMP WITH TIME ZONE;

-- Update unique constraint to allow multiple entries per property/email
-- (e.g., they can view offer, then later express interest)
DROP INDEX IF EXISTS property_leads_property_id_email_key;

-- Create composite unique constraint instead
ALTER TABLE property_leads
  ADD CONSTRAINT property_leads_unique_entry
  UNIQUE (property_id, email, interest_level);

-- Add index for interest level queries
CREATE INDEX IF NOT EXISTS idx_property_leads_interest_level
  ON property_leads(interest_level);

-- Create view for lead quality scoring
CREATE OR REPLACE VIEW lead_quality_score AS
SELECT
  pl.*,
  CASE
    WHEN pl.interest_level = 'qualified' THEN 100
    WHEN pl.interest_level = 'contacted' THEN 75
    WHEN pl.interest_level = 'interested' AND pl.selling_timeline = 'asap' THEN 90
    WHEN pl.interest_level = 'interested' AND pl.selling_timeline = '1-3months' THEN 70
    WHEN pl.interest_level = 'interested' AND pl.selling_timeline = '3-6months' THEN 50
    WHEN pl.interest_level = 'interested' THEN 40
    WHEN pl.interest_level = 'email-only' THEN 20
    ELSE 10
  END as quality_score
FROM property_leads pl;

-- Grant access to quality score view
GRANT SELECT ON lead_quality_score TO authenticated;

-- Create function to automatically update interest level
CREATE OR REPLACE FUNCTION update_lead_interest_level()
RETURNS TRIGGER AS $$
BEGIN
  -- If phone number is added, upgrade to 'interested'
  IF NEW.phone IS NOT NULL AND OLD.phone IS NULL THEN
    NEW.interest_level = 'interested';
  END IF;

  -- If contacted, upgrade status
  IF NEW.contacted = TRUE AND OLD.contacted = FALSE THEN
    NEW.interest_level = 'contacted';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating interest level
DROP TRIGGER IF EXISTS auto_update_interest_level ON property_leads;
CREATE TRIGGER auto_update_interest_level
  BEFORE UPDATE ON property_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_interest_level();

COMMENT ON COLUMN property_leads.interest_level IS 'Tracks lead progression: email-only → interested → contacted → qualified';
COMMENT ON VIEW lead_quality_score IS 'Assigns quality score to leads based on interest level and timeline';

-- Add lead scoring system
-- This migration adds automatic lead scoring based on timeline and other factors

-- Add score and hot_lead columns
ALTER TABLE property_leads
  ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hot_lead BOOLEAN DEFAULT FALSE;

-- Create function to calculate lead score
CREATE OR REPLACE FUNCTION calculate_lead_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Base score on selling timeline
  NEW.score = CASE NEW.selling_timeline
    WHEN 'asap' THEN 5
    WHEN '1-3months' THEN 4
    WHEN '3-6months' THEN 3
    WHEN '6-12months' THEN 2
    ELSE 1
  END;

  -- Bonus points if has property_id
  IF NEW.property_id IS NOT NULL THEN
    NEW.score = NEW.score + 1;
  END IF;

  -- Bonus point if has notes (shows engagement)
  IF NEW.notes IS NOT NULL AND length(NEW.notes) > 10 THEN
    NEW.score = NEW.score + 1;
  END IF;

  -- Mark as hot lead if score >= 4
  NEW.hot_lead = (NEW.score >= 4);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to calculate score on INSERT and UPDATE
DROP TRIGGER IF EXISTS calculate_lead_score_trigger ON property_leads;
CREATE TRIGGER calculate_lead_score_trigger
  BEFORE INSERT OR UPDATE OF selling_timeline, property_id, notes
  ON property_leads
  FOR EACH ROW
  EXECUTE FUNCTION calculate_lead_score();

-- Update existing leads with scores
UPDATE property_leads
SET score = CASE selling_timeline
  WHEN 'asap' THEN 5
  WHEN '1-3months' THEN 4
  WHEN '3-6months' THEN 3
  WHEN '6-12months' THEN 2
  ELSE 1
END,
hot_lead = (
  CASE selling_timeline
    WHEN 'asap' THEN 5
    WHEN '1-3months' THEN 4
    WHEN '3-6months' THEN 3
    WHEN '6-12months' THEN 2
    ELSE 1
  END >= 4
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_property_leads_score ON property_leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_property_leads_hot_lead ON property_leads(hot_lead);

-- Update analytics view to include scoring data
DROP VIEW IF EXISTS property_leads_analytics;
CREATE OR REPLACE VIEW property_leads_analytics AS
SELECT
  pl.property_id,
  p.address,
  p.city,
  p.state,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN pl.status = 'new' THEN 1 END) as new_leads,
  COUNT(CASE WHEN pl.status = 'contacted' THEN 1 END) as contacted_leads,
  COUNT(CASE WHEN pl.status = 'qualified' THEN 1 END) as qualified_leads,
  COUNT(CASE WHEN pl.selling_timeline = 'asap' THEN 1 END) as urgent_leads,
  COUNT(CASE WHEN pl.selling_timeline IN ('1-3months', '3-6months') THEN 1 END) as warm_leads,
  COUNT(CASE WHEN pl.hot_lead = true THEN 1 END) as hot_leads,
  ROUND(AVG(pl.score), 2) as avg_score,
  MAX(pl.score) as max_score,
  MAX(pl.created_at) as latest_lead_at
FROM property_leads pl
LEFT JOIN properties p ON pl.property_id = p.id
GROUP BY pl.property_id, p.address, p.city, p.state;

-- Grant access to analytics view
GRANT SELECT ON property_leads_analytics TO authenticated;

-- Create view for hot leads only
CREATE OR REPLACE VIEW hot_leads_view AS
SELECT
  pl.*,
  p.address,
  p.city,
  p.state,
  p.cash_offer_amount
FROM property_leads pl
LEFT JOIN properties p ON pl.property_id = p.id
WHERE pl.hot_lead = true
ORDER BY pl.score DESC, pl.created_at DESC;

-- Grant access
GRANT SELECT ON hot_leads_view TO authenticated;

COMMENT ON COLUMN property_leads.score IS 'Auto-calculated lead score (1-7): timeline + property + engagement';
COMMENT ON COLUMN property_leads.hot_lead IS 'Automatically set to true if score >= 4 (high priority leads)';
COMMENT ON VIEW hot_leads_view IS 'Shows only hot leads (score >= 4) for quick access';

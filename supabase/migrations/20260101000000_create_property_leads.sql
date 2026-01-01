-- Create property_leads table for lead capture
CREATE TABLE IF NOT EXISTS property_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,

  -- Contact Information (Required)
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,

  -- Ownership Verification
  is_owner BOOLEAN NOT NULL DEFAULT TRUE,

  -- Sales Intelligence
  selling_timeline TEXT NOT NULL, -- 'asap', '1-3months', '3-6months', '6-12months', 'exploring'

  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  ip_address TEXT,
  user_agent TEXT,

  -- Follow-up Status
  contacted BOOLEAN DEFAULT FALSE,
  contacted_at TIMESTAMP WITH TIME ZONE,
  contacted_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'not-interested', 'closed'
  notes TEXT,

  -- Prevent duplicate leads for same property/email
  UNIQUE(property_id, email)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_property_leads_property_id ON property_leads(property_id);
CREATE INDEX IF NOT EXISTS idx_property_leads_email ON property_leads(email);
CREATE INDEX IF NOT EXISTS idx_property_leads_status ON property_leads(status);
CREATE INDEX IF NOT EXISTS idx_property_leads_created_at ON property_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_leads_timeline ON property_leads(selling_timeline);

-- Enable RLS (Row Level Security)
ALTER TABLE property_leads ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (public lead capture form)
CREATE POLICY "Anyone can insert leads"
  ON property_leads
  FOR INSERT
  WITH CHECK (true);

-- Policy: Authenticated users can view all leads
CREATE POLICY "Authenticated users can view all leads"
  ON property_leads
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can update leads
CREATE POLICY "Authenticated users can update leads"
  ON property_leads
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_property_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_property_leads_updated_at
  BEFORE UPDATE ON property_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_property_leads_updated_at();

-- Add column to properties table to track if lead was captured
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lead_captured BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lead_captured_at TIMESTAMP WITH TIME ZONE;

-- Create view for lead analytics
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
  MAX(pl.created_at) as latest_lead_at
FROM property_leads pl
JOIN properties p ON pl.property_id = p.id
GROUP BY pl.property_id, p.address, p.city, p.state;

-- Grant access to analytics view
GRANT SELECT ON property_leads_analytics TO authenticated;

COMMENT ON TABLE property_leads IS 'Stores lead capture data when potential sellers view their cash offer';
COMMENT ON COLUMN property_leads.selling_timeline IS 'Timeline for selling: asap, 1-3months, 3-6months, 6-12months, exploring';
COMMENT ON COLUMN property_leads.status IS 'Lead status: new, contacted, qualified, not-interested, closed';

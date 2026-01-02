-- Migration 1: Create property_leads table

CREATE TABLE IF NOT EXISTS property_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  is_owner BOOLEAN DEFAULT TRUE,
  selling_timeline TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  contacted BOOLEAN DEFAULT FALSE,
  contacted_at TIMESTAMP WITH TIME ZONE,
  contacted_by UUID,
  status TEXT DEFAULT 'new',
  notes TEXT,
  interest_level TEXT DEFAULT 'email-only',
  offer_viewed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_property_leads_property_id ON property_leads(property_id);
CREATE INDEX IF NOT EXISTS idx_property_leads_email ON property_leads(email);
CREATE INDEX IF NOT EXISTS idx_property_leads_status ON property_leads(status);
CREATE INDEX IF NOT EXISTS idx_property_leads_created_at ON property_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_leads_timeline ON property_leads(selling_timeline);
CREATE INDEX IF NOT EXISTS idx_property_leads_interest_level ON property_leads(interest_level);

-- Enable RLS
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
  USING (auth.uid() IS NOT NULL);

-- Policy: Authenticated users can update leads
CREATE POLICY "Authenticated users can update leads"
  ON property_leads
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_property_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_property_leads_updated_at
  BEFORE UPDATE ON property_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_property_leads_updated_at();

-- Add columns to properties table if not exists
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lead_captured BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lead_captured_at TIMESTAMP WITH TIME ZONE;

-- Migration 2: Create ab_test_events table
CREATE TABLE IF NOT EXISTS ab_test_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  event TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  session_id TEXT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ab_events_property ON ab_test_events(property_id);
CREATE INDEX IF NOT EXISTS idx_ab_events_variant ON ab_test_events(variant);
CREATE INDEX IF NOT EXISTS idx_ab_events_event ON ab_test_events(event);
CREATE INDEX IF NOT EXISTS idx_ab_events_timestamp ON ab_test_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ab_events_session ON ab_test_events(session_id);

-- Enable RLS
ALTER TABLE ab_test_events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert events (public tracking)
CREATE POLICY "Anyone can insert ab_test_events"
  ON ab_test_events
  FOR INSERT
  WITH CHECK (true);

-- Policy: Authenticated users can view all events
CREATE POLICY "Authenticated users can view ab_test_events"
  ON ab_test_events
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Migration 3: Create CSV import helper functions

-- Function to check if a column exists
CREATE OR REPLACE FUNCTION column_exists(
  p_table_name text,
  p_column_name text
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = p_table_name
    AND column_name = p_column_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to add a column if it doesn't exist
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
  p_table_name text,
  p_column_name text,
  p_column_type text DEFAULT 'text'
) RETURNS boolean AS $$
DECLARE
  sql_statement text;
BEGIN
  IF column_exists(p_table_name, p_column_name) THEN
    RETURN false;
  END IF;
  
  IF p_column_name !~ '^[a-z][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid column name: %', p_column_name;
  END IF;
  
  IF p_table_name !~ '^[a-z][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;
  
  IF p_column_type NOT IN ('text', 'integer', 'numeric', 'boolean', 'timestamp', 'date', 'jsonb') THEN
    RAISE EXCEPTION 'Invalid column type: %', p_column_type;
  END IF;
  
  sql_statement := format('ALTER TABLE %I ADD COLUMN %I %s', p_table_name, p_column_name, p_column_type);
  EXECUTE sql_statement;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get all column names for a table
CREATE OR REPLACE FUNCTION get_table_columns(
  p_table_name text
) RETURNS TABLE(
  column_name text,
  data_type text,
  is_nullable text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
  AND c.table_name = p_table_name
  ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
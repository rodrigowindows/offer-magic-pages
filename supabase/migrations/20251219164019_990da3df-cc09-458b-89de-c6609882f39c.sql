-- Create priority_leads table
CREATE TABLE IF NOT EXISTS public.priority_leads (
    id BIGSERIAL PRIMARY KEY,
    account_number TEXT UNIQUE NOT NULL,
    priority_tier TEXT,
    owner_name TEXT,
    mailing_address TEXT,
    mailing_city TEXT,
    mailing_state TEXT,
    mailing_zip TEXT,
    property_address TEXT,
    lead_score INTEGER,
    condition_score INTEGER,
    condition_category TEXT,
    visual_summary TEXT,
    property_type TEXT,
    beds INTEGER,
    baths NUMERIC,
    year_built INTEGER,
    sqft INTEGER,
    lot_size INTEGER,
    just_value INTEGER,
    taxable_value INTEGER,
    exemptions TEXT,
    total_tax_due NUMERIC,
    years_delinquent INTEGER,
    is_estate BOOLEAN,
    is_out_of_state BOOLEAN,
    equity_estimate INTEGER,
    estimated_repair_cost_low INTEGER,
    estimated_repair_cost_high INTEGER,
    appears_vacant BOOLEAN,
    is_vacant_land BOOLEAN,
    lawn_condition TEXT,
    exterior_condition TEXT,
    roof_condition TEXT,
    visible_issues TEXT,
    distress_indicators TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_priority_tier ON public.priority_leads(priority_tier);
CREATE INDEX IF NOT EXISTS idx_lead_score ON public.priority_leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_condition_score ON public.priority_leads(condition_score DESC);
CREATE INDEX IF NOT EXISTS idx_is_estate ON public.priority_leads(is_estate);
CREATE INDEX IF NOT EXISTS idx_is_vacant_land ON public.priority_leads(is_vacant_land);

-- Enable Row Level Security
ALTER TABLE public.priority_leads ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on priority_leads"
    ON public.priority_leads
    FOR SELECT
    USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert on priority_leads"
    ON public.priority_leads
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update on priority_leads"
    ON public.priority_leads
    FOR UPDATE
    TO authenticated
    USING (true);
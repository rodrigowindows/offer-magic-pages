-- ============================================================================
-- SUPABASE DATABASE SETUP FOR PRIORITY LEADS
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor:
-- https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/sql

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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_priority_tier ON public.priority_leads(priority_tier);
CREATE INDEX IF NOT EXISTS idx_lead_score ON public.priority_leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_condition_score ON public.priority_leads(condition_score DESC);
CREATE INDEX IF NOT EXISTS idx_is_estate ON public.priority_leads(is_estate);
CREATE INDEX IF NOT EXISTS idx_is_vacant_land ON public.priority_leads(is_vacant_land);

-- Enable Row Level Security (RLS)
ALTER TABLE public.priority_leads ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (adjust as needed)
CREATE POLICY "Allow public read access"
    ON public.priority_leads
    FOR SELECT
    USING (true);

-- Create policy to allow authenticated users to insert/update
CREATE POLICY "Allow authenticated insert"
    ON public.priority_leads
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update"
    ON public.priority_leads
    FOR UPDATE
    TO authenticated
    USING (true);

-- Create storage bucket for property images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'property-images' );

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'property-images' );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if table was created
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'priority_leads';

-- Check columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'priority_leads'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'priority_leads';

-- Check storage bucket
SELECT * FROM storage.buckets WHERE name = 'property-images';

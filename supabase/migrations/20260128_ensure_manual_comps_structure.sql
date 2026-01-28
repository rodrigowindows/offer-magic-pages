-- Migration: Ensure manual_comps_links table has all required columns
-- Created: 2026-01-28
-- Purpose: Consolidate all manual comps structure requirements

-- Ensure table exists with all required columns
CREATE TABLE IF NOT EXISTS public.manual_comps_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    property_address TEXT NOT NULL,
    url TEXT,
    notes TEXT,
    comp_data JSONB,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure comp_data column exists (in case table existed without it)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'manual_comps_links'
        AND column_name = 'comp_data'
    ) THEN
        ALTER TABLE public.manual_comps_links ADD COLUMN comp_data JSONB;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_manual_comps_links_property_id
ON public.manual_comps_links(property_id);

CREATE INDEX IF NOT EXISTS idx_manual_comps_links_user_id
ON public.manual_comps_links(user_id);

CREATE INDEX IF NOT EXISTS idx_manual_comps_links_comp_data
ON public.manual_comps_links USING GIN (comp_data);

CREATE INDEX IF NOT EXISTS idx_manual_comps_links_created_at
ON public.manual_comps_links(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.manual_comps_links IS
'Stores manually added comparable properties with optional full data';

COMMENT ON COLUMN public.manual_comps_links.comp_data IS
'Optional JSON data containing full comp details: {
  "sale_price": number,
  "square_feet": number,
  "bedrooms": number,
  "bathrooms": number,
  "sale_date": "YYYY-MM-DD"
}';

-- Enable Row Level Security
ALTER TABLE public.manual_comps_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own manual comps" ON public.manual_comps_links;
DROP POLICY IF EXISTS "Users can insert their own manual comps" ON public.manual_comps_links;
DROP POLICY IF EXISTS "Users can update their own manual comps" ON public.manual_comps_links;
DROP POLICY IF EXISTS "Users can delete their own manual comps" ON public.manual_comps_links;

-- Create RLS policies
CREATE POLICY "Users can view their own manual comps"
ON public.manual_comps_links
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own manual comps"
ON public.manual_comps_links
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own manual comps"
ON public.manual_comps_links
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own manual comps"
ON public.manual_comps_links
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_manual_comps_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_manual_comps_links_updated_at_trigger ON public.manual_comps_links;

CREATE TRIGGER update_manual_comps_links_updated_at_trigger
    BEFORE UPDATE ON public.manual_comps_links
    FOR EACH ROW
    EXECUTE FUNCTION public.update_manual_comps_links_updated_at();

-- Validate existing data (optional - add constraints if needed)
-- Ensure comp_data has required structure when present
ALTER TABLE public.manual_comps_links
ADD CONSTRAINT check_comp_data_structure
CHECK (
    comp_data IS NULL
    OR (
        comp_data ? 'sale_price'
        AND comp_data ? 'square_feet'
    )
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manual_comps_links TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

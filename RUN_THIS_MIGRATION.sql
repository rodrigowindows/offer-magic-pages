-- ============================================================
-- MIGRATION: Add comp_data column to manual_comps_links
-- PASTE THIS IN SUPABASE SQL EDITOR AND RUN IT
-- ============================================================
-- URL: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/sql/new
-- ============================================================

-- Add comp_data column
ALTER TABLE public.manual_comps_links
ADD COLUMN IF NOT EXISTS comp_data JSONB;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_manual_comps_links_comp_data
ON public.manual_comps_links USING GIN (comp_data);

-- Add comment
COMMENT ON COLUMN public.manual_comps_links.comp_data IS
'Optional JSON data: { salePrice, squareFeet, bedrooms, bathrooms, saleDate, address, city, state, zipCode }';

-- Verify the column was added
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'manual_comps_links'
  AND column_name = 'comp_data';

-- Expected result: comp_data | jsonb | YES

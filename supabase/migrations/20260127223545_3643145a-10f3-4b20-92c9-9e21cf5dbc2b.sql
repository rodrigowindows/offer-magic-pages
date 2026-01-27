-- Add comp_data column to manual_comps_links table
ALTER TABLE public.manual_comps_links
ADD COLUMN IF NOT EXISTS comp_data JSONB;

-- Create index for querying by comp data
CREATE INDEX IF NOT EXISTS idx_manual_comps_links_comp_data
ON public.manual_comps_links USING GIN (comp_data);

-- Add comment explaining the column
COMMENT ON COLUMN public.manual_comps_links.comp_data IS
'Optional JSON data containing full comp details: { salePrice, squareFeet, bedrooms, bathrooms, saleDate, etc. }';
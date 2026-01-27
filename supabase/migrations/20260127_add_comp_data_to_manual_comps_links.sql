-- Add comp_data JSONB column to manual_comps_links table
-- This allows storing complete comp data (price, sqft, beds, baths, sale_date) manually

ALTER TABLE public.manual_comps_links
ADD COLUMN IF NOT EXISTS comp_data JSONB;

-- Add comment to explain the structure
COMMENT ON COLUMN public.manual_comps_links.comp_data IS 'Optional complete comp data: {sale_price, square_feet, bedrooms, bathrooms, sale_date}';

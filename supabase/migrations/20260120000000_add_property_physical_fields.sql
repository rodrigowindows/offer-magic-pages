-- Add physical property details to properties table
-- This enables accurate comparable analysis and quality scoring

-- Add new columns for property physical characteristics
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS sqft INTEGER,
ADD COLUMN IF NOT EXISTS beds INTEGER,
ADD COLUMN IF NOT EXISTS baths DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS year_built INTEGER,
ADD COLUMN IF NOT EXISTS lot_size INTEGER,
ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'Single Family',
ADD COLUMN IF NOT EXISTS condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'as-is'));

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_properties_sqft ON public.properties(sqft);
CREATE INDEX IF NOT EXISTS idx_properties_beds ON public.properties(beds);
CREATE INDEX IF NOT EXISTS idx_properties_year_built ON public.properties(year_built);

-- Comments
COMMENT ON COLUMN properties.sqft IS 'Total living area in square feet';
COMMENT ON COLUMN properties.beds IS 'Number of bedrooms';
COMMENT ON COLUMN properties.baths IS 'Number of bathrooms (supports half baths like 2.5)';
COMMENT ON COLUMN properties.year_built IS 'Year the property was built';
COMMENT ON COLUMN properties.lot_size IS 'Lot size in square feet';
COMMENT ON COLUMN properties.property_type IS 'Property type (Single Family, Multi-Family, Condo, etc.)';
COMMENT ON COLUMN properties.condition IS 'Current condition of the property';

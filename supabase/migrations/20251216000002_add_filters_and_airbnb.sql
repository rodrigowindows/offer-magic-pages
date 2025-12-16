-- Add advanced filtering fields and Airbnb data

-- Add date/time fields for better filtering
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS import_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS import_batch text,
ADD COLUMN IF NOT EXISTS last_contact_date date,
ADD COLUMN IF NOT EXISTS next_followup_date date;

-- Add Airbnb eligibility fields
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS airbnb_eligible boolean,
ADD COLUMN IF NOT EXISTS airbnb_check_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS airbnb_regulations jsonb,
ADD COLUMN IF NOT EXISTS airbnb_notes text;

-- Add more location/property details for filtering
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS county text,
ADD COLUMN IF NOT EXISTS property_type text,
ADD COLUMN IF NOT EXISTS bedrooms integer,
ADD COLUMN IF NOT EXISTS bathrooms numeric(3,1),
ADD COLUMN IF NOT EXISTS square_feet integer,
ADD COLUMN IF NOT EXISTS lot_size numeric(10,2),
ADD COLUMN IF NOT EXISTS year_built integer;

-- Create indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_properties_import_date ON properties(import_date DESC);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_county ON properties(county);
CREATE INDEX IF NOT EXISTS idx_properties_import_batch ON properties(import_batch);
CREATE INDEX IF NOT EXISTS idx_properties_airbnb_eligible ON properties(airbnb_eligible) WHERE airbnb_eligible = true;
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_next_followup ON properties(next_followup_date) WHERE next_followup_date IS NOT NULL;

-- Add comments
COMMENT ON COLUMN properties.import_date IS 'Date when property was imported';
COMMENT ON COLUMN properties.import_batch IS 'Batch identifier (e.g., "orlando-tier1-dec2025")';
COMMENT ON COLUMN properties.last_contact_date IS 'Last time property owner was contacted';
COMMENT ON COLUMN properties.next_followup_date IS 'Scheduled follow-up date';
COMMENT ON COLUMN properties.airbnb_eligible IS 'Whether property is eligible for Airbnb based on local regulations';
COMMENT ON COLUMN properties.airbnb_check_date IS 'When Airbnb eligibility was last checked';
COMMENT ON COLUMN properties.airbnb_regulations IS 'JSON with Airbnb regulations details';
COMMENT ON COLUMN properties.airbnb_notes IS 'Additional Airbnb eligibility notes';
COMMENT ON COLUMN properties.county IS 'County name (e.g., Orange County)';
COMMENT ON COLUMN properties.property_type IS 'Property type (Single Family, Condo, Townhouse, etc)';

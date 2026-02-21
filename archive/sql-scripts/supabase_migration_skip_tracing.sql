-- =====================================================
-- Skip Tracing Data Migration
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add skip_tracing_data column to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS skip_tracing_data JSONB;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_skip_tracing
ON properties USING GIN (skip_tracing_data);

-- Add comment to document the field
COMMENT ON COLUMN properties.skip_tracing_data IS
'Skip tracing data from PropStream/BatchSkipTracing exports.
Structure: {
  firstName: string,
  lastName: string,
  age: number,
  isDNC: boolean,
  isDeceased: boolean,
  phones: [{number: string, type: string}],
  emails: [string],
  relatives: [{name: string, age: number, phones: [{number: string, type: string}]}],
  updatedAt: timestamp
}';

-- Optional: Create helper function to get best phone from skip tracing data
CREATE OR REPLACE FUNCTION get_best_phone_from_skip_tracing(data JSONB)
RETURNS TEXT AS $$
DECLARE
  phone_record JSONB;
BEGIN
  -- Try to get mobile phone first
  FOR phone_record IN
    SELECT jsonb_array_elements FROM jsonb_array_elements(data->'phones')
  LOOP
    IF phone_record->>'type' = 'Mobile' THEN
      RETURN phone_record->>'number';
    END IF;
  END LOOP;

  -- If no mobile, try residential
  FOR phone_record IN
    SELECT jsonb_array_elements FROM jsonb_array_elements(data->'phones')
  LOOP
    IF phone_record->>'type' = 'Residential' THEN
      RETURN phone_record->>'number';
    END IF;
  END LOOP;

  -- Return first phone if available
  IF jsonb_array_length(data->'phones') > 0 THEN
    RETURN (data->'phones'->0)->>'number';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Optional: Create view to easily access skip tracing data
CREATE OR REPLACE VIEW properties_with_skip_tracing AS
SELECT
  id,
  address,
  city,
  state,
  zip_code,
  owner_name,
  owner_phone,
  owner_email,
  skip_tracing_data->>'firstName' as st_first_name,
  skip_tracing_data->>'lastName' as st_last_name,
  (skip_tracing_data->>'age')::int as st_age,
  (skip_tracing_data->>'isDNC')::boolean as st_is_dnc,
  (skip_tracing_data->>'isDeceased')::boolean as st_is_deceased,
  get_best_phone_from_skip_tracing(skip_tracing_data) as st_best_phone,
  skip_tracing_data->'emails'->0 as st_primary_email,
  jsonb_array_length(COALESCE(skip_tracing_data->'phones', '[]'::jsonb)) as st_phone_count,
  jsonb_array_length(COALESCE(skip_tracing_data->'relatives', '[]'::jsonb)) as st_relatives_count,
  skip_tracing_data->>'updatedAt' as st_updated_at,
  skip_tracing_data
FROM properties
WHERE skip_tracing_data IS NOT NULL;

-- Grant permissions (adjust role name as needed)
GRANT SELECT ON properties_with_skip_tracing TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Skip tracing migration completed successfully!';
  RAISE NOTICE 'Column added: skip_tracing_data (JSONB)';
  RAISE NOTICE 'Index created: idx_properties_skip_tracing';
  RAISE NOTICE 'Helper function created: get_best_phone_from_skip_tracing()';
  RAISE NOTICE 'View created: properties_with_skip_tracing';
END $$;

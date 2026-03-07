-- Add skip_tracing_data JSONB column for skip trace metadata backup
ALTER TABLE properties ADD COLUMN IF NOT EXISTS skip_tracing_data JSONB;

-- Add index for better query performance on skip trace data
CREATE INDEX IF NOT EXISTS idx_properties_skip_tracing
ON properties USING GIN (skip_tracing_data);

-- Add comment
COMMENT ON COLUMN properties.skip_tracing_data IS
'Skip tracing data backup from BatchSkipTracing exports. Structure: { firstName, lastName, age, isDNC, isDeceased, resultCode, phones: [{number, type}], emails: [string], updatedAt }';

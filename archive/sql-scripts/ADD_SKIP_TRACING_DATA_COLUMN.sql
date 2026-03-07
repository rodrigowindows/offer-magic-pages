-- =====================================================
-- Add skip_tracing_data JSONB column
-- Run this in Supabase SQL Editor
-- =====================================================

-- This column stores the JSON backup of skip trace import data
ALTER TABLE properties ADD COLUMN IF NOT EXISTS skip_tracing_data JSONB;

-- Index for faster queries on skip trace data
CREATE INDEX IF NOT EXISTS idx_properties_skip_tracing
ON properties USING GIN (skip_tracing_data);

COMMENT ON COLUMN properties.skip_tracing_data IS
'Skip tracing data backup from BatchSkipTracing exports. Structure: { firstName, lastName, age, isDNC, isDeceased, resultCode, phones: [{number, type}], emails: [string], updatedAt }';

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'properties' AND column_name = 'skip_tracing_data';

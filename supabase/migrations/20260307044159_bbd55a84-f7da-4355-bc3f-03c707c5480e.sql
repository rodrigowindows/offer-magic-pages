ALTER TABLE properties ADD COLUMN IF NOT EXISTS skip_tracing_data JSONB;

CREATE INDEX IF NOT EXISTS idx_properties_skip_tracing ON properties USING GIN (skip_tracing_data);
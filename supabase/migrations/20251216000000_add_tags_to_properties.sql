-- Add tags column to properties table
-- Tags will be stored as a text array for easy filtering

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create index for faster tag searches
CREATE INDEX IF NOT EXISTS idx_properties_tags ON properties USING GIN (tags);

-- Add comment
COMMENT ON COLUMN properties.tags IS 'Property tags for categorization and filtering (e.g., tier1, hot-lead, deed-certified, vacant, pool-distress)';

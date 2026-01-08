-- Add preferred contact columns to properties table
-- This allows users to select which phones/emails to use for campaigns

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS preferred_phones JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS preferred_emails JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN properties.preferred_phones IS 'Array of selected phone numbers to be used in marketing campaigns';
COMMENT ON COLUMN properties.preferred_emails IS 'Array of selected email addresses to be used in marketing campaigns';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_properties_preferred_phones ON properties USING GIN (preferred_phones);
CREATE INDEX IF NOT EXISTS idx_properties_preferred_emails ON properties USING GIN (preferred_emails);

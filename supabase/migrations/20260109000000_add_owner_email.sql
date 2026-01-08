-- Add owner_email field to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS owner_email TEXT;

-- Add comment
COMMENT ON COLUMN public.properties.owner_email IS 'Primary email address of the property owner';
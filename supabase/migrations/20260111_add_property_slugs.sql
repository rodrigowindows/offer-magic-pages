-- Add slug column to properties table and create function to generate slugs
-- Migration: 20260111_add_property_slugs.sql

-- Add slug column to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- Create function to generate property slug
CREATE OR REPLACE FUNCTION generate_property_slug(
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT
) RETURNS TEXT AS $$
DECLARE
  clean_address TEXT;
  clean_city TEXT;
  result_slug TEXT;
BEGIN
  -- Clean address: lowercase, remove special chars, replace spaces with hyphens
  clean_address := regexp_replace(lower(address), '[^a-zA-Z0-9\s-]', '', 'g');
  clean_address := regexp_replace(clean_address, '\s+', '-', 'g');
  clean_address := regexp_replace(clean_address, '-+', '-', 'g');
  clean_address := trim(clean_address);

  -- Clean city
  clean_city := regexp_replace(lower(city), '[^a-zA-Z0-9\s-]', '', 'g');
  clean_city := regexp_replace(clean_city, '\s+', '-', 'g');
  clean_city := regexp_replace(clean_city, '-+', '-', 'g');
  clean_city := trim(clean_city);

  -- Generate slug: address-city-state-zip
  result_slug := clean_address || '-' || clean_city || '-' || lower(trim(state)) || '-' || zip_code;

  -- Ensure it's not too long (max 255 chars for VARCHAR)
  IF length(result_slug) > 255 THEN
    result_slug := substring(result_slug, 1, 255);
  END IF;

  RETURN result_slug;
END;
$$ LANGUAGE plpgsql;

-- Update existing properties with slugs
UPDATE properties
SET slug = generate_property_slug(address, city, state, zip_code)
WHERE slug IS NULL OR slug = '';

-- Create trigger to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION set_property_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug if it's not provided or if address/city/state/zip changed
  IF NEW.slug IS NULL OR NEW.slug = '' OR
     (OLD.address != NEW.address OR OLD.city != NEW.city OR
      OLD.state != NEW.state OR OLD.zip_code != NEW.zip_code) THEN
    NEW.slug := generate_property_slug(NEW.address, NEW.city, NEW.state, NEW.zip_code);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_property_slug ON properties;
CREATE TRIGGER trigger_set_property_slug
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION set_property_slug();

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug);

-- Add comment
COMMENT ON COLUMN properties.slug IS 'URL-friendly identifier generated from address, city, state, and zip code';
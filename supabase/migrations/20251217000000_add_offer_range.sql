-- Add offer range columns to properties table
-- This allows setting a min/max offer range instead of single offer amount

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS min_offer_amount numeric,
ADD COLUMN IF NOT EXISTS max_offer_amount numeric;

-- Add comments
COMMENT ON COLUMN properties.min_offer_amount IS 'Minimum cash offer amount for this property';
COMMENT ON COLUMN properties.max_offer_amount IS 'Maximum cash offer amount for this property';

-- Update existing properties: if they have cash_offer_amount, use it as both min and max
UPDATE properties
SET
  min_offer_amount = cash_offer_amount,
  max_offer_amount = cash_offer_amount * 1.1  -- Add 10% for max
WHERE cash_offer_amount IS NOT NULL
  AND min_offer_amount IS NULL;

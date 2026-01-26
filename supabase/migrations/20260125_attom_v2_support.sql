-- Migration: Add county_name and ATTOM V2 support fields
-- Date: 2026-01-25
-- Description: Add county field for ATTOM V2 API, AVM fields, and valuation tracking

-- 1. Add county_name column (required for ATTOM V2 Sales Comparables API)
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS county_name TEXT;

-- 2. Add AVM-related columns
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS valuation_method TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS valuation_confidence DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_valuation_date TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS avm_min_value DECIMAL(12,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS avm_max_value DECIMAL(12,2) DEFAULT NULL;

-- 3. Add ATTOM-specific fields
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS attom_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_attom_fetch TIMESTAMP DEFAULT NULL;

-- 4. Create index for valuation tracking
CREATE INDEX IF NOT EXISTS idx_properties_valuation_method 
ON public.properties(valuation_method) WHERE valuation_method IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_county_name 
ON public.properties(county_name) WHERE county_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_last_valuation_date 
ON public.properties(last_valuation_date DESC) WHERE last_valuation_date IS NOT NULL;

-- 5. Create index for performance on estimated_value queries
CREATE INDEX IF NOT EXISTS idx_properties_estimated_value 
ON public.properties(estimated_value DESC) WHERE estimated_value > 0;

-- 6. Create function to auto-update property valuation when comparables are saved
CREATE OR REPLACE FUNCTION public.update_property_from_attom_v2()
RETURNS TRIGGER AS $$
DECLARE
  avg_price DECIMAL;
  comp_count INT;
  min_price DECIMAL;
  max_price DECIMAL;
BEGIN
  -- Calcular estatísticas dos comparables
  SELECT 
    ROUND(AVG(sale_price))::DECIMAL,
    COUNT(*),
    ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY sale_price))::DECIMAL,
    ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY sale_price))::DECIMAL
  INTO avg_price, comp_count, min_price, max_price
  FROM public.comparables
  WHERE property_id = NEW.property_id
  AND sale_price > 10000;

  -- Atualizar propriedade se temos comps válidos
  IF comp_count >= 3 THEN
    UPDATE public.properties
    SET 
      estimated_value = avg_price,
      avm_min_value = COALESCE(min_price, ROUND(avg_price * 0.85)),
      avm_max_value = COALESCE(max_price, ROUND(avg_price * 1.15)),
      valuation_method = 'avm_from_comps',
      valuation_confidence = LEAST(100, 60 + (comp_count * 8))::DECIMAL,
      last_valuation_date = NOW(),
      last_attom_fetch = NOW(),
      updated_at = NOW()
    WHERE id = NEW.property_id;
    
    RAISE NOTICE 'Updated property % with AVM: $% (% comps, % confidence)', 
      NEW.property_id, avg_price, comp_count, LEAST(100, 60 + (comp_count * 8));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Drop old trigger if exists
DROP TRIGGER IF EXISTS trigger_update_property_from_comps ON public.comparables;

-- 8. Create new trigger
CREATE TRIGGER trigger_update_property_from_attom_v2
AFTER INSERT ON public.comparables
FOR EACH ROW
EXECUTE FUNCTION public.update_property_from_attom_v2();

-- 9. Clear old placeholder values
UPDATE public.properties
SET 
  estimated_value = NULL,
  valuation_method = NULL,
  valuation_confidence = NULL,
  avm_min_value = NULL,
  avm_max_value = NULL
WHERE estimated_value = 100000 
  AND valuation_method IS NULL
  AND created_at < NOW() - INTERVAL '1 day';

-- 10. Set county_name for known Orlando area properties
UPDATE public.properties
SET county_name = 'Orange'
WHERE (
  city ILIKE '%Orlando%' OR 
  city ILIKE '%Winter Park%' OR 
  city ILIKE '%Ocoee%' OR 
  city ILIKE '%Apopka%' OR
  city ILIKE '%Belle Isle%' OR
  city ILIKE '%Eatonville%'
) AND state = 'FL' AND county_name IS NULL;

-- 11. Add comment to column
COMMENT ON COLUMN public.properties.county_name IS 'County name (required for ATTOM V2 Sales Comparables API). E.g., "Orange" for Orlando, FL';
COMMENT ON COLUMN public.properties.valuation_method IS 'Method used for valuation: avm_from_comps, attom_avm, manual, zillow, etc';
COMMENT ON COLUMN public.properties.valuation_confidence IS 'Confidence score for valuation (0-100%). Higher = more reliable';
COMMENT ON COLUMN public.properties.attom_id IS 'ATTOM assigned property ID for reference and future lookups';
COMMENT ON COLUMN public.properties.last_attom_fetch IS 'Timestamp of last successful ATTOM API call';

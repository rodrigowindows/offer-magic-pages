-- Keep AVM valuation as a single source of truth in application logic.
-- Automatic SQL triggers can overwrite values calculated by AVMService.

DROP TRIGGER IF EXISTS trigger_update_property_from_attom_v2 ON public.comparables;
DROP TRIGGER IF EXISTS trigger_update_property_valuation ON public.comparables;
DROP TRIGGER IF EXISTS trigger_update_property_from_comps ON public.comparables;

DROP FUNCTION IF EXISTS public.update_property_from_attom_v2();
DROP FUNCTION IF EXISTS public.update_property_valuation();


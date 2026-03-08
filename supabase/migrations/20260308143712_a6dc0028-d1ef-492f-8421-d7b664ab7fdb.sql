
-- Fix SECURITY DEFINER view - recreate as SECURITY INVOKER
DROP VIEW IF EXISTS public.properties_public;
CREATE VIEW public.properties_public 
WITH (security_invoker = true)
AS
SELECT 
  id, slug, address, city, state, zip_code, 
  property_image_url, estimated_value, cash_offer_amount,
  status, neighborhood, zillow_url, bedrooms, bathrooms, 
  square_feet, lot_size, year_built, pool, latitude, longitude,
  property_type, lead_status
FROM public.properties
WHERE status = 'active';

-- Fix remaining "always true" RLS policies on other tables
-- ab_test_events INSERT (public can insert for tracking - intentional)
-- ab_tests INSERT (public can insert for tracking - intentional)
-- property_analytics INSERT (service role inserts - intentional)

-- Fix: campaign_logs INSERT/UPDATE - restrict to authenticated
DROP POLICY IF EXISTS "Anyone can insert campaign logs" ON public.campaign_logs;
DROP POLICY IF EXISTS "Anyone can update campaign logs" ON public.campaign_logs;

-- Check if insert/update policies exist already
CREATE POLICY "Authenticated users can insert campaign logs"
  ON public.campaign_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update campaign logs"
  ON public.campaign_logs FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix function search_path for mutable functions
CREATE OR REPLACE FUNCTION public.update_templates_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
  RETURNS TABLE(deleted_comps_history bigint, deleted_comparables_cache bigint)
  LANGUAGE plpgsql
  SET search_path = 'public'
AS $function$
DECLARE
  deleted_history BIGINT;
  deleted_cache BIGINT;
BEGIN
  DELETE FROM public.comps_analysis_history 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  GET DIAGNOSTICS deleted_history = ROW_COUNT;
  
  DELETE FROM comparables_cache 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  GET DIAGNOSTICS deleted_cache = ROW_COUNT;
  
  RETURN QUERY SELECT deleted_history, deleted_cache;
END;
$function$;

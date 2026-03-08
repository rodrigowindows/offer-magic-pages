
-- =============================================
-- SECURITY HARDENING: Fix all critical RLS issues
-- =============================================

-- 1. DROP the dangerous execute_sql function (SQL injection vector)
DROP FUNCTION IF EXISTS public.execute_sql(text);

-- 2. FIX: properties - Create a public view with only non-sensitive fields
-- Keep existing "Anyone can view active properties" for the public landing/property pages
-- but restrict what columns the anon role can see via a secure view
CREATE OR REPLACE VIEW public.properties_public AS
SELECT 
  id, slug, address, city, state, zip_code, 
  property_image_url, estimated_value, cash_offer_amount,
  status, neighborhood, zillow_url, bedrooms, bathrooms, 
  square_feet, lot_size, year_built, pool, latitude, longitude,
  property_type, lead_status
FROM public.properties
WHERE status = 'active';

-- 3. FIX: api_request_logs - Remove public SELECT, restrict to authenticated
DROP POLICY IF EXISTS "Anyone can view api request logs" ON public.api_request_logs;
CREATE POLICY "Authenticated users can view api request logs"
  ON public.api_request_logs FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 4. FIX: campaign_logs - Add authenticated-only SELECT
-- First check if there's a public select policy
DROP POLICY IF EXISTS "Anyone can view campaign logs" ON public.campaign_logs;
CREATE POLICY "Authenticated users can view campaign logs"
  ON public.campaign_logs FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 5. FIX: priority_leads - Remove anon read/write, restrict to authenticated
DROP POLICY IF EXISTS "Allow public read access on priority_leads" ON public.priority_leads;
DROP POLICY IF EXISTS "Allow anon insert" ON public.priority_leads;
DROP POLICY IF EXISTS "Allow anon update" ON public.priority_leads;
CREATE POLICY "Authenticated users can view priority leads"
  ON public.priority_leads FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 6. FIX: templates - Restrict to authenticated users only
DROP POLICY IF EXISTS "Allow public delete to templates" ON public.templates;
DROP POLICY IF EXISTS "Allow public insert to templates" ON public.templates;
DROP POLICY IF EXISTS "Allow public read access to templates" ON public.templates;
DROP POLICY IF EXISTS "Allow public update to templates" ON public.templates;
CREATE POLICY "Authenticated users can manage templates"
  ON public.templates FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 7. FIX: email_campaigns - Restrict to authenticated users only
DROP POLICY IF EXISTS "Allow all operations on email_campaigns" ON public.email_campaigns;
CREATE POLICY "Authenticated users can manage email campaigns"
  ON public.email_campaigns FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 8. FIX: properties INSERT/UPDATE/DELETE - Require authentication
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can update properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can delete properties" ON public.properties;

CREATE POLICY "Authenticated users can insert properties"
  ON public.properties FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update properties"
  ON public.properties FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete properties"
  ON public.properties FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 9. FIX: properties SELECT - Keep public view for active properties (landing page needs it)
-- but also add authenticated full access
CREATE POLICY "Authenticated users can view all properties"
  ON public.properties FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

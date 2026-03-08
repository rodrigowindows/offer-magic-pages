-- 1. Remove the dangerous public SELECT policy on properties that exposes PII
DROP POLICY IF EXISTS "Anyone can view active properties" ON public.properties;

-- 2. Fix ab_tests: restrict SELECT to authenticated only
DROP POLICY IF EXISTS "Anyone can view ab_tests" ON public.ab_tests;
CREATE POLICY "Authenticated users can view ab_tests"
  ON public.ab_tests FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 3. Fix priority_leads: tighten INSERT/UPDATE policies to require auth
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.priority_leads;
DROP POLICY IF EXISTS "Allow authenticated insert on priority_leads" ON public.priority_leads;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.priority_leads;
DROP POLICY IF EXISTS "Allow authenticated update on priority_leads" ON public.priority_leads;

CREATE POLICY "Authenticated users can insert priority_leads"
  ON public.priority_leads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update priority_leads"
  ON public.priority_leads FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 4. Fix api_request_logs INSERT policy  
DROP POLICY IF EXISTS "Service role can insert api request logs" ON public.api_request_logs;
CREATE POLICY "Authenticated users can insert api request logs"
  ON public.api_request_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
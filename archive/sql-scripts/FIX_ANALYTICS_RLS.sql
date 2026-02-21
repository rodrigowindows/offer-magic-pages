-- ============================================================================
-- FIX: Analytics RLS policies - Run in Supabase SQL Editor
-- Project: atwdkhlyrffbaugkaker
-- URL: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/sql/new
--
-- Problem: RLS blocks anon inserts to property_analytics and ab_test_events,
-- causing zero page views to be recorded when visitors access property pages.
-- Safe to run multiple times (idempotent).
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1) property_analytics: Allow anon INSERT (for edge functions + client tracking)
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.property_analytics ENABLE ROW LEVEL SECURITY;

-- Drop old policy if it exists (might be misconfigured)
DROP POLICY IF EXISTS "Service role can insert analytics" ON public.property_analytics;
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.property_analytics;

-- Allow anyone (including anon) to insert analytics events
CREATE POLICY "Anyone can insert analytics"
  ON public.property_analytics
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated users to view analytics
DROP POLICY IF EXISTS "Authenticated users can view analytics" ON public.property_analytics;
CREATE POLICY "Authenticated users can view analytics"
  ON public.property_analytics
  FOR SELECT
  TO authenticated
  USING (true);

-- Also allow anon to read (for real-time dashboard if needed)
DROP POLICY IF EXISTS "Anon can view analytics" ON public.property_analytics;
CREATE POLICY "Anon can view analytics"
  ON public.property_analytics
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- 2) ab_test_events: Allow anon INSERT (for A/B test tracking)
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.ab_test_events ENABLE ROW LEVEL SECURITY;

-- Drop old policy if it exists
DROP POLICY IF EXISTS "Anyone can insert ab_test_events" ON public.ab_test_events;

-- Allow anyone to insert AB test events (visitor tracking)
CREATE POLICY "Anyone can insert ab_test_events"
  ON public.ab_test_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated users to view AB test events
DROP POLICY IF EXISTS "Authenticated users can view ab_test_events" ON public.ab_test_events;
CREATE POLICY "Authenticated users can view ab_test_events"
  ON public.ab_test_events
  FOR SELECT
  TO authenticated
  USING (true);

COMMIT;

-- ============================================================================
-- VERIFY: After running, test with this query:
-- INSERT INTO property_analytics (property_id, event_type, source)
-- VALUES ('eb7e1672-ea78-4270-b0c0-b841354cbaec', 'test_ping', 'debug');
-- If it succeeds, the fix worked!
-- Then delete the test: DELETE FROM property_analytics WHERE event_type = 'test_ping';
-- ============================================================================

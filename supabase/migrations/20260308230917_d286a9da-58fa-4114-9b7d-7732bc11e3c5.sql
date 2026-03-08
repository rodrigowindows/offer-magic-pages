
-- Fix campaign_logs: Drop public INSERT/UPDATE policies with true, recreate for service_role
DROP POLICY IF EXISTS "Service role can insert campaign logs" ON public.campaign_logs;
DROP POLICY IF EXISTS "Service role can update campaign logs" ON public.campaign_logs;

CREATE POLICY "Service role can insert campaign logs"
ON public.campaign_logs FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update campaign logs"
ON public.campaign_logs FOR UPDATE
TO service_role
USING (true);

-- Fix notifications: Drop public INSERT policy, recreate for service_role
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

CREATE POLICY "Service role can insert notifications"
ON public.notifications FOR INSERT
TO service_role
WITH CHECK (true);

-- Fix property_analytics: Drop public INSERT policy, recreate for service_role
DROP POLICY IF EXISTS "Service role can insert analytics" ON public.property_analytics;

CREATE POLICY "Service role can insert analytics"
ON public.property_analytics FOR INSERT
TO service_role
WITH CHECK (true);

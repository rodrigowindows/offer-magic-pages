-- Fix RLS policies to allow anon/public key to insert data
-- This is needed because the publishable key (anon role) needs insert permission

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.priority_leads;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.priority_leads;

-- Create new policies that allow anon role to insert/update
CREATE POLICY "Allow anon insert"
    ON public.priority_leads
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anon update"
    ON public.priority_leads
    FOR UPDATE
    TO anon
    USING (true);

-- Also allow authenticated users
CREATE POLICY "Allow authenticated insert"
    ON public.priority_leads
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update"
    ON public.priority_leads
    FOR UPDATE
    TO authenticated
    USING (true);

-- Verify policies
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'priority_leads';


-- Drop old user-specific policies
DROP POLICY IF EXISTS "Users can view their own manual comps links" ON public.manual_comps_links;
DROP POLICY IF EXISTS "Users can insert their own manual comps links" ON public.manual_comps_links;
DROP POLICY IF EXISTS "Users can update their own manual comps links" ON public.manual_comps_links;
DROP POLICY IF EXISTS "Users can delete their own manual comps links" ON public.manual_comps_links;

-- Create shared policies for all authenticated users
CREATE POLICY "Authenticated users can view all manual comps"
  ON public.manual_comps_links FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert manual comps"
  ON public.manual_comps_links FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update manual comps"
  ON public.manual_comps_links FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete manual comps"
  ON public.manual_comps_links FOR DELETE
  USING (auth.uid() IS NOT NULL);

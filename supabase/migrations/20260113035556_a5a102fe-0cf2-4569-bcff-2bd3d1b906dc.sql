-- Remove as políticas antigas (somente para authenticated)
DROP POLICY IF EXISTS "Allow authenticated users to read templates" ON public.templates;
DROP POLICY IF EXISTS "Allow authenticated users to insert templates" ON public.templates;
DROP POLICY IF EXISTS "Allow authenticated users to update templates" ON public.templates;
DROP POLICY IF EXISTS "Allow authenticated users to delete templates" ON public.templates;

-- Cria novas políticas que permitem acesso público (anon + authenticated)
CREATE POLICY "Allow public read access to templates"
  ON public.templates
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to templates"
  ON public.templates
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to templates"
  ON public.templates
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to templates"
  ON public.templates
  FOR DELETE
  USING (true);
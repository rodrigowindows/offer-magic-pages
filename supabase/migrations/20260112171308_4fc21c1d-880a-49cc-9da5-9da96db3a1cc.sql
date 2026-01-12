-- Create templates table for marketing templates
CREATE TABLE IF NOT EXISTS public.templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'call')),
  subject TEXT,
  body TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  edited_manually BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_templates_channel ON public.templates(channel);
CREATE INDEX IF NOT EXISTS idx_templates_is_default ON public.templates(is_default);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read templates"
  ON public.templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert templates"
  ON public.templates FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update templates"
  ON public.templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete templates"
  ON public.templates FOR DELETE TO authenticated USING (true);

-- Create trigger function
CREATE OR REPLACE FUNCTION public.update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_templates_timestamp
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_templates_updated_at();
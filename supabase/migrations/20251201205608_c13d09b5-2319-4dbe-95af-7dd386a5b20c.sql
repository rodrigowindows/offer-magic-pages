-- Create email_settings table for storing SMTP configuration
CREATE TABLE IF NOT EXISTS public.email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  smtp_host text NOT NULL,
  smtp_port integer NOT NULL DEFAULT 587,
  smtp_user text NOT NULL,
  smtp_password text NOT NULL,
  from_email text NOT NULL,
  from_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read email settings
CREATE POLICY "Authenticated users can view email settings"
  ON public.email_settings
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert email settings
CREATE POLICY "Authenticated users can insert email settings"
  ON public.email_settings
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update email settings
CREATE POLICY "Authenticated users can update email settings"
  ON public.email_settings
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete email settings
CREATE POLICY "Authenticated users can delete email settings"
  ON public.email_settings
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_email_settings_updated_at
  BEFORE UPDATE ON public.email_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_properties_updated_at();
-- Helper FIRST
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- contact_settings (singleton row)
CREATE TABLE IF NOT EXISTS public.contact_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_number text,
  sms_number text,
  support_email text,
  calendly_url text,
  retell_agent_id text,
  retell_phone_number text,
  whatsapp_message_template text DEFAULT 'Hi! I''m interested in discussing the offer for property {{address}} (ID: {{propertyId}}).',
  sms_message_template text DEFAULT 'Hi! Re: offer for {{address}}. ',
  email_subject_template text DEFAULT 'Re: Cash offer for {{address}}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read contact_settings"
  ON public.contact_settings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can insert contact_settings"
  ON public.contact_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update contact_settings"
  ON public.contact_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_contact_settings_updated_at
  BEFORE UPDATE ON public.contact_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.contact_settings (whatsapp_number, sms_number, support_email)
SELECT '+17868828251', '+17868828251', 'hello@mylocalinvest.com'
WHERE NOT EXISTS (SELECT 1 FROM public.contact_settings);

-- Properties: flood zone + temperature
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS flood_zone text,
  ADD COLUMN IF NOT EXISTS flood_zone_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS lead_temperature text DEFAULT 'COLD',
  ADD COLUMN IF NOT EXISTS lead_temperature_manual boolean DEFAULT false;

-- property_notes
CREATE TABLE IF NOT EXISTS public.property_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  note_type text NOT NULL DEFAULT 'manual',
  body text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_notes_property_created
  ON public.property_notes(property_id, created_at DESC);

ALTER TABLE public.property_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view property_notes"
  ON public.property_notes FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can insert property_notes"
  ON public.property_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update property_notes"
  ON public.property_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can delete property_notes"
  ON public.property_notes FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
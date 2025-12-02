-- Create SMS settings table
CREATE TABLE public.sms_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'twilio',
  account_sid TEXT NOT NULL,
  auth_token TEXT NOT NULL,
  from_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for SMS settings
CREATE POLICY "Authenticated users can view sms settings"
  ON public.sms_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert sms settings"
  ON public.sms_settings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update sms settings"
  ON public.sms_settings FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete sms settings"
  ON public.sms_settings FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create Call settings table
CREATE TABLE public.call_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'twilio',
  account_sid TEXT NOT NULL,
  auth_token TEXT NOT NULL,
  from_number TEXT NOT NULL,
  voice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for Call settings
CREATE POLICY "Authenticated users can view call settings"
  ON public.call_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert call settings"
  ON public.call_settings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update call settings"
  ON public.call_settings FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete call settings"
  ON public.call_settings FOR DELETE
  USING (auth.uid() IS NOT NULL);
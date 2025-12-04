-- Drop existing tables and recreate with REST API fields
DROP TABLE IF EXISTS email_settings CASCADE;
DROP TABLE IF EXISTS sms_settings CASCADE;
DROP TABLE IF EXISTS call_settings CASCADE;

-- Create email_settings with REST API fields
CREATE TABLE public.email_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_endpoint TEXT NOT NULL,
  api_key TEXT,
  http_method TEXT NOT NULL DEFAULT 'POST',
  headers JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sms_settings with REST API fields
CREATE TABLE public.sms_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_endpoint TEXT NOT NULL,
  api_key TEXT,
  http_method TEXT NOT NULL DEFAULT 'POST',
  headers JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create call_settings with REST API fields
CREATE TABLE public.call_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_endpoint TEXT NOT NULL,
  api_key TEXT,
  http_method TEXT NOT NULL DEFAULT 'POST',
  headers JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_settings
CREATE POLICY "Authenticated users can view email settings" ON public.email_settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert email settings" ON public.email_settings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update email settings" ON public.email_settings FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete email settings" ON public.email_settings FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS policies for sms_settings
CREATE POLICY "Authenticated users can view sms settings" ON public.sms_settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert sms settings" ON public.sms_settings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update sms settings" ON public.sms_settings FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete sms settings" ON public.sms_settings FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS policies for call_settings
CREATE POLICY "Authenticated users can view call settings" ON public.call_settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert call settings" ON public.call_settings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update call settings" ON public.call_settings FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete call settings" ON public.call_settings FOR DELETE USING (auth.uid() IS NOT NULL);
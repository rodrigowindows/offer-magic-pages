-- Create property analytics table
CREATE TABLE IF NOT EXISTS public.property_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'page_view', 'inquiry_submitted', 'phone_click', 'email_click', 'whatsapp_click'
  ip_address TEXT,
  country TEXT,
  city TEXT,
  user_agent TEXT,
  referrer TEXT,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_property_analytics_property_id ON public.property_analytics(property_id);
CREATE INDEX idx_property_analytics_event_type ON public.property_analytics(event_type);
CREATE INDEX idx_property_analytics_created_at ON public.property_analytics(created_at DESC);

-- Enable RLS
ALTER TABLE public.property_analytics ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (admins) to view all analytics
CREATE POLICY "Authenticated users can view analytics"
  ON public.property_analytics
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow edge function to insert analytics (service role)
CREATE POLICY "Service role can insert analytics"
  ON public.property_analytics
  FOR INSERT
  WITH CHECK (true);

-- Enable realtime for analytics
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_analytics;
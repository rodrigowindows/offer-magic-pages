-- Add lead_score column to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;

-- Create campaign_templates table
CREATE TABLE IF NOT EXISTS public.campaign_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'marketing',
  api_endpoint TEXT,
  seller_name TEXT,
  message_template TEXT,
  headers JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage templates" 
ON public.campaign_templates 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Add response_time column to campaign_logs for response time analytics
ALTER TABLE public.campaign_logs ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.campaign_logs ADD COLUMN IF NOT EXISTS response_time_seconds INTEGER;

-- Enable realtime for campaign_logs (ignore if already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'campaign_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_logs;
  END IF;
END $$;
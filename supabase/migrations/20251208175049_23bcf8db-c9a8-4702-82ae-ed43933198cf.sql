-- Create campaign_logs table to store all API communications
CREATE TABLE public.campaign_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  campaign_type TEXT NOT NULL DEFAULT 'marketing', -- marketing, email, sms, call
  recipient_phone TEXT,
  recipient_email TEXT,
  recipient_name TEXT,
  property_address TEXT,
  api_response JSONB,
  api_status INTEGER,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tracking_id UUID NOT NULL DEFAULT gen_random_uuid(),
  link_clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMP WITH TIME ZONE,
  click_count INTEGER DEFAULT 0,
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.campaign_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view campaign logs"
ON public.campaign_logs
FOR SELECT
USING (true);

CREATE POLICY "Service role can insert campaign logs"
ON public.campaign_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update campaign logs"
ON public.campaign_logs
FOR UPDATE
USING (true);

-- Create index for faster queries
CREATE INDEX idx_campaign_logs_property_id ON public.campaign_logs(property_id);
CREATE INDEX idx_campaign_logs_tracking_id ON public.campaign_logs(tracking_id);
CREATE INDEX idx_campaign_logs_sent_at ON public.campaign_logs(sent_at DESC);

-- Enable realtime for campaign_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_logs;
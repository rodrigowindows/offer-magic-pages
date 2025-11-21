-- Create table for tracking email campaigns
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  opened_at TIMESTAMP WITH TIME ZONE,
  opened_count INTEGER NOT NULL DEFAULT 0,
  tracking_id UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE
);

-- Enable Row Level Security
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is admin-only)
CREATE POLICY "Allow all operations on email_campaigns" 
ON public.email_campaigns 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_email_campaigns_tracking_id ON public.email_campaigns(tracking_id);
CREATE INDEX idx_email_campaigns_property_id ON public.email_campaigns(property_id);
CREATE INDEX idx_email_campaigns_opened_at ON public.email_campaigns(opened_at);
-- Migration: Add html_content and status columns to campaign_logs
-- The channel column already exists

-- Add html_content column for storing full email/SMS content
ALTER TABLE public.campaign_logs
ADD COLUMN IF NOT EXISTS html_content TEXT;

-- Add status column for delivery tracking
ALTER TABLE public.campaign_logs
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_logs_status ON public.campaign_logs(status);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_sent_at ON public.campaign_logs(sent_at DESC);

-- Add property_id to manual_comps_links if missing (for property association)
ALTER TABLE public.manual_comps_links
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;

-- Create index for property_id lookup
CREATE INDEX IF NOT EXISTS idx_manual_comps_links_property_id ON public.manual_comps_links(property_id);

-- Comments for documentation
COMMENT ON COLUMN public.campaign_logs.html_content IS 'Full HTML or text content of the communication sent';
COMMENT ON COLUMN public.campaign_logs.status IS 'Delivery status: sent, delivered, bounced, failed, opened, clicked';
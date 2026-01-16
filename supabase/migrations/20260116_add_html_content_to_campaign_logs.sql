-- Add html_content and channel fields to campaign_logs
-- This stores the full HTML/text content sent and the communication channel

ALTER TABLE public.campaign_logs
ADD COLUMN IF NOT EXISTS html_content TEXT,
ADD COLUMN IF NOT EXISTS channel TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent'; -- sent, delivered, bounced, failed, opened, clicked

-- Add index for faster filtering by status and channel
CREATE INDEX IF NOT EXISTS idx_campaign_logs_status ON public.campaign_logs(status);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_channel ON public.campaign_logs(channel);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_sent_at ON public.campaign_logs(sent_at DESC);

-- Comment on columns
COMMENT ON COLUMN public.campaign_logs.html_content IS 'Full HTML or text content of the communication sent';
COMMENT ON COLUMN public.campaign_logs.channel IS 'Communication channel: email, sms, call, letter';
COMMENT ON COLUMN public.campaign_logs.status IS 'Delivery status: sent, delivered, bounced, failed, opened, clicked';

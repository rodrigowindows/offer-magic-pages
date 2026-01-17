-- Add source column to track where the click came from (email, sms, carta, direct)
ALTER TABLE public.property_analytics 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'direct';

-- Add index for better performance on source queries
CREATE INDEX IF NOT EXISTS idx_property_analytics_source ON public.property_analytics(source);
-- Create scheduled_campaigns table for smart scheduling
CREATE TABLE IF NOT EXISTS scheduled_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL, -- 'sms', 'email', 'call', 'multi'
  property_ids UUID[] NOT NULL,
  template_id TEXT,
  custom_template TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  time_slot TEXT, -- 'morning', 'afternoon', 'evening', 'custom'
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'processing', 'completed', 'failed'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE,
  results JSONB DEFAULT '{}',
  error_message TEXT
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_campaigns_scheduled_at ON scheduled_campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_campaigns_status ON scheduled_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_campaigns_created_by ON scheduled_campaigns(created_by);

-- Enable RLS
ALTER TABLE scheduled_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own scheduled campaigns" ON scheduled_campaigns
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own scheduled campaigns" ON scheduled_campaigns
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own scheduled campaigns" ON scheduled_campaigns
  FOR UPDATE USING (auth.uid() = created_by);

-- Function to process due scheduled campaigns
CREATE OR REPLACE FUNCTION process_scheduled_campaigns()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  campaign_record RECORD;
  property_id UUID;
  success_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  -- Get campaigns due for execution (within last 5 minutes to handle delays)
  FOR campaign_record IN
    SELECT * FROM scheduled_campaigns
    WHERE status = 'scheduled'
    AND scheduled_at <= NOW()
    AND scheduled_at > NOW() - INTERVAL '5 minutes'
    ORDER BY scheduled_at ASC
  LOOP
    -- Mark as processing
    UPDATE scheduled_campaigns
    SET status = 'processing'
    WHERE id = campaign_record.id;

    -- Process each property in the campaign
    FOREACH property_id IN ARRAY campaign_record.property_ids
    LOOP
      BEGIN
        -- Here we would call the actual sending logic
        -- For now, just log success
        success_count := success_count + 1;
      EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
      END;
    END LOOP;

    -- Mark as completed
    UPDATE scheduled_campaigns
    SET status = 'completed',
        executed_at = NOW(),
        results = jsonb_build_object(
          'success_count', success_count,
          'error_count', error_count,
          'total_properties', array_length(campaign_record.property_ids, 1)
        )
    WHERE id = campaign_record.id;

  END LOOP;
END;
$$;
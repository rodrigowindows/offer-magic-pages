-- Database Schema for Marketing Campaign System
-- Create missing tables to fix build errors

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  template_id UUID,
  target_criteria JSONB,
  total_targets INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  estimated_roi DECIMAL(5,2)
);

-- Campaign targets table
CREATE TABLE IF NOT EXISTS campaign_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  property_id UUID NOT NULL,
  contact_method VARCHAR(50) NOT NULL, -- 'sms', 'email', 'call'
  contact_value VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign clicks table
CREATE TABLE IF NOT EXISTS campaign_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  property_id UUID NOT NULL,
  click_source VARCHAR(50) NOT NULL, -- 'sms', 'email', 'call'
  template_id UUID,
  campaign_name VARCHAR(255),
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,
  metadata JSONB
);

-- Scheduled campaigns table
CREATE TABLE IF NOT EXISTS scheduled_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  executed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead activities table
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  activity_type VARCHAR(100) NOT NULL,
  activity_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  campaign_id UUID REFERENCES campaigns(id),
  source VARCHAR(100),
  metadata JSONB
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_campaign_id ON campaign_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_property_id ON campaign_clicks(property_id);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_clicked_at ON campaign_clicks(clicked_at);

CREATE INDEX IF NOT EXISTS idx_campaign_targets_campaign_id ON campaign_targets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_targets_property_id ON campaign_targets(property_id);
CREATE INDEX IF NOT EXISTS idx_campaign_targets_status ON campaign_targets(status);

CREATE INDEX IF NOT EXISTS idx_scheduled_campaigns_scheduled_at ON scheduled_campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_campaigns_status ON scheduled_campaigns(status);

CREATE INDEX IF NOT EXISTS idx_lead_activities_property_id ON lead_activities(property_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_timestamp ON lead_activities(timestamp);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities(activity_type);

-- Enable Row Level Security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - adjust as needed)
CREATE POLICY "Users can view their own campaigns" ON campaigns
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = created_by);

-- Similar policies for other tables
CREATE POLICY "Users can view campaign targets for their campaigns" ON campaign_targets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_targets.campaign_id
      AND campaigns.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view campaign clicks for their campaigns" ON campaign_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_clicks.campaign_id
      AND campaigns.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view scheduled campaigns for their campaigns" ON scheduled_campaigns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = scheduled_campaigns.campaign_id
      AND campaigns.created_by = auth.uid()
    )
  );

-- Allow public access to lead_activities for now (adjust as needed)
CREATE POLICY "Allow all operations on lead_activities" ON lead_activities
  FOR ALL USING (true);
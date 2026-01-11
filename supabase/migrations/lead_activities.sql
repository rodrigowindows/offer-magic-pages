-- Lead activities table for tracking all interactions
create table if not exists lead_activities (
  id uuid default gen_random_uuid() primary key,
  property_id text not null,
  activity_type text check (activity_type in ('email_sent', 'email_opened', 'email_clicked', 'sms_sent', 'sms_clicked', 'call_made', 'call_answered', 'property_viewed', 'offer_made', 'offer_accepted')) not null,
  campaign_name text,
  template_id text,
  channel text check (channel in ('email', 'sms', 'call', 'web')),
  details jsonb,
  cost decimal(10,2) default 0,
  created_at timestamp with time zone default now()
);

-- Add indexes
create index if not exists idx_lead_activities_property_id on lead_activities(property_id);
create index if not exists idx_lead_activities_activity_type on lead_activities(activity_type);
create index if not exists idx_lead_activities_created_at on lead_activities(created_at);
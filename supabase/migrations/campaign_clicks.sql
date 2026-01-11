-- Campaign clicks table for tracking performance
create table if not exists campaign_clicks (
  id uuid default gen_random_uuid() primary key,
  campaign_name text,
  click_source text check (click_source in ('sms', 'email', 'call')),
  template_id text,
  property_id text,
  recipient_phone text,
  recipient_email text,
  sent_at timestamp with time zone,
  email_opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  responded_at timestamp with time zone,
  cost decimal(10,2) default 0.10,
  converted boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add indexes for performance
create index if not exists idx_campaign_clicks_campaign_name on campaign_clicks(campaign_name);
create index if not exists idx_campaign_clicks_click_source on campaign_clicks(click_source);
create index if not exists idx_campaign_clicks_template_id on campaign_clicks(template_id);
create index if not exists idx_campaign_clicks_created_at on campaign_clicks(created_at);
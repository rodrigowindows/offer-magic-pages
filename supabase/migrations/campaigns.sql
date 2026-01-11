-- Campaigns table for storing campaign definitions
create table if not exists campaigns (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text,
  status text check (status in ('draft', 'active', 'paused', 'completed', 'archived')) default 'draft',
  campaign_type text check (campaign_type in ('email', 'sms', 'call', 'multi_channel')) default 'email',
  target_audience jsonb,
  budget decimal(10,2),
  spent decimal(10,2) default 0,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add indexes
create index if not exists idx_campaigns_status on campaigns(status);
create index if not exists idx_campaigns_created_at on campaigns(created_at);
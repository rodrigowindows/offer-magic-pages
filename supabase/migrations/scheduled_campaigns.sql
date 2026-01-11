-- Scheduled campaigns table
create table if not exists scheduled_campaigns (
  id uuid default gen_random_uuid() primary key,
  campaign_name text not null,
  template_id text,
  scheduled_at timestamp with time zone not null,
  status text check (status in ('pending', 'processing', 'completed', 'failed')) default 'pending',
  target_audience jsonb,
  message_content text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add indexes
create index if not exists idx_scheduled_campaigns_scheduled_at on scheduled_campaigns(scheduled_at);
create index if not exists idx_scheduled_campaigns_status on scheduled_campaigns(status);
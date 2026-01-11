-- Campaign targets table for storing campaign targeting criteria
create table if not exists campaign_targets (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references campaigns(id) on delete cascade,
  property_type text[],
  min_price decimal(12,2),
  max_price decimal(12,2),
  zip_codes text[],
  neighborhoods text[],
  min_bedrooms integer,
  max_bedrooms integer,
  min_bathrooms integer,
  max_bathrooms integer,
  min_sqft integer,
  max_sqft integer,
  foreclosure_status text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add indexes
create index if not exists idx_campaign_targets_campaign_id on campaign_targets(campaign_id);
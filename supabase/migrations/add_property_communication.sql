-- Table: property_communication
-- Communication log per property, per sender

create table if not exists public.property_communication (
    id uuid primary key default gen_random_uuid(),
    property_id uuid references properties(id) on delete cascade,
    channel text not null, -- sms, email, call, etc
    message text not null,
    sent_by uuid references users(id),
    sent_at timestamptz default now(),
    recipient text,
    campaign_id uuid references campaigns(id),
    metadata jsonb
);

create index if not exists idx_property_communication_property_id on public.property_communication(property_id);
create index if not exists idx_property_communication_sent_by on public.property_communication(sent_by);
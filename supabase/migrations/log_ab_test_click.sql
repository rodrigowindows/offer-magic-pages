-- Function to log A/B test click
create or replace function log_ab_test_click(tracking_id text)
returns void
language plpgsql
as $$
declare
  template_id text;
begin
  -- Get template from campaign_logs
  select metadata->>'template_id' into template_id
  from campaign_logs
  where tracking_id = log_ab_test_click.tracking_id
  limit 1;

  if template_id = 'A' then
    update ab_test_stats set a_click = a_click + 1 where id = 1;
  elsif template_id = 'B' then
    update ab_test_stats set b_click = b_click + 1 where id = 1;
  end if;
end;
$$;
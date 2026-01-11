-- Function to increment A/B test sent count
create or replace function increment_ab_test_sent(template_id text)
returns void
language plpgsql
as $$
begin
  if template_id = 'A' then
    update ab_test_stats set a_sent = a_sent + 1 where id = 1;
  elsif template_id = 'B' then
    update ab_test_stats set b_sent = b_sent + 1 where id = 1;
  end if;
end;
$$;
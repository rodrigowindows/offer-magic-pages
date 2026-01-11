-- SQL for A/B test stats table
create table if not exists ab_test_stats (
  id serial primary key,
  a_sent integer default 0,
  a_open integer default 0,
  a_click integer default 0,
  b_sent integer default 0,
  b_open integer default 0,
  b_click integer default 0
);
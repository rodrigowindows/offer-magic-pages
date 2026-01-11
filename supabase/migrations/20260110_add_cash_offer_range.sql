-- Add cash_offer_min and cash_offer_max to properties table
alter table properties add column if not exists cash_offer_min decimal(12,2);
alter table properties add column if not exists cash_offer_max decimal(12,2);
-- Optionally, migrate existing cash_offer_amount to min/max for legacy rows
update properties set cash_offer_min = cash_offer_amount, cash_offer_max = cash_offer_amount where cash_offer_min is null and cash_offer_max is null;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS total_tax_due numeric NULL;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS years_delinquent integer NULL;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS taxable_value numeric NULL;
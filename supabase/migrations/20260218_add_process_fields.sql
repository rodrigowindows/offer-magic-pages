-- Add new fields for the enhanced 4-step process
-- Run this in Supabase SQL Editor

BEGIN;

-- Step 1: Additional property fields
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS last_sale_date date;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS last_sale_price numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS pool boolean DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS batch_name text;

-- Step 2: Review/approval enhancements
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rejection_notes text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS reviewed_by text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS decision_date timestamptz;

-- Step 4: MAO Calculator fields
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS renovation_type text; -- 'light', 'medium', 'heavy', 'custom'
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS renovation_pct numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS renovation_value numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS wholesale_pct numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS wholesale_value numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS arv numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS mao numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS avg_price_per_sqft numeric;

COMMIT;

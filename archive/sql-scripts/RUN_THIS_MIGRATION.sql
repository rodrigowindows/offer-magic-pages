-- ============================================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- Project: atwdkhlyrffbaugkaker
-- Purpose: finalize campaign_logs fields + manual_comps_links comp_data support
-- Safe to run multiple times (all operations are idempotent).
-- ============================================================================

BEGIN;

-- 1) campaign_logs fields used by History + delivery tracking
ALTER TABLE IF EXISTS public.campaign_logs
  ADD COLUMN IF NOT EXISTS html_content TEXT,
  ADD COLUMN IF NOT EXISTS channel TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';

CREATE INDEX IF NOT EXISTS idx_campaign_logs_status
  ON public.campaign_logs(status);

CREATE INDEX IF NOT EXISTS idx_campaign_logs_channel
  ON public.campaign_logs(channel);

CREATE INDEX IF NOT EXISTS idx_campaign_logs_sent_at
  ON public.campaign_logs(sent_at DESC);

-- 2) manual_comps_links table + comp_data (JSONB) + indexes + RLS
CREATE TABLE IF NOT EXISTS public.manual_comps_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_address TEXT NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'other',
  notes TEXT,
  comp_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Ensure columns exist if table was created in an earlier migration
ALTER TABLE public.manual_comps_links
  ADD COLUMN IF NOT EXISTS comp_data JSONB,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill NULLs for source
UPDATE public.manual_comps_links SET source = 'other' WHERE source IS NULL;

-- Source constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.manual_comps_links'::regclass
      AND conname = 'manual_comps_links_source_check'
  ) THEN
    ALTER TABLE public.manual_comps_links
      ADD CONSTRAINT manual_comps_links_source_check
      CHECK (source IN ('trulia', 'zillow', 'redfin', 'realtor', 'other'));
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_manual_comps_links_property_id
  ON public.manual_comps_links(property_id);

CREATE INDEX IF NOT EXISTS idx_manual_comps_links_user_id
  ON public.manual_comps_links(user_id);

CREATE INDEX IF NOT EXISTS idx_manual_comps_links_created_at
  ON public.manual_comps_links(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_manual_comps_links_comp_data
  ON public.manual_comps_links USING GIN (comp_data);

-- RLS
ALTER TABLE public.manual_comps_links ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'manual_comps_links'
      AND policyname = 'manual_comps_links_select_own'
  ) THEN
    CREATE POLICY manual_comps_links_select_own
      ON public.manual_comps_links FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'manual_comps_links'
      AND policyname = 'manual_comps_links_insert_own'
  ) THEN
    CREATE POLICY manual_comps_links_insert_own
      ON public.manual_comps_links FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'manual_comps_links'
      AND policyname = 'manual_comps_links_update_own'
  ) THEN
    CREATE POLICY manual_comps_links_update_own
      ON public.manual_comps_links FOR UPDATE TO authenticated
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'manual_comps_links'
      AND policyname = 'manual_comps_links_delete_own'
  ) THEN
    CREATE POLICY manual_comps_links_delete_own
      ON public.manual_comps_links FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_manual_comps_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_manual_comps_links_updated_at'
      AND tgrelid = 'public.manual_comps_links'::regclass
  ) THEN
    CREATE TRIGGER trg_manual_comps_links_updated_at
      BEFORE UPDATE ON public.manual_comps_links
      FOR EACH ROW
      EXECUTE FUNCTION public.set_manual_comps_links_updated_at();
  END IF;
END $$;

COMMENT ON COLUMN public.manual_comps_links.comp_data IS
  'Optional JSON payload: {sale_price, square_feet, bedrooms, bathrooms, sale_date, city, state, zip_code}';

COMMIT;

-- Verification
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'manual_comps_links'
  AND column_name = 'comp_data';

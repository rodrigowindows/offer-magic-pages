-- ============================================
-- 🔧 FIX DATABASE - Orlando Marketing App
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. CRIAR TABELA campaign_clicks (se não existir)
CREATE TABLE IF NOT EXISTS public.campaign_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  property_address TEXT,

  -- Recipient info
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,

  -- Campaign info
  campaign_name TEXT,
  campaign_id UUID,
  template_id TEXT,
  template_name TEXT,

  -- Tracking
  click_source TEXT, -- 'sms', 'email', 'call'
  tracking_id TEXT UNIQUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  clicked_at TIMESTAMPTZ,
  email_opened_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,

  -- Metrics
  link_clicked BOOLEAN DEFAULT FALSE,
  click_count INTEGER DEFAULT 0,

  -- Conversion
  converted BOOLEAN DEFAULT FALSE,
  conversion_value NUMERIC(10, 2),
  cost NUMERIC(10, 2) DEFAULT 0.10,

  -- Metadata
  user_agent TEXT,
  ip_address TEXT,
  referrer TEXT,
  metadata JSONB
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_property_id ON public.campaign_clicks(property_id);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_tracking_id ON public.campaign_clicks(tracking_id);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_created_at ON public.campaign_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_click_source ON public.campaign_clicks(click_source);

-- RLS
ALTER TABLE public.campaign_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.campaign_clicks;
CREATE POLICY "Enable read access for authenticated users" ON public.campaign_clicks
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for all users" ON public.campaign_clicks;
CREATE POLICY "Enable insert for all users" ON public.campaign_clicks
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.campaign_clicks;
CREATE POLICY "Enable update for authenticated users" ON public.campaign_clicks
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 2. ADICIONAR COLUNAS FALTANTES EM campaign_logs
DO $$
BEGIN
  -- Adicionar created_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='campaign_logs' AND column_name='created_at'
  ) THEN
    ALTER TABLE public.campaign_logs ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();

    -- Preencher com sent_at se existir
    UPDATE public.campaign_logs SET created_at = sent_at WHERE created_at IS NULL;
  END IF;

  -- Adicionar template_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='campaign_logs' AND column_name='template_id'
  ) THEN
    ALTER TABLE public.campaign_logs ADD COLUMN template_id TEXT;
  END IF;

  -- Adicionar template_name se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='campaign_logs' AND column_name='template_name'
  ) THEN
    ALTER TABLE public.campaign_logs ADD COLUMN template_name TEXT;
  END IF;

  -- Adicionar tracking_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='campaign_logs' AND column_name='tracking_id'
  ) THEN
    ALTER TABLE public.campaign_logs ADD COLUMN tracking_id TEXT UNIQUE;
  END IF;

  -- Adicionar link_clicked se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='campaign_logs' AND column_name='link_clicked'
  ) THEN
    ALTER TABLE public.campaign_logs ADD COLUMN link_clicked BOOLEAN DEFAULT FALSE;
  END IF;

  -- Adicionar click_count se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='campaign_logs' AND column_name='click_count'
  ) THEN
    ALTER TABLE public.campaign_logs ADD COLUMN click_count INTEGER DEFAULT 0;
  END IF;

  -- Adicionar first_response_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='campaign_logs' AND column_name='first_response_at'
  ) THEN
    ALTER TABLE public.campaign_logs ADD COLUMN first_response_at TIMESTAMPTZ;
  END IF;
END $$;

-- 3. ADICIONAR COLUNAS FALTANTES EM properties
DO $$
BEGIN
  -- Adicionar min_offer_amount se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='properties' AND column_name='min_offer_amount'
  ) THEN
    ALTER TABLE public.properties ADD COLUMN min_offer_amount NUMERIC(10, 2);

    -- Preencher com 60% do estimated_value
    UPDATE public.properties
    SET min_offer_amount = ROUND(estimated_value * 0.60, 2)
    WHERE min_offer_amount IS NULL AND estimated_value IS NOT NULL;
  END IF;

  -- Adicionar max_offer_amount se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='properties' AND column_name='max_offer_amount'
  ) THEN
    ALTER TABLE public.properties ADD COLUMN max_offer_amount NUMERIC(10, 2);

    -- Preencher com 80% do estimated_value
    UPDATE public.properties
    SET max_offer_amount = ROUND(estimated_value * 0.80, 2)
    WHERE max_offer_amount IS NULL AND estimated_value IS NOT NULL;
  END IF;
END $$;

-- 4. HABILITAR REALTIME para campaign_clicks
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_clicks;

-- 5. VERIFICAÇÃO FINAL
SELECT
  'campaign_clicks' as table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'campaign_clicks'
  ) as exists,
  (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_name = 'campaign_clicks'
  ) as column_count
UNION ALL
SELECT
  'campaign_logs',
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'campaign_logs'
  ),
  (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_name = 'campaign_logs'
  )
UNION ALL
SELECT
  'properties',
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'properties'
  ),
  (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_name = 'properties'
  );

-- Verificar colunas específicas adicionadas
SELECT
  'campaign_logs.created_at' as column_check,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='campaign_logs' AND column_name='created_at'
  ) as exists
UNION ALL
SELECT
  'properties.min_offer_amount',
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='properties' AND column_name='min_offer_amount'
  )
UNION ALL
SELECT
  'properties.max_offer_amount',
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='properties' AND column_name='max_offer_amount'
  );

-- ✅ PRONTO!
-- Se todas as verificações retornarem 'true', o banco está configurado corretamente.

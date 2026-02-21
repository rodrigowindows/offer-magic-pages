# 🚀 Supabase Setup Guide - Orlando Real Estate Marketing

## 📋 Índice

1. [Verificar Schema Atual](#1-verificar-schema-atual)
2. [Criar Tabelas Faltantes](#2-criar-tabelas-faltantes)
3. [Configurar Edge Functions](#3-configurar-edge-functions)
4. [Configurar Realtime](#4-configurar-realtime)
5. [Verificar Tudo Funcionando](#5-verificar-tudo-funcionando)

---

## 1. Verificar Schema Atual

### Prompt para verificar tabelas existentes:

```sql
-- Liste todas as tabelas do schema público
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verifique colunas das tabelas principais
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'campaign_clicks'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'campaign_logs'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'properties'
ORDER BY ordinal_position;
```

---

## 2. Criar Tabelas Faltantes

### 2.1 Tabela `campaign_clicks` (se não existir)

```sql
-- Tabela para rastrear cliques em links de campanhas
CREATE TABLE IF NOT EXISTS public.campaign_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  property_address TEXT,

  -- Informações do destinatário
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,

  -- Informações da campanha
  campaign_name TEXT,
  campaign_id UUID,
  template_id TEXT,
  template_name TEXT,

  -- Rastreamento
  click_source TEXT, -- 'sms', 'email', 'call'
  tracking_id TEXT UNIQUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  clicked_at TIMESTAMPTZ,
  email_opened_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,

  -- Métricas
  link_clicked BOOLEAN DEFAULT FALSE,
  click_count INTEGER DEFAULT 0,

  -- Conversão
  converted BOOLEAN DEFAULT FALSE,
  conversion_value NUMERIC(10, 2),
  cost NUMERIC(10, 2) DEFAULT 0.10,

  -- Metadata
  user_agent TEXT,
  ip_address TEXT,
  referrer TEXT,
  metadata JSONB,

  -- Indexes
  CONSTRAINT unique_tracking_id UNIQUE (tracking_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_property_id ON public.campaign_clicks(property_id);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_tracking_id ON public.campaign_clicks(tracking_id);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_created_at ON public.campaign_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_click_source ON public.campaign_clicks(click_source);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_clicked_at ON public.campaign_clicks(clicked_at);

-- Habilitar Row Level Security
ALTER TABLE public.campaign_clicks ENABLE ROW LEVEL SECURITY;

-- Política: Permitir leitura autenticada
CREATE POLICY "Enable read access for authenticated users" ON public.campaign_clicks
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política: Permitir insert para todos (tracking público)
CREATE POLICY "Enable insert for all users" ON public.campaign_clicks
  FOR INSERT
  WITH CHECK (true);

-- Política: Permitir update para authenticated
CREATE POLICY "Enable update for authenticated users" ON public.campaign_clicks
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

COMMENT ON TABLE public.campaign_clicks IS 'Rastreamento de cliques em campanhas de marketing';
```

### 2.2 Verificar/Atualizar Tabela `campaign_logs`

```sql
-- Adicionar colunas faltantes à tabela campaign_logs (se necessário)
DO $$
BEGIN
  -- Adicionar colunas se não existirem
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaign_logs' AND column_name='template_id') THEN
    ALTER TABLE public.campaign_logs ADD COLUMN template_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaign_logs' AND column_name='template_name') THEN
    ALTER TABLE public.campaign_logs ADD COLUMN template_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaign_logs' AND column_name='tracking_id') THEN
    ALTER TABLE public.campaign_logs ADD COLUMN tracking_id TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaign_logs' AND column_name='link_clicked') THEN
    ALTER TABLE public.campaign_logs ADD COLUMN link_clicked BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaign_logs' AND column_name='click_count') THEN
    ALTER TABLE public.campaign_logs ADD COLUMN click_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaign_logs' AND column_name='first_response_at') THEN
    ALTER TABLE public.campaign_logs ADD COLUMN first_response_at TIMESTAMPTZ;
  END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_campaign_logs_tracking_id ON public.campaign_logs(tracking_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_property_id ON public.campaign_logs(property_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_sent_at ON public.campaign_logs(sent_at DESC);
```

### 2.3 Tabela `campaign_sequences` (para follow-ups automáticos)

```sql
-- Tabela para sequências de follow-up automatizadas
CREATE TABLE IF NOT EXISTS public.campaign_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,

  -- Trigger settings
  trigger_event TEXT, -- 'initial_contact', 'link_click', 'email_open', 'no_response'

  -- Metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.campaign_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON public.campaign_sequences
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

COMMENT ON TABLE public.campaign_sequences IS 'Sequências automatizadas de follow-up';
```

### 2.4 Tabela `scheduled_followups` (para agendar follow-ups)

```sql
-- Tabela para follow-ups agendados
CREATE TABLE IF NOT EXISTS public.scheduled_followups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relacionamentos
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  click_id UUID REFERENCES public.campaign_clicks(id) ON DELETE CASCADE,

  -- Informações do destinatário
  recipient_name TEXT,
  recipient_phone TEXT,
  recipient_email TEXT,

  -- Configuração do follow-up
  channel TEXT NOT NULL, -- 'sms', 'email', 'call'
  message_body TEXT,
  subject TEXT,

  -- Agendamento
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  error_message TEXT,

  -- Metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_scheduled_followups_property_id ON public.scheduled_followups(property_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_followups_scheduled_at ON public.scheduled_followups(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_followups_status ON public.scheduled_followups(status);

-- RLS
ALTER TABLE public.scheduled_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON public.scheduled_followups
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

COMMENT ON TABLE public.scheduled_followups IS 'Follow-ups agendados automaticamente';
```

---

## 3. Configurar Edge Functions

### 3.1 Verificar Edge Functions Existentes

```bash
# Listar edge functions
supabase functions list

# Ver logs de uma function específica
supabase functions logs track-link-click --follow
supabase functions logs track-button-click --follow
supabase functions logs track-email-open --follow
```

### 3.2 Deploy Edge Functions

```bash
# Fazer deploy de todas as edge functions
cd "Step 5 - Outreach & Campaigns"

# Deploy track-link-click
supabase functions deploy track-link-click

# Deploy track-button-click
supabase functions deploy track-button-click

# Deploy track-email-open
supabase functions deploy track-email-open

# Deploy get-skip-trace-data
supabase functions deploy get-skip-trace-data
```

### 3.3 Testar Edge Functions

```bash
# Testar track-link-click
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/track-link-click' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "tracking_id": "test-123",
    "property_id": "some-uuid",
    "click_source": "email"
  }'

# Substituir YOUR_PROJECT_ID e YOUR_ANON_KEY pelos valores reais
```

---

## 4. Configurar Realtime

### 4.1 Habilitar Realtime para `campaign_clicks`

```sql
-- Habilitar publicação de mudanças
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_clicks;

-- Verificar se está habilitado
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

### 4.2 Testar Realtime no JavaScript

```javascript
// Testar no console do navegador ou em um arquivo de teste
import { supabase } from './supabase/client';

const channel = supabase
  .channel('test-clicks')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'campaign_clicks'
    },
    (payload) => {
      console.log('✅ Realtime working! New click:', payload);
    }
  )
  .subscribe((status) => {
    console.log('Subscription status:', status);
  });

// Para parar
// channel.unsubscribe();
```

---

## 5. Verificar Tudo Funcionando

### 5.1 Checklist de Verificação

```sql
-- 1. Verificar se todas as tabelas existem
SELECT
  'campaign_clicks' as table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'campaign_clicks'
  ) as exists
UNION ALL
SELECT
  'campaign_logs',
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'campaign_logs'
  )
UNION ALL
SELECT
  'campaign_sequences',
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'campaign_sequences'
  )
UNION ALL
SELECT
  'scheduled_followups',
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'scheduled_followups'
  )
UNION ALL
SELECT
  'properties',
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'properties'
  );
```

### 5.2 Inserir Dados de Teste

```sql
-- Inserir um click de teste
INSERT INTO public.campaign_clicks (
  property_id,
  property_address,
  recipient_name,
  recipient_email,
  campaign_name,
  click_source,
  tracking_id,
  clicked_at,
  link_clicked
) VALUES (
  (SELECT id FROM public.properties LIMIT 1), -- Pegar primeira property
  '123 Test St, Orlando, FL 32801',
  'John Doe',
  'john@example.com',
  'Test Campaign',
  'email',
  'test-tracking-' || gen_random_uuid()::text,
  NOW(),
  TRUE
);

-- Verificar se foi inserido
SELECT * FROM public.campaign_clicks ORDER BY created_at DESC LIMIT 1;
```

### 5.3 Verificar Realtime Funcionando

```sql
-- Inserir outro registro (deve disparar realtime)
INSERT INTO public.campaign_clicks (
  property_address,
  recipient_name,
  click_source,
  tracking_id,
  clicked_at,
  link_clicked
) VALUES (
  '456 Realtime Test Ave, Orlando, FL',
  'Jane Smith',
  'sms',
  'realtime-test-' || gen_random_uuid()::text,
  NOW(),
  TRUE
);

-- Se o componente RealTimeClickNotifications estiver rodando,
-- você deve ver uma notificação browser aparecer!
```

---

## 🎯 Prompt Único para Copiar e Colar no Supabase SQL Editor

```sql
-- ============================================
-- 🚀 SETUP COMPLETO - ORLANDO MARKETING APP
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. CRIAR TABELA campaign_clicks
CREATE TABLE IF NOT EXISTS public.campaign_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  property_address TEXT,
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,
  campaign_name TEXT,
  campaign_id UUID,
  template_id TEXT,
  template_name TEXT,
  click_source TEXT,
  tracking_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  clicked_at TIMESTAMPTZ,
  email_opened_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  link_clicked BOOLEAN DEFAULT FALSE,
  click_count INTEGER DEFAULT 0,
  converted BOOLEAN DEFAULT FALSE,
  conversion_value NUMERIC(10, 2),
  cost NUMERIC(10, 2) DEFAULT 0.10,
  user_agent TEXT,
  ip_address TEXT,
  referrer TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_campaign_clicks_property_id ON public.campaign_clicks(property_id);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_tracking_id ON public.campaign_clicks(tracking_id);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_created_at ON public.campaign_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_click_source ON public.campaign_clicks(click_source);

ALTER TABLE public.campaign_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON public.campaign_clicks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for all users" ON public.campaign_clicks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.campaign_clicks
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 2. ATUALIZAR campaign_logs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaign_logs' AND column_name='template_id') THEN
    ALTER TABLE public.campaign_logs ADD COLUMN template_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaign_logs' AND column_name='template_name') THEN
    ALTER TABLE public.campaign_logs ADD COLUMN template_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaign_logs' AND column_name='tracking_id') THEN
    ALTER TABLE public.campaign_logs ADD COLUMN tracking_id TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaign_logs' AND column_name='link_clicked') THEN
    ALTER TABLE public.campaign_logs ADD COLUMN link_clicked BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaign_logs' AND column_name='click_count') THEN
    ALTER TABLE public.campaign_logs ADD COLUMN click_count INTEGER DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaign_logs_tracking_id ON public.campaign_logs(tracking_id);

-- 3. CRIAR campaign_sequences
CREATE TABLE IF NOT EXISTS public.campaign_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  trigger_event TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.campaign_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON public.campaign_sequences
  FOR ALL USING (auth.role() = 'authenticated');

-- 4. CRIAR scheduled_followups
CREATE TABLE IF NOT EXISTS public.scheduled_followups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  click_id UUID REFERENCES public.campaign_clicks(id) ON DELETE CASCADE,
  recipient_name TEXT,
  recipient_phone TEXT,
  recipient_email TEXT,
  channel TEXT NOT NULL,
  message_body TEXT,
  subject TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_followups_property_id ON public.scheduled_followups(property_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_followups_scheduled_at ON public.scheduled_followups(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_followups_status ON public.scheduled_followups(status);

ALTER TABLE public.scheduled_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON public.scheduled_followups
  FOR ALL USING (auth.role() = 'authenticated');

-- 5. HABILITAR REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_clicks;

-- 6. VERIFICAÇÃO FINAL
SELECT
  'campaign_clicks' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_clicks') as exists
UNION ALL
SELECT 'campaign_logs', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_logs')
UNION ALL
SELECT 'campaign_sequences', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_sequences')
UNION ALL
SELECT 'scheduled_followups', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scheduled_followups');

-- ✅ PRONTO! Se todos retornarem 'true', está tudo configurado!
```

---

## 📝 Checklist Final

- [ ] Executar o SQL acima no Supabase SQL Editor
- [ ] Verificar se todas as 4 tabelas existem (query de verificação no final)
- [ ] Deploy das Edge Functions (`supabase functions deploy <function-name>`)
- [ ] Testar Realtime com insert manual
- [ ] Verificar notificações browser funcionando no app
- [ ] Testar Campaign Manager com preview de templates
- [ ] Verificar Dashboard de Performance carregando dados

---

## 🆘 Troubleshooting

### Erro: "relation campaign_clicks does not exist"
**Solução:** Execute o SQL de criação da tabela novamente.

### Erro: "permission denied for table campaign_clicks"
**Solução:** Verifique as políticas RLS e garanta que está autenticado.

### Realtime não funciona
**Solução:**
```sql
-- Verificar se está publicando
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Se não estiver, adicionar
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_clicks;
```

### Edge Functions retornam 500
**Solução:** Ver logs
```bash
supabase functions logs <function-name> --follow
```

---

**Criado em**: 2026-01-11
**Versão**: 1.0
**Projeto**: Orlando Real Estate - Step 5

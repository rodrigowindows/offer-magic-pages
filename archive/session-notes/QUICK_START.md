# 🚀 Quick Start - Supabase Setup

## ⚡ SOLUÇÃO RÁPIDA: Se o app está com erros

**Execute este arquivo SQL no Supabase:**

📄 **[FIX_DATABASE.sql](./FIX_DATABASE.sql)** - Abre o arquivo, copia TUDO e cola no Supabase SQL Editor

Isso vai criar/corrigir:
- ✅ Tabela `campaign_clicks`
- ✅ Colunas faltantes em `campaign_logs` (created_at, tracking_id, etc)
- ✅ Colunas faltantes em `properties` (min_offer_amount, max_offer_amount)
- ✅ Realtime habilitado

---

## 📋 Setup Manual (se preferir)

### 1️⃣ Criar Tabela campaign_clicks

```sql
CREATE TABLE IF NOT EXISTS public.campaign_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  property_address TEXT, recipient_name TEXT, recipient_email TEXT,
  campaign_name TEXT, template_id TEXT, click_source TEXT, tracking_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(), clicked_at TIMESTAMPTZ,
  link_clicked BOOLEAN DEFAULT FALSE, converted BOOLEAN DEFAULT FALSE,
  conversion_value NUMERIC(10, 2), cost NUMERIC(10, 2) DEFAULT 0.10, metadata JSONB
);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_property_id ON public.campaign_clicks(property_id);
ALTER TABLE public.campaign_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated" ON public.campaign_clicks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for all" ON public.campaign_clicks FOR INSERT WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_clicks;
```

### 1.2️⃣ Adicionar Colunas Faltantes

```sql
-- campaign_logs
ALTER TABLE public.campaign_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.campaign_logs ADD COLUMN IF NOT EXISTS template_id TEXT;
ALTER TABLE public.campaign_logs ADD COLUMN IF NOT EXISTS tracking_id TEXT UNIQUE;

-- properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS min_offer_amount NUMERIC(10, 2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS max_offer_amount NUMERIC(10, 2);
UPDATE public.properties SET min_offer_amount = ROUND(estimated_value * 0.60, 2) WHERE min_offer_amount IS NULL;
UPDATE public.properties SET max_offer_amount = ROUND(estimated_value * 0.80, 2) WHERE max_offer_amount IS NULL;
```

### 2️⃣ Deploy Functions

```bash
supabase functions deploy track-link-click
supabase functions deploy track-button-click
supabase functions deploy track-email-open
```

### 3️⃣ Testar

```sql
INSERT INTO campaign_clicks (property_address, recipient_name, click_source, tracking_id, clicked_at, link_clicked)
VALUES ('Test St', 'John', 'email', 'test-' || gen_random_uuid()::text, NOW(), TRUE);
```

✅ Veja notificação no app!

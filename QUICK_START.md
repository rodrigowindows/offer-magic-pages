# 🚀 Quick Start - Supabase Setup

## 📋 Setup em 3 Passos

### 1️⃣ SQL - Copiar e Colar no Supabase

```sql
CREATE TABLE IF NOT EXISTS public.campaign_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  property_address TEXT, recipient_name TEXT, recipient_email TEXT,
  campaign_name TEXT, click_source TEXT, tracking_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(), clicked_at TIMESTAMPTZ,
  link_clicked BOOLEAN DEFAULT FALSE, converted BOOLEAN DEFAULT FALSE,
  cost NUMERIC(10, 2) DEFAULT 0.10, metadata JSONB
);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_property_id ON public.campaign_clicks(property_id);
ALTER TABLE public.campaign_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated" ON public.campaign_clicks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for all" ON public.campaign_clicks FOR INSERT WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_clicks;
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

# Prompt para Lovable - Setup Supabase e Upload de 242 Leads

Copie e cole este prompt completo no Lovable:

---

Preciso que você faça o setup do banco de dados Supabase e importe 242 leads de propriedades. Tenho todos os arquivos prontos.

## Credenciais Supabase (já configuradas):
```
Project ID: atwdkhlyrffbaugkaker
URL: https://atwdkhlyrffbaugkaker.supabase.co
Publishable Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WjzxLQKNl-R0QGy68F6wgtXs
```

## Tarefa 1: Criar a Tabela no Supabase

Acesse o SQL Editor do Supabase:
https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/sql

Execute este SQL (crie uma nova query e rode):

```sql
-- Create priority_leads table
CREATE TABLE IF NOT EXISTS public.priority_leads (
    id BIGSERIAL PRIMARY KEY,
    account_number TEXT UNIQUE NOT NULL,
    priority_tier TEXT,
    owner_name TEXT,
    mailing_address TEXT,
    mailing_city TEXT,
    mailing_state TEXT,
    mailing_zip TEXT,
    property_address TEXT,
    lead_score INTEGER,
    condition_score INTEGER,
    condition_category TEXT,
    visual_summary TEXT,
    property_type TEXT,
    beds INTEGER,
    baths NUMERIC,
    year_built INTEGER,
    sqft INTEGER,
    lot_size INTEGER,
    just_value INTEGER,
    taxable_value INTEGER,
    exemptions TEXT,
    total_tax_due NUMERIC,
    years_delinquent INTEGER,
    is_estate BOOLEAN,
    is_out_of_state BOOLEAN,
    equity_estimate INTEGER,
    estimated_repair_cost_low INTEGER,
    estimated_repair_cost_high INTEGER,
    appears_vacant BOOLEAN,
    is_vacant_land BOOLEAN,
    lawn_condition TEXT,
    exterior_condition TEXT,
    roof_condition TEXT,
    visible_issues TEXT,
    distress_indicators TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_priority_tier ON public.priority_leads(priority_tier);
CREATE INDEX IF NOT EXISTS idx_lead_score ON public.priority_leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_condition_score ON public.priority_leads(condition_score DESC);
CREATE INDEX IF NOT EXISTS idx_is_estate ON public.priority_leads(is_estate);
CREATE INDEX IF NOT EXISTS idx_is_vacant_land ON public.priority_leads(is_vacant_land);

-- Enable Row Level Security
ALTER TABLE public.priority_leads ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access"
    ON public.priority_leads
    FOR SELECT
    USING (true);

-- Allow authenticated users to insert/update
CREATE POLICY "Allow authenticated insert"
    ON public.priority_leads
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update"
    ON public.priority_leads
    FOR UPDATE
    TO authenticated
    USING (true);

-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'property-images' );

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'property-images' );
```

## Tarefa 2: Confirmar que funcionou

Depois de executar o SQL acima, confirme que a tabela foi criada:

1. Vá para Table Editor: https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/editor
2. Você deve ver a tabela "priority_leads" na lista
3. Clique nela para ver a estrutura (estará vazia ainda)

## Tarefa 3: Me avisar quando terminar

Quando terminar, me avise que a tabela foi criada com sucesso. Depois vou fazer upload dos dados via script Python.

---

## Informações Adicionais (opcional):

Os dados que serão importados:
- 242 leads prioritárias (238 properties + 4 vacant land)
- 3 leads P1-CRITICAL (score 180+, condition 9-10/10)
- 35 leads P2-HIGH (score 235+, condition 7-8/10)
- Todas com análise visual completa via Google Street View

Arquivo pronto para upload (depois que criar a tabela):
- SUPABASE_UPLOAD_242_LEADS.csv (242 linhas)

---

Por favor, execute os passos acima e me confirme quando a tabela estiver criada no Supabase.

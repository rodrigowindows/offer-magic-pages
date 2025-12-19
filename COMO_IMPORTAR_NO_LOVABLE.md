# 📥 Como Importar as 84 Properties no Lovable

Guia para importar via interface do Lovable (sem rodar scripts localmente).

---

## 🎯 Duas Opções

### **Opção 1: Upload Manual via Supabase Dashboard** ⭐ MAIS FÁCIL

#### Passo 1: Upload das Imagens (15 min)

1. **Acessar Supabase Storage:**
   - Vá para: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/storage/buckets

2. **Criar Bucket (se não existir):**
   - Click **New bucket**
   - Nome: `property-photos`
   - Marcar **Public bucket** ✅
   - Click **Create**

3. **Upload das Imagens:**
   - Click no bucket `property-photos`
   - Click **Upload files**
   - Selecione TODAS as 84 imagens da pasta:
     ```
     G:\My Drive\Sell House - code\Orlando\Step 3 - Download Images\property_photos\
     ```
   - Filtre para mostrar apenas as que correspondem ao CSV (ou faça upload de todas as 984)
   - Click **Upload**
   - Aguarde completar

#### Passo 2: Importar Dados via CSV (5 min)

1. **Preparar o CSV:**
   - Abra: `LOVABLE_UPLOAD_WITH_IMAGES.csv`
   - Verifique que tem 84 linhas

2. **Acessar Table Editor:**
   - Vá para: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/editor

3. **Criar Tabela (se não existir):**
   - Click **New table**
   - Nome: `properties`
   - Adicione estas colunas principais:
     - `id` (uuid, primary key, default: uuid_generate_v4())
     - `account_number` (text, unique)
     - `property_address` (text)
     - `photo_url` (text)
     - `condition_score` (numeric)
     - `condition_category` (text)
     - `owner_name` (text)
     - `lead_score` (numeric)
     - `created_at` (timestamp, default: now())
   - Ou use este SQL completo (veja abaixo) ⬇️

4. **Importar CSV:**
   - Na tabela `properties`
   - Click **Import data via spreadsheet**
   - Selecione: `LOVABLE_UPLOAD_WITH_IMAGES.csv`
   - Faça o mapeamento das colunas
   - Click **Import**

---

### **Opção 2: Pedir ao Lovable AI para Criar Feature de Import**

Se você está no editor do Lovable, pode pedir para o AI criar uma interface de import:

**Prompt para o Lovable AI:**

```
Crie uma página de admin que permite importar properties via upload de CSV.

A tabela properties deve ter estas colunas:
- account_number (text, unique)
- property_address (text)
- photo_url (text)
- condition_score (numeric)
- condition_category (text: SEVERE, POOR, FAIR, GOOD)
- visual_summary (text)
- appears_vacant (boolean)
- lawn_condition (text)
- exterior_condition (text)
- roof_condition (text)
- visible_issues (text)
- owner_name (text)
- mailing_address (text)
- mailing_city (text)
- mailing_state (text)
- mailing_zip (text)
- property_type (text)
- beds (numeric)
- baths (numeric)
- year_built (numeric)
- sqft (numeric)
- lot_size (numeric)
- just_value (numeric)
- taxable_value (numeric)
- exemptions (numeric)
- total_tax_due (numeric)
- years_delinquent (numeric)
- lead_score (numeric)
- priority_tier (text)
- equity_estimate (numeric)
- estimated_repair_cost_low (numeric)
- estimated_repair_cost_high (numeric)
- is_estate (boolean)
- is_out_of_state (boolean)
- is_vacant_land (boolean)
- distress_indicators (text)
- lead_status (text, default: 'new')
- approval_status (text, default: 'pending')
- created_at (timestamp)
- updated_at (timestamp)

Crie também:
1. Botão para upload de CSV
2. Preview dos dados antes de importar
3. Validação de duplicatas (por account_number)
4. Barra de progresso durante import
5. Mensagem de sucesso mostrando quantas properties foram importadas
```

O Lovable AI vai criar automaticamente:
- A migration do Supabase
- O componente de upload
- A lógica de import
- A interface visual

---

## 🗄️ SQL para Criar Tabela Completa

Se preferir criar a tabela manualmente via SQL Editor:

```sql
-- Criar tabela properties
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_number TEXT UNIQUE NOT NULL,
  property_address TEXT,
  photo_url TEXT,

  -- Condition analysis
  condition_score NUMERIC,
  condition_category TEXT,
  visual_summary TEXT,
  appears_vacant BOOLEAN,
  lawn_condition TEXT,
  exterior_condition TEXT,
  roof_condition TEXT,
  visible_issues TEXT,

  -- Owner information
  owner_name TEXT,
  mailing_address TEXT,
  mailing_city TEXT,
  mailing_state TEXT,
  mailing_zip TEXT,

  -- Property details
  property_type TEXT,
  beds NUMERIC,
  baths NUMERIC,
  year_built NUMERIC,
  sqft NUMERIC,
  lot_size NUMERIC,

  -- Financial
  just_value NUMERIC,
  taxable_value NUMERIC,
  exemptions NUMERIC,
  total_tax_due NUMERIC,
  years_delinquent NUMERIC,

  -- Scoring
  lead_score NUMERIC,
  priority_tier TEXT,

  -- Estimates
  equity_estimate NUMERIC,
  estimated_repair_cost_low NUMERIC,
  estimated_repair_cost_high NUMERIC,

  -- Flags
  is_estate BOOLEAN,
  is_out_of_state BOOLEAN,
  is_vacant_land BOOLEAN,
  distress_indicators TEXT,

  -- Status tracking
  lead_status TEXT DEFAULT 'new',
  approval_status TEXT DEFAULT 'pending',
  approved_by UUID,
  approved_by_name TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  rejection_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_properties_account_number ON properties(account_number);
CREATE INDEX idx_properties_condition_category ON properties(condition_category);
CREATE INDEX idx_properties_lead_score ON properties(lead_score);
CREATE INDEX idx_properties_approval_status ON properties(approval_status);
CREATE INDEX idx_properties_lead_status ON properties(lead_status);

-- RLS (Row Level Security)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler
CREATE POLICY "Enable read access for all users" ON properties
  FOR SELECT USING (true);

-- Política: Apenas autenticados podem inserir
CREATE POLICY "Enable insert for authenticated users only" ON properties
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política: Apenas autenticados podem atualizar
CREATE POLICY "Enable update for authenticated users only" ON properties
  FOR UPDATE USING (auth.role() = 'authenticated');
```

---

## 📸 Como Fazer as Imagens Aparecerem

Depois de fazer upload das imagens para o bucket `property-photos`, o `photo_url` deve estar no formato:

```
https://atwdkhlyrffbaugkaker.supabase.co/storage/v1/object/public/property-photos/28_22_29_5600_81200.jpg
```

**Importante:** Os nomes dos arquivos de imagem usam `_` (underscore), então o CSV precisa ter URLs corretas.

O arquivo `LOVABLE_UPLOAD_WITH_IMAGES.csv` já tem as URLs corretas! ✅

---

## ✅ Checklist Passo a Passo

**Upload de Imagens:**
- [ ] Acessei Supabase Storage
- [ ] Criei bucket `property-photos` (público)
- [ ] Fiz upload das imagens da pasta `property_photos/`
- [ ] Testei abrir uma imagem no navegador

**Importar Dados:**
- [ ] Criei tabela `properties` (via SQL ou Lovable AI)
- [ ] Importei CSV via Supabase Table Editor OU
- [ ] Pedi ao Lovable AI para criar feature de import
- [ ] Verifiquei que 84 properties foram importadas
- [ ] Testei que foto_url funciona

**Verificação Final:**
- [ ] Abri o app Lovable
- [ ] Vi as 84 properties
- [ ] As fotos aparecem corretamente
- [ ] Consigo filtrar por condition_category

---

## 🎯 Próximos Passos no Lovable

Depois de importar, você pode pedir ao Lovable AI:

**"Crie uma página de properties que mostra:**
- Grid de cards com foto, endereço, e condition
- Filtros por condition_category (SEVERE, POOR, FAIR)
- Ordenação por lead_score
- Detalhes ao clicar (modal com todas as informações)
- Botões para aprovar/rejeitar
- Export das aprovadas para CSV"

---

## 💡 Dica Pro

Para importar no futuro sem precisar de scripts Python, você pode pedir ao Lovable:

**"Adicione um botão 'Import Properties' na página Admin que permite:**
1. Upload de arquivo CSV
2. Preview dos dados
3. Validação
4. Import com progresso
5. Relatório de sucesso"

O Lovable cria tudo automaticamente! 🚀

---

**Qual opção você prefere? Opção 1 (manual via Supabase) ou Opção 2 (pedir ao Lovable AI)?**

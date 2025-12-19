# 📤 Guia Completo - Upload para Lovable

Como enviar as 84 properties com imagens para o Lovable/Supabase.

---

## 🎯 O Que Você Tem Pronto

✅ **84 properties com imagens** (das 238 prioritárias)
✅ **84 fotos** prontas para upload
✅ **Arquivo CSV** preparado: `LOVABLE_UPLOAD_WITH_IMAGES.csv`

### Breakdown das 84 Properties:
- **SEVERE**: 1 (pior condição - LIGAR PRIMEIRO!)
- **POOR**: 38 (má condição - alta prioridade)
- **FAIR**: 41 (condição média)
- **VACANT LAND**: 4 terrenos

---

## 📋 Passo a Passo Completo

### **PASSO 1: Preparar Ambiente** (5 minutos)

#### 1.1 Criar arquivo `.env`

Na pasta `tools/`, crie o arquivo `.env`:

```bash
# Supabase Configuration
SUPABASE_URL=https://atwdkhlyrffbaugkaker.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_SERVICE_KEY=sua-chave-service-role-aqui
```

**Onde pegar as chaves:**
1. Vá para: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker
2. **Settings** → **API**
3. Copie:
   - `anon public` → SUPABASE_ANON_KEY
   - `service_role` → SUPABASE_SERVICE_KEY

#### 1.2 Instalar dependências

```bash
cd "Step 5 - Outreach & Campaigns/tools"
pip install requests python-dotenv supabase pandas
```

---

### **PASSO 2: Criar Bucket de Imagens** (2 minutos)

#### 2.1 No Supabase Dashboard:

1. Vá para: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/storage/buckets
2. Click **New bucket**
3. Nome: `property-photos`
4. Marcar **Public bucket** ✅
5. Click **Create bucket**

#### 2.2 Verificar que é público:

1. Click no bucket `property-photos`
2. **Configuration** → Confirmar **Public** = ON

---

### **PASSO 3: Upload das 84 Imagens** (10-15 minutos)

Rode o script de upload de imagens:

```bash
cd "Step 5 - Outreach & Campaigns/tools"
python upload_images_to_lovable.py
```

**O que vai acontecer:**
- Script vai ler o CSV `LOVABLE_UPLOAD_WITH_IMAGES.csv`
- Upload das 84 imagens para Supabase Storage
- Cada imagem fica em: `https://atwdkhlyrffbaugkaker.supabase.co/storage/v1/object/public/property-photos/01_21_28_9108_03030.jpg`

**Resultado esperado:**
```
Uploading 84 images...
✓ Uploaded: 01_21_28_9108_03030.jpg
✓ Uploaded: 01_21_28_9112_00090.jpg
...
✓ Successfully uploaded: 84/84
```

---

### **PASSO 4: Importar Dados para Database** (5-10 minutos)

Rode o script de import de dados:

```bash
python import_csv_to_lovable.py
```

**O que vai acontecer:**
- Cria/atualiza tabela `properties` no Supabase
- Importa as 84 properties com todos os dados
- Vincula cada property com sua imagem

**Resultado esperado:**
```
Loading 84 properties from CSV...
✓ Created table: properties
✓ Inserted: 01-21-28-9108-03030
✓ Inserted: 01-21-28-9112-00090
...
✓ Total processed: 84/84
```

---

### **PASSO 5: Verificar no Lovable** (2 minutos)

#### 5.1 No Supabase Dashboard:

1. Vá para: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/editor
2. **Table Editor** → `properties`
3. Veja suas 84 properties importadas
4. Clique em uma linha → veja que `photo_url` tem o link da imagem

#### 5.2 Testar uma imagem:

1. Copie um `photo_url` da tabela
2. Cole no navegador
3. Deve abrir a foto da property

#### 5.3 No App Lovable:

1. Faça deploy da aplicação (se ainda não fez)
2. Abra o app
3. Vá para página **Admin** ou **Properties**
4. Veja as 84 properties com fotos

---

## 🛠️ Scripts Criados

### **`upload_images_to_lovable.py`**
```python
# Upload das 84 imagens para Supabase Storage
# Lê: LOVABLE_UPLOAD_WITH_IMAGES.csv
# Sobe para: property-photos bucket
```

### **`import_csv_to_lovable.py`**
```python
# Import dos dados das 84 properties
# Cria tabela: properties
# Campos: account_number, address, condition, scores, etc.
```

---

## 📊 Estrutura da Tabela `properties`

```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_number TEXT UNIQUE NOT NULL,
  property_address TEXT,
  photo_url TEXT,  -- URL da imagem no Storage

  -- Condition Analysis
  condition_score NUMERIC,
  condition_category TEXT,  -- SEVERE, POOR, FAIR, GOOD
  visual_summary TEXT,
  appears_vacant BOOLEAN,
  lawn_condition TEXT,
  exterior_condition TEXT,
  roof_condition TEXT,
  visible_issues TEXT,

  -- Property Details
  owner_name TEXT,
  mailing_address TEXT,
  mailing_city TEXT,
  mailing_state TEXT,
  mailing_zip TEXT,
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

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_account_number ON properties(account_number);
CREATE INDEX idx_condition_category ON properties(condition_category);
CREATE INDEX idx_lead_score ON properties(lead_score);
```

---

## 🔧 Troubleshooting

### ❌ Erro: "Bucket not found"
**Solução**: Criar bucket `property-photos` no Supabase Storage (Passo 2)

### ❌ Erro: "Permission denied"
**Solução**: Verificar que bucket é **Public** nas configurações

### ❌ Erro: "Invalid credentials"
**Solução**: Verificar chaves no arquivo `.env` (Passo 1)

### ❌ Imagens não aparecem no app
**Solução**:
1. Verificar que `photo_url` está preenchido na tabela
2. Testar URL direto no navegador
3. Confirmar bucket é público

### ❌ Dados não importaram
**Solução**:
1. Verificar que usou `SUPABASE_SERVICE_KEY` (não anon key)
2. Rodar script novamente (é safe, não duplica)

---

## ✅ Checklist Final

Antes de começar:
- [ ] Arquivo `.env` criado com chaves corretas
- [ ] Dependências instaladas (`pip install ...`)
- [ ] Bucket `property-photos` criado e público

Upload:
- [ ] 84 imagens enviadas com sucesso
- [ ] 84 properties importadas no database
- [ ] Tabela `properties` criada

Verificação:
- [ ] Testei uma imagem no navegador (funciona)
- [ ] Vi as properties na Table Editor do Supabase
- [ ] App Lovable mostra as properties com fotos

---

## 📈 Próximos Passos Após Upload

1. **Revisar as properties no app**
   - Filtrar por `condition_category = 'SEVERE'` (1 property - LIGAR PRIMEIRO!)
   - Filtrar por `condition_category = 'POOR'` (38 properties - alta prioridade)

2. **Usar sistema de aprovação**
   - Aprovar/rejeitar cada property
   - Sistema rastreia quem aprovou

3. **Exportar lista final**
   - Export para CSV as aprovadas
   - Começar outreach!

---

## 🎯 Resumo Executivo

**Você tem:**
- ✅ 84 properties com fotos (das 238 prioritárias)
- ✅ Scripts prontos para upload automático
- ✅ 1 SEVERE (melhor lead!)
- ✅ 38 POOR (alta prioridade)
- ✅ 4 terrenos

**Tempo total de upload:** ~20-30 minutos

**Depois do upload:** Começar a revisar e ligar! 📞

---

**Dúvidas?** Veja também:
- [IMPORT_DATA_GUIDE.md](DOCS/guides/IMPORT_DATA_GUIDE.md) - Guia técnico em inglês
- [IMPORTAR_DADOS_PT.md](DOCS/pt-portuguese/IMPORTAR_DADOS_PT.md) - Guia geral em português

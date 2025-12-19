# GUIA: Como Fazer Upload dos Dados para o Site (Supabase)

## RESUMO

Você tem **2 tipos de upload** disponíveis no Step 5:

1. **Upload de Imagens** (property photos)
2. **Upload de Dados** (análise, scores, etc.)

Ambos usam **Supabase** como backend/database.

---

## O QUE É SUPABASE?

**Supabase** é uma plataforma de backend (como Firebase):
- Database PostgreSQL na nuvem
- Storage para arquivos/imagens
- API REST automática
- Dashboard web para gerenciar dados

**Seu site/app já está configurado para usar Supabase!**

---

## PRÉ-REQUISITOS

### 1. Credenciais Supabase

Você precisa de um arquivo `.env` no diretório `Step 5`:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-aqui
```

**Como conseguir:**
1. Vá para [supabase.com](https://supabase.com)
2. Login no seu projeto
3. Settings → API
4. Copie:
   - Project URL → SUPABASE_URL
   - anon/public key → SUPABASE_KEY

### 2. Instalar Dependências Python

```bash
cd "G:\My Drive\Sell House - code\Orlando\Step 5 - Outreach & Campaigns"
pip install supabase python-dotenv pillow requests
```

---

## OPÇÃO 1: UPLOAD DE IMAGENS

### Script Disponível: `upload_images.py`

Este script:
- Pega as 984 fotos do Step 3
- Faz upload para Supabase Storage
- Atualiza tabela `properties` com URLs das imagens

### Como Usar:

#### Passo 1: Preview (testar sem upload)
```bash
cd "G:\My Drive\Sell House - code\Orlando\Step 5 - Outreach & Campaigns"
python upload_images.py --preview
```

Isso mostra o que será uploadado sem fazer upload de fato.

#### Passo 2: Testar com 10 imagens
```bash
python upload_images.py --limit 10
```

Upload das primeiras 10 apenas (para testar).

#### Passo 3: Upload Completo
```bash
python upload_images.py
```

Upload de TODAS as 984 imagens!

### O Que Acontece:

1. **Cria bucket** `property-images` no Supabase (se não existir)
2. **Upload** cada imagem como `properties/{account-number}.jpg`
3. **Atualiza** tabela `properties` com URL pública
4. Imagens ficam acessíveis em:
   ```
   https://seu-projeto.supabase.co/storage/v1/object/public/property-images/properties/01-22-28-3541-00660.jpg
   ```

---

## OPÇÃO 2: UPLOAD DE DADOS DA ANÁLISE

Você precisa criar um script para fazer upload dos CSVs para o Supabase.

### Dados para Upload:

1. **CONTACT_LIST_FOCUSED.csv** (238 properties prioritárias)
2. **VACANT_LAND_PRIORITY.csv** (4 terrenos)
3. **data/property_condition_analysis.csv** (984 análises completas)

### Script de Upload de Dados (CRIAR):

```python
# upload_analysis_data.py
import os
import pandas as pd
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Upload contact list
print("Uploading contact list...")
df_contacts = pd.read_csv('../Step 4 - AI Review & Evaluate/CONTACT_LIST_FOCUSED.csv')

for _, row in df_contacts.iterrows():
    data = {
        'account_number': row['Account Number'],
        'priority_class': row['Priority_Class'],
        'lead_score': int(row['Score']),
        'condition_score': int(row['Condition_Score']),
        'condition_category': row['Condition_Category'],
        'visual_summary': row['Visual_Summary'],
        'owner_name': row['Owner Name'],
        'property_address': row['Property Address'],
        'equity': float(row['Equity']) if pd.notna(row['Equity']) else None,
        'times_delinquent': int(row['Times Delinquent']) if pd.notna(row['Times Delinquent']) else 0,
        # ... outros campos
    }

    # Upsert (insert or update)
    supabase.table('priority_leads').upsert(data).execute()

print("✅ Upload complete!")
```

---

## OPÇÃO 3: IMPORTAÇÃO MANUAL VIA SUPABASE DASHBOARD

### Mais Fácil para Começar!

1. **Vá para o Supabase Dashboard**
   - [app.supabase.com](https://app.supabase.com)
   - Selecione seu projeto

2. **Table Editor → Sua Tabela**
   - Ex: `properties`, `priority_leads`, etc.

3. **Import Data**
   - Clique em "Import data from CSV"
   - Selecione seu CSV (ex: CONTACT_LIST_FOCUSED.csv)
   - Mapeie as colunas
   - Import!

### Vantagens:
- ✅ Não precisa código
- ✅ Visual/fácil
- ✅ Valida dados automaticamente

### Desvantagens:
- ❌ Manual (tem que clicar)
- ❌ Não automatizado

---

## ESTRUTURA DO BANCO DE DADOS

### Tabelas Sugeridas:

#### 1. `properties` (todas 984)
```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_number TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_name TEXT,
  property_address TEXT,

  -- Step 2 data
  lead_score INTEGER,
  equity DECIMAL,
  times_delinquent INTEGER,
  is_estate_trust BOOLEAN,
  is_out_of_state BOOLEAN,
  is_llc BOOLEAN,

  -- Step 4 data
  condition_score INTEGER,
  condition_category TEXT,
  lawn_condition TEXT,
  exterior_condition TEXT,
  visual_summary TEXT,
  appears_vacant BOOLEAN,

  -- Images
  property_image_url TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `priority_leads` (238 properties)
```sql
CREATE TABLE priority_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_number TEXT UNIQUE NOT NULL,
  priority_class TEXT NOT NULL, -- P1-CRITICAL, P2-HIGH, etc.

  -- Reference to properties table
  property_id UUID REFERENCES properties(id),

  -- Contact status
  contact_status TEXT DEFAULT 'not_contacted',
  last_contacted_at TIMESTAMP,
  interest_level TEXT,
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `vacant_land` (45 terrenos)
```sql
CREATE TABLE vacant_land (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_number TEXT UNIQUE NOT NULL,

  -- Reference
  property_id UUID REFERENCES properties(id),

  -- Land specific
  priority_score INTEGER,
  is_high_priority BOOLEAN,

  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## WORKFLOW COMPLETO RECOMENDADO

### Fase 1: Setup Inicial (uma vez)

1. **Criar tabelas no Supabase**
   - Use SQL Editor no dashboard
   - Rode os CREATE TABLE acima

2. **Configurar Storage Bucket**
   - Storage → New Bucket
   - Nome: `property-images`
   - Public: YES

3. **Criar arquivo .env**
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_KEY=eyJ...
   ```

### Fase 2: Upload Imagens (uma vez)

```bash
cd "Step 5 - Outreach & Campaigns"
python upload_images.py --limit 10  # Teste
python upload_images.py             # Upload completo
```

### Fase 3: Upload Dados

**Opção A - Manual (Recomendado para começar):**
1. Vá ao Supabase Dashboard
2. Table Editor → properties
3. Import CSV: `data/property_condition_analysis.csv`

**Opção B - Script Python:**
```bash
python upload_analysis_data.py  # (você precisa criar este)
```

### Fase 4: Verificar no Site

Abra seu site/app e verifique:
- ✅ Imagens aparecem
- ✅ Dados carregam
- ✅ Filtros funcionam
- ✅ Prioridades aparecem

---

## SCRIPTS PRONTOS NO STEP 5

### 1. `upload_images.py` ✅
- **Pronto para usar**
- Faz upload das fotos
- Atualiza URLs no banco

### 2. `tools/upload_images_to_supabase.py` ✅
- Versão alternativa
- Mesmo propósito

### 3. Upload de Dados ❌
- **Você precisa criar**
- Use o template acima

---

## EXEMPLO: UPLOAD RÁPIDO PASSO-A-PASSO

### Passo 1: Configure .env
```bash
cd "G:\My Drive\Sell House - code\Orlando\Step 5 - Outreach & Campaigns"
notepad .env
```

Adicione:
```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=eyJhbGc...sua-chave
```

### Passo 2: Teste com 1 imagem
```bash
python upload_images.py --limit 1
```

Deveria ver:
```
[1/1] 01_22_28_3541_00660.jpg
  Slug: 01-22-28-3541-00660
  ✓ Uploaded: https://...
  ✓ Property record updated

✅ Uploaded: 1
```

### Passo 3: Upload completo
```bash
python upload_images.py
```

Vai levar ~10-15 minutos para 984 imagens.

### Passo 4: Verificar
1. Vá para Supabase Dashboard
2. Storage → property-images
3. Deveria ver 984 imagens!

4. Table Editor → properties
5. Coluna `property_image_url` deveria ter URLs

---

## TROUBLESHOOTING

### Erro: "Supabase credentials not found"
**Solução:** Crie arquivo `.env` com SUPABASE_URL e SUPABASE_KEY

### Erro: "Bucket not found"
**Solução:**
1. Vá ao Supabase Dashboard
2. Storage → New Bucket
3. Nome: `property-images`
4. Public: YES

### Erro: "Property not found in database"
**Solução:**
- Primeiro popule a tabela `properties` com os dados
- Depois rode o upload de imagens

### Imagens não aparecem no site
**Verificar:**
1. URLs no banco estão corretos?
2. Bucket é público?
3. Site está usando o Supabase correto?

---

## ALTERNATIVAS

### Se Não Quer Usar Supabase:

#### 1. Google Drive / Dropbox
- Upload manual das imagens
- Gere links públicos
- Adicione links no CSV

#### 2. AWS S3
- Similar ao Supabase Storage
- Precisa configurar bucket
- Modificar scripts para usar boto3

#### 3. GitHub Pages
- Commit imagens no repo
- URLs públicas automáticas
- Grátis mas lento para muitas imagens

---

## PRÓXIMOS PASSOS

1. ✅ **Configure .env** com credenciais Supabase
2. ✅ **Rode upload_images.py --preview** para testar
3. ✅ **Upload 10 imagens** de teste
4. ✅ **Verifique no Supabase** se funcionou
5. ✅ **Upload completo** das 984 imagens
6. ✅ **Importe CSVs** via Dashboard ou script
7. ✅ **Teste no site** se tudo aparece

---

## RESUMO

**Você já tem:**
- ✅ Scripts prontos de upload (`upload_images.py`)
- ✅ 984 imagens para fazer upload
- ✅ CSVs com dados analisados
- ✅ Sistema Supabase configurado no Step 5

**Você precisa:**
- ⚠️ Credenciais Supabase (URL + KEY)
- ⚠️ Criar arquivo .env
- ⚠️ Rodar os scripts de upload

**Resultado final:**
- 🎯 Site/app com todas as 984 propriedades
- 🎯 Imagens carregando automaticamente
- 🎯 Dados de análise disponíveis
- 🎯 Sistema de prioridades funcionando

---

**Está pronto para fazer upload! Comece com o `.env` e teste com `--preview` primeiro! 🚀**

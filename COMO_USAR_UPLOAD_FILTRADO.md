# COMO FAZER UPLOAD DOS 242 LEADS PRIORITÁRIOS (COM FILTROS)

## RESUMO RÁPIDO

Criei o script **`upload_priority_leads.py`** que faz upload APENAS dos leads prioritários:
- ✅ **238 properties distressed** (P1-P6)
- ✅ **4 terrenos** (score 180+)
- ✅ **242 leads totais**

---

## COMANDOS DISPONÍVEIS

### 1. PREVIEW (Ver sem fazer upload)
```bash
cd "G:\My Drive\Sell House - code\Orlando\Step 5 - Outreach & Campaigns"
python upload_priority_leads.py --preview
```

**O que faz:**
- Mostra quantos leads serão uploadados
- Lista os top 10 por prioridade
- Verifica se as imagens existem
- **NÃO faz upload** (só mostra)

---

### 2. UPLOAD COMPLETO (Dados + Imagens)
```bash
python upload_priority_leads.py
```

**O que faz:**
- Upload de 238 properties para tabela `priority_leads`
- Upload de 4 land para tabela `priority_leads`
- Upload de ~242 imagens para Storage
- Associa URLs das imagens aos registros

---

### 3. SÓ DADOS (sem imagens)
```bash
python upload_priority_leads.py --data-only
```

**O que faz:**
- Upload apenas dos dados CSV para database
- **NÃO** faz upload de imagens
- Mais rápido (~2-3 minutos)

**Use quando:**
- Quer testar os dados primeiro
- Imagens já foram uploadadas antes
- Quer economizar tempo

---

### 4. SÓ IMAGENS (sem dados)
```bash
python upload_priority_leads.py --images-only
```

**O que faz:**
- Upload apenas das 242 imagens
- **NÃO** faz upload de dados
- Útil se dados já estão no banco

**Use quando:**
- Dados já foram importados manualmente
- Só falta linkar as imagens
- Quer re-upload de imagens

---

## FILTROS CUSTOMIZADOS

### Opção A: Modificar o Script

Edite `upload_priority_leads.py` e adicione filtros:

```python
# Linha ~75, na função load_priority_leads()

# FILTRO 1: Só P1-P3 (as 57 mais prioritárias)
df_properties = df_properties[
    df_properties['Priority_Class'].isin(['P1-CRITICAL', 'P2-HIGH', 'P3-GOOD'])
]

# FILTRO 2: Só SEVERE e POOR (39 properties)
df_properties = df_properties[
    df_properties['Condition_Category'].isin(['SEVERE', 'POOR'])
]

# FILTRO 3: Só Score 200+ (top scores)
df_properties = df_properties[df_properties['Score'] >= 200]

# FILTRO 4: Só Estates/Trusts
df_properties = df_properties[df_properties['Estate/Trust'] == True]

# FILTRO 5: Só Out-of-State
df_properties = df_properties[df_properties['Out of State'] == True]

# FILTRO 6: Combinado (POOR + Score 200+)
df_properties = df_properties[
    (df_properties['Condition_Category'] == 'POOR') &
    (df_properties['Score'] >= 200)
]
```

---

### Opção B: Criar CSVs Filtrados

**Mais fácil!** Filtre os CSVs antes de rodar:

```bash
cd "G:\My Drive\Sell House - code\Orlando\Step 4 - AI Review & Evaluate"
python
```

```python
import pandas as pd

# Carregar lista completa
df = pd.read_csv('CONTACT_LIST_FOCUSED.csv')

# FILTRO: Só P1-P2 (top 38 properties)
df_top = df[df['Priority_Class'].isin(['P1-CRITICAL', 'P2-HIGH'])]

# Salvar
df_top.to_csv('CONTACT_LIST_TOP38.csv', index=False)
print(f"Salvou {len(df_top)} leads prioritários")
```

Depois modifique a linha 36 em `upload_priority_leads.py`:
```python
CONTACT_LIST = Path("../Step 4 - AI Review & Evaluate/CONTACT_LIST_TOP38.csv")
```

---

## EXEMPLOS PRÁTICOS

### Exemplo 1: Upload SÓ das 3 CRITICAL

```python
# 1. Criar CSV filtrado
import pandas as pd
df = pd.read_csv('../Step 4 - AI Review & Evaluate/CONTACT_LIST_FOCUSED.csv')
df_critical = df[df['Priority_Class'] == 'P1-CRITICAL']
df_critical.to_csv('../Step 4 - AI Review & Evaluate/CONTACT_LIST_CRITICAL.csv', index=False)

# 2. Modificar upload_priority_leads.py linha 36
# CONTACT_LIST = Path("../Step 4 - AI Review & Evaluate/CONTACT_LIST_CRITICAL.csv")

# 3. Rodar
python upload_priority_leads.py --preview  # Ver
python upload_priority_leads.py            # Upload
```

---

### Exemplo 2: Upload SÓ POOR + Estates

```python
import pandas as pd
df = pd.read_csv('../Step 4 - AI Review & Evaluate/CONTACT_LIST_FOCUSED.csv')

# Filtro: POOR condition E Estate/Trust
df_filtered = df[
    (df['Condition_Category'] == 'POOR') &
    (df['Estate/Trust'] == True)
]

print(f"Encontrou {len(df_filtered)} leads")
df_filtered.to_csv('../Step 4 - AI Review & Evaluate/CONTACT_LIST_POOR_ESTATES.csv', index=False)

# Depois modifique o script e rode
```

---

### Exemplo 3: Upload TOP 50 (por Score)

```python
import pandas as pd
df = pd.read_csv('../Step 4 - AI Review & Evaluate/CONTACT_LIST_FOCUSED.csv')

# Top 50 por score
df_top50 = df.nlargest(50, 'Score')

print(f"Top 50 scores: {df_top50['Score'].min():.0f} - {df_top50['Score'].max():.0f}")
df_top50.to_csv('../Step 4 - AI Review & Evaluate/CONTACT_LIST_TOP50.csv', index=False)
```

---

## WORKFLOW RECOMENDADO

### Fase 1: Teste com P1-CRITICAL (3 leads)

```bash
# 1. Criar CSV só com P1
cd "Step 4 - AI Review & Evaluate"
python -c "
import pandas as pd
df = pd.read_csv('CONTACT_LIST_FOCUSED.csv')
df[df['Priority_Class'] == 'P1-CRITICAL'].to_csv('TEST_P1.csv', index=False)
"

# 2. Modificar script
# Linha 36: CONTACT_LIST = Path("../Step 4 - AI Review & Evaluate/TEST_P1.csv")
# Linha 37: LAND_LIST = None  # Desabilitar land

# 3. Preview
cd "Step 5 - Outreach & Campaigns"
python upload_priority_leads.py --preview

# 4. Upload
python upload_priority_leads.py --data-only  # Só dados primeiro
```

---

### Fase 2: Adicionar P2-HIGH (35 leads)

```bash
# 1. Criar CSV com P1 + P2
python -c "
import pandas as pd
df = pd.read_csv('../Step 4 - AI Review & Evaluate/CONTACT_LIST_FOCUSED.csv')
df[df['Priority_Class'].isin(['P1-CRITICAL', 'P2-HIGH'])].to_csv(
    '../Step 4 - AI Review & Evaluate/CONTACT_LIST_P1_P2.csv', index=False
)
"

# 2. Modificar script para usar novo CSV

# 3. Upload
python upload_priority_leads.py
```

---

### Fase 3: Upload Completo (242 leads)

```bash
# Usar CSV original (já está configurado)
python upload_priority_leads.py --preview  # Conferir
python upload_priority_leads.py            # Upload tudo
```

---

## FILTROS POR CARACTERÍSTICAS

### Filtro: Propriedades VAGAS
```python
df_vacant = df[df['Appears_Vacant'] == True]
```

### Filtro: Tax Delinquent 5+ anos
```python
df_delinquent = df[df['Times Delinquent'] >= 5]
```

### Filtro: Equity Alto (>$200k)
```python
df_high_equity = df[df['Equity'] > 200000]
```

### Filtro: Combinado (Máxima Prioridade)
```python
df_gold = df[
    (df['Condition_Category'].isin(['SEVERE', 'POOR'])) &
    (df['Score'] >= 200) &
    (df['Estate/Trust'] == True)
]
```

---

## ESTRUTURA DA TABELA SUPABASE

O script cria/atualiza a tabela `priority_leads`:

```sql
CREATE TABLE priority_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identificação
  account_number TEXT UNIQUE NOT NULL,
  slug TEXT NOT NULL,

  -- Prioridade
  priority_class TEXT NOT NULL,  -- P1-CRITICAL, P2-HIGH, etc.

  -- Scores
  lead_score INTEGER,
  condition_score INTEGER,
  condition_category TEXT,

  -- Dados do Owner
  owner_name TEXT,
  property_address TEXT,

  -- Motivadores
  equity DECIMAL,
  times_delinquent INTEGER,
  is_estate_trust BOOLEAN,
  is_out_of_state BOOLEAN,

  -- Análise Visual
  visual_summary TEXT,
  property_image_url TEXT,

  -- Tipo
  is_vacant_land BOOLEAN DEFAULT false,

  -- Status de Contato
  contact_status TEXT DEFAULT 'not_contacted',
  last_contacted_at TIMESTAMP,
  interest_level TEXT,
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## TROUBLESHOOTING

### Erro: "File not found: CONTACT_LIST_FOCUSED.csv"
**Solução:** Certifique-se que está no diretório correto:
```bash
cd "Step 5 - Outreach & Campaigns"
ls ../Step\ 4\ -\ AI\ Review\ &\ Evaluate/CONTACT_LIST_FOCUSED.csv
```

### Erro: "Supabase not installed"
**Solução:**
```bash
pip install supabase python-dotenv
```

### Erro: "Credentials not found"
**Solução:** Crie arquivo `.env`:
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave
```

### Erro: "Table priority_leads does not exist"
**Solução:** Crie a tabela no Supabase Dashboard usando o SQL acima.

---

## RESUMO DOS COMANDOS

```bash
# Preview (ver sem upload)
python upload_priority_leads.py --preview

# Upload completo (dados + imagens)
python upload_priority_leads.py

# Só dados
python upload_priority_leads.py --data-only

# Só imagens
python upload_priority_leads.py --images-only

# Com filtro customizado
# (editar script primeiro ou criar CSV filtrado)
python upload_priority_leads.py
```

---

## PRÓXIMOS PASSOS

1. ☐ Criar arquivo `.env` com credenciais
2. ☐ Decidir filtro (todos 242? só P1-P3? só POOR?)
3. ☐ Rodar `--preview` para conferir
4. ☐ Upload com `--data-only` primeiro (testar)
5. ☐ Upload completo com imagens
6. ☐ Verificar no Supabase Dashboard

---

**Pronto para upload! Comece com `--preview` para ver o que será enviado! 🚀**

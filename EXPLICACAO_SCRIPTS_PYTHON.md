# 📚 Guia Completo dos Scripts Python

Este documento explica **todos os scripts Python** do projeto Step 5, para que servem e quando usar cada um.

---

## 📋 Índice

1. [simple_upload.py](#1-simple_uploadpy) - ⭐ **RECOMENDADO** - Upload simples de dados
2. [upload_images.py](#2-upload_imagespy) - Upload de imagens das propriedades
3. [prepare_for_manual_upload.py](#3-prepare_for_manual_uploadpy) - Prepara dados do Step 4
4. [upload_with_error_handling.py](#4-upload_with_error_handlingpy) - Upload com tratamento de erros
5. [setup_database.py](#5-setup_databasepy) - Configuração do banco de dados
6. [auto_setup_and_upload.py](#6-auto_setup_and_uploadpy) - Setup e upload automático
7. [organize_step5.py](#7-organize_step5py) - Reorganização COMPLETA (move tudo)
8. [organize_step5_SAFE.py](#8-organize_step5_safepy) - ⭐ **USADO** - Reorganização SEGURA

---

## 1. simple_upload.py

### 🎯 Para que serve?
Upload de dados CSV para o Supabase de forma **simples e direta**.

### ✅ Quando usar?
- **Quando você tem um CSV pronto** para importar
- Para fazer upload rápido de leads processados
- É o script **mais recomendado** para uploads normais

### 📊 O que faz?
```python
1. Lê o arquivo CSV especificado
2. Conecta ao Supabase usando credenciais do .env
3. Divide os dados em lotes (batches) de 50 registros
4. Faz upload batch por batch
5. Mostra progresso e erros
6. Gera relatório final com estatísticas
```

### 🔧 Como usar?
```bash
cd scripts/
python simple_upload.py
```

### 📝 Configuração necessária:
- Arquivo `.env` com:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- CSV na localização correta (ou editar caminho no código)

### 💡 Detalhes técnicos:
- **Lê CSV**: Carrega todo o CSV em memória
- **Limpa NaN**: Converte valores NaN do pandas para None (JSON compatível)
- **Upload em batches**: 50 registros por vez (evita timeout)
- **Trata duplicatas**: Skip automático de duplicados
- **Headers REST API**: Usa autenticação Bearer token

---

## 2. upload_images.py

### 🎯 Para que serve?
Upload de **imagens das propriedades** para o Supabase Storage.

### ✅ Quando usar?
- Depois de fazer upload dos dados (simple_upload.py)
- Quando você tem imagens no disco para associar às propriedades
- Para popular o campo `image_url` nas propriedades

### 📊 O que faz?
```python
1. Lê lista de propriedades com account_number
2. Procura imagens correspondentes na pasta local
3. Faz upload das imagens para Supabase Storage
4. Atualiza o campo image_url de cada propriedade
5. Gera relatório de sucesso/falhas
```

### 🔧 Como usar?
```bash
cd scripts/
python upload_images.py
```

### 📝 Estrutura esperada:
```
FINAL_242_LEADS/
├── account_12345.jpg
├── account_67890.png
└── ...
```

### 💡 Detalhes técnicos:
- **Suporta**: JPG, PNG, JPEG
- **Bucket**: `property-images` no Supabase Storage
- **Path no Storage**: `{account_number}.{extensao}`
- **Atualiza DB**: Faz UPDATE na tabela properties após upload
- **URL pública**: Gera URL pública para cada imagem

### ⚠️ Importante:
- Imagens devem estar nomeadas como: `account_{numero}.{ext}`
- Bucket `property-images` deve existir no Supabase
- Permissões RLS devem permitir UPDATE no campo image_url

---

## 3. prepare_for_manual_upload.py

### 🎯 Para que serve?
**Prepara e combina** dados do Step 4 em um único CSV otimizado para Supabase.

### ✅ Quando usar?
- **ANTES** de fazer qualquer upload
- Quando você tem dados novos do Step 4
- Para combinar CONTACT_LIST + VACANT_LAND em um só arquivo

### 📊 O que faz?
```python
1. Lê CONTACT_LIST_FOCUSED.csv do Step 4
2. Lê VACANT_LAND_PRIORITY.csv do Step 4
3. Combina os dois DataFrames
4. Renomeia colunas para snake_case (Supabase padrão)
5. Mapeia colunas para schema do banco
6. Cria arquivo SUPABASE_UPLOAD_242_LEADS.csv
7. Mostra breakdown por Priority Tier
```

### 🔧 Como usar?
```bash
python prepare_for_manual_upload.py
```

### 📝 Mapeamento de colunas:
```python
'Account Number' → 'account_number'
'Priority' → 'priority_tier'
'Owner' → 'owner_name'
'Property Address' → 'property_address'
'Lead Score' → 'lead_score'
'Condition_Score' → 'condition_score'
# ... e mais 30 colunas
```

### 💡 Output:
```
SUPABASE_UPLOAD_242_LEADS.csv
├── 242 linhas (138 properties + 104 land)
├── 35 colunas
└── Pronto para upload manual ou via simple_upload.py
```

### 🔗 Próximos passos sugeridos:
1. ✅ `prepare_for_manual_upload.py` (você está aqui)
2. ➡️ `simple_upload.py` (upload para Supabase)
3. ➡️ `upload_images.py` (upload de imagens)

---

## 4. upload_with_error_handling.py

### 🎯 Para que serve?
Upload **linha por linha** com **tratamento detalhado de erros**.

### ✅ Quando usar?
- Quando `simple_upload.py` está falhando e você não sabe porquê
- Para debuggar problemas de dados
- Para identificar exatamente qual registro tem problema

### 📊 O que faz?
```python
1. Lê o CSV
2. Para CADA linha individualmente:
   - Valida tipos de dados (int, float, bool, string)
   - Limpa valores inválidos
   - Tenta fazer upload
   - Se falhar, registra erro COM DETALHES
3. Mostra progresso a cada 20 registros
4. Gera relatório completo: uploaded, skipped, errors
```

### 🔧 Como usar?
```bash
cd scripts/
python upload_with_error_handling.py
```

### 💡 Validações que faz:
- **Campos numéricos**: `beds`, `year_built`, `sqft`, etc → int ou None
- **Campos decimais**: `baths`, `total_tax_due` → float ou None
- **Campos booleanos**: `is_estate`, `appears_vacant` → True/False/None
- **Campos de texto**: Sempre string ou None

### ⚠️ Desvantagem:
- **MUITO MAIS LENTO** que simple_upload.py (1 request por registro)
- Use apenas para debugging

### 📊 Output exemplo:
```
Progress: 20 uploaded, 2 skipped, 0 errors
Progress: 40 uploaded, 3 skipped, 1 errors
ERROR: account_12345 - 400: Invalid value for 'beds'
...
Total: 242 records
Uploaded: 238
Skipped: 3 (duplicates)
Errors: 1
```

---

## 5. setup_database.py

### 🎯 Para que serve?
**Criar a tabela** `priority_leads` no Supabase (primeira vez).

### ✅ Quando usar?
- **PRIMEIRA VEZ** que você configura o projeto
- Quando precisa recriar a tabela do zero
- Para entender o schema do banco

### 📊 O que faz?
```python
1. Conecta ao Supabase
2. Mostra instruções de setup MANUAL
3. Explica que precisa usar Dashboard do Supabase
4. Fornece links diretos para SQL Editor
```

### 🔧 Como usar?
```bash
python setup_database.py
```

### ⚠️ IMPORTANTE:
Este script **NÃO CRIA A TABELA AUTOMATICAMENTE** porque:
- Chave `PUBLISHABLE_KEY` (anon key) não pode executar DDL (CREATE TABLE)
- Precisa usar **Dashboard do Supabase** com login manual

### 📝 Instruções que fornece:
```
1. Abra: https://atwdkhlyrffbaugkaker.supabase.co/project/.../sql
2. Copie SQL de: setup_supabase_tables.sql
3. Cole no SQL Editor
4. Clique "Run"
```

### 💡 SQL que deve ser executado:
```sql
CREATE TABLE IF NOT EXISTS public.priority_leads (
    id BIGSERIAL PRIMARY KEY,
    account_number TEXT UNIQUE NOT NULL,
    priority_tier TEXT,
    owner_name TEXT,
    property_address TEXT,
    lead_score INTEGER,
    -- ... mais 30 colunas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_priority_tier ON priority_leads(priority_tier);
CREATE INDEX idx_lead_score ON priority_leads(lead_score DESC);
```

---

## 6. auto_setup_and_upload.py

### 🎯 Para que serve?
Tentativa de **setup + upload 100% automático** (semi-funcional).

### ✅ Quando usar?
- Quando você quer tentar fazer tudo de uma vez
- Para setup inicial rápido (após criar tabela manualmente)

### 📊 O que faz?
```python
1. Verifica credenciais do .env
2. TENTA criar tabela (geralmente falha - precisa Service Role Key)
3. Espera confirmação manual que tabela foi criada
4. Faz upload dos dados via REST API
5. Mostra links para visualizar dados
```

### 🔧 Como usar?
```bash
python auto_setup_and_upload.py
```

### 💡 Fluxo:
```
STEP 1: CREATE TABLE
  → Mostra instruções manuais
  → Pede confirmação: "Press ENTER after you've created the table..."

STEP 2: UPLOAD DATA
  → Lê SUPABASE_UPLOAD_242_LEADS.csv
  → Upload em batches de 50
  → Mostra progresso e erros
```

### ⚠️ Limitações:
- **Criação de tabela**: Precisa ser manual (Dashboard)
- **Service Role Key**: Se você tiver, pode criar tabela automaticamente
- **Pausado**: Espera input do usuário entre etapas

### 🔑 Chaves Supabase:
- `PUBLISHABLE_KEY` (anon): ✅ Pode fazer SELECT, INSERT, UPDATE
- `SERVICE_ROLE_KEY`: ✅ Pode fazer CREATE TABLE, DROP, etc (admin)

---

## 7. organize_step5.py

### 🎯 Para que serve?
Reorganizar **TODO O PROJETO** (inclusive Lovable) em estrutura organizada.

### ✅ Quando usar?
- ⚠️ **NÃO RECOMENDADO** - Pode quebrar Lovable
- Apenas se você quiser mover Lovable para subpasta
- Melhor usar: `organize_step5_SAFE.py`

### 📊 O que faz?
```python
1. Cria backup automático
2. Cria estrutura de pastas:
   - LOVABLE_PROJECT/
   - SCRIPTS_PYTHON/
   - DATA/
   - DATABASE/
   - DOCS/
   - TOOLS/
3. Move TUDO (inclusive src/, package.json, etc)
4. Cria README.md principal
```

### 🔧 Estrutura criada:
```
Step 5/
├── LOVABLE_PROJECT/        ← src/, package.json, node_modules
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── SCRIPTS_PYTHON/         ← .py files
├── DATA/                   ← .csv files
├── DATABASE/               ← .sql files
└── DOCS/                   ← .md, .txt files
```

### ⚠️ PROBLEMA:
- **Lovable espera arquivos na raiz** (package.json, src/, etc)
- Mover para subpasta **quebra o Lovable**
- Você teria que mudar configurações do Lovable

### 🚫 Por isso criamos: `organize_step5_SAFE.py`

---

## 8. organize_step5_SAFE.py ⭐

### 🎯 Para que serve?
Reorganizar **APENAS arquivos Python/CSV/SQL**, **SEM TOCAR NO LOVABLE**.

### ✅ Quando usar?
- ✅ **RECOMENDADO** - Já foi usado com sucesso
- Para limpar a raiz do projeto
- Mantém Lovable funcionando perfeitamente

### 📊 O que faz?
```python
1. Move Python scripts → scripts/
2. Move CSV files → data/processed/
3. Move SQL files → database/
4. Move pastas de dados → data/processed/
5. MANTÉM EM ROOT:
   - src/
   - package.json
   - vite.config.ts
   - .env
   - index.html
   - node_modules/
   - etc.
```

### 🔧 Resultado:
```
Step 5/                      ← Lovable continua funcionando
├── src/                     ← FICA NA RAIZ
├── package.json             ← FICA NA RAIZ
├── vite.config.ts           ← FICA NA RAIZ
├── scripts/                 ← NOVO - scripts Python
│   ├── simple_upload.py
│   ├── upload_images.py
│   └── ...
├── data/                    ← NOVO - dados CSV
│   └── processed/
│       ├── FINAL_242_LEADS/
│       └── *.csv
└── database/                ← NOVO - SQL files
    ├── setup_supabase_tables.sql
    └── fix_rls_policy.sql
```

### ✅ Status:
- ✅ **JÁ EXECUTADO** com sucesso
- ✅ 8 arquivos Python movidos
- ✅ 7 arquivos CSV movidos
- ✅ 2 pastas de dados movidas
- ✅ 2 arquivos SQL movidos
- ✅ Lovable **não foi afetado**

### 📝 Arquivos que mantém na raiz (LOVABLE_CRITICAL):
```python
LOVABLE_CRITICAL = {
    "src", "public", "supabase", "node_modules",
    "package.json", "package-lock.json",
    "vite.config.ts", "tsconfig.json",
    "index.html", ".env", ".gitignore",
    ".git", "README.md", "bun.lockb"
}
```

### 💡 Documentação criada:
- `ORGANIZATION.md` - Registro do que foi movido
- Logs completos de tudo que aconteceu

---

## 🎯 Fluxo Recomendado (Primeira Vez)

### **1. Preparar dados**
```bash
python prepare_for_manual_upload.py
```
📤 **Output**: `SUPABASE_UPLOAD_242_LEADS.csv`

### **2. Setup do banco (Manual)**
```bash
python setup_database.py
# Seguir instruções para criar tabela no Dashboard
```
✅ **Tabela criada**: `priority_leads`

### **3. Upload de dados**
```bash
cd scripts/
python simple_upload.py
```
📊 **242 leads** no Supabase

### **4. Upload de imagens**
```bash
python upload_images.py
```
🖼️ **Imagens** linkadas às propriedades

### **5. Verificar no Lovable**
```bash
cd ..
npm install
npm run dev
```
🌐 **App rodando**: http://localhost:8080

---

## 🆘 Troubleshooting

### Problema: "Table does not exist"
**Solução**: Execute setup_database.py e crie tabela manualmente

### Problema: "Upload failing silently"
**Solução**: Use upload_with_error_handling.py para ver erros detalhados

### Problema: "Invalid data type"
**Solução**: upload_with_error_handling.py valida e limpa dados automaticamente

### Problema: "Duplicates"
**Solução**: Normal - scripts fazem skip de duplicados baseado em account_number

### Problema: "Images not showing"
**Solução**:
1. Verificar se bucket `property-images` existe
2. Verificar RLS policies (público read)
3. Verificar se upload_images.py rodou com sucesso

---

## 📊 Comparação Rápida

| Script | Velocidade | Uso | Recomendado |
|--------|-----------|-----|-------------|
| prepare_for_manual_upload.py | N/A | Prepara dados | ⭐ Sempre primeiro |
| simple_upload.py | ⚡⚡⚡ Rápido | Upload normal | ⭐ Sim |
| upload_with_error_handling.py | 🐌 Lento | Debug | Só se der erro |
| upload_images.py | ⚡⚡ Médio | Imagens | ⭐ Depois do upload |
| setup_database.py | N/A | Setup inicial | ⭐ Primeira vez |
| auto_setup_and_upload.py | ⚡⚡ Médio | Setup + Upload | Opcional |
| organize_step5.py | N/A | Reorganizar | ❌ Quebra Lovable |
| organize_step5_SAFE.py | N/A | Reorganizar | ⭐ Já foi usado |

---

## 🔗 Dependências

Todos os scripts precisam de:

```bash
pip install pandas python-dotenv supabase requests Pillow
```

Ou use:
```bash
cd scripts/
pip install -r requirements.txt
```

---

## 📁 Arquivos Relacionados

- `.env` - Credenciais do Supabase
- `setup_supabase_tables.sql` - SQL para criar tabela
- `SUPABASE_UPLOAD_242_LEADS.csv` - Dados preparados
- `FINAL_242_LEADS/` - Pasta com imagens
- `ORGANIZATION.md` - Log da reorganização

---

## ✅ Resumo Final

### Para importar dados pela primeira vez:
1. ✅ `prepare_for_manual_upload.py` - Prepara CSV
2. ✅ `setup_database.py` - Cria tabela (manual)
3. ✅ `simple_upload.py` - Faz upload
4. ✅ `upload_images.py` - Upload imagens

### Para reorganizar o projeto:
5. ✅ `organize_step5_SAFE.py` - Limpa raiz (já feito)

### Para debugging:
- ❓ `upload_with_error_handling.py` - Se algo der errado

### Não usar:
- ❌ `organize_step5.py` - Quebra Lovable
- 🤷 `auto_setup_and_upload.py` - Opcional (simple_upload é melhor)

---

**Última atualização**: 20 Dezembro 2025
**Autor**: Claude Code
**Projeto**: MyLocalInvest Orlando - Step 5

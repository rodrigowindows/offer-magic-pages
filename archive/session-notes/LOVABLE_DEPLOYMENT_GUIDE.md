# 🚀 Guia Completo: Deploy para Lovable com Supabase

## 📋 Índice
1. [Preparação do Projeto](#1-preparação-do-projeto)
2. [Configurar Git Repository](#2-configurar-git-repository)
3. [Push para GitHub](#3-push-para-github)
4. [Deploy no Lovable](#4-deploy-no-lovable)
5. [Configurar Supabase](#5-configurar-supabase)
6. [Aplicar Migrations](#6-aplicar-migrations)
7. [Configurar Variáveis de Ambiente](#7-configurar-variáveis-de-ambiente)
8. [Testar Deploy](#8-testar-deploy)

---

## 1. Preparação do Projeto

### Verificar Estrutura de Arquivos

Certifique-se que todos os arquivos estão nos lugares corretos:

```
Step 5 - Outreach & Campaigns/
├── src/
│   ├── components/
│   │   ├── CSVImporter.tsx              ✓ Criado
│   │   ├── ABTestWrapper.tsx             ✓ Criado
│   │   ├── ABTestAnalytics.tsx           ✓ Criado
│   │   ├── variants/
│   │   │   ├── UltraSimpleVariant.tsx    ✓ Criado
│   │   │   └── EmailFirstVariant.tsx     ✓ Criado
│   │   ├── SimpleLeadCapture.tsx         ✓ Criado
│   │   ├── InterestCapture.tsx           ✓ Criado
│   │   └── OfferRevealCard.tsx           ✓ Criado
│   ├── utils/
│   │   ├── csvParser.ts                  ✓ Criado
│   │   └── abTesting.ts                  ✓ Criado
│   └── pages/
│       └── ImportProperties.tsx          ✓ Já existia
├── supabase/
│   └── migrations/
│       ├── 20260101000000_create_property_leads.sql     ✓ Criado
│       ├── 20260101000001_simple_lead_flow.sql          ✓ Criado
│       ├── 20260101000002_ab_testing.sql                ✓ Criado
│       └── 20260102000000_csv_import_functions.sql      ✓ Criado
├── package.json
├── .gitignore
└── README.md
```

### Limpar Arquivos Desnecessários

Antes de fazer push, delete arquivos que não são necessários:

```bash
cd "g:/My Drive/Sell House - code/Orlando/Step 5 - Outreach & Campaigns"

# Delete arquivos de documentação locais (opcional - manter ou deletar)
# del /F CSV_IMPORT_GUIDE.md
# del /F AB_TESTING_STRATEGY.md
# del /F LOVABLE_DEPLOYMENT_GUIDE.md

# Delete arquivos temporários
del /F /S *.tmp
del /F /S .DS_Store
```

---

## 2. Configurar Git Repository

### Verificar Status do Git

```bash
cd "g:/My Drive/Sell House - code/Orlando/Step 5 - Outreach & Campaigns"
git status
```

### Adicionar Novos Arquivos

```bash
# Adicionar todos os arquivos novos
git add .

# Ou adicionar seletivamente
git add src/components/CSVImporter.tsx
git add src/components/ABTestWrapper.tsx
git add src/components/ABTestAnalytics.tsx
git add src/components/variants/
git add src/utils/csvParser.ts
git add src/utils/abTesting.ts
git add supabase/migrations/
```

### Criar Commit

```bash
git commit -m "feat: Add CSV Import system and A/B Testing infrastructure

- Add CSVImporter component with column mapping
- Add A/B Testing system with variant assignment
- Add lead capture variants (ultra-simple, email-first)
- Add database migrations for leads and A/B testing
- Add CSV parser utility
- Add dynamic column creation for imports"
```

---

## 3. Push para GitHub

### Se já tem repositório GitHub:

```bash
git push origin master
```

### Se ainda NÃO tem repositório GitHub:

#### Opção A: Via GitHub CLI (gh)

```bash
# Instalar GitHub CLI se necessário
winget install GitHub.cli

# Login
gh auth login

# Criar repo e fazer push
gh repo create orlando-real-estate --public --source=. --remote=origin --push
```

#### Opção B: Via GitHub Website

1. Ir para https://github.com/new
2. Nome do repo: `orlando-real-estate` (ou outro nome)
3. Público ou Privado
4. **NÃO** inicializar com README (você já tem)
5. Criar repositório
6. Copiar o link do repo (ex: `https://github.com/seu-usuario/orlando-real-estate.git`)
7. Executar:

```bash
git remote add origin https://github.com/seu-usuario/orlando-real-estate.git
git branch -M master
git push -u origin master
```

---

## 4. Deploy no Lovable

### Passo 1: Acessar Lovable

1. Ir para https://lovable.dev
2. Fazer login (ou criar conta)

### Passo 2: Criar Novo Projeto

1. Clicar em **"New Project"** ou **"Import from GitHub"**
2. Conectar sua conta GitHub (se ainda não conectou)
3. Selecionar o repositório `orlando-real-estate`
4. Selecionar branch `master`

### Passo 3: Configurar Build

Lovable geralmente detecta automaticamente, mas verifique:

- **Framework**: Vite + React
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Passo 4: Deploy

1. Clicar em **"Deploy"**
2. Aguardar build completar (3-5 minutos)
3. Lovable irá gerar uma URL (ex: `https://seu-projeto.lovable.app`)

---

## 5. Configurar Supabase

O Lovable **NÃO sobe o Supabase automaticamente**. Você precisa usar seu próprio Supabase.

### Opção A: Usar Supabase Existente (Recomendado)

Se você já tem um projeto Supabase local:

1. Ir para https://supabase.com/dashboard
2. Verificar seu projeto
3. Pegar as credenciais:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon key**: `eyJhbGc...`

### Opção B: Criar Novo Projeto Supabase

1. Ir para https://supabase.com/dashboard
2. Clicar em **"New Project"**
3. Escolher:
   - **Name**: Orlando Real Estate
   - **Database Password**: (gerar senha forte)
   - **Region**: East US (mais próximo de Orlando)
   - **Pricing Plan**: Free (para começar)
4. Aguardar provisioning (~2 minutos)
5. Ir em **Settings** → **API**
6. Copiar:
   - **Project URL**
   - **anon public key**

---

## 6. Aplicar Migrations

Você tem 4 migrations que precisam ser aplicadas no Supabase:

### Método 1: Via Supabase Dashboard (Mais Fácil)

1. Ir para https://supabase.com/dashboard/project/SEU-PROJECT/sql
2. Clicar em **"New Query"**
3. Copiar e colar o conteúdo de cada migration em ordem:

**Migration 1: Property Leads**
```sql
-- Copiar todo conteúdo de:
-- supabase/migrations/20260101000000_create_property_leads.sql
```

4. Clicar **"Run"**
5. Repetir para as outras 3 migrations:
   - `20260101000001_simple_lead_flow.sql`
   - `20260101000002_ab_testing.sql`
   - `20260102000000_csv_import_functions.sql`

### Método 2: Via Supabase CLI

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao seu projeto
supabase link --project-ref SEU-PROJECT-REF

# Aplicar migrations
supabase db push
```

**Project Ref**: Encontrar em Settings → General → Reference ID

### Verificar se Migrations Foram Aplicadas

No Supabase Dashboard:

1. Ir em **Table Editor**
2. Verificar se existem as tabelas:
   - ✅ `properties`
   - ✅ `property_leads`
   - ✅ `ab_test_events`

3. Ir em **Database** → **Functions**
4. Verificar se existem:
   - ✅ `add_column_if_not_exists`
   - ✅ `column_exists`
   - ✅ `get_table_columns`

---

## 7. Configurar Variáveis de Ambiente

### No Lovable Dashboard

1. Ir em **Settings** → **Environment Variables**
2. Adicionar:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

3. Clicar em **"Save"**
4. **Redeploy** o projeto para aplicar as variáveis

### Verificar no Código

Seu código já está configurado corretamente:

```typescript
// src/integrations/supabase/client.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

---

## 8. Testar Deploy

### 1. Acessar URL do Lovable

```
https://seu-projeto.lovable.app
```

### 2. Testar Funcionalidades

**Autenticação:**
1. Ir para `/auth`
2. Fazer login/cadastro
3. Verificar se conecta com Supabase

**CSV Importer:**
1. Ir para `/admin/import`
2. Fazer upload do `sample-import.csv`
3. Mapear colunas
4. Importar
5. Verificar se dados aparecem no Supabase

**A/B Testing:**
1. Ir para propriedade (criar uma se necessário)
2. Verificar se ABTestWrapper está funcionando
3. Abrir Console do navegador
4. Verificar eventos sendo salvos

**Analytics:**
1. Ir para página de analytics
2. Verificar se carrega dados do Supabase

### 3. Verificar Erros

Abrir **DevTools Console** (F12):
- ❌ Se ver erros de conexão Supabase → Verificar env vars
- ❌ Se ver erros 404 → Verificar rotas
- ❌ Se ver erros SQL → Verificar migrations

---

## 9. Troubleshooting

### Erro: "Failed to fetch" ou "Network Error"

**Causa**: Env vars não configuradas ou incorretas

**Solução**:
1. Verificar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
2. Redeploy após adicionar env vars

### Erro: "relation does not exist"

**Causa**: Migrations não foram aplicadas

**Solução**:
1. Ir no Supabase Dashboard → SQL Editor
2. Executar migrations manualmente
3. Verificar em Table Editor se tabelas foram criadas

### Erro: "permission denied"

**Causa**: RLS (Row Level Security) está ativo mas sem policies

**Solução**:
1. Ir no Supabase → Authentication → Policies
2. Para cada tabela, criar policy:
```sql
-- Policy para properties
CREATE POLICY "Enable read for all users"
ON properties FOR SELECT
TO authenticated
USING (true);

-- Policy para insert
CREATE POLICY "Enable insert for authenticated users"
ON properties FOR INSERT
TO authenticated
WITH CHECK (true);
```

### Erro: "Invalid JWT" ou "expired"

**Causa**: Token de autenticação inválido

**Solução**:
1. Fazer logout
2. Limpar localStorage
3. Fazer login novamente

### Build falhou no Lovable

**Causa**: Dependências faltando ou código com erros

**Solução**:
1. Verificar logs do build no Lovable
2. Testar build localmente:
```bash
npm run build
```
3. Corrigir erros
4. Fazer commit e push
5. Lovable irá redeploy automaticamente

---

## 10. Workflow de Desenvolvimento

### Desenvolvimento Local → Lovable

```bash
# 1. Fazer mudanças localmente
# Editar arquivos...

# 2. Testar localmente
npm run dev

# 3. Build local para verificar
npm run build

# 4. Commit
git add .
git commit -m "feat: Add new feature"

# 5. Push para GitHub
git push origin master

# 6. Lovable detecta push e redeploy automaticamente
```

### Continuous Deployment

Lovable tem **continuous deployment** ativo por padrão:
- ✅ Push no GitHub → Auto-deploy no Lovable
- ✅ Sem necessidade de ação manual
- ✅ Recebe notificação quando deploy completa

---

## 11. Checklist Final

Antes de considerar deploy completo:

### Git & GitHub
- [ ] Repositório criado no GitHub
- [ ] Código commitado
- [ ] Push feito com sucesso
- [ ] README atualizado

### Lovable
- [ ] Projeto criado no Lovable
- [ ] Conectado ao GitHub repo
- [ ] Build completou com sucesso
- [ ] URL gerada e acessível

### Supabase
- [ ] Projeto Supabase criado/configurado
- [ ] 4 migrations aplicadas
- [ ] Tabelas criadas (properties, property_leads, ab_test_events)
- [ ] Funções criadas (add_column_if_not_exists, etc)
- [ ] RLS policies configuradas (se necessário)

### Environment Variables
- [ ] VITE_SUPABASE_URL configurada
- [ ] VITE_SUPABASE_ANON_KEY configurada
- [ ] Redeploy feito após adicionar env vars

### Testes
- [ ] Autenticação funciona
- [ ] CSV Import funciona
- [ ] A/B Testing funciona
- [ ] Analytics carrega
- [ ] Sem erros no console

---

## 12. URLs Úteis

### Seu Projeto
- **GitHub Repo**: `https://github.com/SEU-USER/orlando-real-estate`
- **Lovable App**: `https://seu-projeto.lovable.app`
- **Supabase Dashboard**: `https://supabase.com/dashboard/project/SEU-PROJECT`

### Documentação
- **Lovable Docs**: https://docs.lovable.dev
- **Supabase Docs**: https://supabase.com/docs
- **Vite Docs**: https://vitejs.dev

---

## 13. Próximos Passos

Após deploy bem-sucedido:

1. **Configurar Domínio Customizado** (opcional)
   - Lovable suporta domínios customizados
   - Ex: `orlando-properties.com`

2. **Configurar Analytics**
   - Google Analytics
   - Posthog
   - Etc.

3. **Configurar Email** (para lead notifications)
   - SendGrid
   - Resend
   - Supabase Edge Functions

4. **Monitoramento**
   - Sentry para error tracking
   - Supabase logs para database monitoring

---

## 🎉 Pronto!

Seu projeto está agora no ar com:
- ✅ CSV Import system funcionando
- ✅ A/B Testing infrastructure
- ✅ Supabase database
- ✅ Continuous deployment via Lovable

**Qualquer dúvida, consulte a documentação do Lovable ou Supabase!** 🚀

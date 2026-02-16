# Guia Consolidado de Deploy

## Objetivo
Este projeto esta configurado para deploy automatico de migrations e Edge Functions do Supabase via GitHub Actions.

## Pipeline automatico (GitHub Actions)
Workflow: `.github/workflows/deploy-supabase-functions.yml`

### Gatilhos
- Push em `main` ou `develop` quando houver mudancas em:
  - `supabase/config.toml`
  - `supabase/migrations/**`
  - `supabase/functions/**`
  - `.github/workflows/deploy-supabase-functions.yml`
- Execucao manual por `workflow_dispatch`

### O que o pipeline faz
1. Valida os secrets obrigatorios
2. Resolve o `project_ref` (secret ou `supabase/config.toml`)
3. Executa `supabase link`
4. Executa `supabase db push --include-all`
5. Faz deploy de todas as funcoes em `supabase/functions` (exceto `_shared`)

### Secrets obrigatorios
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`

### Secret opcional
- `SUPABASE_PROJECT_REF`
  - Se nao existir, o workflow usa `project_id` de `supabase/config.toml`

## Integracao com Lovable
- Neste repositorio, a automacao de banco e Edge Functions fica no GitHub Actions.
- Nao existe acesso direto ao pipeline interno do Lovable por codigo deste repo.
- Se a publicacao do Lovable gerar push/sync para `main` ou `develop`, o workflow acima roda automaticamente.

## Deploy local (fallback)
Scripts disponiveis:
- Bash: `scripts/deploy-supabase.sh`
- PowerShell: `scripts/deploy-supabase.ps1`

### Apenas Edge Functions
```bash
bash scripts/deploy-supabase.sh --project-ref SEU_PROJECT_REF
```

```powershell
.\scripts\deploy-supabase.ps1 -ProjectRef SEU_PROJECT_REF
```

### Migrations + Edge Functions
```bash
SUPABASE_DB_PASSWORD='SUA_SENHA_DB' bash scripts/deploy-supabase.sh --project-ref SEU_PROJECT_REF --with-migrations
```

```powershell
.\scripts\deploy-supabase.ps1 -ProjectRef SEU_PROJECT_REF -DbPassword SUA_SENHA_DB -WithMigrations
```

## Checklist rapido
- [ ] Secrets do GitHub configurados
- [ ] Migrations versionadas em `supabase/migrations`
- [ ] Edge Functions com `index.ts` ou `index.js`
- [ ] Workflow executado sem erro em Actions
- [ ] Logs no Supabase sem erro critico

## Troubleshooting
- Erro de token: valide `SUPABASE_ACCESS_TOKEN` no GitHub Secrets
- Erro de senha DB: valide `SUPABASE_DB_PASSWORD`
- Erro de project ref: defina `SUPABASE_PROJECT_REF` ou `project_id` em `supabase/config.toml`
- Funcao nao deployada: confirme pasta em `supabase/functions/<nome>/index.ts`

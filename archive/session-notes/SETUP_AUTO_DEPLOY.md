# 🚀 Configuração de Deploy Automático - Supabase Edge Functions

## ✅ O que foi criado

Arquivo: `.github/workflows/deploy-supabase-functions.yml`

Este workflow do GitHub Actions faz deploy automático das Edge Functions sempre que houver push na pasta `supabase/functions/`.

## 🔐 Configuração Necessária

### 1. Obter Supabase Access Token

**Opção A - Via Dashboard** (requer login):
1. Acesse: https://supabase.com/dashboard/account/tokens
2. Clique em "Generate New Token"
3. Nome: `GitHub Actions Deploy`
4. Copie o token (começa com `sbp_...`)

**Opção B - Via CLI** (se já tiver configurado):
```bash
supabase login
# Depois de fazer login, o token fica em ~/.supabase/access-token
```

### 2. Adicionar Secret no GitHub

1. Acesse o repositório no GitHub
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Preencha:
   - **Name**: `SUPABASE_ACCESS_TOKEN`
   - **Secret**: cole o token `sbp_...` obtido acima
5. Clique em **Add secret**

### 3. Testar Deploy Automático

Depois de configurar o secret:

```bash
# Faça qualquer alteração em supabase/functions/
echo "# Test deploy" >> supabase/functions/retell-webhook-handler/README.md

# Commit e push
git add .
git commit -m "test: Trigger automatic Edge Function deploy"
git push

# Acompanhe o deploy em:
# https://github.com/SEU-USUARIO/SEU-REPO/actions
```

## 🔍 Como Funciona

1. **Trigger**: Push na branch `main` que afeta arquivos em `supabase/functions/`
2. **Setup**: Instala Supabase CLI no runner do GitHub
3. **Deploy**: Executa `supabase functions deploy` usando o access token
4. **Result**: Edge Function atualizada automaticamente

## ⚡ Alternativa: Deploy Manual Rápido

Se não quiser configurar GitHub Actions agora, você pode fazer deploy manual:

### Via Dashboard (mais fácil):
1. Acesse: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/functions/retell-webhook-handler
2. Clique em "Edit"
3. Cole o conteúdo de `supabase/functions/retell-webhook-handler/index.ts`
4. Clique "Deploy"

### Via CLI Local (se tiver access token):
```bash
# Salve o token em variável de ambiente
$env:SUPABASE_ACCESS_TOKEN = "sbp_seu_token_aqui"

# Faça deploy
npx supabase functions deploy retell-webhook-handler --project-ref atwdkhlyrffbaugkaker
```

## 📊 Verificar Deploy

Depois do deploy (automático ou manual), teste:

```powershell
cd "g:\My Drive\Sell House - code\Orlando\Step 5 - Outreach & Campaigns"
.\test-webhook.ps1
```

**Resultado esperado:**
```
[TESTE 1] +14079283433 (deve encontrar)
  ✓ OK: Encontrado - 144 WASHINGTON AVE EATONVILLE

[TESTE 2] +12405814595 (nao deve encontrar)
  ✓ OK: Nao encontrou (correto)
```

## 🆘 Troubleshooting

### Erro: "Invalid access token"
- Verifique se o token começa com `sbp_`
- Gere um novo token no dashboard
- Certifique-se de que o token foi adicionado como secret no GitHub

### Erro: "Project not found"
- Confirme que o `project_id` está correto: `atwdkhlyrffbaugkaker`
- Verifique se você tem permissão no projeto

### Deploy não dispara
- Verifique se o secret `SUPABASE_ACCESS_TOKEN` está configurado
- Confirme que alterou arquivos dentro de `supabase/functions/`
- Veja os logs em: Actions → Deploy Supabase Edge Functions

## 📚 Links Úteis

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

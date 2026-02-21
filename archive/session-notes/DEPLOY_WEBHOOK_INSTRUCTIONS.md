# 🚀 INSTRUÇÕES PARA DEPLOY DO WEBHOOK

## Contexto
O webhook `retell-webhook-handler` foi atualizado localmente mas precisa de deploy manual no Supabase.

## 📋 Passos para Deploy

### Opção 1: Via Dashboard Supabase (RECOMENDADO)

1. **Acesse o dashboard**:
   - URL: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/functions/retell-webhook-handler

2. **Faça login** com credenciais de admin

3. **Edite a função**:
   - Clique em "Edit Function" ou "Deploy"
   - Copie TODO o conteúdo do arquivo local:
     ```
     g:\My Drive\Sell House - code\Orlando\Step 5 - Outreach & Campaigns\supabase\functions\retell-webhook-handler\index.ts
     ```
   - Cole no editor do Supabase
   - Clique em "Deploy" ou "Save & Deploy"

4. **Aguarde deploy** (1-2 minutos)

5. **Teste** executando:
   ```powershell
   cd "g:\My Drive\Sell House - code\Orlando\Step 5 - Outreach & Campaigns"
   .\test-webhook.ps1
   ```

### Opção 2: Via Supabase CLI

Se tiver o CLI configurado com access token:

```bash
npx supabase login
npx supabase functions deploy retell-webhook-handler --project-ref atwdkhlyrffbaugkaker
```

## ✅ Como Verificar se Funcionou

Execute o teste:
```powershell
.\test-webhook.ps1
```

**Resultado esperado:**
```
[TESTE 1] +14079283433 (deve encontrar)
  ✓ OK: Encontrado - 144 WASHINGTON AVE EATONVILLE

[TESTE 2] +12405814595 (nao deve encontrar)  
  ✓ OK: Nao encontrou (correto)
```

## 🔧 O Que Foi Mudado

**Problema**: Webhook não encontrava telefones porque:
- Retell envia `+14079283433` (formato E.164 com +1)
- Banco armazena `4079283433` (sem +1)
- Código antigo só buscava formato exato

**Solução**: Nova query busca AMBOS os formatos:
```typescript
.or(`phone1.eq.${fromNumber},phone1.eq.${cleanPhone}`)
// Busca: phone1=+14079283433 OU phone1=4079283433
```

## 📞 Contato

Qualquer problema, me avise no GitHub ou Lovable!

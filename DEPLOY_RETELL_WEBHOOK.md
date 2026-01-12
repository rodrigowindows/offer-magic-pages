# 🚀 Deploy da Função Retell Webhook

## ⚠️ Status Atual

A função `retell-webhook-handler` existe localmente mas **NÃO está deployada** no Supabase.

**Erro atual:**
```
{"code":"NOT_FOUND","message":"Requested function was not found"}
```

---

## 📋 Pré-requisitos

1. **Supabase CLI instalado:**
   ```bash
   npm install -g supabase
   ```

2. **Login no Supabase:**
   ```bash
   supabase login
   ```

3. **Link ao projeto:**
   ```bash
   cd "Step 5 - Outreach & Campaigns"
   supabase link --project-ref atwdkhlyrffbaugkaker
   ```

---

## 🚀 Deploy da Função

### Opção 1: Deploy via CLI (Recomendado)

```bash
cd "Step 5 - Outreach & Campaigns"

# Deploy apenas a função retell-webhook-handler
supabase functions deploy retell-webhook-handler --project-ref atwdkhlyrffbaugkaker

# Ou deploy de todas as funções
supabase functions deploy --project-ref atwdkhlyrffbaugkaker
```

### Opção 2: Deploy via Dashboard (Manual)

1. **Acesse:** https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/functions

2. **Click:** "Create a new function"

3. **Nome:** `retell-webhook-handler`

4. **Cole o código** de `supabase/functions/retell-webhook-handler/index.ts`

5. **Click:** "Deploy function"

---

## ✅ Verificar Deploy

Após o deploy, teste:

```bash
curl https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler \
  -H "Content-Type: application/json" \
  -d '{"event":"call_ended","call":{"call_id":"test-123","from_number":"+14075551234"}}'
```

**Resposta esperada:**
```json
{
  "success": true,
  "result": {
    "event": "call_ended",
    "property_found": false,
    ...
  }
}
```

---

## 🧪 Teste Rápido Após Deploy

### PowerShell (Windows):

```powershell
$body = '{"event":"call_ended","call":{"call_id":"test-ps","from_number":"+14075551234","to_number":"+14075559999","direction":"inbound","call_status":"ended"}}'

Invoke-RestMethod -Uri "https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler" -Method POST -ContentType "application/json" -Body $body | ConvertTo-Json -Depth 10
```

### Bash/Git Bash:

```bash
curl -X POST https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler \
  -H "Content-Type: application/json" \
  -d '{
    "event": "call_ended",
    "call": {
      "call_id": "test-bash-123",
      "from_number": "+14075551234",
      "to_number": "+14075559999",
      "direction": "inbound",
      "call_status": "ended"
    }
  }'
```

---

## 📝 Exemplo Completo de Teste

```bash
curl -X POST https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler \
  -H "Content-Type: application/json" \
  -d '{
    "event": "call_ended",
    "call": {
      "call_id": "complete-test-789",
      "call_type": "phone_call",
      "from_number": "+14075551234",
      "to_number": "+14075559999",
      "direction": "inbound",
      "call_status": "ended",
      "start_timestamp": 1714608475945,
      "end_timestamp": 1714608491736,
      "disconnection_reason": "user_hangup",
      "transcript": "Hello, I want to sell my house at 123 Main Street",
      "metadata": {
        "test": true,
        "source": "manual_test"
      }
    }
  }'
```

---

## 🔐 Configurar Variáveis de Ambiente (Se Necessário)

Se a função precisar de secrets:

```bash
supabase secrets set RETELL_API_KEY=your_retell_api_key --project-ref atwdkhlyrffbaugkaker
```

---

## 📊 Ver Logs da Função

### Via Dashboard:
1. https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/functions
2. Click em `retell-webhook-handler`
3. Tab "Logs"

### Via CLI:
```bash
supabase functions logs retell-webhook-handler --project-ref atwdkhlyrffbaugkaker
```

---

## 🎯 Próximos Passos Após Deploy

1. ✅ **Deploy da função**
2. ✅ **Testar com curl/Postman**
3. ✅ **Configurar no Retell AI:**
   - Settings → Webhooks
   - URL: `https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler`
   - Events: call_started, call_ended, call_analyzed
4. ✅ **Testar com chamada real no Retell AI**
5. ✅ **Monitorar logs no dashboard**

---

## ❓ Troubleshooting

### Erro: "NOT_FOUND"
**Causa:** Função não deployada ou nome incorreto
**Solução:** Deploy via `supabase functions deploy`

### Erro: "UNAUTHORIZED"
**Causa:** Projeto não linkado
**Solução:** `supabase link --project-ref atwdkhlyrffbaugkaker`

### Erro: "Internal Server Error"
**Causa:** Erro no código da função
**Solução:** Verifique os logs: `supabase functions logs retell-webhook-handler`

### Timeout
**Causa:** Função levou mais de 10 segundos
**Solução:** Otimize queries ou aumente timeout no Retell AI

---

## 📖 Documentação Útil

- **Supabase Functions:** https://supabase.com/docs/guides/functions
- **Retell AI Webhooks:** https://docs.retellai.com/api-references/webhook
- **Supabase CLI:** https://supabase.com/docs/reference/cli

---

## 🎉 Pronto!

Após fazer o deploy, a função estará disponível em:
```
https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler
```

E você poderá:
- ✅ Testar via Postman/curl
- ✅ Testar via componente no dashboard
- ✅ Receber webhooks reais do Retell AI
- ✅ Ver dados de propriedades automaticamente

# 🚨 DEPLOY EMERGENCIAL - Webhook não está atualizando

## PROBLEMA IDENTIFICADO

O código v2.0 NÃO está deployado no Supabase, mesmo depois de múltiplos deploys via Dashboard.

**Prova:**
- ❌ Resposta NÃO tem campo `version: "v2.0-debug-deployed"`
- ❌ Resposta NÃO tem campo `debug: {...}`
- ❌ Resposta NÃO tem campo `timestamp`

**Código local vs Deployed:**

Local (correto):
```typescript
return new Response(JSON.stringify({
  success: true,
  result,
  version: "v2.0-debug-deployed",  // ← ESTE CAMPO
  timestamp: new Date().toISOString()  // ← ESTE CAMPO
}), {
```

Deployed (errado):
```json
{
  "success": true,
  "result": {
    "property_found": false,
    "processed_at": "2026-01-12T03:09:22.004Z"
  }
  // ← SEM "version"
  // ← SEM "timestamp"
  // ← SEM "debug"
}
```

---

## ✅ SOLUÇÃO: Deploy Manual via Dashboard

### PASSO 1: Deletar a função antiga

1. Vá em: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/functions
2. Encontre **retell-webhook-handler**
3. Clique nos **3 pontinhos (...)** → **Delete**
4. Confirme a exclusão

### PASSO 2: Criar nova função

1. Clique em **+ New Edge Function**
2. Nome: `retell-webhook-handler`
3. Clique em **Create function**

### PASSO 3: Copiar o código COMPLETO

1. Abra o arquivo:
   ```
   Step 5 - Outreach & Campaigns/COPY_PASTE_TO_SUPABASE.ts
   ```

2. Copie **TODO O CONTEÚDO** (244 linhas)

3. Cole no editor do Dashboard (substitua tudo)

4. Clique em **Deploy**

### PASSO 4: Aguarde o deploy

- Aguarde mensagem de sucesso ✅
- Deve levar ~30-60 segundos

### PASSO 5: Teste IMEDIATAMENTE

Execute este comando:

```bash
curl --location 'https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WjzxLQKNl-R0QGy68F6wgtXs' \
--data '{
  "event": "call_started",
  "call": {
    "call_id": "TEST-AFTER-DELETE",
    "from_number": "+12405814595",
    "to_number": "+14075551234",
    "direction": "inbound",
    "call_status": "in-progress",
    "start_timestamp": 1736647200000
  }
}'
```

### ✅ RESULTADO ESPERADO:

```json
{
  "success": true,
  "result": {
    "event": "call_started",
    "property_found": true,
    "matched_by": "tag_phone",
    "debug": {
      "original": "+12405814595",
      "clean": "12405814595",
      "without1": "2405814595",
      "formatted": "(240) 581-4595"
    },
    "property_info": {
      "address": "1025 S WASHINGTON AVE",
      "owner_name": "IVERSON DELLA M"
    }
  },
  "version": "v2.0-debug-deployed",
  "timestamp": "2026-01-12T..."
}
```

Se você NÃO ver **"version": "v2.0-debug-deployed"**, então:
- O cache ainda não atualizou (aguarde 1-2 minutos)
- OU você está editando a função errada no Dashboard

---

## 📋 Checklist

- [ ] Deletei a função antiga `retell-webhook-handler`
- [ ] Criei nova função com o mesmo nome
- [ ] Copiei TODO o código de `COPY_PASTE_TO_SUPABASE.ts`
- [ ] Fiz deploy
- [ ] Aguardei sucesso
- [ ] Testei com curl
- [ ] Vi `"version": "v2.0-debug-deployed"` na resposta ✅
- [ ] Vi `"debug": {...}` na resposta ✅
- [ ] Vi `"property_found": true` na resposta ✅

---

**Me avise quando terminar cada passo!**

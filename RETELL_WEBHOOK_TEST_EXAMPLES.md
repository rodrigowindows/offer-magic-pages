# 🧪 Retell Webhook - Exemplos de Teste

## 📍 Informações Básicas

**Webhook URL:**
```
https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler
```

**Seu Site Público:**
```
https://offer.mylocalinvest.com
```

---

## 🔧 Método 1: Testar via CURL (Terminal/CMD)

### Exemplo 1: Chamada com número conhecido

Abra o terminal e rode:

```bash
curl -X POST https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler \
  -H "Content-Type: application/json" \
  -d "{
    \"event\": \"call_ended\",
    \"call\": {
      \"call_id\": \"test-123\",
      \"from_number\": \"+14075551234\",
      \"to_number\": \"+14075559999\",
      \"direction\": \"inbound\",
      \"call_status\": \"ended\",
      \"start_timestamp\": 1714608475945,
      \"end_timestamp\": 1714608491736,
      \"disconnection_reason\": \"user_hangup\"
    }
  }"
```

### Exemplo 2: Chamada com número desconhecido

```bash
curl -X POST https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler \
  -H "Content-Type: application/json" \
  -d "{
    \"event\": \"call_ended\",
    \"call\": {
      \"call_id\": \"test-456\",
      \"from_number\": \"+19999999999\",
      \"to_number\": \"+14075559999\",
      \"direction\": \"inbound\",
      \"call_status\": \"ended\"
    }
  }"
```

---

## 🌐 Método 2: Testar via PowerShell (Windows)

```powershell
$body = @{
    event = "call_ended"
    call = @{
        call_id = "test-ps-123"
        from_number = "+14075551234"
        to_number = "+14075559999"
        direction = "inbound"
        call_status = "ended"
        start_timestamp = 1714608475945
        end_timestamp = 1714608491736
        disconnection_reason = "user_hangup"
        transcript = "Hello, I want to sell my property"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

---

## 📮 Método 3: Testar via Postman

### Configuração:

1. **Method:** POST
2. **URL:**
   ```
   https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler
   ```

3. **Headers:**
   ```
   Content-Type: application/json
   ```

4. **Body (raw JSON):**
   ```json
   {
     "event": "call_ended",
     "call": {
       "call_id": "postman-test-123",
       "call_type": "phone_call",
       "from_number": "+14075551234",
       "to_number": "+14075559999",
       "direction": "inbound",
       "call_status": "ended",
       "start_timestamp": 1714608475945,
       "end_timestamp": 1714608491736,
       "disconnection_reason": "user_hangup",
       "transcript": "Hi, I'm calling about 123 Main Street",
       "metadata": {
         "test_mode": true,
         "campaign": "Orlando Real Estate"
       }
     }
   }
   ```

5. **Click:** Send

### Resposta Esperada (Sucesso):

```json
{
  "success": true,
  "result": {
    "event": "call_ended",
    "call": {
      "call_id": "postman-test-123",
      "from_number": "+14075551234",
      "to_number": "+14075559999",
      "direction": "inbound",
      "call_status": "ended"
    },
    "property_found": true,
    "matched_by": "exact_phone",
    "property_info": {
      "id": "abc-123-def",
      "address": "123 Main Street",
      "city": "Orlando",
      "state": "FL",
      "zip_code": "32801",
      "owner_name": "John Smith",
      "estimated_value": 250000,
      "cash_offer_amount": 180000
    },
    "skip_trace_data": {
      "total_phones": 3,
      "total_emails": 2,
      "has_owner_info": true,
      "phones": ["+14075551234", "+14075555678"],
      "emails": ["john@example.com", "jsmith@gmail.com"],
      "preferred_phones": ["+14075551234"],
      "preferred_emails": ["john@example.com"],
      "dnc_status": "Clear",
      "deceased_status": "Alive"
    },
    "processed_at": "2026-01-11T23:00:00.000Z"
  }
}
```

### Resposta (Número Não Encontrado):

```json
{
  "success": true,
  "result": {
    "event": "call_ended",
    "call": {
      "call_id": "postman-test-123",
      "from_number": "+19999999999",
      "call_status": "ended"
    },
    "property_found": false,
    "matched_by": null,
    "property_info": null,
    "skip_trace_data": null,
    "processed_at": "2026-01-11T23:00:00.000Z"
  }
}
```

---

## 💻 Método 4: Testar via JavaScript (Browser Console)

Abra o console do navegador (F12) em `https://offer.mylocalinvest.com` e cole:

```javascript
// Teste 1: Número conhecido
fetch('https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event: 'call_ended',
    call: {
      call_id: 'browser-test-' + Date.now(),
      from_number: '+14075551234',
      to_number: '+14075559999',
      direction: 'inbound',
      call_status: 'ended',
      start_timestamp: Date.now() - 120000,
      end_timestamp: Date.now(),
      disconnection_reason: 'user_hangup',
      transcript: 'Browser console test call'
    }
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Webhook Response:', data);

  if (data.result?.property_found) {
    console.log('🏠 Property:', data.result.property_info.address);
    console.log('👤 Owner:', data.result.property_info.owner_name);
    console.log('📞 Skip Trace Phones:', data.result.skip_trace_data.total_phones);
  } else {
    console.log('❌ Property not found');
  }
})
.catch(err => console.error('❌ Error:', err));
```

---

## 🎯 Método 5: Usar o Componente no Dashboard

**A forma mais fácil!**

1. Acesse: `https://offer.mylocalinvest.com/marketing`
2. Role até **"Retell AI Webhook Tester"**
3. Digite um número: `+14075551234` ou `4075551234`
4. Clique **"Test Webhook"**
5. Veja os resultados na tela! 🎉

---

## 📋 Eventos Suportados

O webhook suporta 3 tipos de eventos do Retell AI:

### 1. call_started
Disparado quando uma chamada começa:
```json
{
  "event": "call_started",
  "call": {
    "call_id": "abc123",
    "from_number": "+14075551234",
    "call_status": "in_progress"
  }
}
```

### 2. call_ended
Disparado quando uma chamada termina:
```json
{
  "event": "call_ended",
  "call": {
    "call_id": "abc123",
    "from_number": "+14075551234",
    "call_status": "ended",
    "disconnection_reason": "user_hangup"
  }
}
```

### 3. call_analyzed
Disparado quando a análise da chamada está completa:
```json
{
  "event": "call_analyzed",
  "call": {
    "call_id": "abc123",
    "from_number": "+14075551234",
    "transcript": "Full call transcript...",
    "call_analysis": {
      "sentiment": "positive",
      "intent": "selling_property"
    }
  }
}
```

---

## 🔍 Como Buscar Números de Telefone no Banco

O webhook busca propriedades em múltiplos campos:

1. **Match Exato:**
   - `owner_phone`
   - `phone1`, `phone2`, `phone3`, `phone4`, `phone5`

2. **Match Limpo (sem formatação):**
   - `owner_phone_clean`
   - `phone1_clean`, `phone2_clean`, etc.

3. **Retorna:**
   - Primeira propriedade encontrada
   - Dados de skip trace via função `get-skip-trace-data`

---

## 🚀 Configurar no Retell AI (Produção)

1. **Login:** https://app.retellai.com
2. **Settings** → **Webhooks**
3. **Add Webhook URL:**
   ```
   https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler
   ```
4. **Selecione eventos:**
   - ☑️ call_started
   - ☑️ call_ended
   - ☑️ call_analyzed
5. **Save**

Agora toda chamada do Retell AI vai automaticamente buscar a propriedade e retornar os dados!

---

## 📊 Logs e Monitoramento

Para ver os logs da função:

1. **Supabase Dashboard:** https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker
2. **Edge Functions** → **retell-webhook-handler**
3. **Logs tab**

Você verá:
```
Received Retell webhook: call_ended { call_id: 'abc123' }
Webhook processed: { event: 'call_ended', property_found: true, matched_by: 'exact_phone' }
```

---

## ❓ Troubleshooting

### Erro: "Property not found"
- Verifique se o número existe no banco de dados
- Tente diferentes formatos: `+14075551234`, `14075551234`, `4075551234`
- Verifique campos: `phone1`, `phone2`, `owner_phone`, etc.

### Erro: "Failed to fetch skip trace data"
- A função `get-skip-trace-data` pode não estar disponível
- Verifique se a propriedade tem dados de skip trace

### Erro 500: Internal Server Error
- Verifique os logs no Supabase Dashboard
- Veja se as variáveis de ambiente estão configuradas

---

## 🎉 Pronto para Testar!

Escolha seu método favorito e teste agora! 🚀

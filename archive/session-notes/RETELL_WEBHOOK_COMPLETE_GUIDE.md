# 📞 Retell AI Webhook - Guia Completo de Implementação

## 🎯 Visão Geral

Sistema completo de integração entre Retell AI e Supabase que:
- Recebe webhooks de chamadas do Retell AI
- Busca automaticamente informações da propriedade pelo telefone
- Retorna dados de skip trace em tempo real
- Envia JSON formatado de volta para o Retell AI usar na conversa

---

## 🔧 Configuração no Retell AI Dashboard

### 1. Acesse o Retell AI Dashboard
URL: https://app.retellai.com/dashboard

### 2. Navegue para Webhooks Settings
- Clique em **Settings** → **Webhooks**

### 3. Configure o Webhook URL

**Webhook URL:**
```
https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler
```

### 4. Ative os Eventos

Marque todos os eventos:
- ✅ **call_started** - Quando a chamada inicia
- ✅ **call_ended** - Quando a chamada termina
- ✅ **call_analyzed** - Quando a análise da chamada está completa

### 5. Headers (Opcional)

Se necessário autenticação extra:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WjzxLQKNl-R0QGy68F6wgtXs
```

---

## 📡 Exemplo de Request Completo

### Request do Retell AI para o Webhook

```bash
curl --location 'https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WjzxLQKNl-R0QGy68F6wgtXs' \
--data '{
  "event": "call_started",
  "call": {
    "call_id": "abc123xyz",
    "call_type": "phone_call",
    "from_number": "+13053039511",
    "to_number": "+14075551234",
    "direction": "inbound",
    "agent_id": "agent_001",
    "call_status": "in-progress",
    "metadata": {
      "campaign_id": "summer-2026",
      "source": "facebook-ads"
    },
    "retell_llm_dynamic_variables": {
      "customer_name": "Unknown"
    },
    "start_timestamp": 1736647200000
  }
}'
```

### Payload JSON Enviado pelo Retell AI

```json
{
  "event": "call_started",
  "call": {
    "call_id": "abc123xyz",
    "call_type": "phone_call",
    "from_number": "+13053039511",
    "to_number": "+14075551234",
    "direction": "inbound",
    "agent_id": "agent_001",
    "call_status": "in-progress",
    "metadata": {
      "campaign_id": "summer-2026",
      "source": "facebook-ads"
    },
    "retell_llm_dynamic_variables": {
      "customer_name": "Unknown"
    },
    "start_timestamp": 1736647200000
  }
}
```

---

## 📤 Response do Webhook

### Response Completo (Success)

```json
{
  "success": true,
  "result": {
    "event": "call_started",
    "call": {
      "call_id": "abc123xyz",
      "from_number": "+13053039511",
      "to_number": "+14075551234",
      "direction": "inbound",
      "call_status": "in-progress",
      "start_timestamp": 1736647200000,
      "end_timestamp": null,
      "disconnection_reason": null
    },
    "property_found": true,
    "matched_by": "exact_phone",
    "property_info": {
      "id": "413afe7e-440a-4f26-8ca3-b75ce10ff800",
      "address": "11250 NE 3rd Avenue",
      "city": "Miami",
      "state": "FL",
      "zip_code": "33161",
      "owner_name": "JOANE",
      "estimated_value": 350000,
      "cash_offer_amount": 280000
    },
    "skip_trace_data": {
      "total_phones": 3,
      "total_emails": 2,
      "has_owner_info": true,
      "phones": [
        {
          "number": "3053039511",
          "type": "Mobile",
          "is_preferred": true
        },
        {
          "number": "3055551234",
          "type": "Landline",
          "is_preferred": false
        }
      ],
      "emails": [
        "joane@example.com",
        "joane.smith@gmail.com"
      ],
      "preferred_phones": ["3053039511"],
      "preferred_emails": ["joane@example.com"],
      "dnc_status": "Clear",
      "deceased_status": "Active"
    },
    "processed_at": "2026-01-12T02:30:00.000Z"
  }
}
```

### Response quando Propriedade NÃO Encontrada

```json
{
  "success": true,
  "result": {
    "event": "call_started",
    "call": {
      "call_id": "xyz789",
      "from_number": "+15551234567",
      "to_number": "+14075551234",
      "direction": "inbound",
      "call_status": "in-progress",
      "start_timestamp": 1736647200000,
      "end_timestamp": null,
      "disconnection_reason": null
    },
    "property_found": false,
    "matched_by": null,
    "property_info": null,
    "skip_trace_data": null,
    "processed_at": "2026-01-12T02:30:00.000Z"
  }
}
```

### Response em Caso de Erro

```json
{
  "error": "Failed to process webhook",
  "received_at": "2026-01-12T02:30:00.000Z"
}
```

HTTP Status: 500

---

## 🧪 Testes Completos

### Teste 1: Chamada com Propriedade Existente

**Request:**
```bash
curl -X POST 'https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WjzxLQKNl-R0QGy68F6wgtXs' \
-d '{
  "event": "call_ended",
  "call": {
    "call_id": "test-001",
    "from_number": "3053039511",
    "to_number": "+14075551234",
    "direction": "inbound",
    "call_status": "completed",
    "disconnection_reason": "user_hangup",
    "start_timestamp": 1714608475945,
    "end_timestamp": 1714608491736
  }
}'
```

**Resultado Esperado:**
- ✅ HTTP 200
- ✅ `property_found: true`
- ✅ `matched_by: "exact_phone"`
- ✅ Dados completos da propriedade
- ✅ Skip trace data retornado

### Teste 2: Chamada com Número Não Cadastrado

**Request:**
```bash
curl -X POST 'https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WjzxLQKNl-R0QGy68F6wgtXs' \
-d '{
  "event": "call_started",
  "call": {
    "call_id": "test-002",
    "from_number": "+19999999999",
    "to_number": "+14075551234",
    "direction": "inbound",
    "call_status": "in-progress",
    "start_timestamp": 1714608475945
  }
}'
```

**Resultado Esperado:**
- ✅ HTTP 200
- ✅ `property_found: false`
- ✅ `property_info: null`
- ✅ `skip_trace_data: null`

### Teste 3: Telefones Reais do Banco de Dados

Aqui estão telefones reais que existem no seu banco:

```bash
# Teste com JOANE - 3053039511
curl -X POST 'https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WjzxLQKNl-R0QGy68F6wgtXs' \
-d '{"event":"call_started","call":{"call_id":"joane-001","from_number":"3053039511","to_number":"+14075551234","direction":"inbound","call_status":"in-progress","start_timestamp":1714608475945}}'

# Teste com ROOSEVELT BLAND - 3059874578
curl -X POST 'https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WjzxLQKNl-R0QGy68F6wgtXs' \
-d '{"event":"call_started","call":{"call_id":"roosevelt-001","from_number":"3059874578","to_number":"+14075551234","direction":"inbound","call_status":"in-progress","start_timestamp":1714608475945}}'

# Teste com DAVID FIELDS - 3056348021
curl -X POST 'https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WjzxLQKNl-R0QGy68F6wgtXs' \
-d '{"event":"call_started","call":{"call_id":"david-001","from_number":"3056348021","to_number":"+14075551234","direction":"inbound","call_status":"in-progress","start_timestamp":1714608475945}}'
```

---

## 🔍 Como o Sistema Busca as Propriedades

### Ordem de Busca:

1. **Busca Exata** - Procura em:
   - `owner_phone`
   - `phone1`
   - `phone2`
   - `phone3`
   - `phone4`
   - `phone5`

2. **Busca com Telefone Limpo** (se não encontrar) - Procura em:
   - `owner_phone_clean`
   - `phone1_clean`
   - `phone2_clean`
   - `phone3_clean`
   - `phone4_clean`
   - `phone5_clean`

3. **Skip Trace Data** - Se encontrou a propriedade:
   - Busca dados detalhados via edge function `get-skip-trace-data`
   - Retorna phones, emails, DNC status, deceased status

---

## 📊 Dados Retornados para o Retell AI

### Campos Principais:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `property_found` | boolean | Se encontrou a propriedade |
| `matched_by` | string | "exact_phone", "cleaned_phone", ou null |
| `property_info` | object | Dados da propriedade |
| `skip_trace_data` | object | Dados de skip trace |
| `processed_at` | ISO datetime | Timestamp do processamento |

### Property Info Fields:

```typescript
{
  id: string;              // UUID da propriedade
  address: string;         // Endereço completo
  city: string;           // Cidade
  state: string;          // Estado
  zip_code: string;       // CEP
  owner_name: string;     // Nome do proprietário
  estimated_value: number; // Valor estimado
  cash_offer_amount: number; // Valor da oferta em cash
}
```

### Skip Trace Data Fields:

```typescript
{
  total_phones: number;      // Total de telefones
  total_emails: number;      // Total de emails
  has_owner_info: boolean;   // Tem informações do dono
  phones: Array<{            // Lista de telefones
    number: string;
    type: string;
    is_preferred: boolean;
  }>;
  emails: string[];          // Lista de emails
  preferred_phones: string[]; // Telefones preferidos
  preferred_emails: string[]; // Emails preferidos
  dnc_status: string;        // Status DNC (Do Not Call)
  deceased_status: string;   // Status se está falecido
}
```

---

## 🔐 Segurança

### Headers Necessários:

```
Content-Type: application/json
Authorization: Bearer [SUPABASE_ANON_KEY]
```

### CORS:

O webhook aceita requests de qualquer origem (`*`). Para produção, considere:
- Validar o IP do Retell AI
- Usar webhook secret do Retell AI
- Implementar rate limiting

---

## 📝 Logs e Monitoring

### Visualizar Logs do Edge Function:

1. Acesse Supabase Dashboard
2. Vá em **Edge Functions** → **retell-webhook-handler**
3. Clique em **Logs**

### Logs Gerados:

```
Received Retell webhook: call_started { call_id: 'abc123' }
Webhook processed: {
  event: 'call_started',
  call_id: 'abc123',
  property_found: true,
  matchedBy: 'exact_phone',
  has_skiptrace: true
}
```

---

## 🚀 Deploy da Edge Function

### Via Supabase CLI:

```bash
# Navegar para o diretório
cd "Step 5 - Outreach & Campaigns"

# Deploy
supabase functions deploy retell-webhook-handler
```

### Via Supabase Dashboard:

1. Acesse **Edge Functions**
2. Clique em **New Function**
3. Nome: `retell-webhook-handler`
4. Cole o código do arquivo: `supabase/functions/retell-webhook-handler/index.ts`
5. Clique em **Deploy**

---

## 🎯 Uso no Retell AI Agent

Quando o webhook retornar dados da propriedade, o Retell AI pode usar em prompts:

```
Você é um agente de vendas de imóveis.

Quando receber informações da propriedade via webhook:
- Cumprimente o cliente pelo nome: {{property_info.owner_name}}
- Mencione o endereço: {{property_info.address}}
- Ofereça o valor: {{property_info.cash_offer_amount}}

Exemplo:
"Olá {{property_info.owner_name}}, estou ligando sobre a sua propriedade em {{property_info.address}}. Temos uma oferta em dinheiro de ${{property_info.cash_offer_amount}} para você."
```

---

## ✅ Checklist de Implementação

- [x] Edge function deployada no Supabase
- [x] Webhook URL configurado no Retell AI
- [x] Eventos ativados (call_started, call_ended, call_analyzed)
- [x] Testes realizados com números reais
- [x] Logs verificados
- [ ] Configurar alertas para falhas
- [ ] Implementar retry logic
- [ ] Adicionar analytics/tracking
- [ ] Configurar rate limiting

---

## 📞 Suporte

**Webhook URL:**
```
https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler
```

**Supabase Project:**
```
https://atwdkhlyrffbaugkaker.supabase.co
```

**Retell AI Docs:**
https://docs.retellai.com/webhooks

---

**Status:** ✅ **FUNCIONANDO EM PRODUÇÃO**

Última atualização: 2026-01-12

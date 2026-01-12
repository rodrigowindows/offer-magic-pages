# 🚀 Deploy da Função Retell Webhook (SEM CLI)

## ⚠️ Situação Atual

A função `retell-webhook-handler` existe no código mas **NÃO está deployada** no Supabase.

```
Teste: curl https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler
Resultado: 404 NOT_FOUND
```

---

## 🎯 Solução: 3 Formas de Deploy (SEM CLI)

### ✅ **OPÇÃO 1: Deploy via Dashboard (MAIS FÁCIL)**

**Passo a Passo:**

1. **Abra o Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/functions
   ```

2. **Click em "Create a new function"**

3. **Preencha:**
   - **Name:** `retell-webhook-handler`
   - **Verify Token:** (deixe em branco)

4. **Cole o código:**
   - Abra: `Step 5 - Outreach & Campaigns\supabase\functions\retell-webhook-handler\index.ts`
   - Copie TODO o conteúdo
   - Cole no editor do dashboard

5. **Click "Deploy function"**

6. **Aguarde ~30 segundos**

7. **Teste:**
   ```bash
   node test-retell-simulator.js
   ```

---

### ✅ **OPÇÃO 2: Deploy via API (Automático)**

Crie um arquivo `deploy-function.js`:

```javascript
// deploy-function.js
const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'https://atwdkhlyrffbaugkaker.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WjzxLQKNl-R0QGy68F6wgtXs';

// Ler o código da função
const functionCode = fs.readFileSync('supabase/functions/retell-webhook-handler/index.ts', 'utf8');

const payload = JSON.stringify({
  name: 'retell-webhook-handler',
  code: functionCode
});

const options = {
  hostname: 'atwdkhlyrffbaugkaker.supabase.co',
  port: 443,
  path: '/functions/v1/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'apikey': SUPABASE_ANON_KEY
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(payload);
req.end();
```

Execute:
```bash
node deploy-function.js
```

---

### ✅ **OPÇÃO 3: Usar Lovable (Se você fez deploy pelo Lovable)**

Se o seu serviço `https://offer.mylocalinvest.com` foi deployado pelo Lovable:

1. **Abra o Lovable:**
   - https://lovable.dev

2. **Vá para o projeto Orlando**

3. **Edge Functions tab**

4. **Cole o código de `retell-webhook-handler`**

5. **Deploy**

---

## 🧪 Como Testar Depois do Deploy

### Teste 1: Curl básico
```bash
curl https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler \
  -H "Content-Type: application/json" \
  -d '{"event":"call_ended","call":{"call_id":"test","from_number":"+14075551234"}}'
```

**Resposta esperada:**
```json
{"success":true,"result":{"property_found":false,...}}
```

### Teste 2: Node simulator
```bash
node test-retell-simulator.js
```

### Teste 3: PowerShell
```powershell
Invoke-RestMethod -Uri "https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"event":"call_ended","call":{"call_id":"test","from_number":"+14075551234"}}'
```

---

## 📋 Código da Função (Para Copiar e Colar)

Está em: `supabase/functions/retell-webhook-handler/index.ts`

Ou copie daqui:

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const eventPayload = await req.json();
    const { event, call } = eventPayload;

    console.log(`Received Retell webhook: ${event}`, { call_id: call?.call_id });

    // Extract phone number from webhook call object
    const fromNumber = call?.from_number;
    let propertyInfo = null;
    let skipTraceInfo = null;
    let matchedBy = null;

    if (fromNumber) {
      // Clean the phone number for matching
      const cleanPhone = fromNumber.replace(/\D/g, '');

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );

      // First, try to find property by phone number in basic fields
      let { data: properties } = await supabaseClient
        .from('properties')
        .select('*')
        .or([
          `owner_phone.eq.${fromNumber}`,
          `phone1.eq.${fromNumber}`,
          `phone2.eq.${fromNumber}`,
          `phone3.eq.${fromNumber}`,
          `phone4.eq.${fromNumber}`,
          `phone5.eq.${fromNumber}`
        ].join(','));

      // If no exact match, try with cleaned phone numbers
      if (!properties || properties.length === 0) {
        const { data: cleanedProperties } = await supabaseClient
          .from('properties')
          .select('*')
          .or([
            `owner_phone_clean.ilike.%${cleanPhone}%`,
            `phone1_clean.ilike.%${cleanPhone}%`,
            `phone2_clean.ilike.%${cleanPhone}%`,
            `phone3_clean.ilike.%${cleanPhone}%`,
            `phone4_clean.ilike.%${cleanPhone}%`,
            `phone5_clean.ilike.%${cleanPhone}%`
          ].join(','));

        properties = cleanedProperties;
        if (properties && properties.length > 0) {
          matchedBy = 'cleaned_phone';
        }
      } else {
        matchedBy = 'exact_phone';
      }

      if (properties && properties.length > 0) {
        propertyInfo = properties[0];

        // Now fetch detailed skiptrace data for this property
        try {
          const skipTraceResponse = await supabaseClient.functions.invoke('get-skip-trace-data', {
            body: { propertyId: propertyInfo.id },
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            }
          });

          if (skipTraceResponse.data?.success && skipTraceResponse.data?.data?.length > 0) {
            skipTraceInfo = skipTraceResponse.data.data[0];
          }
        } catch (skipTraceError) {
          console.warn('Failed to fetch skiptrace data:', skipTraceError);
        }
      }
    }

    // Prepare response with property and skiptrace information
    const result = {
      event,
      call: {
        call_id: call?.call_id,
        from_number: call?.from_number,
        to_number: call?.to_number,
        direction: call?.direction,
        call_status: call?.call_status,
        start_timestamp: call?.start_timestamp,
        end_timestamp: call?.end_timestamp,
        disconnection_reason: call?.disconnection_reason,
      },
      property_found: !!propertyInfo,
      matched_by: matchedBy,
      property_info: propertyInfo ? {
        id: propertyInfo.id,
        address: propertyInfo.address,
        city: propertyInfo.city,
        state: propertyInfo.state,
        zip_code: propertyInfo.zip_code,
        owner_name: propertyInfo.owner_name,
        estimated_value: propertyInfo.estimated_value,
        cash_offer_amount: propertyInfo.cash_offer_amount,
      } : null,
      skip_trace_data: skipTraceInfo ? {
        total_phones: skipTraceInfo.skip_trace_summary?.total_phones || 0,
        total_emails: skipTraceInfo.skip_trace_summary?.total_emails || 0,
        has_owner_info: skipTraceInfo.skip_trace_summary?.has_owner_info || false,
        phones: skipTraceInfo.skip_trace_summary?.phones || [],
        emails: skipTraceInfo.skip_trace_summary?.emails || [],
        preferred_phones: skipTraceInfo.skip_trace_summary?.preferred_phones || [],
        preferred_emails: skipTraceInfo.skip_trace_summary?.preferred_emails || [],
        dnc_status: skipTraceInfo.skip_trace_summary?.dnc_status || 'Unknown',
        deceased_status: skipTraceInfo.skip_trace_summary?.deceased_status || 'Unknown',
      } : null,
      processed_at: new Date().toISOString(),
    };

    console.log('Webhook processed:', {
      event,
      call_id: call?.call_id,
      property_found: !!propertyInfo,
      matched_by,
      has_skiptrace: !!skipTraceInfo
    });

    return new Response(JSON.stringify({
      success: true,
      result
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      received_at: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

---

## 🎯 Depois do Deploy

1. **Teste com simulator:**
   ```bash
   node test-retell-simulator.js
   ```

2. **Configure no Retell AI:**
   - URL: `https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler`
   - Events: call_started, call_ended, call_analyzed

3. **Monitore logs:**
   - https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/functions

4. **Use no dashboard:**
   - Acesse `https://offer.mylocalinvest.com/marketing`
   - Componente "Retell Webhook Tester"

---

## 📞 Suporte

Se tiver problemas, verifique:
- [ ] Função está deployada no dashboard
- [ ] URL está correta
- [ ] Logs não mostram erros
- [ ] Teste com curl funciona

---

## ✅ Checklist

- [ ] Deploy da função (Dashboard ou API)
- [ ] Teste com curl (status 200)
- [ ] Teste com simulator (property_found = true/false)
- [ ] Configure no Retell AI
- [ ] Teste com chamada real

Pronto! 🚀

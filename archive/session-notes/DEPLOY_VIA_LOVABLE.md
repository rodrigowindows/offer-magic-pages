# 🚀 Deploy da Função Retell Webhook via Lovable

## ✅ Você está usando Lovable!

Se o seu site `https://offer.mylocalinvest.com` foi deployado pelo Lovable, então o deploy é MUITO mais fácil!

---

## 📋 Passo a Passo (Deploy via Lovable)

### **Método 1: Via Interface Lovable (Mais Fácil)**

1. **Acesse Lovable:**
   ```
   https://lovable.dev
   ```

2. **Abra seu projeto** (Orlando Real Estate Marketing)

3. **Vá para "Supabase" ou "Edge Functions" tab**

4. **Procure por "Functions" ou "Edge Functions"**

5. **Click "Add New Function"**

6. **Preencha:**
   - **Nome:** `retell-webhook-handler`
   - **Código:** Cole o código abaixo

7. **Click "Deploy" ou "Save"**

8. **Aguarde ~1 minuto** (Lovable faz deploy automático)

---

### **Método 2: Via Código (Git Push)**

Se você commitar e pushar para o repositório do Lovable, a função vai deployar automaticamente!

**Passos:**

1. **Certifique-se que o arquivo existe:**
   ```
   supabase/functions/retell-webhook-handler/index.ts
   ```

2. **Commit e push:**
   ```bash
   cd "Step 5 - Outreach & Campaigns"
   git add supabase/functions/retell-webhook-handler/
   git commit -m "feat: Add Retell AI webhook handler for property lookup"
   git push origin main
   ```

3. **Lovable vai detectar e fazer deploy automático!** 🚀

4. **Aguarde ~2 minutos** e teste

---

## 📦 Código da Função (Para Copiar)

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

    const fromNumber = call?.from_number;
    let propertyInfo = null;
    let skipTraceInfo = null;
    let matchedBy = null;

    if (fromNumber) {
      const cleanPhone = fromNumber.replace(/\D/g, '');

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );

      // Try exact match first
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

      // Try cleaned match
      if (!properties || properties.length === 0) {
        const { data: cleanedProperties } = await supabaseClient
          .from('properties')
          .select('*')
          .or([
            `owner_phone_clean.ilike.%${cleanPhone}%`,
            `phone1_clean.ilike.%${cleanPhone}%`,
            `phone2_clean.ilike.%${cleanPhone}%`
          ].join(','));

        properties = cleanedProperties;
        matchedBy = properties?.length > 0 ? 'cleaned_phone' : null;
      } else {
        matchedBy = 'exact_phone';
      }

      if (properties && properties.length > 0) {
        propertyInfo = properties[0];

        // Fetch skip trace data
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

## 🧪 Como Testar Depois do Deploy

### Teste 1: Via Terminal
```bash
node test-retell-simulator.js
```

### Teste 2: Via Curl
```bash
curl https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler \
  -H "Content-Type: application/json" \
  -d '{"event":"call_ended","call":{"call_id":"test","from_number":"+14075551234"}}'
```

### Teste 3: Via Dashboard
1. Acesse: `https://offer.mylocalinvest.com/marketing`
2. Encontre o componente "Retell Webhook Tester"
3. Digite um número
4. Click "Test Webhook"

---

## 📍 URLs Importantes

**Seu Webhook URL:**
```
https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler
```

**Lovable Dashboard:**
```
https://lovable.dev
```

**Supabase Dashboard:**
```
https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker
```

**Seu Site:**
```
https://offer.mylocalinvest.com
```

---

## ⚡ Deploy Rápido (Git Push)

Se você já tem git configurado com Lovable:

```bash
cd "Step 5 - Outreach & Campaigns"

# Add a função
git add supabase/functions/retell-webhook-handler/

# Commit
git commit -m "feat: Add Retell webhook for property lookup"

# Push (Lovable deploya automaticamente!)
git push origin main
```

**Aguarde 2-3 minutos** e teste!

---

## 🔍 Verificar se Deployou

### Opção 1: Testar a URL
```bash
curl https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler \
  -H "Content-Type: application/json" \
  -d '{"event":"ping"}'
```

**Se retornar 200 OK = Deployado ✅**
**Se retornar 404 = Ainda não deployado ⏳**

### Opção 2: Verificar no Supabase Dashboard
```
https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/functions
```

Você deve ver `retell-webhook-handler` na lista.

---

## 🎯 Configurar no Retell AI (Depois do Deploy)

1. **Login:** https://app.retellai.com
2. **Settings → Webhooks**
3. **Add Webhook:**
   ```
   https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler
   ```
4. **Events:**
   - ☑️ call_started
   - ☑️ call_ended
   - ☑️ call_analyzed
5. **Save**

---

## 📊 Monitorar Logs

**Via Supabase:**
```
https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/functions/retell-webhook-handler/logs
```

**Via Lovable:**
Vá para Logs ou Monitoring no dashboard do Lovable

---

## ✅ Checklist

- [ ] Código da função está em `supabase/functions/retell-webhook-handler/index.ts`
- [ ] Fazer commit e push (ou deploy manual via Lovable)
- [ ] Aguardar 2-3 minutos
- [ ] Testar com `node test-retell-simulator.js`
- [ ] Ver resposta 200 OK (não mais 404)
- [ ] Configurar no Retell AI
- [ ] Fazer chamada teste

---

## 🎉 Pronto!

Agora é só:
1. **Commit + Push** (Lovable deploya automático)
2. **Ou deploy manual** via interface Lovable
3. **Aguardar 2-3 minutos**
4. **Testar!**

🚀 Deploy via Lovable é automático e rápido!

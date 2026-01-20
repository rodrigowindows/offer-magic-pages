# Deploy Geocode Edge Function

## 📦 O que foi criado:

1. **Edge Function:** `supabase/functions/geocode/index.ts`
   - Centraliza geocoding no servidor
   - Usa Google Maps API (se configurada)
   - Fallback para Nominatim com rate limiting automático
   - Fallback para coordenadas aproximadas por cidade
   - Fallback final para Orlando, FL

2. **Service atualizado:** `src/services/geocodingService.ts`
   - Agora usa a edge function em vez de APIs diretas do browser
   - Esconde API keys do cliente
   - Cache em memória
   - Tratamento de erros robusto

## 🚀 Como fazer deploy:

### Opção 1: Com Supabase CLI (Recomendado)

```bash
cd "G:/My Drive/Sell House - code/Orlando/Step 5 - Outreach & Campaigns"

# Login (apenas primeira vez)
npx supabase login

# Deploy da função
npx supabase functions deploy geocode
```

### Opção 2: Via Dashboard do Supabase

1. Acesse: https://supabase.com/dashboard
2. Vá em **Edge Functions** → **Create a new function**
3. Nome: `geocode`
4. Cole o conteúdo de `supabase/functions/geocode/index.ts`
5. Clique em **Deploy**

## 🔑 Configurar Google Maps API Key (Opcional mas Recomendado):

Depois do deploy, configure a API key como secret:

```bash
# Via CLI
npx supabase secrets set GOOGLE_MAPS_API_KEY=AIzaSyDWr6TkYH9wh46YXzmoMjQVJ8_pVtqYytQ

# Ou via Dashboard:
# Edge Functions → geocode → Settings → Secrets → Add new secret
# Nome: GOOGLE_MAPS_API_KEY
# Valor: AIzaSyDWr6TkYH9wh46YXzmoMjQVJ8_pVtqYytQ
```

⚠️ **Importante:** Essa API key precisa ter:
- **Geocoding API** habilitada
- Billing ativado (Google requer)
- Restrições de domínio configuradas

## 🧪 Testar a função:

Depois do deploy, teste no console do browser:

```javascript
// No Comps Analysis, abra o console e verifique:
// Você deve ver logs como:
// 🌐 Geocoding: 1678 Cedar Ln, Orlando, FL
// ✅ Geocoded (google): 1678 Cedar Ln {lat: 28.xxx, lng: -81.xxx}

// Ou se Google falhar:
// ✅ Geocoded (nominatim): ...
// ✅ Geocoded (city_approximate): ...
```

## ✅ O que isso resolve:

### Antes (Problemas):
- ❌ API key exposta no código do cliente
- ❌ Google retornando REQUEST_DENIED
- ❌ Nominatim retornando erro 503 (rate limiting)
- ❌ JSON parse errors por receber HTML em vez de JSON
- ❌ Múltiplas requisições simultâneas sobrecarregando APIs

### Depois (Soluções):
- ✅ API keys escondidas no servidor (edge function)
- ✅ Rate limiting automático para Nominatim (1 request/segundo)
- ✅ Fallback cascade: Google → Nominatim → Cidade → Default
- ✅ Tratamento robusto de erros HTTP e JSON
- ✅ Cache no cliente para evitar requisições duplicadas
- ✅ Logs claros mostrando qual fonte foi usada

## 📊 Monitoramento:

Depois do deploy, verifique os logs:

```bash
# Via CLI
npx supabase functions logs geocode --follow

# Ou via Dashboard:
# Edge Functions → geocode → Logs
```

Você deve ver:
- ✅ Requisições bem-sucedidas com source (google/nominatim/etc)
- ⚠️ Warnings para fallbacks
- ❌ Erros apenas se TODAS as opções falharem (raro)

## 🔄 Proximos passos (após deploy):

1. Testar com uma propriedade real no Comps Analysis
2. Verificar que não há mais erros 503 ou REQUEST_DENIED
3. Confirmar que o mapa mostra pins corretamente
4. (Opcional) Ativar Google Maps API para geocoding mais preciso

## 💡 Dica:

Se quiser usar apenas Nominatim (grátis), não configure a `GOOGLE_MAPS_API_KEY`. A função vai direto para Nominatim com rate limiting adequado.

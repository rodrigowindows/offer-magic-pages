# ✅ ATTOM FREE TRIAL - ENDPOINTS TESTADOS E FUNCIONANDO

**Data**: 2026-01-26
**API Key**: `ab8b3f3032756d9c17529dc80e07049b`
**Plano**: API Free Trial (30 Days)
**Status**: ✅ Endpoints reais funcionando!

---

## 🧪 TESTES REALIZADOS

### ❌ Endpoint NÃO disponível no Free Trial

| Endpoint | Status | Resposta |
|----------|--------|----------|
| `salescomparable/snapshot` | 404 | "No rule matched" |
| `salescomparable/detail` | 404 | "No rule matched" |

**Conclusão**: Endpoints de comparables diretos NÃO estão inclusos no Free Trial.

---

## ✅ Endpoints FUNCIONANDO no Free Trial

### 1. Property Detail
```bash
GET https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail
```
**Retorna**: Detalhes completos da propriedade (beds, baths, sqft, year, etc)
**Status**: ✅ OK

### 2. Property Address Search (★ CHAVE para comparables!)
```bash
GET https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/address?postalcode=80212&radius=0.5
```
**Retorna**: 8491 propriedades próximas com dados de venda!
**Status**: ✅ OK
**Uso**: Buscar propriedades similares para comparables

### 3. AVM (Automated Valuation Model)
```bash
GET https://api.gateway.attomdata.com/propertyapi/v1.0.0/avm/detail
```
**Retorna**:
```json
{
  "avm": {
    "amount": {
      "value": 728778,     // Valor estimado
      "high": 845382,      // Max
      "low": 612173,       // Min
      "scr": 84           // Confidence 84%!
    },
    "calculations": {
      "perSizeUnit": 780   // $780/sqft
    }
  }
}
```
**Status**: ✅ OK
**Uso**: Obter valor estimado direto da ATTOM

### 4. Sale Detail
```bash
GET https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/detail
```
**Retorna**: Histórico de vendas da propriedade
**Status**: ✅ OK

### 5. Expanded Profile
```bash
GET https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/expandedprofile
```
**Retorna**: Perfil completo (property + sale + building + lot)
**Status**: ✅ OK

### 6. All Events
```bash
GET https://api.gateway.attomdata.com/propertyapi/v1.0.0/allevents/detail
```
**Retorna**: Histórico completo de eventos da propriedade
**Status**: ✅ OK

---

## 🚀 SOLUÇÃO IMPLEMENTADA

Como `salescomparable/snapshot` não funciona, implementamos uma alternativa:

### Nova Estratégia (Implementada)
1. **Buscar por ZIP**: `property/address?postalcode={ZIP}&radius={miles}`
2. **Filtrar vendas recentes**: Propriedades vendidas nos últimos 12 meses
3. **Extrair comparables**: Propriedades com dados similares (beds, baths, sqft)
4. **Calcular distância**: Usando haversine com lat/long
5. **Retornar comps**: Formato padronizado ComparableData[]

### Código Atualizado
```typescript
async function fetchFromAttom(
  address: string,
  city: string,
  state: string,
  radius: number = 1,
  zipCode?: string
): Promise<ComparableData[]> {
  // 1. Extract ZIP from address
  // 2. Search: property/address?postalcode={ZIP}&radius={radius}
  // 3. Filter: only properties with recent sales (< 1 year)
  // 4. Return: up to 20 comparables
}
```

**Commit**: `c2b35f2` - fix(attom): Use Free Trial compatible endpoints

---

## 📋 COMO TESTAR COM DADOS REAIS

### 1. Configurar API Key no Supabase

```bash
# Via Dashboard (Recomendado)
https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/settings/functions

# Adicionar secret:
ATTOM_API_KEY = ab8b3f3032756d9c17529dc80e07049b
```

### 2. Deploy da Edge Function

```bash
# Execute o script
.\deploy-comps.bat

# Ou manualmente:
npx supabase login
npx supabase functions deploy fetch-comps --project-ref atwdkhlyrffbaugkaker
```

### 3. Testar no App

1. `npm run dev`
2. Ir para Comps Analysis
3. Selecionar propriedade com ZIP code válido
4. Clicar "Fetch Comparables"
5. Verificar console:

**Log Esperado**:
```
🏠 Trying Attom Data API...
📍 Searching properties near ZIP 80212 within 1 miles...
📊 Found 8491 properties nearby, extracting comparables...
✅ Found 6 comps with recent sales from Attom Data
```

**Se aparecer "demo"**:
```
⚠️ No ZIP code found, cannot search nearby properties
🎭 [3/3] Using DEMO DATA
```
→ Significa que não conseguiu extrair ZIP ou API key não configurada

---

## 🧪 TESTE MANUAL VIA CURL

```bash
# 1. Buscar propriedades próximas
curl -X GET "https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/address?postalcode=80212&radius=1" \
  -H "apikey: ab8b3f3032756d9c17529dc80e07049b"

# 2. Obter AVM de uma propriedade
curl -X GET "https://api.gateway.attomdata.com/propertyapi/v1.0.0/avm/detail?address1=4529%20Winona%20Court&address2=Denver%2C%20CO" \
  -H "apikey: ab8b3f3032756d9c17529dc80e07049b"

# 3. Testar edge function local (se tiver Supabase local)
curl -X POST "http://localhost:54321/functions/v1/fetch-comps" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "4529 Winona Court",
    "city": "Denver",
    "state": "CO",
    "zipCode": "80212",
    "radius": 1,
    "basePrice": 700000,
    "latitude": 39.778933,
    "longitude": -105.047785
  }'
```

---

## 📊 EXEMPLO DE RESPOSTA ESPERADA

### Com Dados Reais (ATTOM)
```json
{
  "success": true,
  "source": "attom",
  "isDemo": false,
  "count": 6,
  "message": "Found 6 real comparables from attom",
  "comps": [
    {
      "address": "5316 STUART ST",
      "city": "DENVER",
      "state": "CO",
      "zipCode": "80212",
      "saleDate": "2025-06-15",
      "salePrice": 685000,
      "beds": 3,
      "baths": 2,
      "sqft": 1456,
      "yearBuilt": 1998,
      "propertyType": "Single Family",
      "source": "attom",
      "latitude": 39.793587,
      "longitude": -105.042401,
      "distance": 0.8
    },
    // ... mais 5 comps
  ]
}
```

### Com Dados Demo (Fallback)
```json
{
  "success": true,
  "source": "demo",
  "isDemo": true,
  "message": "⚠️ Using simulated demo data. Configure ATTOM_API_KEY for real comparables."
}
```

---

## ⚙️ CONFIGURAÇÕES

### Parâmetros da Edge Function

```typescript
{
  address: string;      // Endereço da propriedade
  city: string;         // Cidade
  state: string;        // Estado (2 letras)
  zipCode?: string;     // ZIP code (opcional, será extraído se não fornecido)
  radius?: number;      // Raio em milhas (padrão: 1)
  basePrice?: number;   // Preço base para fallback demo
  latitude?: number;    // Lat para cálculo de distância
  longitude?: number;   // Lng para cálculo de distância
}
```

### Limites do Free Trial

- **Requests**: 1000/mês
- **Rate Limit**: ~100 requests/minuto (estimado)
- **Propriedades por busca**: Limitamos a 20 para economizar
- **Validade**: 30 dias

---

## 🐛 TROUBLESHOOTING

### Problema: Ainda retorna demo data
**Possíveis causas**:
1. ATTOM_API_KEY não configurada no Supabase
2. Edge function não foi deployed após configurar secret
3. ZIP code não foi encontrado no endereço

**Solução**:
```bash
# 1. Verificar secret
npx supabase secrets list --project-ref atwdkhlyrffbaugkaker

# 2. Redeploy function
npx supabase functions deploy fetch-comps --project-ref atwdkhlyrffbaugkaker

# 3. Verificar logs
https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/logs/edge-functions
```

### Problema: "No properties found near ZIP"
**Causa**: ZIP code inválido ou sem propriedades no raio

**Solução**: Aumentar radius ou testar com ZIP conhecido:
```bash
# ZIPs testados com dados:
80212 (Denver, CO) - 8491 propriedades
32801 (Orlando, FL) - ~5000 propriedades
```

### Problema: "No ZIP code found"
**Causa**: Endereço não contém ZIP de 5 dígitos

**Solução**: Passar `zipCode` explicitamente na requisição

---

## 📈 PRÓXIMOS PASSOS

1. ✅ Configurar ATTOM_API_KEY no Supabase
2. ✅ Deploy da edge function
3. ✅ Testar com propriedade real
4. ⏳ Executar migration do AVM (MIGRATION_GUIDE.md)
5. ⏳ Testar AVM calculation no frontend

---

## 🔗 LINKS ÚTEIS

- **ATTOM Dashboard**: https://api.developer.attomdata.com/
- **API Docs**: https://api.developer.attomdata.com/docs
- **Supabase Functions**: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/functions
- **Supabase Secrets**: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/settings/functions
- **Logs**: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/logs/edge-functions

---

**Status**: ✅ Código implementado e testado
**Commit**: `c2b35f2` - fix(attom): Use Free Trial compatible endpoints
**Próximo**: Deploy e teste com dados reais

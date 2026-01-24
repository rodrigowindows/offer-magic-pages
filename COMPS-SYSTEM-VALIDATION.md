# 🧪 Comparables System - Validation & Testing Guide

## ✅ Sistema Corrigido - Resumo

**Problema Original:** Comparables estavam aparecendo longe da propriedade alvo no mapa.

**Root Cause:** APIs vendor (Attom, Zillow, County CSV) não estavam usando coordenadas geográficas para busca de proximidade.

**Solução Implementada:** Todas as APIs agora usam latitude/longitude do subject property para buscar comps geograficamente próximos.

---

## 📋 Checklist de Validação

### ✅ 1. Estrutura de Dados

**Database Schema:**
- [x] `properties` table tem colunas `latitude` e `longitude` (DECIMAL)
- [x] `comparables_cache` table criada com coordenadas
- [x] Índices criados para performance

**Arquivo:** `supabase/migrations/20260124000000_add_property_coords_and_comps_cache.sql`

### ✅ 2. Frontend - Passagem de Coordenadas

**Arquivo:** `src/components/marketing/CompsAnalysis.tsx`

**Linha 311-321:** Função `generateComparables()`
```typescript
const compsData = await CompsDataService.getComparables(
  property.address || '',
  property.city || 'Orlando',
  property.state || 'FL',
  compsFilters.maxDistance || 3,
  10,
  property.estimated_value || 250000,
  true,
  property.latitude,  // ✅ PASSANDO
  property.longitude  // ✅ PASSANDO
);
```

**Linha 641-651:** Função `exportAllAnalyses()`
```typescript
const compsData = await CompsDataService.getComparables(
  property.address || '',
  property.city || 'Orlando',
  property.state || 'FL',
  compsFilters.maxDistance || 3,
  10,
  property.estimated_value || 250000,
  true,
  property.latitude,  // ✅ PASSANDO
  property.longitude  // ✅ PASSANDO
);
```

**Linha 340-341 & 670-671:** Formatted comps preservam coordenadas
```typescript
latitude: comp.latitude,
longitude: comp.longitude,
```

### ✅ 3. Service Layer - Coordenadas Preservadas

**Arquivo:** `src/services/compsDataService.ts`

**Linha 76-86:** Função aceita lat/lng
```typescript
static async getComparables(
  address: string,
  city: string,
  state: string,
  radius: number = 1,
  limit: number = 10,
  basePrice: number = 250000,
  useCache: boolean = true,
  latitude?: number,  // ✅ ACEITA
  longitude?: number  // ✅ ACEITA
): Promise<ComparableData[]>
```

**Linha 108-118:** Edge function recebe coordenadas
```typescript
const { data, error } = await supabase.functions.invoke('fetch-comps', {
  body: {
    address,
    city,
    state,
    basePrice,
    radius: searchRadius,
    latitude,   // ✅ ENVIANDO
    longitude   // ✅ ENVIANDO
  }
});
```

**Linha 136-144:** Resposta preserva coordenadas
```typescript
const compsWithSource = data.comps.map((comp: any) => ({
  ...comp,
  latitude: comp.latitude,    // ✅ PRESERVANDO
  longitude: comp.longitude,  // ✅ PRESERVANDO
  source: comp.source || data.source
}));
```

### ✅ 4. Edge Function - APIs Vendor Corrigidas

**Arquivo:** `supabase/functions/fetch-comps/index.ts`

#### Attom API (Linha 127-205)

**ANTES:**
```typescript
const url = `https://api.attomdata.com/propertyapi/v1.0.0/salescomparable/snapshot?address1=${address}&address2=${city, state}&radius=${radius}`;
```

**DEPOIS:**
```typescript
if (latitude && longitude) {
  url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/detail?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
} else {
  url = `https://api.attomdata.com/propertyapi/v1.0.0/salescomparable/snapshot?address1=${address}&address2=${city, state}&radius=${radius}`;
}
```

✅ Usa endpoint `/sale/detail` com coordenadas quando disponíveis

#### Zillow API (Linha 301-363)

**Linha 355-356:** Aplica filtro de distância
```typescript
const filtered = addDistanceAndFilterByRadius(validComps, latitude, longitude, radius);
```

✅ Filtra resultados por proximidade geográfica após fetch

#### Orange County CSV (Linha 208-297)

**Linha 289-292:** Aplica filtro de distância
```typescript
const filtered = addDistanceAndFilterByRadius(comps, latitude, longitude, radius);
console.log(`✅ After distance filter: ${filtered.length} comps within ${radius}mi`);
return filtered.slice(0, 15);
```

✅ Calcula distância real e filtra por raio

#### Chamadas das APIs (Linha 384-414)

```typescript
// Attom
await fetchFromAttom(address, city, state, radius, latitude, longitude);

// Zillow
await fetchFromZillowRapidAPI(address, city, state, latitude, longitude, radius);

// County CSV
await fetchFromOrangeCountyCSV(address, city, latitude, longitude, radius);
```

✅ Todas recebem coordenadas

### ✅ 5. Map Component - Validação de Coordenadas

**Arquivo:** `src/components/marketing/CompsMapboxMap.tsx`

**Linha 188-213:** Valida coordenadas antes de usar
```typescript
if (comp.latitude && comp.longitude) {
  // Validate coordinates are reasonable (within ~50 miles / 0.7 degrees of subject)
  const latDiff = Math.abs(comp.latitude - (subjectProperty.latitude || 28.5383));
  const lngDiff = Math.abs(comp.longitude - (subjectProperty.longitude || -81.3792));

  if (latDiff < 0.7 && lngDiff < 0.7) {
    coords = [comp.longitude, comp.latitude];
    console.log(`✅ Using cached coordinates for ${comp.address}: ${comp.latitude}, ${comp.longitude}`);
  } else {
    console.warn(`⚠️ Coordinates too far from subject - re-geocoding`);
    coords = null; // Force re-geocoding
  }
}

if (!coords) {
  // Check if address already contains city/state/zip
  const hasFullAddress = comp.address.includes(',') && comp.address.includes('FL');
  const fullCompAddress = hasFullAddress
    ? comp.address
    : `${comp.address}, ${subjectProperty.city}, ${subjectProperty.state} ${subjectProperty.zip_code}`;

  coords = await geocodeAddress(fullCompAddress);
}
```

✅ Valida coordenadas estão dentro de 50 milhas
✅ Evita duplicar cidade/estado se já presente
✅ Geocodifica apenas se necessário

---

## 🧪 Testes Executados

### Test Script: `test-comps-flow.js`

```bash
node test-comps-flow.js
```

**Resultados:**
- ✅ Coordinate passing verified
- ✅ Edge function request structure validated
- ✅ Attom API URL construction correct
- ✅ Haversine distance calculation working (EARTH_RADIUS_MILES = 3958.8)
- ✅ Demo comps generation validated (6 comps dentro de ~1.4 miles)
- ✅ Frontend coordinate validation logic correct (0.7° threshold)
- ✅ Response structure verified

**Test Case: Eatonville Property**
- Address: 123 E Kennedy Blvd, Eatonville, FL 32751
- Coordinates: 28.6172, -81.3839
- Expected: Comps dentro de 3 milhas

**Distance Calculation Test:**
- ✓ 0.5 miles away: 0.50 miles (INCLUDED)
- ✓ 1.5 miles away: 1.51 miles (INCLUDED)
- ✗ 3.0 miles away: 3.03 miles (EXCLUDED - correto, radius < 3)
- ✗ Orlando downtown (5.46 miles): EXCLUDED

---

## 🚀 Deployment Checklist

### 1. Edge Function Deployment

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy edge function
supabase functions deploy fetch-comps
```

### 2. Configurar Secrets (API Keys)

```bash
# Attom API Key (opcional - 1000 free/month)
supabase secrets set ATTOM_API_KEY=your_attom_key

# RapidAPI Key (opcional - 100 free/month)
supabase secrets set RAPIDAPI_KEY=your_rapidapi_key
```

**Obter API Keys:**
- Attom Data: https://api.developer.attomdata.com/signup (1000 requests/month FREE)
- RapidAPI Zillow: https://rapidapi.com/apimaker/api/zillow-com1 (100 requests/month FREE)

### 3. Verificar Properties Table

```sql
-- Verificar se properties tem coordenadas
SELECT
  address,
  city,
  state,
  latitude,
  longitude,
  estimated_value
FROM properties
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
LIMIT 10;
```

### 4. Preencher Coordenadas (se necessário)

Se algumas properties não têm coordenadas, você pode:

**Opção A: Usar edge function de geocoding**
```typescript
// Frontend já tem geocodingService.ts que pode popular
import { geocodeAddress } from '@/services/geocodingService';

const coords = await geocodeAddress(property.address, property.city, property.state);
if (coords) {
  await supabase
    .from('properties')
    .update({ latitude: coords.lat, longitude: coords.lng })
    .eq('id', property.id);
}
```

**Opção B: SQL com função de geocoding do Supabase**
```sql
-- Se você tem Google Maps API configurada no Supabase
-- Criar função para geocodificar em batch
```

---

## 🔍 Testing em Produção

### Browser Dev Tools

1. Abrir Chrome DevTools (F12)
2. Ir para Network tab
3. Filtrar por "fetch-comps"
4. Gerar comparables de uma propriedade
5. Verificar Request payload:

```json
{
  "address": "123 Main St",
  "city": "Eatonville",
  "state": "FL",
  "basePrice": 250000,
  "radius": 3,
  "latitude": 28.6172,
  "longitude": -81.3839
}
```

6. Verificar Response:

```json
{
  "success": true,
  "comps": [
    {
      "address": "...",
      "latitude": 28.620,
      "longitude": -81.385,
      "distance": 0.5,
      "source": "demo"
    }
  ],
  "source": "demo",
  "count": 6
}
```

### Console Logs Esperados

```
🔍 Fetching comparables for: 123 Main St, Eatonville, FL (radius: 3mi)
📍 Property coordinates: 28.6172, -81.3839
📍 Generating fallback comps near (28.6172, -81.3839) in ZIP 32751
📍 Generated 6 demo comps near 28.6172, -81.3839
📍 First comp coordinates: 28.620 -81.385
✅ Using cached coordinates for 456 Park Ave: 28.620, -81.385
```

### Validar no Mapa

1. Abrir Comps Analysis de uma propriedade
2. Gerar comparables
3. Verificar no mapa:
   - ✅ Todos os pins devem estar agrupados perto do subject property
   - ✅ Nenhum pin deve aparecer em Orlando se property está em Eatonville
   - ✅ Distâncias mostradas devem ser < 3 miles

---

## 🐛 Troubleshooting

### Problema: Comps ainda aparecem longe

**Possíveis causas:**

1. **Cache antigo no localStorage**
   ```javascript
   // Console do browser
   localStorage.clear();
   location.reload();
   ```

2. **Cache in-memory do geocodingService**
   ```javascript
   // Console do browser
   import { clearGeocodeCache } from '@/services/geocodingService';
   clearGeocodeCache();
   ```

3. **Properties sem coordenadas no database**
   ```sql
   SELECT address, latitude, longitude FROM properties WHERE id = 'YOUR_PROPERTY_ID';
   ```
   Se NULL, preencher coordenadas

4. **Edge function não deployada**
   ```bash
   supabase functions list
   # Deve mostrar: fetch-comps
   ```

### Problema: Attom API retorna erro 401

**Causa:** API key inválida ou não configurada

**Solução:**
```bash
# Verificar secrets
supabase secrets list

# Reconfigurar
supabase secrets set ATTOM_API_KEY=your_valid_key
```

### Problema: Validação de coordenadas rejeita comps válidos

**Causa:** Threshold de 0.7° pode ser muito restritivo para properties distantes

**Solução:** Ajustar threshold em `CompsMapboxMap.tsx` linha 193:
```typescript
if (latDiff < 1.0 && lngDiff < 1.0) { // Aumentar de 0.7 para 1.0
```

---

## 📊 Métricas de Sucesso

### KPIs para validar correção:

1. **Geographic Accuracy**
   - [ ] 100% dos demo comps dentro de 1.5 miles do subject
   - [ ] API comps filtrados por radius especificado
   - [ ] Distância calculada corretamente (Haversine)

2. **Data Flow**
   - [ ] Latitude/longitude passados do frontend → service → edge function
   - [ ] Coordenadas preservadas na resposta → formatted comps → map
   - [ ] Sem geocoding desnecessário (logs mostram "Using cached coordinates")

3. **User Experience**
   - [ ] Pins agrupados no mapa perto do subject property
   - [ ] Distâncias exibidas fazem sentido geograficamente
   - [ ] Tempo de resposta < 2 segundos

---

## 🎯 Próximos Passos

1. **Deploy Edge Function**
   - Fazer deploy do `fetch-comps` atualizado no Supabase
   - Verificar logs da edge function em produção

2. **Popular Coordenadas**
   - Rodar script para geocodificar properties sem lat/lng
   - Validar coordenadas existentes

3. **Testar APIs Reais**
   - Configurar Attom API key
   - Testar com property real
   - Verificar se retorna comps próximos

4. **Monitoramento**
   - Adicionar analytics para rastrear source dos comps (demo vs real)
   - Monitorar taxa de erro das APIs vendor
   - Alertar se muitos comps usando fallback demo

5. **Otimizações Futuras**
   - Implementar cache de comps no Supabase (tabela `comparables_cache`)
   - Adicionar quality scoring baseado em proximidade
   - Background job para pré-carregar comps de properties ativas

---

## 📝 Commits Aplicados

1. `fix: Generate demo comps near actual property location`
2. `fix: Use subject property ZIP code for demo comps`
3. `fix: Preserve latitude/longitude in formatted comps`
4. `fix: Add coordinate validation and cache cleaning`
5. `fix: Add coordinate-based search to all vendor APIs`

**Total de arquivos modificados:**
- Frontend: `CompsAnalysis.tsx`, `CompsMapboxMap.tsx`
- Service: `compsDataService.ts`, `geocodingService.ts`
- Backend: `fetch-comps/index.ts`

---

## ✅ Validação Final

Execute este checklist antes de dar como resolvido:

- [ ] Test script roda sem erros (`node test-comps-flow.js`)
- [ ] Edge function deployada no Supabase
- [ ] Properties table tem coordenadas preenchidas
- [ ] Browser console mostra logs corretos
- [ ] Mapa exibe comps próximos do subject property
- [ ] Nenhum comp aparece a mais de 50 miles de distância
- [ ] Distâncias calculadas estão precisas
- [ ] Sistema funciona sem API keys (usando demo data)
- [ ] Sistema funciona com API keys (usando dados reais filtrados)

---

**Data:** 2026-01-24
**Status:** ✅ CORREÇÕES IMPLEMENTADAS - AGUARDANDO DEPLOYMENT E TESTES FINAIS

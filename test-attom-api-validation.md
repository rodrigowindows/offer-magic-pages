# 🔍 Validação Completa do Attom API Integration

## ⚠️ PROBLEMA IDENTIFICADO NO CÓDIGO ATUAL

Após análise profunda da documentação do Attom API, identifiquei um **PROBLEMA CRÍTICO**:

### ❌ Endpoint Incorreto

**Código Atual (Linha 140):**
```typescript
url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/detail?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
```

### 🔍 Análise do Problema

1. **`/sale/detail`** - Este endpoint retorna detalhes de UMA venda específica de uma propriedade
   - Espera identificador da propriedade (attomId, APN, ou endereço)
   - **NÃO** suporta busca por raio com lat/lng
   - **NÃO** retorna múltiplos comparables

2. **`/salescomparable/snapshot`** - Endpoint correto para comparables
   - Retorna múltiplas vendas comparáveis
   - **MAS** a documentação indica que este endpoint pode estar **DEPRECIADO**
   - Pode não suportar lat/lng search, apenas endereço

### ✅ SOLUÇÃO CORRETA

Baseado na documentação oficial do Attom API V1.0.0, existem estas opções:

#### Opção 1: Sale Snapshot + Address (Atual Fallback) ✅
```
GET /propertyapi/v1.0.0/sale/snapshot?address1={street}&address2={city,state}&radius={miles}
```
- Funciona com endereço
- Retorna vendas recentes dentro do raio
- **PROBLEMA:** Não aceita lat/lng diretamente

#### Opção 2: Geocode First + Sale Snapshot 🎯 RECOMENDADO
```
1. Geocode address primeiro (se não tiver lat/lng)
2. GET /propertyapi/v1.0.0/sale/snapshot?latitude={lat}&longitude={lng}&radius={miles}
```
- Verifica se `/sale/snapshot` aceita lat/lng
- Se não, usar apenas o endereço

#### Opção 3: Property Snapshot Expanded + Filter 🔄
```
GET /propertyapi/v1.0.0/property/snapshot?latitude={lat}&longitude={lng}&radius={miles}
```
- Retorna propriedades (não apenas vendas)
- Filtrar por vendas recentes no client-side

---

## 📊 Estrutura de Resposta Validada

Baseado na documentação oficial, a resposta do Attom API tem esta estrutura:

### Response Structure
```json
{
  "status": {
    "version": "1.0.0",
    "code": 200,
    "msg": "Success",
    "total": 10,
    "page": 1,
    "pagesize": 10
  },
  "property": [
    {
      "identifier": {
        "obPropId": "...",
        "fips": "...",
        "apn": "...",
        "attomId": "..."
      },
      "address": {
        "country": "US",
        "countrySubd": "FL",
        "line1": "123 Main St",
        "line2": "Unit A",
        "locality": "Orlando",
        "matchCode": "...",
        "oneLine": "...",
        "postal1": "32801",
        "postal2": "...",
        "postal3": "..."
      },
      "location": {
        "accuracy": "Street",
        "elevation": "0",
        "latitude": "28.5383",
        "longitude": "-81.3792",
        "distance": "0.5",
        "geoid": "..."
      },
      "sale": {
        "amount": {
          "saleAmt": "250000",
          "saleRecDate": "2024-01-15",
          "saleTransDate": "2024-01-10"
        },
        "calculation": {
          "pricePerBed": "83333",
          "pricePerSqft": "166"
        }
      },
      "building": {
        "size": {
          "bldgSize": "1500",
          "livingSize": "1500",
          "grossSize": "1500"
        },
        "rooms": {
          "beds": "3",
          "bathsTotal": "2",
          "bathsFull": "2",
          "bathsHalf": "0"
        },
        "summary": {
          "yearBuilt": "1995",
          "propertyType": "SFR",
          "archStyle": "...",
          "quality": "..."
        }
      }
    }
  ]
}
```

---

## 🔧 Correções Necessárias no Código

### Problema 1: Mapeamento de Dados Incorreto

**Código Atual (Linha 185-186):**
```typescript
saleDate: sale.saleTransDate || new Date().toISOString().split('T')[0],
salePrice: parseInt(sale.saleAmt) || 0,
```

**❌ ERRO:** `sale.saleTransDate` e `sale.saleAmt` estão INCORRETOS

**✅ CORRETO (baseado na estrutura da API):**
```typescript
saleDate: sale.amount?.saleTransDate || sale.amount?.saleRecDate || new Date().toISOString().split('T')[0],
salePrice: parseInt(sale.amount?.saleAmt) || 0,
```

A resposta do Attom API tem `sale.amount.saleAmt`, não `sale.saleAmt`!

### Problema 2: Endpoint `/sale/detail` Não Retorna Múltiplos Comps

**Código Atual (Linha 140):**
```typescript
url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/detail?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
```

**❌ PROBLEMA:**
- `/sale/detail` é para UMA propriedade específica
- Não retorna múltiplos comparables
- Não suporta radius search

**✅ SOLUÇÃO:**

Usar `/sale/snapshot` ou `/property/snapshot`:

```typescript
// Opção A: Sale Snapshot (se suportar lat/lng)
url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/snapshot?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;

// Opção B: Property Snapshot + filtrar por vendas
url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/snapshot?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
```

---

## ✅ Código Corrigido Completo

```typescript
async function fetchFromAttom(
  address: string,
  city: string,
  state: string,
  radius: number = 1,
  latitude?: number,
  longitude?: number
): Promise<ComparableData[]> {
  if (!ATTOM_API_KEY) {
    console.log('⚠️ Attom API key not configured');
    return [];
  }

  try {
    console.log(`🏠 Trying Attom Data API (radius: ${radius}mi)...`);

    let url: string;

    // CORREÇÃO: Usar /sale/snapshot ao invés de /sale/detail
    if (latitude && longitude) {
      // Tentar busca por coordenadas primeiro
      url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/snapshot?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
      console.log(`📍 Using coordinate search: ${latitude}, ${longitude} within ${radius}mi`);
    } else {
      // Fallback para busca por endereço
      url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/snapshot?address1=${encodeURIComponent(address)}&address2=${encodeURIComponent(city + ', ' + state)}&radius=${radius}`;
      console.log(`📮 Using address search: ${address}, ${city}, ${state}`);
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'apikey': ATTOM_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Attom API status: ${response.status}`, errorText);

      // Se erro 400 com lat/lng, tentar fallback para endereço
      if (response.status === 400 && latitude && longitude) {
        console.log('⚠️ Lat/lng search failed, trying address fallback...');
        url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/snapshot?address1=${encodeURIComponent(address)}&address2=${encodeURIComponent(city + ', ' + state)}&radius=${radius}`;

        const retryResponse = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'apikey': ATTOM_API_KEY,
          },
        });

        if (!retryResponse.ok) {
          console.log('❌ Address fallback also failed');
          return [];
        }

        const retryData = await retryResponse.json();
        return parseAttomResponse(retryData, city, state);
      }

      return [];
    }

    const data = await response.json();
    return parseAttomResponse(data, city, state);

  } catch (error) {
    console.error('❌ Attom error:', error);
    return [];
  }
}

// Helper function para parsear resposta
function parseAttomResponse(data: any, defaultCity: string, defaultState: string): ComparableData[] {
  if (!data.property || !Array.isArray(data.property)) {
    console.log('⚠️ No properties in Attom response');
    return [];
  }

  const comps: ComparableData[] = data.property.map((prop: any) => {
    // CORREÇÃO: Acesso correto aos campos da API
    const sale = prop.sale || {};
    const saleAmount = sale.amount || {};
    const building = prop.building || {};
    const buildingSize = building.size || {};
    const buildingRooms = building.rooms || {};
    const buildingSummary = building.summary || {};
    const addr = prop.address || {};
    const location = prop.location || {};

    // Parse coordinates
    const lat = parseFloat(location.latitude || '');
    const lng = parseFloat(location.longitude || '');
    const distance = parseFloat(location.distance || '0');

    return {
      address: addr.line1 || addr.oneLine || '',
      city: addr.locality || defaultCity,
      state: addr.countrySubd || defaultState,
      zipCode: addr.postal1 || '',

      // CORREÇÃO: Usar sale.amount.saleTransDate e sale.amount.saleAmt
      saleDate: saleAmount.saleTransDate || saleAmount.saleRecDate || new Date().toISOString().split('T')[0],
      salePrice: parseInt(saleAmount.saleAmt) || 0,

      // CORREÇÃO: Usar building.rooms.beds e building.rooms.bathsTotal
      beds: parseInt(buildingRooms.beds) || 3,
      baths: parseFloat(buildingRooms.bathsTotal) || 2,

      // CORREÇÃO: Usar building.size.livingSize
      sqft: parseInt(buildingSize.livingSize || buildingSize.bldgSize) || 1500,

      // CORREÇÃO: Usar building.summary.yearBuilt
      yearBuilt: parseInt(buildingSummary.yearBuilt) || 2000,

      propertyType: buildingSummary.propertyType || 'SFR',
      source: 'attom',
      latitude: Number.isFinite(lat) ? lat : undefined,
      longitude: Number.isFinite(lng) ? lng : undefined,
      distance: Number.isFinite(distance) ? distance : undefined
    };
  });

  const validComps = comps.filter(c => c.salePrice > 0 && c.salePrice < 100000000); // Filter outliers
  console.log(`✅ Found ${validComps.length} valid comps from Attom Data`);

  return validComps;
}
```

---

## 🧪 Como Testar

### 1. Teste com curl (sem API key)
```bash
# Teste de estrutura (vai falhar sem API key mas mostra estrutura de erro)
curl -X GET "https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/snapshot?latitude=28.5383&longitude=-81.3792&radius=3" \
  -H "Accept: application/json" \
  -H "apikey: YOUR_API_KEY"
```

### 2. Teste no Supabase Edge Function
```typescript
// Adicionar logging detalhado
console.log('📦 Raw Attom response:', JSON.stringify(data, null, 2));
console.log('📊 Response structure:', {
  hasProperty: !!data.property,
  isArray: Array.isArray(data.property),
  count: data.property?.length,
  firstProp: data.property?.[0]
});
```

### 3. Verificar Estrutura Real
```typescript
// Log primeiro property para ver estrutura real
if (data.property && data.property[0]) {
  console.log('🔍 First property structure:');
  console.log('  sale:', Object.keys(data.property[0].sale || {}));
  console.log('  building:', Object.keys(data.property[0].building || {}));
  console.log('  location:', Object.keys(data.property[0].location || {}));
}
```

---

## 📋 Checklist de Validação

### Endpoint
- [ ] Confirmar que `/sale/snapshot` aceita latitude/longitude
- [ ] Verificar se precisa de fallback para endereço
- [ ] Testar com API key real

### Mapeamento de Dados
- [ ] Validar `sale.amount.saleAmt` ao invés de `sale.saleAmt`
- [ ] Validar `sale.amount.saleTransDate` ao invés de `sale.saleTransDate`
- [ ] Validar `building.size.livingSize` ao invés de `building.size?.livingSize`
- [ ] Validar `building.rooms.beds` ao invés de `building.rooms?.beds`
- [ ] Validar `building.rooms.bathsTotal` ao invés de `building.rooms?.bathsTotal`
- [ ] Validar `building.summary.yearBuilt` ao invés de `building.summary?.yearBuilt`

### Response Handling
- [ ] Verificar se `data.property` é array
- [ ] Filtrar vendas com preço > 0
- [ ] Preservar latitude/longitude de `location.latitude` e `location.longitude`
- [ ] Extrair distância de `location.distance`

### Error Handling
- [ ] Tratar erro 400 (bad request)
- [ ] Tratar erro 401 (API key inválida)
- [ ] Tratar erro 404 (endpoint não existe)
- [ ] Implementar retry com endereço se lat/lng falhar

---

## ⚠️ AÇÃO IMEDIATA NECESSÁRIA

1. **Alterar endpoint de `/sale/detail` para `/sale/snapshot`**
2. **Corrigir mapeamento de campos com estrutura aninhada**
3. **Adicionar fallback se lat/lng search não funcionar**
4. **Testar com API key real para validar estrutura de resposta**

---

## 🎯 Próximos Passos

1. Aplicar correções no código
2. Deploy da edge function atualizada
3. Testar com propriedade real
4. Validar comps retornados no mapa
5. Comparar com demo data para garantir mesma estrutura

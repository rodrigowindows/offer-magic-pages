/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GUIA DE INTEGRAÇÃO: ATTOM V2 SALES COMPARABLES NO EDGE FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * ARQUIVO: supabase/functions/fetch-comps/index.ts
 * 
 * PASSO 1: Adicionar mapeamento de counties no topo do arquivo
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Adicionar após os imports existentes:

const CITY_TO_COUNTY_MAP: Record<string, string> = {
  // Orange County (Orlando)
  'Orlando': 'Orange',
  'Winter Park': 'Orange',
  'Ocoee': 'Orange',
  'Belle Isle': 'Orange',
  'Eatonville': 'Orange',
  'Apopka': 'Orange',
  'Edgewood': 'Orange',
  'Maitland': 'Orange',
  // Seminole County
  'Altamonte Springs': 'Seminole',
  'Casselberry': 'Seminole',
  'Longwood': 'Seminole',
  // Osceola County
  'Kissimmee': 'Osceola',
  'Poinciana': 'Osceola',
  'St Cloud': 'Osceola',
};

function getCountyByCity(city: string): string {
  return CITY_TO_COUNTY_MAP[city] || 'Orange'; // Default to Orange if not found
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PASSO 2: Adicionar função ATTOM V2 corrigida
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Substitua a função fetchFromAttom() existente por esta:

async function fetchFromAttomV2(
  address: string,
  city: string,
  state: string,
  zipCode: string
): Promise<ComparableData[]> {
  if (!ATTOM_API_KEY) {
    console.log('⚠️ ATTOM_API_KEY not configured');
    return [];
  }

  try {
    // PASSO CRÍTICO: Obter county name
    const county = getCountyByCity(city);
    console.log(`🏠 ATTOM V2: Fetching ${address}, ${city}, ${county}, ${state} ${zipCode}`);

    // URL CORRIGIDA: /property/v2/salescomparables/address/{street}/{city}/{county}/{state}/{zip}
    const url = `https://api.gateway.attomdata.com/property/v2/salescomparables/address/${encodeURIComponent(address)}/${encodeURIComponent(city)}/${encodeURIComponent(county)}/${state}/${zipCode}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'APIKey': ATTOM_API_KEY,
        'User-Agent': 'MyLocalInvest-CMA/1.0'
      }
    });

    if (!response.ok) {
      console.log(`❌ ATTOM V2 error (${response.status}):`, await response.text());
      return [];
    }

    const data = await response.json();

    if (!data.property || !Array.isArray(data.property) || data.property.length === 0) {
      console.log('⚠️ No comparables from ATTOM V2');
      return [];
    }

    const comps: ComparableData[] = data.property
      .map((prop: any) => {
        const addr = prop.address || {};
        const loc = prop.location || {};
        const propDetails = prop.property || {};
        const sale = prop.sale || {};

        return {
          address: `${addr.line1 || ''}`,
          city: addr.city || city,
          state: addr.state || state,
          zipCode: addr.zip || zipCode,
          saleDate: sale.saleTransactionDate || new Date().toISOString().split('T')[0],
          salePrice: Number(sale.saleAmt) || 0,
          beds: Number(propDetails.bedrooms) || 0,
          baths: Number(propDetails.bathrooms) || 0,
          sqft: Number(propDetails.sqft) || 0,
          yearBuilt: Number(propDetails.yearBuilt) || 0,
          propertyType: 'Single Family',
          source: 'attom',
          latitude: loc.latitude ? Number(loc.latitude) : undefined,
          longitude: loc.longitude ? Number(loc.longitude) : undefined,
          distance: loc.distance ? Number(loc.distance) : undefined
        };
      })
      .filter(c => c.salePrice > 0);

    console.log(`✅ Got ${comps.length} comparables from ATTOM V2`);
    return comps;

  } catch (error) {
    console.error('❌ ATTOM V2 error:', error);
    return [];
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PASSO 3: Atualizar função serve() para usar ATTOM V2
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Na função serve(), substitua a chamada a fetchFromAttom por:

// 1️⃣ Try ATTOM V2 (Sales Comparables)
if (ATTOM_API_KEY && comps.length < 3) {
  console.log('1️⃣ Trying ATTOM V2 Sales Comparables...');
  const attomV2Comps = await fetchFromAttomV2(
    address,
    city || 'Orlando',
    state || 'FL',
    zipCode || '32801'
  );
  if (attomV2Comps.length > 0) {
    comps = attomV2Comps;
    source = 'attom';
    console.log(`✅ SUCCESS: Got ${comps.length} comps from ATTOM V2`);
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PASSO 4: Testar localmente
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/*
curl -X POST http://localhost:54321/functions/v1/fetch-comps \
  -H "Content-Type: application/json" \
  -d '{
    "address": "25217 Mathew St",
    "city": "Orlando",
    "state": "FL",
    "zipCode": "32709",
    "basePrice": 100000,
    "latitude": 28.5440,
    "longitude": -81.3770
  }'

Resposta esperada (se ATTOM_API_KEY está configurada):
{
  "success": true,
  "comps": [
    {
      "address": "3820 Colonial Dr",
      "city": "Orlando",
      "state": "FL",
      "zipCode": "32801",
      "saleDate": "2026-01-08",
      "salePrice": 112000,
      "beds": 4,
      "baths": 2,
      "sqft": 2083,
      "propertyType": "Single Family",
      "source": "attom",
      "latitude": 28.5431,
      "longitude": -81.3710,
      "distance": 0.5
    },
    // ... mais comps ...
  ],
  "source": "attom",
  "isDemo": false,
  "count": 6,
  "message": "Found 6 real comparables from attom"
}
*/

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PASSO 5: Deploy no Supabase
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/*
# Login
npx supabase login

# Deploy
npx supabase functions deploy fetch-comps --project-ref atwdkhlyrffbaugkaker

# Ver logs
supabase functions logs fetch-comps --project-ref atwdkhlyrffbaugkaker
*/

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHECKLIST FINAL
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/*
✅ Adicionar CITY_TO_COUNTY_MAP ao topo de index.ts
✅ Adicionar função getCountyByCity()
✅ Substituir fetchFromAttom() por fetchFromAttomV2()
✅ Atualizar cascata de APIs: ATTOM V2 como primeira opção
✅ Testar URL formatação: /property/v2/salescomparables/address/{street}/{city}/{county}/{state}/{zip}
✅ Executar migration: supabase/migrations/20260125_attom_v2_support.sql
✅ Deploy: npx supabase functions deploy fetch-comps
✅ Testar com uma propriedade real
✅ Verificar logs em: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/logs/edge-functions

RESULTADO ESPERADO:
❌ ANTES: source: "demo", isDemo: true (porque V1 não funciona)
✅ DEPOIS: source: "attom", isDemo: false (V2 funciona!)
*/

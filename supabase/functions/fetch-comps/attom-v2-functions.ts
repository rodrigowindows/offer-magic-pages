/**
 * ATTOM Sales Comparables API V2 - Função Corrigida
 * 
 * Adicione este código ao arquivo: supabase/functions/fetch-comps/index.ts
 * 
 * Substitua a função fetchFromAttom() existente por esta versão V2
 * 
 * Documentação: https://api.developer.attomdata.com/docs
 * Endpoint: GET /property/v2/salescomparables/address/{street}/{city}/{county}/{state}/{zip}
 */

interface ComparableData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  saleDate: string;
  salePrice: number;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  propertyType: string;
  source: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
}
// ===== ATTOM V2: Sales Comparables API (CORRECTED ROUTE) =====
// Sign up at https://api.developer.attomdata.com/
async function fetchFromAttomV2(
  address: string,
  city: string,
  county: string,
  state: string,
  zipCode: string,
  ATTOM_API_KEY: string
): Promise<ComparableData[]> {
  if (!ATTOM_API_KEY) {
    console.log('⚠️ ATTOM_API_KEY not configured');
    return [];
  }

  if (!county) {
    console.log('⚠️ County name required for ATTOM V2 API');
    return [];
  }

  try {
    console.log(`🏠 Fetching from ATTOM Sales Comparables V2...`);
    console.log(`📍 Address: ${address}, City: ${city}, County: ${county}, State: ${state}, ZIP: ${zipCode}`);

    // ROTA CORRIGIDA: V2 sales comparables
    // Base: https://api.gateway.attomdata.com/property/v2
    // Path: /salescomparables/address/{street}/{city}/{county}/{state}/{zip}
    const encodedAddress = encodeURIComponent(address);
    const encodedCity = encodeURIComponent(city);
    const encodedCounty = encodeURIComponent(county);

    const url = `https://api.gateway.attomdata.com/property/v2/salescomparables/address/${encodedAddress}/${encodedCity}/${encodedCounty}/${state}/${zipCode}`;

    console.log(`🔗 Request URL: ${url.substring(0, 100)}...`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'APIKey': ATTOM_API_KEY,
        'User-Agent': 'MyLocalInvest-CMA/1.0 (contact@mylocalinvest.com)'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ ATTOM V2 API error (HTTP ${response.status}):`, errorText.substring(0, 200));
      return [];
    }

    const data = await response.json();

    // Extrair comparables (API V2 retorna em RESPONSE_GROUP)
    const comps = extractAttomV2Comparables(data, { city, state, zipCode });

    if (comps.length === 0) {
      console.log('⚠️ No comparables returned from ATTOM V2');
      return [];
    }

    console.log(`✅ Parsed ${comps.length} valid comparables from ATTOM V2`);
    return comps;

  } catch (error) {
    console.error('❌ ATTOM V2 fetch failed:', error);
    return [];
  }
}

// ==== Helpers ====
function extractAttomV2Comparables(data: any, defaults: { city: string; state: string; zipCode: string }): ComparableData[] {
  const results: ComparableData[] = [];

  // Formato observado na API V2 (RESPONSE_GROUP)
  const v2Props = data?.RESPONSE_GROUP?.RESPONSE?.RESPONSE_DATA?.PROPERTY_INFORMATION_RESPONSE_ext?.SUBJECT_PROPERTY_ext?.PROPERTY;
  if (Array.isArray(v2Props)) {
    const parsedV2 = v2Props
      .map((entry: any) => parseAttomV2Comparable(entry, defaults))
      .filter((comp: ComparableData | null) => comp !== null && comp.salePrice > 0) as ComparableData[];

    results.push(...parsedV2);
  }

  // Fallback para formato antigo (data.property)
  if (Array.isArray(data?.property)) {
    const parsedLegacy = data.property
      .map((prop: any) => parseLegacyComparable(prop, defaults))
      .filter((comp: ComparableData | null) => comp !== null && comp.salePrice > 0) as ComparableData[];

    results.push(...parsedLegacy);
  }

  return results;
}

function parseLegacyComparable(prop: any, defaults: { city: string; state: string; zipCode: string }): ComparableData | null {
  try {
    const addr = prop.address || {};
    const loc = prop.location || {};
    const propDetails = prop.property || {};
    const sale = prop.sale || {};

    const salePrice = sale.saleAmt || sale.saleAmount || 0;
    if (!salePrice) return null;

    return {
      address: `${addr.line1 || ''}, ${addr.city || defaults.city}, ${addr.state || defaults.state} ${addr.zip || defaults.zipCode}`,
      city: addr.city || defaults.city,
      state: addr.state || defaults.state,
      zipCode: addr.zip || defaults.zipCode,
      salePrice: Number(salePrice) || 0,
      saleDate: sale.saleTransactionDate || sale.saleTransDate || new Date().toISOString().split('T')[0],
      beds: Number(propDetails.bedrooms || propDetails.beds || 0),
      baths: Number(propDetails.bathrooms || propDetails.bathsTotal || 0),
      sqft: Number(propDetails.sqft || propDetails.livingSize || propDetails.universalSize || 0),
      yearBuilt: propDetails.yearBuilt ? Number(propDetails.yearBuilt) : 0,
      latitude: loc.latitude ? Number(loc.latitude) : undefined,
      longitude: loc.longitude ? Number(loc.longitude) : undefined,
      distance: loc.distance ? Number(loc.distance) : undefined,
      propertyType: propDetails.propertyType || 'Single Family',
      source: 'attom'
    };
  } catch (error) {
    console.warn('⚠️ Error parsing legacy comparable:', error);
    return null;
  }
}

function parseAttomV2Comparable(entry: any, defaults: { city: string; state: string; zipCode: string }): ComparableData | null {
  try {
    const c = entry?.COMPARABLE_PROPERTY_ext;
    if (!c) return null;

    const sale = c.SALES_HISTORY || {};
    const structure = c.STRUCTURE || {};

    const salePrice = Number(sale['@PropertySalesAmount'] || 0);
    if (!salePrice || Number.isNaN(salePrice)) return null;

    return {
      address: String(c['@_StreetAddress'] || '').trim(),
      city: String(c['@_City'] || defaults.city),
      state: String(c['@_State'] || defaults.state),
      zipCode: String(c['@_PostalCode'] || defaults.zipCode),
      saleDate: String(sale['@TransferDate_ext'] || sale['@PropertySalesDate'] || new Date().toISOString().split('T')[0]),
      salePrice,
      beds: Number(structure['@TotalBedroomCount'] || 0),
      baths: Number(structure['@TotalBathroomCount'] || 0),
      sqft: Number(structure['@GrossLivingAreaSquareFeetCount'] || 0),
      yearBuilt: structure.STRUCTURE_ANALYSIS?.['@PropertyStructureBuiltYear'] ? Number(structure.STRUCTURE_ANALYSIS['@PropertyStructureBuiltYear']) : 0,
      latitude: c['@LatitudeNumber'] ? Number(c['@LatitudeNumber']) : undefined,
      longitude: c['@LongitudeNumber'] ? Number(c['@LongitudeNumber']) : undefined,
      distance: c['@DistanceFromSubjectPropertyMilesCount'] ? Number(c['@DistanceFromSubjectPropertyMilesCount']) : undefined,
      propertyType: String(c['@StandardUseDescription_ext'] || 'Single Family'),
      source: 'attom'
    };
  } catch (error) {
    console.warn('⚠️ Error parsing V2 comparable:', error);
    return null;
  }
}

/**
 * ALTERNATIVA: Usar ATTOM AVM API para obter value + comparables
 * Retorna mais informações de valuation
 */
async function fetchFromAttomAVM(
  address: string,
  city: string,
  state: string,
  zipCode: string,
  ATTOM_API_KEY: string
): Promise<{
  comps: ComparableData[],
  avmValue?: number,
  avmConfidence?: number,
  avmRange?: { min: number, max: number }
}> {
  if (!ATTOM_API_KEY) {
    return { comps: [] };
  }

  try {
    console.log(`🎯 Fetching AVM data from ATTOM...`);

    const url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/attomavm/detail?address1=${encodeURIComponent(address)}&address2=${encodeURIComponent(city + ', ' + state + ' ' + zipCode)}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'APIKey': ATTOM_API_KEY
      }
    });

    if (!response.ok) {
      console.log('⚠️ AVM API error:', response.status);
      return { comps: [] };
    }

    const data = await response.json();

    if (!data.property || !Array.isArray(data.property)) {
      console.log('⚠️ No AVM data from ATTOM');
      return { comps: [] };
    }

    const prop = data.property[0];
    if (!prop) {
      return { comps: [] };
    }

    const avm = prop.avm || {};
    const avmValue = avm.avmValue || null;
    const avmConfidence = avm.avmConfidence || null;

    console.log(`✅ Got AVM Value: $${avmValue} (Confidence: ${avmConfidence}%)`);

    return {
      comps: [], // AVM não retorna comps direto, usar V2 para isso
      avmValue: avmValue ? Number(avmValue) : undefined,
      avmConfidence: avmConfidence ? Number(avmConfidence) : undefined,
      avmRange: avmValue ? {
        min: Math.round(Number(avmValue) * 0.90),
        max: Math.round(Number(avmValue) * 1.10)
      } : undefined
    };

  } catch (error) {
    console.error('❌ ATTOM AVM fetch failed:', error);
    return { comps: [] };
  }
}

export { fetchFromAttomV2, fetchFromAttomAVM };

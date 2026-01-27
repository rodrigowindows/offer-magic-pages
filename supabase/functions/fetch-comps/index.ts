import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CITY_TO_COUNTY_MAP, getCountyByCity, suggestCounty } from './cityCountyMap.ts';

function generateRequestId() {
  return Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// API Keys from environment (all have free tiers!)
// ⚠️ HARDCODED FALLBACK: Usar apenas se secret não estiver configurado no Supabase
// TODO: Remover hardcoded após configurar secret no Supabase
const ATTOM_API_KEY = Deno.env.get('ATTOM_API_KEY') || 'ab8b3f3032756d9c17529dc80e07049b'; // 1000 free requests/month
const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY') || ''; // 100 free requests/month

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
  source: 'attom-v2' | 'attom-v1' | 'attom' | 'zillow-api' | 'county-csv' | 'none';
  latitude?: number;
  longitude?: number;
  distance: number; // Always required
}

const EARTH_RADIUS_MILES = 3958.8;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2))
    * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
}

function addDistanceAndFilterByRadius(
  comps: ComparableData[],
  centerLat?: number,
  centerLng?: number,
  radiusMiles?: number
): ComparableData[] {
  if (centerLat == null || centerLng == null || radiusMiles == null) {
    return comps;
  }

  return comps
    .map(comp => {
      if (comp.latitude == null || comp.longitude == null) {
        return comp;
      }

      const distanceMiles = haversineMiles(centerLat, centerLng, comp.latitude, comp.longitude);
      return {
        ...comp,
        distance: Math.round(distanceMiles * 10) / 10
      };
    })
    .filter(comp => comp.distance == null || comp.distance <= radiusMiles);
}

// REMOVED: generateDemoComps function - no longer using demo data fallback
// If no comps are found, return empty array instead

// ===== City to County Map (required for ATTOM V2) =====
// ...existing code...

// ===== OPTION 1A: Attom Data API V2 (PREFERRED - Sales Comparables) =====
// V2 endpoint that works with Free Trial: /property/v2/salescomparables/address
async function fetchFromAttomV2(
  address: string,
  city: string,
  county: string,
  state: string,
  zipCode: string
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
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      const isAddressNotFound = response.status === 400 && errorText.includes('Unable to locate a property record');
      
      if (isAddressNotFound) {
        console.log(`⚠️ ATTOM V2: Address not found in database (HTTP ${response.status})`);
        console.log(`📍 Address: ${address}, ${city}, ${county}, ${state} ${zipCode}`);
      } else {
        console.log(`❌ ATTOM V2 API error (HTTP ${response.status}):`, errorText.substring(0, 200));
      }
      return [];
    }

    const data = await response.json();

    // Extract comparables from V2 format (RESPONSE_GROUP)
    const comps = extractAttomV2Comparables(data, { city, state, zipCode });

    if (comps.length === 0) {
      console.log('⚠️ ATTOM V2: No comparables found (API returned data but parser found 0 valid comps)');
      return [];
    }

    console.log(`✅ ATTOM V2: Successfully parsed ${comps.length} valid comparables`);
    return comps;

  } catch (error) {
    console.error('❌ ATTOM V2 fetch failed:', error);
    return [];
  }
}

// V2 Parser
function extractAttomV2Comparables(data: any, defaults: { city: string; state: string; zipCode: string }): ComparableData[] {
  const results: ComparableData[] = [];

  // Log estrutura recebida para debugging
  console.log('📦 ATTOM V2 Response Structure:', JSON.stringify(Object.keys(data || {})));

  // V2 format (RESPONSE_GROUP)
  const v2Props = data?.RESPONSE_GROUP?.RESPONSE?.RESPONSE_DATA?.PROPERTY_INFORMATION_RESPONSE_ext?.SUBJECT_PROPERTY_ext?.PROPERTY;

  if (Array.isArray(v2Props)) {
    console.log(`✅ Found V2 format with ${v2Props.length} properties`);
    const parsedV2 = v2Props
      .map((entry: any) => parseAttomV2Comparable(entry, defaults))
      .filter((comp: ComparableData | null) => comp !== null && comp.salePrice > 0) as ComparableData[];
    results.push(...parsedV2);
  } else if (v2Props) {
    console.log('⚠️ V2 format found but not an array:', typeof v2Props);
  } else {
    console.log('⚠️ V2 format (RESPONSE_GROUP) not found in response');
  }

  // Fallback for legacy format (data.property)
  if (Array.isArray(data?.property)) {
    console.log(`✅ Found legacy format with ${data.property.length} properties`);
    const parsedLegacy = data.property
      .map((prop: any) => parseLegacyComparable(prop, defaults))
      .filter((comp: ComparableData | null) => comp !== null && comp.salePrice > 0) as ComparableData[];
    results.push(...parsedLegacy);
  } else if (data?.property) {
    console.log('⚠️ Legacy format found but not an array:', typeof data.property);
  }

  if (results.length === 0) {
    console.error('❌ No comparables extracted from ATTOM V2 response');
    console.log('📋 Full response structure:', JSON.stringify(data, null, 2).substring(0, 1000));
  }

  return results;
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
      distance: c['@DistanceFromSubjectPropertyMilesCount'] ? Number(c['@DistanceFromSubjectPropertyMilesCount']) : 0,
      propertyType: String(c['@StandardUseDescription_ext'] || 'Single Family'),
      source: 'attom'
    };
  } catch (error) {
    console.warn('⚠️ Error parsing V2 comparable:', error);
    return null;
  }
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
      distance: loc.distance ? Number(loc.distance) : 0,
      propertyType: propDetails.propertyType || 'Single Family',
      source: 'attom'
    };
  } catch (error) {
    console.warn('⚠️ Error parsing legacy comparable:', error);
    return null;
  }
}

// ===== OPTION 1B: Attom Data API V1 (FALLBACK - Property Search) =====
// Sign up at https://api.developer.attomdata.com/
// FREE TRIAL endpoints that work: property/address, sale/detail, avm/detail, expandedprofile
async function fetchFromAttom(address: string, city: string, state: string, radius: number = 1, zipCode?: string): Promise<ComparableData[]> {
  if (!ATTOM_API_KEY) {
    console.log('⚠️ Attom API key not configured');
    return [];
  }

  try {
    console.log(`🏠 Trying Attom Data API (1000 free/month, radius: ${radius}mi)...`);

    // Extract ZIP code from address if not provided
    if (!zipCode) {
      const zipMatch = `${address} ${city} ${state}`.match(/\b\d{5}\b/);
      zipCode = zipMatch ? zipMatch[0] : '';
    }

    if (!zipCode) {
      console.log('⚠️ No ZIP code found, cannot search nearby properties');
      return [];
    }

    console.log(`📍 Searching properties near ZIP ${zipCode} within ${radius} miles...`);

    // Search nearby properties by ZIP code
    const searchUrl = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/address?postalcode=${zipCode}&radius=${radius}`;

    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
        'apikey': ATTOM_API_KEY,
      },
    });

    if (!searchResponse.ok) {
      console.log('❌ Attom search failed:', searchResponse.status, await searchResponse.text());
      return [];
    }

    const searchData = await searchResponse.json();

    if (!searchData.property || !Array.isArray(searchData.property)) {
      console.log('⚠️ No properties found near ZIP', zipCode);
      return [];
    }

    console.log(`📊 Found ${searchData.property.length} properties nearby, extracting comparables...`);

    // Extract comps from nearby properties with sale data
    const comps: ComparableData[] = searchData.property
      .slice(0, 20) // Limit to first 20 to avoid too many requests
      .map((prop: any) => {
        const sale = prop.sale || {};
        const building = prop.building || {};
        const addr = prop.address || {};
        const location = prop.location || {};

        // Only include if has sale data
        if (!sale.saleTransDate || !sale.saleAmt) {
          return null;
        }

        // Check sale is recent (within 1 year)
        const saleDate = new Date(sale.saleTransDate);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        if (saleDate < oneYearAgo) {
          return null;
        }

        const latitude = parseFloat(
          location.latitude || location.lat || addr.latitude || addr.lat || ''
        );
        const longitude = parseFloat(
          location.longitude || location.lng || location.lon || addr.longitude || addr.lng || ''
        );

        return {
          address: `${addr.line1 || ''}`,
          city: addr.locality || city,
          state: addr.countrySubd || state,
          zipCode: addr.postal1 || zipCode,
          saleDate: sale.saleTransDate || new Date().toISOString().split('T')[0],
          salePrice: parseInt(sale.saleAmt) || 0,
          beds: parseInt(building.rooms?.beds) || 3,
          baths: parseFloat(building.rooms?.bathsTotal) || 2,
          sqft: parseInt(building.size?.livingSize || building.size?.livingsize) || 1500,
          yearBuilt: parseInt(building.summary?.yearBuilt || building.summary?.yearbuilt) || 2000,
          propertyType: building.summary?.propertyType || 'Single Family',
          source: 'attom',
          latitude: Number.isFinite(latitude) ? latitude : undefined,
          longitude: Number.isFinite(longitude) ? longitude : undefined,
          distance: 0 // Will be calculated later
        };
      })
      .filter((comp: ComparableData | null): comp is ComparableData => comp !== null && comp.salePrice > 0);

    console.log(`✅ Found ${comps.length} comps with recent sales from Attom Data`);
    return comps;
  } catch (error) {
    console.error('❌ Attom error:', error);
    return [];
  }
}

// ===== OPTION 2: Orange County CSV Scraper (100% FREE - Public Records) =====
async function fetchFromOrangeCountyCSV(address: string, city: string): Promise<ComparableData[]> {
  try {
    console.log('🍊 Trying Orange County Public CSV...');

    // Orange County provides monthly CSV exports of all sales
    const csvUrl = 'https://www.ocpafl.org/downloads/sales.csv';

    const response = await fetch(csvUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      console.log('❌ CSV download failed:', response.status);
      return [];
    }

    const csvText = await response.text();
    const lines = csvText.split('\n');

    if (lines.length < 2) {
      console.log('⚠️ Empty CSV');
      return [];
    }

    // Parse header
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

    // Parse rows and filter
    const comps: ComparableData[] = [];
    const searchCity = city.toLowerCase();
    const searchStreet = address.split(' ').slice(1).join(' ').toLowerCase();

    for (let i = 1; i < Math.min(lines.length, 5000); i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) continue;

      const row: any = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx]?.trim() || '';
      });

      // Filter by city and nearby streets
      const rowCity = (row.city || row.situs_city || '').toLowerCase();
      const rowAddress = (row.address || row.situs_address || '').toLowerCase();

      if (rowCity.includes(searchCity) || searchCity.includes(rowCity)) {
        const salePrice = parseInt(row.sale_price || row.price || row.sale_amount || '0');
        const latitude = parseFloat(row.latitude || row.lat || row.y || '');
        const longitude = parseFloat(row.longitude || row.lng || row.lon || row.x || '');

        if (salePrice > 10000) { // Filter out $1 sales
          comps.push({
            address: row.address || row.situs_address || '',
            city: row.city || row.situs_city || city,
            state: 'FL',
            zipCode: row.zip || row.zipcode || '',
            saleDate: row.sale_date || row.recording_date || new Date().toISOString().split('T')[0],
            salePrice,
            beds: parseInt(row.bedrooms || row.beds || '3'),
            baths: parseFloat(row.bathrooms || row.baths || '2'),
            sqft: parseInt(row.living_area || row.sqft || row.square_feet || '1500'),
            yearBuilt: parseInt(row.year_built || row.effective_year || '2000'),
            propertyType: row.property_type || 'Single Family',
            source: 'county-csv',
            latitude: Number.isFinite(latitude) ? latitude : undefined,
            longitude: Number.isFinite(longitude) ? longitude : undefined,
            distance: 0
          });
        }
      }

      if (comps.length >= 15) break; // Got enough
    }

    console.log(`✅ Found ${comps.length} comps from Orange County CSV`);
    return comps;
  } catch (error) {
    console.error('❌ CSV parsing error:', error);
    return [];
  }
}

// ===== OPTION 3: Zillow via RapidAPI (FREE TIER - 100 requests/month) =====
// Sign up at https://rapidapi.com/apimaker/api/zillow-com1
async function fetchFromZillowRapidAPI(address: string, city: string, state: string): Promise<ComparableData[]> {
  if (!RAPIDAPI_KEY) {
    console.log('⚠️ RapidAPI key not configured');
    return [];
  }

  try {
    console.log('🏠 Trying Zillow via RapidAPI (100 free/month)...');

    const url = `https://zillow-com1.p.rapidapi.com/similarSales?zpid=0&location=${encodeURIComponent(address + ', ' + city + ', ' + state)}`;

    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      console.log('❌ RapidAPI status:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.comparables || !Array.isArray(data.comparables)) {
      console.log('⚠️ No comparables from Zillow');
      return [];
    }

    const comps: ComparableData[] = data.comparables.map((comp: any) => ({
      address: comp.address?.streetAddress || '',
      city: comp.address?.city || city,
      state: comp.address?.state || state,
      zipCode: comp.address?.zipcode || '',
      saleDate: comp.dateSold || new Date().toISOString().split('T')[0],
      salePrice: comp.price || 0,
      beds: comp.bedrooms || 3,
      baths: comp.bathrooms || 2,
      sqft: comp.livingArea || 1500,
      yearBuilt: comp.yearBuilt || 2000,
      propertyType: comp.homeType || 'Single Family',
      source: 'zillow-api',
      latitude: comp.latitude || comp.lat || comp.address?.latitude,
      longitude: comp.longitude || comp.lng || comp.address?.longitude
    }));

    const validComps = comps.filter(c => c.salePrice > 0);
    console.log(`✅ Found ${validComps.length} comps from Zillow RapidAPI`);
    return validComps;
  } catch (error) {
    console.error('❌ RapidAPI error:', error);
    return [];
  }
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = generateRequestId();
  const startTime = Date.now();
  try {
    const { address, city, state, basePrice, radius = 1, latitude, longitude, zipCode, testSource } = await req.json();
    // Melhor extração de zipCode
    let extractedZipCode = zipCode;
    if (!extractedZipCode) {
      const zipMatch = `${address} ${city} ${state}`.match(/\b\d{5}(?:-\d{4})?\b/);
      extractedZipCode = zipMatch ? zipMatch[0] : '';
      // Se ainda não encontrou e tem coordenadas, logar possível uso de reverse geocoding
      if (!extractedZipCode && latitude && longitude) {
        console.log(`⚠️ No ZIP code found, using coordinates: ${latitude}, ${longitude}`);
      }
    }
    // TESTE INDIVIDUAL DE API
    if (testSource === 'attom-v2') {
      let extractedZipCode = zipCode;
      if (!extractedZipCode) {
        const zipMatch = `${address} ${city} ${state}`.match(/\b\d{5}\b/);
        extractedZipCode = zipMatch ? zipMatch[0] : '';
      }
      const county = getCountyByCity(city || 'Orlando', state || 'FL') || suggestCounty(city || 'Orlando', state || 'FL');
      const attomV2Comps = await fetchFromAttomV2(address, city || 'Orlando', county, state || 'FL', extractedZipCode);
      return new Response(JSON.stringify({
        comps: attomV2Comps,
        source: 'attom-v2',
        count: attomV2Comps.length,
        tested: 'attom-v2',
        error: attomV2Comps.length === 0 ? 'No comps found from Attom V2' : null
      }), { headers: corsHeaders });
    }
    if (testSource === 'zillow') {
      const zillowApiComps = await fetchFromZillowRapidAPI(address, city || 'Orlando', state || 'FL');
      return new Response(JSON.stringify({
        comps: zillowApiComps,
        source: 'zillow',
        count: zillowApiComps.length,
        tested: 'zillow',
        error: zillowApiComps.length === 0 ? 'No comps found from Zillow' : null
      }), { headers: corsHeaders });
    }
    if (testSource === 'county-csv') {
      const countyComps = await fetchFromOrangeCountyCSV(address, city || 'Orlando');
      return new Response(JSON.stringify({
        comps: countyComps,
        source: 'county-csv',
        count: countyComps.length,
        tested: 'county-csv',
        error: countyComps.length === 0 ? 'No comps found from County CSV' : null
      }), { headers: corsHeaders });
    }

    console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] 🔍 Fetching comps:`, {
      address, city, state, zipCode, radius, basePrice, coordinates: { latitude, longitude }
    });

    console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] 🔑 API Keys configured: Attom=${!!ATTOM_API_KEY}, RapidAPI=${!!RAPIDAPI_KEY}`);

    let comps: ComparableData[] = [];
    let source = 'demo';
    const apiErrors: Record<string, string> = {};
    const testedSources: string[] = [];

    // ===== CASCATA DE FONTES (tentativas em ordem de qualidade) =====
    // 1️⃣ PRIORITY: Try ATTOM V2 Sales Comparables (most accurate)
    if (ATTOM_API_KEY && comps.length < 3) {
      testedSources.push('attom-v2');
      console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] 🔄 [1a/4] Attempting ATTOM V2...`, { address, city, state, zipCode });
      let extractedZipCode = zipCode;
      if (!extractedZipCode) {
        const zipMatch = `${address} ${city} ${state}`.match(/\b\d{5}\b/);
        extractedZipCode = zipMatch ? zipMatch[0] : '';
      }
      const county = getCountyByCity(city || 'Orlando', state || 'FL') || suggestCounty(city || 'Orlando', state || 'FL');
      const v2Start = Date.now();
      if (extractedZipCode && county) {
        const attomV2Comps = await fetchFromAttomV2(address, city || 'Orlando', county, state || 'FL', extractedZipCode);
        const v2Time = Date.now() - v2Start;
        console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] ✅ ATTOM V2 response:`, { status: attomV2Comps.length > 0 ? 'success' : 'empty', timeMs: v2Time, comps: attomV2Comps.length });
        if (attomV2Comps && attomV2Comps.length > 0) {
          comps = attomV2Comps;
          source = 'attom-v2';
          if (comps.length < 3) {
            console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] ⚠️ ATTOM V2 returned ${comps.length} comps, combining with V1 fallback...`);
            const attomV1Comps = await fetchFromAttom(address, city || 'Orlando', state || 'FL', radius, zipCode);
            const deduplicateComps = (arr: ComparableData[]) => {
              const seen = new Set();
              return arr.filter(c => {
                const key = `${c.address}|${c.saleDate}|${c.salePrice}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
            };
            comps = deduplicateComps([...comps, ...(attomV1Comps || [])]);
          } else {
            console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] ✅ Got ${comps.length} comps from ATTOM V2`);
          }
        } else {
          apiErrors['attom-v2'] = 'No comps found or address not recognized';
          console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] ⚠️ ATTOM V2 returned ${attomV2Comps?.length || 0} comps, trying V1 fallback...`);
        }
      } else {
        console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] ⚠️ Missing ZIP (${extractedZipCode}) or County (${county}), skipping ATTOM V2`);
      }
    }

    // 1️⃣b FALLBACK: Try ATTOM V1 Property Search if V2 failed
    if (ATTOM_API_KEY && comps.length < 3) {
      testedSources.push('attom-v1');
      const v1Start = Date.now();
      console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] 🔄 [1b/4] Attempting ATTOM V1 Property Search (fallback)...`);
      const attomComps = await fetchFromAttom(address, city || 'Orlando', state || 'FL', radius, zipCode);
      const v1Time = Date.now() - v1Start;
      if (attomComps && attomComps.length >= 3) {
        comps = attomComps;
        source = 'attom-v1';
        console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] ✅ Got ${comps.length} comps from ATTOM V1 in ${v1Time}ms`);
      } else {
        apiErrors['attom-v1'] = 'No comps found or insufficient comps';
        console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] ❌ ATTOM V1 failed or returned insufficient comps (${attomComps?.length || 0})`);
      }
    }

    if (!ATTOM_API_KEY) {
      console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] ⚠️ ATTOM_API_KEY not configured.`);
    }

    // 2️⃣ FALLBACK: Try Zillow/RapidAPI
    if (!comps || comps.length < 3) {
      testedSources.push('zillow');
      if (RAPIDAPI_KEY) {
        const zillowStart = Date.now();
        console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] 🔄 [2/4] Attempting Zillow via RapidAPI...`);
        const zillowApiComps = await fetchFromZillowRapidAPI(address, city || 'Orlando', state || 'FL');
        const zillowTime = Date.now() - zillowStart;
        if (zillowApiComps && zillowApiComps.length >= 3) {
          comps = zillowApiComps;
          source = 'zillow-api';
          console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] ✅ Got ${comps.length} comps from Zillow in ${zillowTime}ms`);
        } else {
          apiErrors['zillow'] = 'No comps found or insufficient comps';
          console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] ❌ Zillow fallback failed or returned insufficient comps (${zillowApiComps?.length || 0})`);
        }
      } else {
        console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] ⚠️ RAPIDAPI_KEY not configured.`);
      }
    }

    // 3️⃣ Try Orange County CSV (100% FREE - Public records for Orlando/FL)
    if ((city?.toLowerCase().includes('orlando') || state === 'FL') && (!comps || comps.length < 3)) {
      testedSources.push('county-csv');
      const csvStart = Date.now();
      console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] 🔄 Trying Orange County Public CSV...`);
      const countyComps = await fetchFromOrangeCountyCSV(address, city || 'Orlando');
      const csvTime = Date.now() - csvStart;
      if (countyComps && countyComps.length > 0) {
        comps = [...(comps || []), ...countyComps];
        source = comps[0]?.source || 'county-csv';
        console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] ✅ Got ${countyComps.length} comps from Orange County CSV in ${csvTime}ms`);
      } else {
        apiErrors['county-csv'] = 'No comps found in Orange County CSV';
        console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] ❌ Orange County CSV returned no comps`);
      }
    }

    // Fallback por coordenadas se todas APIs falharem
    if ((!comps || comps.length === 0) && latitude && longitude) {
      console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] 🔄 Attempting coordinate-based search...`);
      // Aqui você pode implementar fetchCompsByCoordinates se disponível
      // Exemplo: const coordinateBasedComps = await fetchCompsByCoordinates(latitude, longitude, radius, basePrice);
      // if (coordinateBasedComps && coordinateBasedComps.length > 0) {
      //   comps = coordinateBasedComps;
      //   source = 'coordinate-based';
      // }
    }
    if (!comps || comps.length === 0) {
      console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] ⚠️ No comparables found from any source`);
      source = 'none';
    }

    // Filter, deduplicate, and sort (only if we have comps)
    let sortedComps: ComparableData[] = [];
    let addressNotFound = false;
    let noResultsFound = false;

    if (comps && comps.length > 0) {
      const compsBeforeFilters = comps.length;
      console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] 📊 Processando comps: ${compsBeforeFilters} comps antes de filtros`);
      
      const filteredComps = addDistanceAndFilterByRadius(comps, latitude, longitude, radius);
      const compsAfterDistanceFilter = filteredComps.length;
      if (filteredComps.length > 0) {
        comps = filteredComps;
        console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] 📊 Após filtro de distância: ${compsAfterDistanceFilter} comps (removidos: ${compsBeforeFilters - compsAfterDistanceFilter})`);
      }

      const uniqueComps = Array.from(
        new Map(comps.map(c => [`${c.address}-${c.salePrice}`, c])).values()
      );
      const compsAfterDeduplication = uniqueComps.length;
      console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] 📊 Após deduplicação: ${compsAfterDeduplication} comps (removidos: ${comps.length - compsAfterDeduplication})`);

      sortedComps = uniqueComps
        .filter(c => c.salePrice > 10000)
        .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
        .slice(0, 10);
      
      const compsAfterPriceFilter = sortedComps.length;
      console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] 📊 Após filtro de preço e ordenação: ${compsAfterPriceFilter} comps finais`);

      // Log resumido dos primeiros 3 comps processados
      if (sortedComps.length > 0) {
        const compsSummary = sortedComps.slice(0, 3).map((c, i) => ({
          index: i + 1,
          address: c.address,
          price: c.salePrice,
          distance: c.distance,
          sqft: c.sqft
        }));
        console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] 📋 Primeiros comps processados:`, compsSummary);
        console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] 🗺️ First comp coordinates:`, sortedComps[0]?.latitude, sortedComps[0]?.longitude);
      }
      
      console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] 📊 Resumo processamento: ${compsBeforeFilters} → ${compsAfterDistanceFilter} → ${compsAfterDeduplication} → ${compsAfterPriceFilter} comps finais`);
    } else {
      noResultsFound = true;
      addressNotFound = true;
      console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] 📊 Final Result: 0 comps - No comparables found`);
    }

    const isDemo = false;
    let message = '';
    if (sortedComps.length > 0) {
      message = `Found ${sortedComps.length} comparables from ${source}`;
    } else if (addressNotFound) {
      message = `Address not found in property databases. Please verify the address and try again.`;
    } else if (noResultsFound) {
      message = `No comparable properties found in this area. This may indicate: no recent sales, address not in database, or API configuration issues.`;
    } else {
      message = `No comparables available.`;
    }

    const totalTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] [REQUEST-${requestId}] 📦 Response:`, {
      success: sortedComps.length > 0,
      source,
      count: sortedComps.length,
      message,
      addressNotFound,
      noResultsFound,
      totalTimeMs: totalTime
    });

    return new Response(JSON.stringify({
      success: sortedComps.length > 0,
      comps: sortedComps,
      source,
      isDemo,
      count: sortedComps.length,
      message,
      addressNotFound,
      noResultsFound,
      apiKeysConfigured: {
        attom: !!ATTOM_API_KEY,
        rapidapi: !!RAPIDAPI_KEY
      },
      testedSources,
      apiErrors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] [REQUEST-${requestId}] ❌ Fatal Error:`, error, { totalTimeMs: totalTime });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      comps: [],
      source: 'none',
      isDemo: false,
      count: 0,
      message: `Error fetching comparables: ${errorMessage}`,
      apiError: true,
      apiKeysConfigured: {
        attom: !!ATTOM_API_KEY,
        rapidapi: !!RAPIDAPI_KEY
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

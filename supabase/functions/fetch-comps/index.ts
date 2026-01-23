import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// API Keys from environment (all have free tiers!)
const ATTOM_API_KEY = Deno.env.get('ATTOM_API_KEY') || ''; // 1000 free requests/month
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
  source: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
}

// Generate realistic demo data based on property value with coordinates
function generateDemoComps(basePrice: number, city: string, count: number = 6, centerLat: number = 28.5383, centerLng: number = -81.3792): ComparableData[] {
  const streets = [
    'Oak St', 'Pine Ave', 'Maple Dr', 'Cedar Ln', 'Palm Way',
    'Sunset Blvd', 'Lake View Dr', 'Park Ave', 'Main St', 'Colonial Dr'
  ];

  const comps: ComparableData[] = [];

  // Orlando default coordinates: 28.5383° N, 81.3792° W
  // 0.01 degrees ≈ 1.1 km (0.7 miles)
  const maxRadius = 0.02; // ~2.2 km radius

  for (let i = 0; i < count; i++) {
    const variance = (Math.random() - 0.5) * 0.3;
    const price = Math.round(basePrice * (1 + variance));
    const sqft = Math.round(1200 + Math.random() * 1500);
    const beds = Math.floor(2 + Math.random() * 3);
    const baths = Math.floor(1 + Math.random() * 2.5);
    const yearBuilt = Math.floor(1970 + Math.random() * 50);

    const daysAgo = Math.floor(Math.random() * 180);
    const saleDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Generate coordinates within small radius of center (±0.02 degrees)
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * maxRadius;
    const lat = centerLat + (radius * Math.cos(angle));
    const lng = centerLng + (radius * Math.sin(angle));
    const distance = Math.sqrt(Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2)) * 111; // rough km conversion

    comps.push({
      address: `${Math.floor(100 + Math.random() * 9900)} ${streets[Math.floor(Math.random() * streets.length)]}`,
      city: city || 'Orlando',
      state: 'FL',
      zipCode: `328${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
      saleDate: saleDate.toISOString().split('T')[0],
      salePrice: price,
      beds,
      baths,
      sqft,
      yearBuilt,
      propertyType: 'Single Family',
      source: 'demo',
      latitude: lat,
      longitude: lng,
      distance: Math.round(distance * 10) / 10 // Round to 1 decimal
    });
  }

  return comps.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
}

// ===== OPTION 1: Attom Data API (FREE TIER - 1000 requests/month) =====
// Sign up at https://api.developer.attomdata.com/
async function fetchFromAttom(address: string, city: string, state: string, radius: number = 1): Promise<ComparableData[]> {
  if (!ATTOM_API_KEY) {
    console.log('⚠️ Attom API key not configured');
    return [];
  }

  try {
    console.log(`🏠 Trying Attom Data API (1000 free/month, radius: ${radius}mi)...`);

    const url = `https://api.attomdata.com/propertyapi/v1.0.0/salescomparable/snapshot?address1=${encodeURIComponent(address)}&address2=${encodeURIComponent(city + ', ' + state)}&radius=${radius}&maxComps=10`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'apikey': ATTOM_API_KEY,
      },
    });

    if (!response.ok) {
      console.log('❌ Attom API status:', response.status, await response.text());
      return [];
    }

    const data = await response.json();

    if (!data.property || !Array.isArray(data.property)) {
      console.log('⚠️ No comps from Attom');
      return [];
    }

    const comps: ComparableData[] = data.property.map((prop: any) => {
      const sale = prop.sale || {};
      const building = prop.building || {};
      const addr = prop.address || {};

      return {
        address: `${addr.line1 || ''}`,
        city: addr.locality || city,
        state: addr.countrySubd || state,
        zipCode: addr.postal1 || '',
        saleDate: sale.saleTransDate || new Date().toISOString().split('T')[0],
        salePrice: parseInt(sale.saleAmt) || 0,
        beds: parseInt(building.rooms?.beds) || 3,
        baths: parseInt(building.rooms?.bathsTotal) || 2,
        sqft: parseInt(building.size?.livingSize) || 1500,
        yearBuilt: parseInt(building.summary?.yearBuilt) || 2000,
        propertyType: building.summary?.propertyType || 'Single Family',
        source: 'attom'
      };
    });

    const validComps = comps.filter(c => c.salePrice > 0);
    console.log(`✅ Found ${validComps.length} comps from Attom Data`);
    return validComps;
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
            source: 'county-csv'
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
      source: 'zillow-api'
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

  try {
    const { address, city, state, basePrice, radius = 1 } = await req.json();

    console.log(`🔍 Fetching comps for: ${address}, ${city}, ${state}, basePrice: $${basePrice}, radius: ${radius}mi`);
    console.log(`🔑 API Keys configured: Attom=${!!ATTOM_API_KEY}, RapidAPI=${!!RAPIDAPI_KEY}`);

    let comps: ComparableData[] = [];
    let source = 'demo';

    // ===== CASCATA DE FONTES (tentativas em ordem de qualidade) =====

    // 1️⃣ Try Attom Data API (BEST - Real MLS data, 1000 free/month)
    if (ATTOM_API_KEY && comps.length < 3) {
      console.log('1️⃣ Trying Attom Data API...');
      const attomComps = await fetchFromAttom(address, city || 'Orlando', state || 'FL', radius);
      if (attomComps.length > 0) {
        comps = attomComps;
        source = 'attom';
        console.log(`✅ SUCCESS: Got ${comps.length} comps from Attom Data (MLS)`);
      }
    }

    // 2️⃣ Try Zillow RapidAPI (GOOD - 100 free/month)
    if (RAPIDAPI_KEY && comps.length < 3) {
      console.log('2️⃣ Trying Zillow RapidAPI...');
      const zillowApiComps = await fetchFromZillowRapidAPI(address, city || 'Orlando', state || 'FL');
      if (zillowApiComps.length > 0) {
        comps = [...comps, ...zillowApiComps];
        source = comps[0]?.source || 'zillow-api';
        console.log(`✅ SUCCESS: Got ${zillowApiComps.length} comps from Zillow API`);
      }
    }

    // 3️⃣ Try Orange County CSV (100% FREE - Public records for Orlando/FL)
    if ((city?.toLowerCase().includes('orlando') || state === 'FL') && comps.length < 3) {
      console.log('3️⃣ Trying Orange County Public CSV...');
      const countyComps = await fetchFromOrangeCountyCSV(address, city || 'Orlando');
      if (countyComps.length > 0) {
        comps = [...comps, ...countyComps];
        source = comps[0]?.source || 'county-csv';
        console.log(`✅ SUCCESS: Got ${countyComps.length} comps from Orange County CSV`);
      }
    }

    // 4️⃣ Fallback to realistic demo data
    if (comps.length < 3) {
      console.log('⚠️ No real data sources available - using realistic demo data');
      console.log('💡 To get real data:');
      console.log('   - Sign up for Attom Data: https://api.developer.attomdata.com/ (1000 free/month)');
      console.log('   - Sign up for RapidAPI: https://rapidapi.com/apimaker/api/zillow-com1 (100 free/month)');
      console.log('   - Add ATTOM_API_KEY and RAPIDAPI_KEY to Supabase Edge Function secrets');

      comps = generateDemoComps(basePrice || 250000, city || 'Orlando', 6);
      source = 'demo';
    }

    // Filter, deduplicate, and sort
    const uniqueComps = Array.from(
      new Map(comps.map(c => [`${c.address}-${c.salePrice}`, c])).values()
    );

    const sortedComps = uniqueComps
      .filter(c => c.salePrice > 10000) // Filter out suspicious $1 sales
      .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
      .slice(0, 10);

    console.log(`✅ Returning ${sortedComps.length} comps (source: ${source})`);

    return new Response(JSON.stringify({
      success: true,
      comps: sortedComps,
      source,
      count: sortedComps.length,
      apiKeysConfigured: {
        attom: !!ATTOM_API_KEY,
        rapidapi: !!RAPIDAPI_KEY
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Fatal Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      comps: generateDemoComps(250000, 'Orlando', 6),
      source: 'demo'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

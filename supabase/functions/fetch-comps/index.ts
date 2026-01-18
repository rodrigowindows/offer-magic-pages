import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
}

// Generate realistic demo data based on property value
function generateDemoComps(basePrice: number, city: string, count: number = 6): ComparableData[] {
  const streets = [
    'Oak St', 'Pine Ave', 'Maple Dr', 'Cedar Ln', 'Palm Way',
    'Sunset Blvd', 'Lake View Dr', 'Park Ave', 'Main St', 'Colonial Dr'
  ];
  
  const comps: ComparableData[] = [];
  
  for (let i = 0; i < count; i++) {
    const variance = (Math.random() - 0.5) * 0.3; // -15% to +15%
    const price = Math.round(basePrice * (1 + variance));
    const sqft = Math.round(1200 + Math.random() * 1500);
    const beds = Math.floor(2 + Math.random() * 3);
    const baths = Math.floor(1 + Math.random() * 2.5);
    const yearBuilt = Math.floor(1970 + Math.random() * 50);
    
    // Random date in last 6 months
    const daysAgo = Math.floor(Math.random() * 180);
    const saleDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    
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
      source: 'demo'
    });
  }
  
  return comps.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
}

// Try to fetch from Redfin public data (no API key needed)
async function fetchFromRedfin(city: string, state: string): Promise<ComparableData[]> {
  try {
    const searchUrl = `https://www.redfin.com/stingray/api/gis-csv?al=1&market=${state.toLowerCase()}&min_stories=1&num_homes=20&ord=redfin-recommended-asc&page_number=1&region_id=0&region_type=2&sold_within_days=90&status=9&uipt=1,2,3&v=8`;
    
    console.log('Trying Redfin:', searchUrl);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.log('Redfin returned:', response.status);
      return [];
    }
    
    const csvText = await response.text();
    const lines = csvText.split('\n').slice(1); // Skip header
    
    const comps: ComparableData[] = [];
    for (const line of lines.slice(0, 10)) {
      const cols = line.split(',');
      if (cols.length > 10) {
        comps.push({
          address: cols[1]?.replace(/"/g, '') || '',
          city: cols[2]?.replace(/"/g, '') || city,
          state: cols[3]?.replace(/"/g, '') || state,
          zipCode: cols[4]?.replace(/"/g, '') || '',
          saleDate: cols[14]?.replace(/"/g, '') || new Date().toISOString().split('T')[0],
          salePrice: parseInt(cols[5]?.replace(/[^0-9]/g, '')) || 0,
          beds: parseInt(cols[6]) || 0,
          baths: parseFloat(cols[7]) || 0,
          sqft: parseInt(cols[8]?.replace(/[^0-9]/g, '')) || 0,
          yearBuilt: parseInt(cols[11]) || 2000,
          propertyType: cols[10]?.replace(/"/g, '') || 'Single Family',
          source: 'redfin'
        });
      }
    }
    
    console.log(`Found ${comps.length} comps from Redfin`);
    return comps.filter(c => c.salePrice > 0);
  } catch (error) {
    console.error('Redfin error:', error);
    return [];
  }
}

// Try RealtyMole API (free tier available)
async function fetchFromRealtyMole(address: string, city: string, state: string): Promise<ComparableData[]> {
  try {
    const apiKey = Deno.env.get('REALTYMOLE_API_KEY');
    if (!apiKey) {
      console.log('No RealtyMole API key');
      return [];
    }
    
    const url = `https://realty-mole-property-api.p.rapidapi.com/saleListings?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&limit=10`;
    
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'realty-mole-property-api.p.rapidapi.com',
      },
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return (data || []).map((sale: any) => ({
      address: sale.formattedAddress || sale.addressLine1 || '',
      city: sale.city || city,
      state: sale.state || state,
      zipCode: sale.zipCode || '',
      saleDate: sale.lastSoldDate || new Date().toISOString().split('T')[0],
      salePrice: sale.lastSoldPrice || sale.price || 0,
      beds: sale.bedrooms || 0,
      baths: sale.bathrooms || 0,
      sqft: sale.squareFootage || 0,
      yearBuilt: sale.yearBuilt || 2000,
      propertyType: sale.propertyType || 'Single Family',
      source: 'realtymole'
    }));
  } catch (error) {
    console.error('RealtyMole error:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, city, state, basePrice } = await req.json();
    
    console.log(`🔍 Fetching comps for: ${address}, ${city}, ${state}`);
    
    let comps: ComparableData[] = [];
    
    // Try real data sources
    comps = await fetchFromRedfin(city || 'Orlando', state || 'FL');
    
    if (comps.length < 3) {
      const moleComps = await fetchFromRealtyMole(address, city, state);
      comps = [...comps, ...moleComps];
    }
    
    // Fallback to demo data if no real data found
    if (comps.length < 3) {
      console.log('⚠️ Using demo data - no real comps found');
      comps = generateDemoComps(basePrice || 250000, city || 'Orlando', 6);
    }
    
    console.log(`✅ Returning ${comps.length} comps (source: ${comps[0]?.source})`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      comps,
      source: comps[0]?.source || 'demo'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
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

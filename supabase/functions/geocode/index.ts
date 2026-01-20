import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Rate limiting cache
const requestCache = new Map<string, number>();
const RATE_LIMIT_MS = 1000; // 1 second between requests to same address

// City/State approximate coordinates (fallback)
const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  'orlando,fl': { lat: 28.5383, lng: -81.3792 },
  'miami,fl': { lat: 25.7617, lng: -80.1918 },
  'tampa,fl': { lat: 27.9506, lng: -82.4572 },
  'jacksonville,fl': { lat: 30.3322, lng: -81.6557 },
  'tallahassee,fl': { lat: 30.4383, lng: -84.2807 },
  'fort lauderdale,fl': { lat: 26.1224, lng: -80.1373 },
  'st petersburg,fl': { lat: 27.7676, lng: -82.6403 },
  'hialeah,fl': { lat: 25.8576, lng: -80.2781 },
  'port st lucie,fl': { lat: 27.2730, lng: -80.3582 },
  'cape coral,fl': { lat: 26.5629, lng: -81.9495 },
};

function getCityStateKey(city: string, state: string): string {
  return `${city.toLowerCase()},${state.toLowerCase()}`;
}

async function geocodeWithGoogle(address: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      return {
        lat: data.results[0].geometry.location.lat,
        lng: data.results[0].geometry.location.lng,
      };
    } else {
      console.warn('⚠️ Google geocoding failed:', data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error('❌ Google geocoding error:', error);
    return null;
  }
}

async function geocodeWithNominatim(address: string): Promise<{ lat: number; lng: number } | null> {
  // Rate limiting check
  const lastRequest = requestCache.get(address);
  const now = Date.now();

  if (lastRequest && (now - lastRequest) < RATE_LIMIT_MS) {
    const waitTime = RATE_LIMIT_MS - (now - lastRequest);
    console.log(`⏱️ Rate limiting: waiting ${waitTime}ms for ${address}`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MyLocalInvest/1.0 (contact@mylocalinvest.com)',
      },
    });

    requestCache.set(address, Date.now());

    if (!response.ok) {
      console.warn(`⚠️ Nominatim HTTP error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    } else {
      console.warn('❌ Nominatim: No results for:', address);
      return null;
    }
  } catch (error) {
    console.error('❌ Nominatim error:', error);
    return null;
  }
}

function getCityApproximateCoords(city: string, state: string): { lat: number; lng: number } | null {
  const key = getCityStateKey(city, state);
  return cityCoordinates[key] || null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { address, city, state } = await req.json();

    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🌐 Geocoding request: ${address}`);

    let result: { lat: number; lng: number } | null = null;
    let source = 'unknown';

    // 1. Try Google Maps API (most reliable, but requires API key)
    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (googleApiKey) {
      result = await geocodeWithGoogle(address, googleApiKey);
      if (result) {
        source = 'google';
        console.log(`✅ Geocoded with Google: ${address}`, result);
      }
    }

    // 2. Fallback to Nominatim (free, but rate limited)
    if (!result) {
      result = await geocodeWithNominatim(address);
      if (result) {
        source = 'nominatim';
        console.log(`✅ Geocoded with Nominatim: ${address}`, result);
      }
    }

    // 3. Fallback to approximate city coordinates
    if (!result && city && state) {
      result = getCityApproximateCoords(city, state);
      if (result) {
        source = 'city_approximate';
        console.log(`✅ Using approximate city coords for: ${city}, ${state}`, result);
      }
    }

    // 4. Final fallback: Orlando, FL center (for demo purposes)
    if (!result) {
      result = { lat: 28.5383, lng: -81.3792 };
      source = 'default_fallback';
      console.warn(`⚠️ Using default fallback coords for: ${address}`);
    }

    return new Response(
      JSON.stringify({
        ...result,
        source,
        address,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Geocoding function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})

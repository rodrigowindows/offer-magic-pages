/**
 * Scrape Listing Data
 * Attempts to scrape property data from Zillow, Redfin, Trulia URLs
 * Uses a simple fetch + HTML parsing approach
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface ScrapedData {
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  success: boolean;
  source: string;
  error?: string;
}

/**
 * Extract JSON-LD data from HTML (many sites use this for SEO)
 */
function extractJsonLd(html: string): any {
  try {
    const match = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/is);
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
  } catch (e) {
    console.warn('Failed to parse JSON-LD:', e);
  }
  return null;
}

/**
 * Extract Open Graph meta tags
 */
function extractOpenGraph(html: string): Record<string, string> {
  const og: Record<string, string> = {};
  const matches = html.matchAll(/<meta\s+property=["']og:([^"']+)["']\s+content=["']([^"']+)["']/gi);
  for (const match of matches) {
    og[match[1]] = match[2];
  }
  return og;
}

/**
 * Try to scrape Zillow listing
 */
async function scrapeZillow(url: string): Promise<Partial<ScrapedData>> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const jsonLd = extractJsonLd(html);
    const og = extractOpenGraph(html);

    const data: Partial<ScrapedData> = {};

    // Try JSON-LD first (most reliable)
    if (jsonLd) {
      if (jsonLd.offers?.price) {
        data.price = parseInt(jsonLd.offers.price.replace(/[^0-9]/g, ''));
      }
      if (jsonLd.address) {
        data.address = jsonLd.address.streetAddress;
        data.city = jsonLd.address.addressLocality;
        data.state = jsonLd.address.addressRegion;
        data.zipCode = jsonLd.address.postalCode;
      }
      if (jsonLd.numberOfRooms) {
        data.beds = parseInt(jsonLd.numberOfRooms);
      }
      if (jsonLd.floorSize?.value) {
        data.sqft = parseInt(jsonLd.floorSize.value);
      }
    }

    // Try Open Graph as fallback
    if (!data.price && og['price:amount']) {
      data.price = parseInt(og['price:amount'].replace(/[^0-9]/g, ''));
    }

    return data;
  } catch (error: any) {
    console.error('Zillow scrape error:', error);
    return { error: error.message };
  }
}

/**
 * Main handler
 */
serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping URL:', url);

    // Detect source
    const lower = url.toLowerCase();
    let source = 'other';
    let scrapedData: Partial<ScrapedData> = {};

    if (lower.includes('zillow.com')) {
      source = 'zillow';
      scrapedData = await scrapeZillow(url);
    } else if (lower.includes('redfin.com')) {
      source = 'redfin';
      // Redfin has stricter anti-scraping, might not work
      scrapedData = { error: 'Redfin scraping not supported yet' };
    } else if (lower.includes('trulia.com')) {
      source = 'trulia';
      // Similar to Zillow (same parent company)
      scrapedData = await scrapeZillow(url); // Try same method
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Unsupported URL source' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result: ScrapedData = {
      ...scrapedData,
      success: !scrapedData.error && (!!scrapedData.price || !!scrapedData.address),
      source,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Scrape function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

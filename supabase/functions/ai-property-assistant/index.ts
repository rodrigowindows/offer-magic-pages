import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PropertyData {
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  estimatedValue?: number;
  cashOfferAmount?: number;
  ownerAddress?: string;
  ownerName?: string;
  ownerPhone?: string;
  answerFlag?: boolean;
  dncFlag?: boolean;
  neighborhood?: string;
  origem?: string;
  carta?: string;
  zillowUrl?: string;
  evaluation?: string;
  focar?: string;
  comparativePrice?: number;
}

const fetchPropertyImage = async (address: string): Promise<string | null> => {
  try {
    // Use Unsplash API to get property images
    const query = encodeURIComponent(`house home property ${address}`);
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${Deno.env.get('UNSPLASH_ACCESS_KEY') || ''}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].urls.regular;
      }
    }
  } catch (error) {
    console.error('Error fetching image from Unsplash:', error);
  }

  // Fallback to a default property image
  return "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80";
};

const parsePropertyData = async (input: string): Promise<PropertyData[]> => {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableApiKey) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  // Use AI to parse the property data
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'You are a property data parser. Extract property information from the provided text and return it as structured JSON. Each property should have: address, city (default: "Miami"), state (default: "FL"), zipCode, estimatedValue, cashOfferAmount, ownerAddress, ownerName, ownerPhone, answerFlag (boolean), dncFlag (boolean), neighborhood, origem, carta, zillowUrl, evaluation, focar, comparativePrice (number). If values are missing, use reasonable defaults or null.',
        },
        {
          role: 'user',
          content: input,
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'return_properties',
            description: 'Return the parsed property data',
            parameters: {
              type: 'object',
              properties: {
                properties: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      address: { type: 'string' },
                      city: { type: 'string' },
                      state: { type: 'string' },
                      zipCode: { type: 'string' },
                      estimatedValue: { type: 'number' },
                      cashOfferAmount: { type: 'number' },
                      ownerAddress: { type: 'string' },
                      ownerName: { type: 'string' },
                      ownerPhone: { type: 'string' },
                      answerFlag: { type: 'boolean' },
                      dncFlag: { type: 'boolean' },
                      neighborhood: { type: 'string' },
                      origem: { type: 'string' },
                      carta: { type: 'string' },
                      zillowUrl: { type: 'string' },
                      evaluation: { type: 'string' },
                      focar: { type: 'string' },
                      comparativePrice: { type: 'number' },
                    },
                    required: ['address'],
                  },
                },
              },
              required: ['properties'],
            },
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'return_properties' } },
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (!toolCall || !toolCall.function.arguments) {
    throw new Error('Failed to parse property data');
  }

  const parsed = JSON.parse(toolCall.function.arguments);
  return parsed.properties || [];
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, data } = await req.json();

    if (action === 'parse') {
      // Parse property data from text/CSV
      const properties = await parsePropertyData(data);
      
      // Fetch images for each property
      const propertiesWithImages = await Promise.all(
        properties.map(async (property) => {
          const imageUrl = await fetchPropertyImage(property.address);
          return { ...property, imageUrl };
        })
      );

      return new Response(
        JSON.stringify({ properties: propertiesWithImages }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (action === 'import') {
      // Import properties into database
      const { properties } = data;
      
      const generateSlug = (address: string): string => {
        return address
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
      };

      const insertData = properties.map((p: any) => ({
        slug: generateSlug(p.address),
        address: p.address,
        city: p.city || 'Miami',
        state: p.state || 'FL',
        zip_code: p.zipCode || '',
        estimated_value: p.estimatedValue || 0,
        cash_offer_amount: p.cashOfferAmount || 0,
        property_image_url: p.imageUrl || null,
        owner_address: p.ownerAddress || null,
        owner_name: p.ownerName || null,
        owner_phone: p.ownerPhone || null,
        answer_flag: p.answerFlag || false,
        dnc_flag: p.dncFlag || false,
        neighborhood: p.neighborhood || null,
        origem: p.origem || null,
        carta: p.carta || null,
        zillow_url: p.zillowUrl || null,
        evaluation: p.evaluation || null,
        focar: p.focar || null,
        comparative_price: p.comparativePrice || null,
      }));

      // Use upsert to handle duplicates - update existing properties
      const { data: upsertedData, error } = await supabase
        .from('properties')
        .upsert(insertData, { 
          onConflict: 'slug',
          ignoreDuplicates: false // Update existing records
        })
        .select();

      if (error) {
        console.error('Upsert error:', error);
        throw error;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          count: upsertedData?.length || 0,
          message: `Successfully imported/updated ${upsertedData?.length || 0} properties`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('Error in ai-property-assistant:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

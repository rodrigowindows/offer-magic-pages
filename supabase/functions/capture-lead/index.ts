import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, phone, email, address, message } = await req.json();

    // Basic validation
    if (!name || name.length < 2) {
      return new Response(JSON.stringify({ error: 'Name is required (min 2 chars)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!address || address.length < 10) {
      return new Response(JSON.stringify({ error: 'Full address is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check for duplicates
    const { data: existing } = await supabaseAdmin
      .from('properties')
      .select('id')
      .ilike('address', `%${address}%`)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ error: 'duplicate', message: 'A request with this address already exists' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const slug = address.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { error } = await supabaseAdmin.from('properties').insert([{
      owner_name: name,
      owner_phone: phone || null,
      email1: email || null,
      address,
      slug,
      zip_code: '00000',
      estimated_value: 0,
      cash_offer_amount: 0,
      status: 'active',
      lead_status: 'new',
    }]);

    if (error) {
      console.error('Insert error:', error);
      return new Response(JSON.stringify({ error: 'Failed to save lead' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Lead capture error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

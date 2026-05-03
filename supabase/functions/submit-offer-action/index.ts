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
    const body = await req.json();
    const {
      action_type, // 'increase_offer' | 'schedule_visit'
      property_id,
      property_address,
      name,
      phone,
      email,
      desired_amount,
      reason,
      preferred_times,
    } = body || {};

    if (!action_type || !['increase_offer', 'schedule_visit'].includes(action_type)) {
      return new Response(JSON.stringify({ error: 'Invalid action_type' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!name || String(name).trim().length < 2) {
      return new Response(JSON.stringify({ error: 'Name is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!phone || String(phone).replace(/\D/g, '').length < 10) {
      return new Response(JSON.stringify({ error: 'Valid phone is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const message = action_type === 'increase_offer'
      ? `Counter-offer ${desired_amount ? '$' + Number(desired_amount).toLocaleString() : ''} from ${name} for ${property_address || 'property'}`
      : `Visit request from ${name} for ${property_address || 'property'}`;

    const { error } = await admin.from('notifications').insert({
      property_id: property_id || null,
      event_type: action_type,
      message,
      metadata: { name, phone, email, desired_amount, reason, preferred_times, property_address },
    });

    if (error) {
      console.error('Insert error:', error);
      return new Response(JSON.stringify({ error: 'Failed to save request' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('submit-offer-action error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

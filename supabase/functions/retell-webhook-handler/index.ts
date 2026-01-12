import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const eventPayload = await req.json();
    const { event, call } = eventPayload;

    console.log(`Received Retell webhook: ${event}`, { call_id: call?.call_id });

    // Extract phone number from webhook call object
    const fromNumber = call?.from_number;
    let propertyInfo = null;
    let skipTraceInfo = null;
    let matchedBy = null;

    if (fromNumber) {
      // Clean the phone number for matching
      const cleanPhone = fromNumber.replace(/\D/g, '');

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );

      // First, try to find property by phone number in basic fields
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
        .from('properties')
        .select('*')
        .or(`owner_phone.eq.${fromNumber},phone1.eq.${fromNumber},phone2.eq.${fromNumber},phone3.eq.${fromNumber},phone4.eq.${fromNumber},phone5.eq.${fromNumber},owner_phone.eq.${cleanPhone},phone1.eq.${cleanPhone},phone2.eq.${cleanPhone},phone3.eq.${cleanPhone},phone4.eq.${cleanPhone},phone5.eq.${cleanPhone}`)
        .limit(1);

      if (properties && properties.length > 0) {
        matchedBy = 'exact_phone';
      }
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient
      let { data: properties } = await supabaseClient

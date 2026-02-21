// 🚨 VERSÃO v2.0 - DEPLOYED ON 2026-01-12 - SE VOCÊ VÊ ISSO, O DEPLOY FUNCIONOU! 🚨
// Se ao testar NÃO aparecer "version": "v2.0-debug-deployed" no resultado,
// significa que você está editando a função errada ou o cache não atualizou.

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

    console.log(`🔥 v2.0 Received Retell webhook: ${event}`, { call_id: call?.call_id, from_number: call?.from_number });

    const fromNumber = call?.from_number;
    let propertyInfo = null;
    let skipTraceInfo = null;
    let matchedBy = null;

    if (fromNumber) {
      // Clean phone: remove ALL non-digits
      const cleanPhone = fromNumber.replace(/\D/g, '');

      // Remove leading 1 for US numbers
      const cleanPhoneWithout1 = cleanPhone.startsWith('1') && cleanPhone.length === 11
        ? cleanPhone.substring(1)
        : cleanPhone;

      // Format as (XXX) XXX-XXXX for tag matching
      const formattedPhone = cleanPhoneWithout1.length === 10
        ? `(${cleanPhoneWithout1.slice(0, 3)}) ${cleanPhoneWithout1.slice(3, 6)}-${cleanPhoneWithout1.slice(6)}`
        : fromNumber;

      console.log('Phone variations:', {
        original: fromNumber,
        clean: cleanPhone,
        without1: cleanPhoneWithout1,
        formatted: formattedPhone
      });

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );

      // STEP 1: Try basic fields (owner_phone, phone1-7)
      console.log('STEP 1: Searching basic phone fields...');
      let { data: properties } = await supabaseClient
        .from('properties')
        .select('*')
        .or([
          `owner_phone.eq.${fromNumber}`,
          `owner_phone.eq.${cleanPhone}`,
          `owner_phone.eq.${cleanPhoneWithout1}`,
          `owner_phone.eq.${formattedPhone}`,
          `phone1.eq.${fromNumber}`,
          `phone1.eq.${cleanPhone}`,
          `phone1.eq.${cleanPhoneWithout1}`,
          `phone1.eq.${formattedPhone}`,
          `phone2.eq.${fromNumber}`,
          `phone2.eq.${cleanPhone}`,
          `phone2.eq.${cleanPhoneWithout1}`,
          `phone2.eq.${formattedPhone}`,
          `phone3.eq.${fromNumber}`,
          `phone3.eq.${cleanPhone}`,
          `phone3.eq.${cleanPhoneWithout1}`,
          `phone3.eq.${formattedPhone}`,
          `phone4.eq.${fromNumber}`,
          `phone4.eq.${cleanPhone}`,
          `phone4.eq.${cleanPhoneWithout1}`,
          `phone4.eq.${formattedPhone}`,
          `phone5.eq.${fromNumber}`,
          `phone5.eq.${cleanPhone}`,
          `phone5.eq.${cleanPhoneWithout1}`,
          `phone5.eq.${formattedPhone}`
        ].join(','))
        .limit(1);

      if (properties && properties.length > 0) {
        matchedBy = 'exact_phone_field';
        console.log('✅ Found in basic fields!');
      }

      // STEP 2: Try tags array
      if (!properties || properties.length === 0) {
        console.log('STEP 2: Searching tags...');

        const { data: allPropertiesWithTags } = await supabaseClient
          .from('properties')
          .select('*')
          .not('tags', 'is', null);

        if (allPropertiesWithTags && allPropertiesWithTags.length > 0) {
          console.log(`  Checking ${allPropertiesWithTags.length} properties with tags`);

          // Search for phone in tags
          const matchingProperties = allPropertiesWithTags.filter(property => {
            if (!Array.isArray(property.tags)) return false;

            // Check multiple tag formats
            const possibleTags = [
              `pref_phone:${fromNumber}`,
              `pref_phone:${cleanPhone}`,
              `pref_phone:${cleanPhoneWithout1}`,
              `pref_phone:${formattedPhone}`,
              `manual_phone:${fromNumber}`,
              `manual_phone:${cleanPhone}`,
              `manual_phone:${cleanPhoneWithout1}`,
              `manual_phone:${formattedPhone}`
            ];

            // Debug: Check first 3 properties
            if (allPropertiesWithTags.indexOf(property) < 3) {
              console.log(`  Property: ${property.address}, Tags:`, property.tags);
              console.log(`  Looking for:`, possibleTags);
            }

            const found = property.tags.some((tag: string) => possibleTags.includes(tag));
            if (found) {
              console.log(`  ✅ Found match in tags for property: ${property.address}`, property.tags);
            }
            return found;
          });

          if (matchingProperties.length > 0) {
            properties = matchingProperties;
            matchedBy = 'tag_phone';
            console.log('✅ Found in tags!');
          }
        }
      }

      // STEP 3: Get skip trace data if property found
      if (properties && properties.length > 0) {
        propertyInfo = properties[0];
        console.log(`Property found: ${propertyInfo.address} - ${propertyInfo.owner_name}`);

        try {
          const skipTraceResponse = await supabaseClient.functions.invoke('get-skip-trace-data', {
            body: { propertyId: propertyInfo.id },
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            }
          });

          if (skipTraceResponse.data?.success && skipTraceResponse.data?.data?.length > 0) {
            skipTraceInfo = skipTraceResponse.data.data[0];
            console.log('✅ Skip trace data loaded');
          }
        } catch (skipTraceError) {
          console.warn('Skip trace fetch failed:', skipTraceError);
        }
      } else {
        console.log('❌ No property found for phone:', fromNumber);
      }
    }

    const result = {
      event,
      call: {
        call_id: call?.call_id,
        from_number: call?.from_number,
        to_number: call?.to_number,
        direction: call?.direction,
        call_status: call?.call_status,
        start_timestamp: call?.start_timestamp,
        end_timestamp: call?.end_timestamp,
        disconnection_reason: call?.disconnection_reason,
      },
      property_found: !!propertyInfo,
      matched_by: matchedBy,
      debug: fromNumber ? {
        original: fromNumber,
        clean: fromNumber.replace(/\D/g, ''),
        without1: (fromNumber.replace(/\D/g, '').startsWith('1') && fromNumber.replace(/\D/g, '').length === 11)
          ? fromNumber.replace(/\D/g, '').substring(1)
          : fromNumber.replace(/\D/g, ''),
        formatted: fromNumber.replace(/\D/g, '').length === 10 || (fromNumber.replace(/\D/g, '').startsWith('1') && fromNumber.replace(/\D/g, '').length === 11)
          ? `(${(fromNumber.replace(/\D/g, '').startsWith('1') ? fromNumber.replace(/\D/g, '').substring(1) : fromNumber.replace(/\D/g, '')).slice(0, 3)}) ${(fromNumber.replace(/\D/g, '').startsWith('1') ? fromNumber.replace(/\D/g, '').substring(1) : fromNumber.replace(/\D/g, '')).slice(3, 6)}-${(fromNumber.replace(/\D/g, '').startsWith('1') ? fromNumber.replace(/\D/g, '').substring(1) : fromNumber.replace(/\D/g, '')).slice(6)}`
          : fromNumber
      } : null,
      property_info: propertyInfo ? {
        id: propertyInfo.id,
        address: propertyInfo.address,
        city: propertyInfo.city,
        state: propertyInfo.state,
        zip_code: propertyInfo.zip_code,
        owner_name: propertyInfo.owner_name,
        estimated_value: propertyInfo.estimated_value,
        cash_offer_amount: propertyInfo.cash_offer_amount,
      } : null,
      skip_trace_data: skipTraceInfo ? {
        total_phones: skipTraceInfo.skip_trace_summary?.total_phones || 0,
        total_emails: skipTraceInfo.skip_trace_summary?.total_emails || 0,
        has_owner_info: skipTraceInfo.skip_trace_summary?.has_owner_info || false,
        phones: skipTraceInfo.skip_trace_summary?.phones || [],
        emails: skipTraceInfo.skip_trace_summary?.emails || [],
        preferred_phones: skipTraceInfo.skip_trace_summary?.preferred_phones || [],
        preferred_emails: skipTraceInfo.skip_trace_summary?.preferred_emails || [],
        dnc_status: skipTraceInfo.skip_trace_summary?.dnc_status || 'Unknown',
        deceased_status: skipTraceInfo.skip_trace_summary?.deceased_status || 'Unknown',
      } : null,
      processed_at: new Date().toISOString(),
    };

    console.log('Webhook processed:', {
      event,
      call_id: call?.call_id,
      property_found: !!propertyInfo,
      matched_by: matchedBy,
      has_skiptrace: !!skipTraceInfo
    });

    return new Response(JSON.stringify({
      success: true,
      result,
      version: "v2.0-debug-deployed",
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      received_at: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

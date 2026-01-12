import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
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
      const cleanPhone = fromNumber.replace(/\D/g, "");

      const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");

      // First, try to find property by phone number in basic fields
      // Try both with +1 prefix and without
      let { data: properties } = await supabaseClient
        .from("properties")
        .select("*")
        .or(
          `owner_phone.eq.${fromNumber},phone1.eq.${fromNumber},phone2.eq.${fromNumber},phone3.eq.${fromNumber},phone4.eq.${fromNumber},phone5.eq.${fromNumber},owner_phone.eq.${cleanPhone},phone1.eq.${cleanPhone},phone2.eq.${cleanPhone},phone3.eq.${cleanPhone},phone4.eq.${cleanPhone},phone5.eq.${cleanPhone}`,
        )
        .limit(1);

      if (properties && properties.length > 0) {
        matchedBy = "exact_phone";
      }

      // If still no match, search in preferred_phones JSONB array
      if (!properties || properties.length === 0) {
        const { data: preferredProperties } = await supabaseClient
          .from("properties")
          .select("*")
          .contains("preferred_phones", [fromNumber]);

        if (!preferredProperties || preferredProperties.length === 0) {
          // Also try with cleaned phone in preferred_phones
          const { data: preferredCleanedProperties } = await supabaseClient
            .from("properties")
            .select("*")
            .contains("preferred_phones", [cleanPhone]);

          properties = preferredCleanedProperties;
          if (properties && properties.length > 0) {
            matchedBy = "preferred_cleaned_phone";
          }
        } else {
          properties = preferredProperties;
          matchedBy = "preferred_phone";
        }
      }

      // If still no match, search in tags array for phone numbers
      if (!properties || properties.length === 0) {
        // Format phone for searching in tags (e.g., (240) 581-4595)
        const formattedPhone =
          cleanPhone.length === 10
            ? `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`
            : fromNumber;

        // Search for phone numbers in tags - get all properties with tags and filter in code
        const { data: allProperties } = await supabaseClient.from("properties").select("*").not("tags", "is", null);

        // Filter properties that have the phone number in their tags
        const tagProperties =
          allProperties?.filter((property) => {
            if (!Array.isArray(property.tags)) return false;

            const phoneTags = [
              `pref_phone:${fromNumber}`,
              `manual_phone:${fromNumber}`,
              `pref_phone:${cleanPhone}`,
              `manual_phone:${cleanPhone}`,
              `pref_phone:${formattedPhone}`,
              `manual_phone:${formattedPhone}`,
            ];

            return property.tags.some((tag: string) => phoneTags.includes(tag));
          }) || [];

        properties = tagProperties;
        if (properties && properties.length > 0) {
          matchedBy = "tag_phone";
        }
      }

      // If still no match, search in skip_tracing_data JSON field
      if (!properties || properties.length === 0) {
        // Search for phone numbers in skip_tracing_data.phones array
        // This requires a more complex query since we need to search within JSON
        const { data: skipTraceProperties } = await supabaseClient
          .from("properties")
          .select("*")
          .not("skip_tracing_data", "is", null);

        // Filter properties that have the phone number in their skip_tracing_data
        const matchingProperties =
          skipTraceProperties?.filter((property) => {
            if (!property.skip_tracing_data || !property.skip_tracing_data.phones) return false;

            return property.skip_tracing_data.phones.some(
              (phone: any) =>
                phone.number === fromNumber ||
                phone.number === cleanPhone ||
                phone.number.replace(/\D/g, "") === cleanPhone,
            );
          }) || [];

        properties = matchingProperties;
        if (properties && properties.length > 0) {
          matchedBy = "skiptrace_data_phone";
        }
      }

      if (properties && properties.length > 0) {
        propertyInfo = properties[0];

        // Now fetch detailed skiptrace data for this property
        try {
          const skipTraceResponse = await supabaseClient.functions.invoke("get-skip-trace-data", {
            body: { propertyId: propertyInfo.id },
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
          });

          if (skipTraceResponse.data?.success && skipTraceResponse.data?.data?.length > 0) {
            skipTraceInfo = skipTraceResponse.data.data[0];
          }
        } catch (skipTraceError) {
          console.warn("Failed to fetch skiptrace data:", skipTraceError);
        }
      }
    }

    // Prepare response with property and skiptrace information
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
      property_info: propertyInfo
        ? {
            id: propertyInfo.id,
            address: propertyInfo.address,
            city: propertyInfo.city,
            state: propertyInfo.state,
            zip_code: propertyInfo.zip_code,
            owner_name: propertyInfo.owner_name,
            estimated_value: propertyInfo.estimated_value,
            cash_offer_amount: propertyInfo.cash_offer_amount,
          }
        : null,
      skip_trace_data: skipTraceInfo
        ? {
            total_phones: skipTraceInfo.skip_trace_summary?.total_phones || 0,
            total_emails: skipTraceInfo.skip_trace_summary?.total_emails || 0,
            has_owner_info: skipTraceInfo.skip_trace_summary?.has_owner_info || false,
            phones: skipTraceInfo.skip_trace_summary?.phones || [],
            emails: skipTraceInfo.skip_trace_summary?.emails || [],
            preferred_phones: skipTraceInfo.skip_trace_summary?.preferred_phones || [],
            preferred_emails: skipTraceInfo.skip_trace_summary?.preferred_emails || [],
            dnc_status: skipTraceInfo.skip_trace_summary?.dnc_status || "Unknown",
            deceased_status: skipTraceInfo.skip_trace_summary?.deceased_status || "Unknown",
          }
        : null,
      processed_at: new Date().toISOString(),
    };

    // Log the result for monitoring
    console.log("Webhook processed:", {
      event,
      call_id: call?.call_id,
      property_found: !!propertyInfo,
      matched_by,
      has_skiptrace: !!skipTraceInfo,
    });

    // TODO: You can add additional logic here:
    // - Update CRM with call information
    // - Trigger follow-up campaigns
    // - Log analytics
    // - Send notifications

    return new Response(
      JSON.stringify({
        success: true,
        result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        received_at: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 1x1 transparent PNG pixel
const TRACKING_PIXEL = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get("id");

    if (!trackingId) {
      console.error("No tracking ID provided");
      return new Response(TRACKING_PIXEL, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          ...corsHeaders,
        },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the email campaign
    const { data: campaign, error: findError } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("tracking_id", trackingId)
      .single();

    if (findError || !campaign) {
      console.error("Campaign not found for tracking ID:", trackingId);
      return new Response(TRACKING_PIXEL, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          ...corsHeaders,
        },
      });
    }

    // Update the campaign with open tracking
    const updateData: any = {
      opened_count: campaign.opened_count + 1,
    };

    // Set opened_at only on first open
    if (!campaign.opened_at) {
      updateData.opened_at = new Date().toISOString();
    }

    await supabase
      .from("email_campaigns")
      .update(updateData)
      .eq("tracking_id", trackingId);

    // Create notification only on first open
    if (!campaign.opened_at) {
      const { data: property } = await supabase
        .from("properties")
        .select("address")
        .eq("id", campaign.property_id)
        .single();

      await supabase.from("notifications").insert({
        event_type: "email_opened",
        message: `Email opened by ${campaign.recipient_email}${property ? ` for ${property.address}` : ""}`,
        property_id: campaign.property_id,
        metadata: {
          recipient: campaign.recipient_email,
          tracking_id: trackingId,
          opened_at: new Date().toISOString(),
        },
      });

      console.log(`First email open tracked for campaign ${trackingId}`);
    } else {
      console.log(`Email opened again (count: ${campaign.opened_count + 1}) for campaign ${trackingId}`);
    }

    // Return the tracking pixel
    return new Response(TRACKING_PIXEL, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in track-email-open:", error);
    // Always return the pixel even on error
    return new Response(TRACKING_PIXEL, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        ...corsHeaders,
      },
    });
  }
};

serve(handler);

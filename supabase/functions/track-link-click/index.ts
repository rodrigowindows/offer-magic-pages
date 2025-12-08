import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get("id");
    const redirectUrl = url.searchParams.get("redirect");

    console.log(`Link click tracking request - ID: ${trackingId}, Redirect: ${redirectUrl}`);

    if (!trackingId) {
      console.error("No tracking ID provided");
      return new Response("Missing tracking ID", { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the campaign log
    const { data: campaign, error: findError } = await supabase
      .from("campaign_logs")
      .select("*")
      .eq("tracking_id", trackingId)
      .single();

    if (findError || !campaign) {
      console.error("Campaign not found for tracking ID:", trackingId, findError);
    } else {
      // Update the campaign with click tracking
      const updateData: Record<string, unknown> = {
        click_count: (campaign.click_count || 0) + 1,
        link_clicked: true,
      };

      // Set clicked_at only on first click
      if (!campaign.clicked_at) {
        updateData.clicked_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("campaign_logs")
        .update(updateData)
        .eq("tracking_id", trackingId);

      if (updateError) {
        console.error("Error updating campaign log:", updateError);
      } else {
        console.log(`Click tracked for campaign ${trackingId} (count: ${updateData.click_count})`);
      }

      // Create notification on first click
      if (!campaign.clicked_at) {
        await supabase.from("notifications").insert({
          event_type: "link_clicked",
          message: `Link clicked by ${campaign.recipient_name || campaign.recipient_phone || 'recipient'}${campaign.property_address ? ` for ${campaign.property_address}` : ""}`,
          property_id: campaign.property_id,
          metadata: {
            recipient_name: campaign.recipient_name,
            recipient_phone: campaign.recipient_phone,
            tracking_id: trackingId,
            clicked_at: new Date().toISOString(),
          },
        });

        console.log(`Notification created for first click on campaign ${trackingId}`);
      }
    }

    // Redirect to the target URL or a default page
    const targetUrl = redirectUrl || supabaseUrl.replace('.supabase.co', '.lovable.app');
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": targetUrl,
      },
    });
  } catch (error: unknown) {
    console.error("Error in track-link-click:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);

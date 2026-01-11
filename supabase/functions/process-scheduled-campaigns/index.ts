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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process scheduled campaigns
    const { data: dueCampaigns, error: fetchError } = await supabase
      .from("scheduled_campaigns")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", new Date().toISOString())
      .gt("scheduled_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Within last 5 minutes

    if (fetchError) {
      console.error("Error fetching due campaigns:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    console.log(`Found ${dueCampaigns?.length || 0} campaigns due for processing`);

    for (const campaign of dueCampaigns || []) {
      try {
        // Mark as processing
        await supabase
          .from("scheduled_campaigns")
          .update({ status: "processing" })
          .eq("id", campaign.id);

        // Process the campaign (simplified - would integrate with actual sending logic)
        let successCount = 0;
        let errorCount = 0;

        // For each property, simulate sending
        for (const propertyId of campaign.property_ids) {
          try {
            // Here we would call the actual campaign sending logic
            // For now, just increment success
            successCount++;
          } catch (err) {
            console.error(`Error processing property ${propertyId}:`, err);
            errorCount++;
          }
        }

        // Mark as completed
        await supabase
          .from("scheduled_campaigns")
          .update({
            status: "completed",
            executed_at: new Date().toISOString(),
            results: {
              success_count: successCount,
              error_count: errorCount,
              total_properties: campaign.property_ids.length,
            },
          })
          .eq("id", campaign.id);

        console.log(`Processed campaign ${campaign.id}: ${successCount} successes, ${errorCount} errors`);

      } catch (campaignError) {
        console.error(`Error processing campaign ${campaign.id}:`, campaignError);

        // Mark as failed
        await supabase
          .from("scheduled_campaigns")
          .update({
            status: "failed",
            error_message: campaignError instanceof Error ? campaignError.message : String(campaignError),
          })
          .eq("id", campaign.id);
      }
    }

    return new Response(JSON.stringify({
      processed: dueCampaigns?.length || 0,
      message: "Scheduled campaigns processed successfully"
    }), {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error("Error in process-scheduled-campaigns:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};

serve(handler);
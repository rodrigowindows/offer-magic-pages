import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadData {
  id: string;
  address: string;
  owner_name: string | null;
  owner_phone: string | null;
  lead_status: string;
  cash_offer_amount: number;
  estimated_value: number;
  email_sent: boolean;
  sms_sent: boolean;
  letter_sent: boolean;
  phone_call_made: boolean;
  meeting_scheduled: boolean;
  answer_flag: boolean | null;
  dnc_flag: boolean | null;
  created_at: string;
}

interface EmailCampaignData {
  sent_count: number;
  opened_count: number;
  last_sent?: string;
  last_opened?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyIds } = await req.json();

    if (!propertyIds || propertyIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Property IDs are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch property data
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("*")
      .in("id", propertyIds);

    if (propertiesError || !properties) {
      console.error("Error fetching properties:", propertiesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch properties" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch email campaign data for these properties
    const { data: campaigns } = await supabase
      .from("email_campaigns")
      .select("*")
      .in("property_id", propertyIds);

    // Organize email data by property
    const emailData: Record<string, EmailCampaignData> = {};
    if (campaigns) {
      campaigns.forEach((campaign) => {
        if (!emailData[campaign.property_id]) {
          emailData[campaign.property_id] = {
            sent_count: 0,
            opened_count: 0,
          };
        }
        emailData[campaign.property_id].sent_count++;
        if (campaign.opened_at) {
          emailData[campaign.property_id].opened_count++;
          emailData[campaign.property_id].last_opened = campaign.opened_at;
        }
        emailData[campaign.property_id].last_sent = campaign.sent_at;
      });
    }

    // Generate AI suggestions for each property
    const suggestions = [];

    for (const property of properties) {
      const emailStats = emailData[property.id] || {
        sent_count: 0,
        opened_count: 0,
      };

      const prompt = `Analyze this real estate lead and provide specific, actionable next steps to move them closer to a sale:

Property: ${property.address}
Owner: ${property.owner_name || "Unknown"}
Phone: ${property.owner_phone || "No phone"}
Current Status: ${property.lead_status}
Cash Offer: $${property.cash_offer_amount.toLocaleString()}
Estimated Value: $${property.estimated_value.toLocaleString()}

Contact History:
- Email sent: ${property.email_sent ? "Yes" : "No"} (${emailStats.sent_count} campaigns, ${emailStats.opened_count} opened)
- SMS sent: ${property.sms_sent ? "Yes" : "No"}
- Letter sent: ${property.letter_sent ? "Yes" : "No"}
- Phone call made: ${property.phone_call_made ? "Yes" : "No"}
- Meeting scheduled: ${property.meeting_scheduled ? "Yes" : "No"}
- Answered: ${property.answer_flag ? "Yes" : "No"}
- DNC Flag: ${property.dnc_flag ? "Yes" : "No"}
- Days in pipeline: ${Math.floor((Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24))}
${emailStats.last_opened ? `- Last email opened: ${new Date(emailStats.last_opened).toLocaleDateString()}` : ""}

Provide:
1. Priority level (High/Medium/Low) with reasoning
2. Recommended next action (be specific)
3. Suggested status change (if appropriate)
4. Key talking points or offer adjustments
5. Estimated conversion likelihood

Keep it concise and actionable.`;

      const aiResponse = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert real estate investor and sales strategist. Analyze leads and provide clear, actionable recommendations to close deals.",
              },
              { role: "user", content: prompt },
            ],
          }),
        }
      );

      if (!aiResponse.ok) {
        console.error("AI API error:", aiResponse.status, await aiResponse.text());
        suggestions.push({
          property_id: property.id,
          address: property.address,
          error: "Failed to generate suggestions",
        });
        continue;
      }

      const aiData = await aiResponse.json();
      const suggestion = aiData.choices[0].message.content;

      suggestions.push({
        property_id: property.id,
        address: property.address,
        current_status: property.lead_status,
        suggestion,
        email_stats: emailStats,
      });
    }

    console.log(`Generated AI suggestions for ${suggestions.length} properties`);

    return new Response(JSON.stringify({ suggestions }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in ai-lead-suggestions:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);

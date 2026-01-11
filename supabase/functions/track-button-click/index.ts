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
    const source = url.searchParams.get("src") || "unknown";

    console.log(`Button click tracking request - ID: ${trackingId}, Source: ${source}`);

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
      return new Response("Campaign not found", {
        status: 404,
        headers: corsHeaders
      });
    }

    // Update the campaign with button click tracking
    const updateData: Record<string, unknown> = {
      button_click_count: (campaign.button_click_count || 0) + 1,
      button_clicked: true,
    };

    // Set button_clicked_at only on first click
    if (!campaign.button_clicked_at) {
      updateData.button_clicked_at = new Date().toISOString();
      updateData.button_click_source = source;
    }

    const { error: updateError } = await supabase
      .from("campaign_logs")
      .update(updateData)
      .eq("tracking_id", trackingId);

    if (updateError) {
      console.error("Error updating campaign log:", updateError);
      return new Response("Error updating campaign", {
        status: 500,
        headers: corsHeaders
      });
    }

    console.log(`Button click tracked for campaign ${trackingId} (count: ${updateData.button_click_count}, source: ${source})`);

    // Schedule automatic follow-up after 5 minutes
    if (!campaign.button_clicked_at) {
      try {
        // Get property contacts for follow-up
        const { data: property, error: propertyError } = await supabase
          .from("properties")
          .select("preferred_phones, preferred_emails, owner_phone, owner_email, property_address, city, state")
          .eq("id", campaign.property_id)
          .single();

        if (propertyError) {
          console.error("Error fetching property for follow-up:", propertyError);
        } else if (property) {
          // Collect all contacts
          const contacts: Array<{phone?: string, email?: string, type: string}> = [];

          // Add preferred phones
          if (property.preferred_phones && Array.isArray(property.preferred_phones)) {
            property.preferred_phones.forEach((phone: string) => {
              if (phone) contacts.push({ phone, type: 'preferred_phone' });
            });
          }

          // Add preferred emails
          if (property.preferred_emails && Array.isArray(property.preferred_emails)) {
            property.preferred_emails.forEach((email: string) => {
              if (email) contacts.push({ email, type: 'preferred_email' });
            });
          }

          // Add primary contacts if not already included
          if (property.owner_phone && !contacts.some(c => c.phone === property.owner_phone)) {
            contacts.push({ phone: property.owner_phone, type: 'owner_phone' });
          }
          if (property.owner_email && !contacts.some(c => c.email === property.owner_email)) {
            contacts.push({ email: property.owner_email, type: 'owner_email' });
          }

          if (contacts.length > 0) {
            // Schedule follow-up 5 minutes from now
            const scheduledAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

            const addr = `${property.property_address || ''} ${property.city || ''} ${property.state || ''}`.trim();
            const smsMsg = `Olá! Seguimos interessados na sua propriedade em ${addr}. Podemos conversar sobre uma oferta em dinheiro?`;
            const emailMsg = `Olá! Seguimos interessados na sua propriedade em ${addr}. Veja sua oferta completa aqui.`;
            const callMsg = `Hi, this is a follow up regarding your property at ${addr}. Please call us back to discuss a cash offer.`;

            const channels = [
              { type: 'sms', message: smsMsg },
              { type: 'email', message: emailMsg },
              { type: 'call', message: callMsg }
            ];

            for (const ch of channels) {
              const chContacts = contacts.filter(c => {
                if (ch.type === 'email') return !!c.email;
                return !!c.phone;
              }).map(c => ({ phone: c.phone, email: c.email, type: c.type }));

              if (chContacts.length === 0) continue;

              const { error: followUpError } = await supabase
                .from('scheduled_followups')
                .insert({
                  property_id: campaign.property_id,
                  campaign_log_id: campaign.id,
                  scheduled_at: scheduledAt.toISOString(),
                  message_type: ch.type,
                  contacts: chContacts,
                  follow_up_message: ch.message
                });

              if (followUpError) {
                console.error('Error scheduling follow-up for channel', ch.type, followUpError);
              } else {
                console.log(`Follow-up (${ch.type}) scheduled for ${scheduledAt.toISOString()} with ${chContacts.length} contacts`);
              }
            }
          }
        }
      } catch (followUpError) {
        console.error("Error in follow-up scheduling:", followUpError);
        // Don't fail the main tracking if follow-up scheduling fails
      }
    }

    // Create notification on first button click
    if (!campaign.button_clicked_at) {
      await supabase.from("notifications").insert({
        event_type: "button_clicked",
        message: `Button clicked by ${campaign.recipient_name || campaign.recipient_phone || 'recipient'}${campaign.property_address ? ` for ${campaign.property_address}` : ""} (Source: ${source})`,
        property_id: campaign.property_id,
        metadata: {
          recipient_name: campaign.recipient_name,
          recipient_phone: campaign.recipient_phone,
          tracking_id: trackingId,
          source: source,
          clicked_at: new Date().toISOString(),
        },
      });

      console.log(`Notification created for first button click on campaign ${trackingId}`);
    }

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: "Button click tracked successfully",
      tracking_id: trackingId,
      source: source
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: unknown) {
    console.error("Error in track-button-click:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
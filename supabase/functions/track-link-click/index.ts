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

        // Schedule automatic follow-ups for SMS, Email and Call 5 minutes from now
        try {
          const { data: property, error: propertyError } = await supabase
            .from("properties")
            .select("preferred_phones, preferred_emails, owner_phone, owner_email, skip_tracing_data, property_address, city, state")
            .eq("id", campaign.property_id)
            .single();

          if (propertyError) {
            console.error("Error fetching property for follow-up:", propertyError);
          } else if (property) {
            const contacts: Array<{ phone?: string; email?: string; type: string }> = [];

            // skip_tracing_data may contain arrays of phones/emails
            const skip = property.skip_tracing_data || {};
            if (Array.isArray(skip?.phones)) {
              skip.phones.forEach((p: string) => { if (p) contacts.push({ phone: p, type: 'skip_phone' }); });
            }
            if (Array.isArray(skip?.emails)) {
              skip.emails.forEach((e: string) => { if (e) contacts.push({ email: e, type: 'skip_email' }); });
            }

            // preferred lists
            if (Array.isArray(property.preferred_phones)) {
              property.preferred_phones.forEach((p: string) => { if (p && !contacts.some(c => c.phone === p)) contacts.push({ phone: p, type: 'preferred_phone' }); });
            }
            if (Array.isArray(property.preferred_emails)) {
              property.preferred_emails.forEach((e: string) => { if (e && !contacts.some(c => c.email === e)) contacts.push({ email: e, type: 'preferred_email' }); });
            }

            // owner contacts
            if (property.owner_phone && !contacts.some(c => c.phone === property.owner_phone)) contacts.push({ phone: property.owner_phone, type: 'owner_phone' });
            if (property.owner_email && !contacts.some(c => c.email === property.owner_email)) contacts.push({ email: property.owner_email, type: 'owner_email' });

            // Remove duplicates (by phone/email)
            const uniqueContacts: Array<{ phone?: string; email?: string; type: string }> = [];
            for (const c of contacts) {
              if (c.phone && uniqueContacts.some(x => x.phone === c.phone)) continue;
              if (c.email && uniqueContacts.some(x => x.email === c.email)) continue;
              uniqueContacts.push(c);
            }

            if (uniqueContacts.length > 0) {
              const scheduledAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

              // Build simple follow-up messages (server-side templating)
              const addr = `${property.property_address || ''} ${property.city || ''} ${property.state || ''}`.trim();
              const smsMsg = `Oi, seguimento sobre sua propriedade em ${addr}. Podemos conversar sobre uma oferta em dinheiro?`;
              const emailMsg = `Olá, seguimos interessados na sua propriedade em ${addr}. Veja sua oferta completa.`;
              const callMsg = `Hi, this is a follow up regarding your property at ${addr}. Please call us back to discuss a cash offer.`;

              // Insert one scheduled_followups entry per channel
              const channels: Array<{ type: string; message: string }> = [
                { type: 'sms', message: smsMsg },
                { type: 'email', message: emailMsg },
                { type: 'call', message: callMsg },
              ];

              for (const ch of channels) {
                // filter contacts relevant to this channel
                const chContacts = uniqueContacts.filter(c => {
                  if (ch.type === 'email') return !!c.email;
                  return !!c.phone;
                }).map(c => ({ phone: c.phone, email: c.email, type: c.type }));

                if (chContacts.length === 0) continue;

                const { error: followUpError } = await supabase
                  .from('scheduled_followups')
                  .insert({
                    property_id: campaign.property_id,
                    campaign_log_id: campaign.id,
                    scheduled_at: scheduledAt,
                    message_type: ch.type,
                    contacts: chContacts,
                    follow_up_message: ch.message
                  });

                if (followUpError) {
                  console.error('Error scheduling follow-up for channel', ch.type, followUpError);
                } else {
                  console.log(`Scheduled ${ch.type} follow-up for ${scheduledAt} with ${chContacts.length} contacts`);
                }
              }
            }
          }
        } catch (err) {
          console.error('Error scheduling follow-ups on link click:', err);
        }
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

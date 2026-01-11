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

    // Find the campaign log
    const { data: campaign, error: findError } = await supabase
      .from("campaign_logs")
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
      email_open_count: (campaign.email_open_count || 0) + 1,
    };

    // Set email_opened_at only on first open
    if (!campaign.email_opened_at) {
      updateData.email_opened_at = new Date().toISOString();
    }

    await supabase
      .from("campaign_logs")
      .update(updateData)
      .eq("tracking_id", trackingId);

    // Create notification only on first open
    if (!campaign.email_opened_at) {
      const { data: property } = await supabase
        .from("properties")
        .select("address")
        .eq("id", campaign.property_id)
        .single();

      await supabase.from("notifications").insert({
        event_type: "email_opened",
        message: `Email opened by ${campaign.recipient_email || campaign.recipient_name || 'recipient'}${property ? ` for ${property.address}` : ""}`,
        property_id: campaign.property_id,
        metadata: {
          recipient: campaign.recipient_email || campaign.recipient_name,
          tracking_id: trackingId,
          opened_at: new Date().toISOString(),
        },
      });

      console.log(`First email open tracked for campaign ${trackingId}`);

      // Schedule follow-ups (5 minutes) on first open as well
      try {
        const { data: prop } = await supabase
          .from('properties')
          .select('preferred_phones, preferred_emails, owner_phone, owner_email, skip_tracing_data, property_address, city, state')
          .eq('id', campaign.property_id)
          .single();

        if (prop) {
          const contacts: Array<{ phone?: string; email?: string; type: string }> = [];
          const skip = prop.skip_tracing_data || {};
          if (Array.isArray(skip?.phones)) skip.phones.forEach((p: string) => { if (p) contacts.push({ phone: p, type: 'skip_phone' }); });
          if (Array.isArray(skip?.emails)) skip.emails.forEach((e: string) => { if (e) contacts.push({ email: e, type: 'skip_email' }); });
          if (Array.isArray(prop.preferred_phones)) prop.preferred_phones.forEach((p: string) => { if (p && !contacts.some(c => c.phone === p)) contacts.push({ phone: p, type: 'preferred_phone' }); });
          if (Array.isArray(prop.preferred_emails)) prop.preferred_emails.forEach((e: string) => { if (e && !contacts.some(c => c.email === e)) contacts.push({ email: e, type: 'preferred_email' }); });
          if (prop.owner_phone && !contacts.some(c => c.phone === prop.owner_phone)) contacts.push({ phone: prop.owner_phone, type: 'owner_phone' });
          if (prop.owner_email && !contacts.some(c => c.email === prop.owner_email)) contacts.push({ email: prop.owner_email, type: 'owner_email' });

          const uniqueContacts: Array<{ phone?: string; email?: string; type: string }> = [];
          for (const c of contacts) {
            if (c.phone && uniqueContacts.some(x => x.phone === c.phone)) continue;
            if (c.email && uniqueContacts.some(x => x.email === c.email)) continue;
            uniqueContacts.push(c);
          }

          if (uniqueContacts.length > 0) {
            const scheduledAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
            const addr = `${prop.property_address || ''} ${prop.city || ''} ${prop.state || ''}`.trim();
            const smsMsg = `Hi, following up on your property at ${addr}. Can we discuss a cash offer?`;
            const emailMsg = `Hi, we're still interested in your property at ${addr}. View your complete offer.`;
            const callMsg = `Hi, this is a follow up regarding your property at ${addr}. Please call us back to discuss a cash offer.`;

            const channels = [
              { type: 'sms', message: smsMsg },
              { type: 'email', message: emailMsg },
              { type: 'call', message: callMsg }
            ];

            for (const ch of channels) {
              const chContacts = uniqueContacts.filter(c => ch.type === 'email' ? !!c.email : !!c.phone).map(c => ({ phone: c.phone, email: c.email, type: c.type }));
              if (chContacts.length === 0) continue;
              const { error: followUpError } = await supabase.from('scheduled_followups').insert({
                property_id: campaign.property_id,
                campaign_log_id: campaign.id,
                scheduled_at: scheduledAt,
                message_type: ch.type,
                contacts: chContacts,
                follow_up_message: ch.message
              });
              if (followUpError) console.error('Failed to schedule follow-up on email open:', followUpError);
              else console.log(`Scheduled ${ch.type} follow-up for ${scheduledAt} on email open`);
            }
          }
        }
      } catch (err) {
        console.error('Error scheduling follow-ups on email open:', err);
      }
    } else {
      console.log(`Email opened again (count: ${(campaign.email_open_count || 0) + 1}) for campaign ${trackingId}`);
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

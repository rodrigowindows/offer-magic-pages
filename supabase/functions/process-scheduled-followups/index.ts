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

    console.log("Processing scheduled follow-ups...");

    // Get follow-ups that are due (scheduled_at <= now and status = 'pending')
    const now = new Date().toISOString();
    const { data: dueFollowUps, error: fetchError } = await supabase
      .from("scheduled_followups")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(10); // Process in batches

    if (fetchError) {
      console.error("Error fetching due follow-ups:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch follow-ups" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!dueFollowUps || dueFollowUps.length === 0) {
      console.log("No due follow-ups to process");
      return new Response(JSON.stringify({
        success: true,
        message: "No follow-ups to process",
        processed: 0
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Processing ${dueFollowUps.length} follow-ups`);

    let processed = 0;
    let failed = 0;

    for (const followUp of dueFollowUps) {
      try {
        // Mark as processing
        await supabase
          .from("scheduled_followups")
          .update({ status: "processing" })
          .eq("id", followUp.id);

        // Send follow-up to all contacts
        const results = [];
        for (const contact of followUp.contacts) {
          try {
            if (followUp.message_type === 'sms' && contact.phone) {
              // Send SMS
              const smsResult = await sendSMS(contact.phone, followUp.follow_up_message);
              results.push({ type: 'sms', contact: contact.phone, success: smsResult.success, error: smsResult.error });
            } else if (followUp.message_type === 'email' && contact.email) {
              // Send Email
              const emailResult = await sendEmail(contact.email, "Follow-up on Your Property", followUp.follow_up_message);
              results.push({ type: 'email', contact: contact.email, success: emailResult.success, error: emailResult.error });
            } else if (followUp.message_type === 'call' && contact.phone) {
              // Make Call (voicemail)
              const callResult = await makeCall(contact.phone, followUp.follow_up_message);
              results.push({ type: 'call', contact: contact.phone, success: callResult.success, error: callResult.error });
            }
          } catch (contactError: unknown) {
            console.error(`Error sending to contact ${JSON.stringify(contact)}:`, contactError);
            const errorMessage = contactError instanceof Error ? contactError.message : 'Unknown error';
            results.push({ type: followUp.message_type, contact: contact.phone || contact.email, success: false, error: errorMessage });
          }
        }

        // Update status to sent
        await supabase
          .from("scheduled_followups")
          .update({
            status: "sent",
            processed_at: new Date().toISOString()
          })
          .eq("id", followUp.id);

        // Log results
        console.log(`Follow-up ${followUp.id} sent to ${results.length} contacts`);

        // Insert campaign_logs entries for auditability for each successful send
        try {
          for (const r of results) {
            if (r.success) {
              const trackingId = `followup-${Date.now()}-${followUp.id}-${r.contact}`;
              await supabase.from('campaign_logs').insert({
                tracking_id: trackingId,
                campaign_type: 'follow_up',
                channel: followUp.message_type,
                property_id: followUp.property_id,
                recipient_phone: r.type === 'sms' || r.type === 'call' ? r.contact : null,
                recipient_email: r.type === 'email' ? r.contact : null,
                recipient_name: null,
                property_address: followUp.property_address || null,
                api_response: r,
                api_status: r.success ? 200 : 500,
                sent_at: new Date().toISOString(),
                metadata: { source: 'process-scheduled-followups', followup_id: followUp.id }
              });
            }
          }
        } catch (logErr) {
          console.error('Failed to insert campaign_logs for follow-up:', logErr);
        }

        processed++;

      } catch (error: unknown) {
        console.error(`Error processing follow-up ${followUp.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Mark as failed
        await supabase
          .from("scheduled_followups")
          .update({
            status: "failed",
            processed_at: new Date().toISOString(),
            error_message: errorMessage
          })
          .eq("id", followUp.id);

        failed++;
      }
    }

    console.log(`Processed ${processed} follow-ups successfully, ${failed} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${processed} follow-ups`,
      processed,
      failed
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: unknown) {
    console.error("Error in process-scheduled-followups:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

// Helper functions for sending messages (implement based on your SMS/Email/Call services)
async function sendSMS(phone: string, message: string): Promise<{ success: boolean, error?: string }> {
  // TODO: Implement SMS sending logic (Twilio, etc.)
  console.log(`Sending SMS to ${phone}: ${message}`);
  // For now, just log - implement actual SMS service
  return { success: true };
}

async function sendEmail(email: string, subject: string, message: string): Promise<{ success: boolean, error?: string }> {
  // TODO: Implement email sending logic (SendGrid, etc.)
  console.log(`Sending email to ${email} with subject "${subject}": ${message}`);
  // For now, just log - implement actual email service
  return { success: true };
}

async function makeCall(phone: string, message: string): Promise<{ success: boolean, error?: string }> {
  // TODO: Implement call logic (Twilio, etc.)
  console.log(`Making call to ${phone} with message: ${message}`);
  // For now, just log - implement actual call service
  return { success: true };
}

serve(handler);
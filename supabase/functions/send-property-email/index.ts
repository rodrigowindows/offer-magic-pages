import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  propertyId: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      propertyId,
      recipientEmail,
      recipientName,
      subject,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      fromEmail,
      fromName,
    }: EmailRequest = await req.json();

    // Get property details
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (propertyError || !property) {
      throw new Error("Property not found");
    }

    // Create email campaign record to get tracking ID
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .insert({
        property_id: propertyId,
        recipient_email: recipientEmail,
        subject: subject,
      })
      .select()
      .single();

    if (campaignError || !campaign) {
      throw new Error("Failed to create email campaign");
    }

    // Build tracking pixel URL
    const trackingPixelUrl = `${supabaseUrl}/functions/v1/track-email-open?id=${campaign.tracking_id}`;

    // Build email HTML with cash offer letter content and tracking pixel
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: white; }
          .offer-amount { font-size: 32px; font-weight: bold; color: #3b82f6; margin: 20px 0; }
          .benefits { margin: 20px 0; }
          .benefits h3 { font-size: 18px; margin-bottom: 10px; }
          .benefit-item { margin: 8px 0; color: #666; }
          .benefit-item::before { content: "✓"; color: #3b82f6; font-weight: bold; margin-right: 8px; }
          .cta { background: #fbbf24; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .cta-button { background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Cash Offer for Your Property</h1>
        </div>
        
        <div class="content">
          <p>Dear ${recipientName || "Property Owner"},</p>
          
          <p>We are pleased to present you with a <strong>cash offer</strong> for your property located at:</p>
          
          <p style="font-size: 18px; font-weight: 600;">${property.address}, ${property.city}, ${property.state} ${property.zip_code}</p>
          
          <div style="text-align: center;">
            <div class="offer-amount">$${property.cash_offer_amount.toLocaleString()}</div>
            <p style="color: #666;">Cash Offer Amount</p>
          </div>
          
          <div class="benefits">
            <h3>We Help You:</h3>
            <div class="benefit-item">Stop tax foreclosure</div>
            <div class="benefit-item">Pay off your tax debt</div>
            <div class="benefit-item">Sell as-is (any condition)</div>
            <div class="benefit-item">You pick the date</div>
          </div>
          
          <div class="cta">
            <p style="margin: 0 0 15px 0; font-weight: 600;">Ready to discuss this offer?</p>
            <a href="tel:+1234567890" class="cta-button">Call Us Now</a>
          </div>
          
          <p>This offer is valid and we can close on your schedule. No repairs needed, no agent fees, no hassle.</p>
          
          <p>Best regards,<br>Your Property Investment Team</p>
        </div>
        
        <div class="footer">
          <p>This is a cash offer for your property. If you have any questions, please contact us.</p>
        </div>
        
        <!-- Tracking pixel -->
        <img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />
      </body>
      </html>
    `;

    // Send email using SMTP
    const response = await fetch("https://api.smtp2go.com/v3/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: smtpPassword, // Using password field as API key for SMTP2GO
        to: [{ email: recipientEmail, name: recipientName || recipientEmail }],
        sender: fromEmail,
        subject: subject,
        html_body: emailHtml,
        custom_headers: [
          {
            header: "X-Campaign-ID",
            value: campaign.tracking_id,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SMTP Error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    // Update property email_sent flag
    await supabase
      .from("properties")
      .update({ email_sent: true })
      .eq("id", propertyId);

    // Create notification
    await supabase.from("notifications").insert({
      event_type: "email_sent",
      message: `Email sent to ${recipientEmail} for property at ${property.address}`,
      property_id: propertyId,
      metadata: {
        recipient: recipientEmail,
        tracking_id: campaign.tracking_id,
      },
    });

    console.log(`Email sent successfully to ${recipientEmail} for property ${propertyId}`);

    return new Response(
      JSON.stringify({
        success: true,
        tracking_id: campaign.tracking_id,
        message: "Email sent successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-property-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

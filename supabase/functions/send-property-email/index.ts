import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  propertyId: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  language?: "en" | "es";
  useResend?: boolean;
  // Legacy SMTP fields (optional)
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail?: string;
  fromName?: string;
}

const getEmailContent = (
  property: any,
  recipientName: string,
  trackingPixelUrl: string,
  language: "en" | "es" = "en"
) => {
  const isSpanish = language === "es";
  
  const texts = {
    title: isSpanish ? "Oferta en Efectivo por Su Propiedad" : "Cash Offer for Your Property",
    greeting: isSpanish ? `Estimado/a ${recipientName}` : `Dear ${recipientName}`,
    intro: isSpanish 
      ? "Nos complace presentarle una <strong>oferta en efectivo</strong> por su propiedad ubicada en:"
      : "We are pleased to present you with a <strong>cash offer</strong> for your property located at:",
    offerLabel: isSpanish ? "Monto de Oferta en Efectivo" : "Cash Offer Amount",
    helpTitle: isSpanish ? "Le Ayudamos A:" : "We Help You:",
    benefits: isSpanish 
      ? ["Detener ejecución hipotecaria", "Pagar sus deudas de impuestos", "Vender como está (cualquier condición)", "Usted elige la fecha"]
      : ["Stop tax foreclosure", "Pay off your tax debt", "Sell as-is (any condition)", "You pick the date"],
    ctaText: isSpanish ? "¿Listo para discutir esta oferta?" : "Ready to discuss this offer?",
    ctaButton: isSpanish ? "Llámenos Ahora" : "Call Us Now",
    closing: isSpanish 
      ? "Esta oferta es válida y podemos cerrar según su calendario. Sin reparaciones, sin comisiones de agente, sin complicaciones."
      : "This offer is valid and we can close on your schedule. No repairs needed, no agent fees, no hassle.",
    regards: isSpanish ? "Atentamente" : "Best regards",
    team: isSpanish ? "Su Equipo de Inversión en Propiedades" : "Your Property Investment Team",
    footer: isSpanish 
      ? "Esta es una oferta en efectivo por su propiedad. Si tiene alguna pregunta, contáctenos."
      : "This is a cash offer for your property. If you have any questions, please contact us.",
  };

  return `
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
        <h1>${texts.title}</h1>
      </div>
      
      <div class="content">
        <p>${texts.greeting},</p>
        
        <p>${texts.intro}</p>
        
        <p style="font-size: 18px; font-weight: 600;">${property.address}, ${property.city}, ${property.state} ${property.zip_code}</p>
        
        <div style="text-align: center;">
          <div class="offer-amount">$${property.cash_offer_amount.toLocaleString()}</div>
          <p style="color: #666;">${texts.offerLabel}</p>
        </div>
        
        <div class="benefits">
          <h3>${texts.helpTitle}</h3>
          ${texts.benefits.map(b => `<div class="benefit-item">${b}</div>`).join('')}
        </div>
        
        <div class="cta">
          <p style="margin: 0 0 15px 0; font-weight: 600;">${texts.ctaText}</p>
          <a href="tel:786-882-8251" class="cta-button">${texts.ctaButton}</a>
        </div>
        
        <p>${texts.closing}</p>
        
        <p>${texts.regards},<br>${texts.team}</p>
      </div>
      
      <div class="footer">
        <p>${texts.footer}</p>
      </div>
      
      <!-- Tracking pixel -->
      <img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />
    </body>
    </html>
  `;
};

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
      language = "en",
      useResend = false,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      fromEmail,
      fromName,
    }: EmailRequest = await req.json();

    console.log(`Processing email request for property ${propertyId} to ${recipientEmail}, language: ${language}, useResend: ${useResend}`);

    // Get property details
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (propertyError || !property) {
      console.error("Property not found:", propertyError);
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
      console.error("Failed to create campaign:", campaignError);
      throw new Error("Failed to create email campaign");
    }

    // Build tracking pixel URL
    const trackingPixelUrl = `${supabaseUrl}/functions/v1/track-email-open?id=${campaign.tracking_id}`;

    // Build email HTML with localized content
    const emailHtml = getEmailContent(
      property, 
      recipientName || "Property Owner", 
      trackingPixelUrl, 
      language
    );

    let emailSent = false;

    // Try Resend first if configured
    if (useResend) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);
          const { error: resendError } = await resend.emails.send({
            from: "MyLocalInvest <onboarding@resend.dev>",
            to: [recipientEmail],
            subject: subject,
            html: emailHtml,
          });

          if (resendError) {
            console.error("Resend error:", resendError);
          } else {
            emailSent = true;
            console.log("Email sent successfully via Resend");
          }
        } catch (resendErr) {
          console.error("Resend exception:", resendErr);
        }
      } else {
        console.log("RESEND_API_KEY not configured, falling back to SMTP");
      }
    }

    // Fallback to SMTP if Resend didn't work
    if (!emailSent && smtpPassword) {
      const response = await fetch("https://api.smtp2go.com/v3/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: smtpPassword,
          to: [{ email: recipientEmail, name: recipientName || recipientEmail }],
          sender: fromEmail || "noreply@mylocalinvest.com",
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
      emailSent = true;
      console.log("Email sent successfully via SMTP");
    }

    if (!emailSent) {
      // Log but don't fail - campaign was created for tracking
      console.log("No email provider configured, campaign created for tracking only");
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
        language,
      },
    });

    console.log(`Email campaign completed for ${recipientEmail}, property ${propertyId}`);

    return new Response(
      JSON.stringify({
        success: true,
        tracking_id: campaign.tracking_id,
        message: emailSent ? "Email sent successfully" : "Campaign created (email provider not configured)",
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

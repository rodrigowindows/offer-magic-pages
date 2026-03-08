import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { property, channel, tone, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const channelGuide: Record<string, string> = {
      sms: "Max 160 characters. Direct, urgent, personal. Include a call-to-action link placeholder {link}.",
      email: "Professional but warm. Include subject line. Use {name}, {address}, {link} variables. HTML formatting allowed.",
      call: "Script for voicemail drop. 30 seconds max. Conversational and friendly.",
      letter: "Formal letter format. Professional tone. Include return address placeholder.",
    };

    const toneGuide: Record<string, string> = {
      friendly: "Warm, approachable, neighborly",
      urgent: "Time-sensitive, create FOMO, motivated seller focus",
      professional: "Business-like, data-driven, credibility-focused",
      empathetic: "Understanding, solution-oriented, no-pressure",
    };

    const prompt = `Generate a ${channel} marketing message for a real estate investor reaching out to a property owner.

Channel: ${channel} (${channelGuide[channel] || channelGuide.sms})
Tone: ${toneGuide[tone || 'friendly'] || toneGuide.friendly}
Language: ${language || 'English'}

Property/Owner Info:
- Owner Name: ${property.owner_name || 'Property Owner'}
- Property Address: ${property.address}
- City: ${property.city}, ${property.state}
- Estimated Value: $${property.estimated_value || 'N/A'}
- Cash Offer: $${property.cash_offer_amount || 'N/A'}
- Property Type: ${property.property_type || 'Residential'}

Use template variables: {name} for owner name, {address} for property address, {link} for tracking link, {company} for company name, {phone} for company phone.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a real estate marketing copywriter. Generate compelling, compliant outreach messages." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_message",
            description: "Generate a marketing message for property outreach",
            parameters: {
              type: "object",
              properties: {
                subject: { type: "string", description: "Email subject line (only for email channel)" },
                body: { type: "string", description: "The message body with template variables" },
                variant_b: { type: "string", description: "Alternative version for A/B testing" },
                tips: { type: "string", description: "Best practices tip for this message in Portuguese" },
              },
              required: ["body", "tips"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_message" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI service error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content = data.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(content.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-generate-message error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

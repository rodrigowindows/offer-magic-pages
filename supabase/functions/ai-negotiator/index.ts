import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { property } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert real estate negotiation AI for wholesale property deals. Analyze the property data and provide negotiation strategy.

Return a JSON object with:
- "counter_offer": suggested counter-offer amount (number)
- "counter_offer_rationale": why this amount (string)
- "opening_script": opening script for the call/conversation (string, 2-3 sentences)
- "objection_handlers": array of { "objection": string, "response": string } (3-5 common objections)
- "leverage_points": array of strings highlighting negotiation advantages
- "risk_level": "low" | "medium" | "high"
- "recommended_strategy": "aggressive" | "balanced" | "conservative"
- "walkaway_price": minimum acceptable price (number)
- "tips": array of 3 actionable tips`;

    const prompt = `Property data:
- Address: ${property.address || 'N/A'}
- Estimated Value: $${property.estimated_value || 0}
- Cash Offer: $${property.cash_offer_amount || 0}
- ARV: $${property.arv || 'N/A'}
- Bedrooms: ${property.bedrooms || 'N/A'}
- Bathrooms: ${property.bathrooms || 'N/A'}
- Sq Ft: ${property.square_feet || 'N/A'}
- Year Built: ${property.year_built || 'N/A'}
- Owner Name: ${property.owner_name || 'N/A'}
- Lead Status: ${property.lead_status || 'new'}
- Tags: ${(property.tags || []).join(', ') || 'none'}
- AI Score: ${property.ai_score || 'N/A'}
- Last Sale Price: $${property.last_sale_price || 'N/A'}
- Renovation Type: ${property.renovation_type || 'N/A'}

Provide negotiation strategy as JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "negotiation_strategy",
            description: "Return negotiation strategy for this property deal",
            parameters: {
              type: "object",
              properties: {
                counter_offer: { type: "number" },
                counter_offer_rationale: { type: "string" },
                opening_script: { type: "string" },
                objection_handlers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      objection: { type: "string" },
                      response: { type: "string" },
                    },
                    required: ["objection", "response"],
                  },
                },
                leverage_points: { type: "array", items: { type: "string" } },
                risk_level: { type: "string", enum: ["low", "medium", "high"] },
                recommended_strategy: { type: "string", enum: ["aggressive", "balanced", "conservative"] },
                walkaway_price: { type: "number" },
                tips: { type: "array", items: { type: "string" } },
              },
              required: ["counter_offer", "counter_offer_rationale", "opening_script", "objection_handlers", "leverage_points", "risk_level", "recommended_strategy", "walkaway_price", "tips"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "negotiation_strategy" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = JSON.parse(toolCall?.function?.arguments || "{}");

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-negotiator error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

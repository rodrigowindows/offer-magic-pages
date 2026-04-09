import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { property } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Analyze this property for real estate investment potential. Return a JSON object with:
- "score": integer 0-100 (investment attractiveness)
- "reasoning": string (2-3 sentences in Portuguese explaining the score)
- "recommendation": "approve" | "reject" | "review" (based on score: >=70 approve, <30 reject, else review)

IMPORTANT CLASSIFICATION RULES:
1. VACANT LAND: If bedrooms AND bathrooms AND square_feet are ALL null/0, OR if property_type contains "land" or "vacant":
   - This is LAND (terreno), NOT a house. NEVER say "casa em bom estado" for land.
   - Score based on: lot size, location, price per acre, zoning potential.
   - In reasoning, always start with "TERRENO:"

2. NO PHOTO: If property_image_url is null or empty:
   - DO NOT make any visual/condition assessment about the property.
   - State "Sem foto disponível - avaliação visual não realizada"
   - Reduce score by 10 points (missing visual data = higher risk)

3. COMMERCIAL: ONLY classify as "Imóvel Comercial" if property_type EXPLICITLY contains "commercial", "warehouse", "industrial", or "office".
   Proximity to downtown or commercial areas does NOT make a property commercial.

4. MULTI-FAMILY: ONLY classify as "Multi-Family" if property_type contains "multi", "duplex", "triplex", or "fourplex".
   Address containing "APT" or "UNIT" means it is a CONDO/APARTMENT unit, NOT multi-family.

5. PRICE ANOMALY: If last_sale_price exists and differs from estimated_value by >30%:
   - Flag this in reasoning: "ALERTA: Preço anterior diferente do estimado atual"
   - This is a risk factor - adjust score accordingly.

Scoring criteria:
- Location quality (zip code, neighborhood)
- Price vs estimated value ratio (lower = better deal)
- Property characteristics (sqft, beds, baths, year built, lot size)
- Owner situation (out of state, deceased = higher urgency)
- Contact availability (phones, emails available)
- Market indicators (last sale price vs current estimated value)

Property data:
${JSON.stringify(property, null, 2)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a real estate investment analyst. Always respond with valid JSON only, no markdown." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "score_property",
            description: "Score a property for investment potential",
            parameters: {
              type: "object",
              properties: {
                score: { type: "integer", description: "Investment score 0-100" },
                reasoning: { type: "string", description: "2-3 sentence explanation in Portuguese" },
                recommendation: { type: "string", enum: ["approve", "reject", "review"] },
              },
              required: ["score", "reasoning", "recommendation"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "score_property" } },
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
      const t = await response.text();
      console.error("AI error:", response.status, t);
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

    // Fallback: try parsing content directly
    const content = data.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(content.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-score-property error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

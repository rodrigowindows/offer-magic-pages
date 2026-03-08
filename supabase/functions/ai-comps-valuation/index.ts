import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { property, comps } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Analyze these comparable sales for the subject property and provide a valuation opinion.

Subject Property:
- Address: ${property.address}, ${property.city}, ${property.state} ${property.zip_code}
- Square Feet: ${property.square_feet || 'Unknown'}
- Bedrooms: ${property.bedrooms || 'Unknown'}
- Bathrooms: ${property.bathrooms || 'Unknown'}
- Year Built: ${property.year_built || 'Unknown'}
- Lot Size: ${property.lot_size || 'Unknown'}
- Current Estimated Value: $${property.estimated_value || 'Unknown'}

Comparable Sales (${comps.length} comps):
${comps.map((c: any, i: number) => `
Comp ${i+1}: ${c.address || c.url || 'Unknown'}
  - Sale Price: $${c.sale_price || 'N/A'}
  - Square Feet: ${c.square_feet || 'N/A'}
  - $/Sqft: $${c.sale_price && c.square_feet ? Math.round(c.sale_price / c.square_feet) : 'N/A'}
  - Notes: ${c.notes || 'None'}
`).join('')}

Provide your analysis in Portuguese.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a real estate appraiser specializing in Orlando FL market. Respond with structured JSON only." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "valuation_analysis",
            description: "Provide property valuation based on comparable sales",
            parameters: {
              type: "object",
              properties: {
                suggested_arv: { type: "number", description: "Suggested ARV (After Repair Value) in dollars" },
                suggested_price_per_sqft: { type: "number", description: "Suggested price per sqft based on comps" },
                confidence: { type: "string", enum: ["high", "medium", "low"], description: "Confidence level of the valuation" },
                analysis: { type: "string", description: "2-4 sentence analysis in Portuguese" },
                adjustments: { type: "string", description: "Key adjustments or considerations in Portuguese" },
                suggested_offer_range_min: { type: "number", description: "Minimum suggested offer (60-65% of ARV)" },
                suggested_offer_range_max: { type: "number", description: "Maximum suggested offer (70-75% of ARV)" },
              },
              required: ["suggested_arv", "suggested_price_per_sqft", "confidence", "analysis", "suggested_offer_range_min", "suggested_offer_range_max"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "valuation_analysis" } },
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
    console.error("ai-comps-valuation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

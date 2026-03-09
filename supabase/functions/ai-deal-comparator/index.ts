import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { properties } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!properties || properties.length < 2) {
      return new Response(JSON.stringify({ error: "At least 2 properties required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const systemPrompt = `You are a real estate investment analyst. Compare multiple properties and rank them by deal quality.

Return JSON with:
- "ranking": array of { "address": string, "rank": number, "roi_estimate_pct": number, "risk_score": number (1-10, 10=highest risk), "deal_grade": "A" | "B" | "C" | "D", "strengths": string[], "weaknesses": string[] }
- "best_deal": string (address of best deal)
- "best_deal_reason": string
- "overall_analysis": string (2-3 sentences market overview)
- "recommendation": string (what to do next)`;

    const propertySummaries = properties.map((p: any, i: number) => 
      `Property ${i + 1}: ${p.address || 'N/A'}, Value: $${p.estimated_value || 0}, Offer: $${p.cash_offer_amount || 0}, ARV: $${p.arv || 'N/A'}, Beds: ${p.bedrooms || '?'}, Baths: ${p.bathrooms || '?'}, SqFt: ${p.square_feet || '?'}, Year: ${p.year_built || '?'}, Score: ${p.ai_score || '?'}, Tags: ${(p.tags || []).join(',') || 'none'}`
    ).join('\n');

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
          { role: "user", content: `Compare these properties:\n${propertySummaries}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "deal_comparison",
            description: "Compare and rank property deals",
            parameters: {
              type: "object",
              properties: {
                ranking: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      address: { type: "string" },
                      rank: { type: "number" },
                      roi_estimate_pct: { type: "number" },
                      risk_score: { type: "number" },
                      deal_grade: { type: "string", enum: ["A", "B", "C", "D"] },
                      strengths: { type: "array", items: { type: "string" } },
                      weaknesses: { type: "array", items: { type: "string" } },
                    },
                    required: ["address", "rank", "roi_estimate_pct", "risk_score", "deal_grade", "strengths", "weaknesses"],
                  },
                },
                best_deal: { type: "string" },
                best_deal_reason: { type: "string" },
                overall_analysis: { type: "string" },
                recommendation: { type: "string" },
              },
              required: ["ranking", "best_deal", "best_deal_reason", "overall_analysis", "recommendation"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "deal_comparison" } },
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
    console.error("ai-deal-comparator error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

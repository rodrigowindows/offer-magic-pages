import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { property } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a real estate lead categorization expert. Analyze property data and suggest intelligent tags.

Available tags: motivated-seller, absentee-owner, probate, pre-foreclosure, tax-delinquent, vacant, distressed, high-equity, out-of-state, estate-trust, divorce, inherited, senior-owner, corporate-owned, bank-owned, fixer-upper, teardown, quick-close, cash-buyer-only, owner-occupied, tenant-occupied, multi-family, commercial-zoned, flood-zone, hoa-issue, title-issue, code-violation, hot-lead, cold-lead, warm-lead, follow-up, tier-1, tier-2, tier-3

Return JSON with:
- "suggested_tags": array of tag strings from the list above
- "confidence": object mapping each tag to confidence 0-100
- "reasoning": object mapping each tag to why it was suggested
- "priority_score": number 1-100 overall lead priority
- "lead_category": "hot" | "warm" | "cold"
- "summary": one sentence summary of this lead`;

    const prompt = `Property:
- Address: ${property.address || 'N/A'}
- City: ${property.city || 'N/A'}, State: ${property.state || 'FL'}
- Owner: ${property.owner_name || 'N/A'}
- Owner Address: ${property.owner_address || 'N/A'}
- Value: $${property.estimated_value || 0}
- Offer: $${property.cash_offer_amount || 0}
- Beds/Baths: ${property.bedrooms || '?'}/${property.bathrooms || '?'}
- SqFt: ${property.square_feet || '?'}
- Year Built: ${property.year_built || '?'}
- Pool: ${property.pool ? 'Yes' : 'No'}
- Lead Status: ${property.lead_status || 'new'}
- AI Score: ${property.ai_score || 'N/A'}
- Deceased: ${property.deceased ? 'Yes' : 'No'}
- DNC: ${property.dnc_flag ? 'Yes' : 'No'}
- Current Tags: ${(property.tags || []).join(', ') || 'none'}
- Last Contact: ${property.last_contact_date || 'never'}
- Renovation Type: ${property.renovation_type || 'N/A'}

Suggest tags for this property.`;

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
            name: "auto_tag",
            description: "Suggest tags for this property lead",
            parameters: {
              type: "object",
              properties: {
                suggested_tags: { type: "array", items: { type: "string" } },
                confidence: { type: "object" },
                reasoning: { type: "object" },
                priority_score: { type: "number" },
                lead_category: { type: "string", enum: ["hot", "warm", "cold"] },
                summary: { type: "string" },
              },
              required: ["suggested_tags", "confidence", "reasoning", "priority_score", "lead_category", "summary"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "auto_tag" } },
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
    console.error("ai-auto-tagger error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

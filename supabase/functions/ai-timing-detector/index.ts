import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { property, campaignHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert in real estate lead outreach timing optimization. Analyze property data and campaign history to recommend the best time to contact each lead via different channels.

Return JSON with:
- "best_call_time": { "day": string (e.g. "Tuesday"), "time": string (e.g. "10:00 AM"), "reason": string }
- "best_sms_time": { "day": string, "time": string, "reason": string }
- "best_email_time": { "day": string, "time": string, "reason": string }
- "urgency": "immediate" | "this_week" | "next_week" | "low"
- "urgency_reason": string
- "contact_frequency": "daily" | "every_2_days" | "weekly" | "biweekly"
- "avoid_times": array of strings (times to avoid)
- "personalization_tip": string`;

    const prompt = `Property: ${property.address || 'N/A'}
Owner: ${property.owner_name || 'N/A'}
Lead Status: ${property.lead_status || 'new'}
Tags: ${(property.tags || []).join(', ') || 'none'}
Last Contact: ${property.last_contact_date || 'never'}
Next Follow-up: ${property.next_followup_date || 'not set'}
AI Score: ${property.ai_score || 'N/A'}
State: ${property.state || 'FL'}
Campaign History: ${JSON.stringify(campaignHistory || [])}

Recommend optimal contact timing.`;

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
            name: "timing_recommendation",
            description: "Return optimal contact timing for this lead",
            parameters: {
              type: "object",
              properties: {
                best_call_time: {
                  type: "object",
                  properties: { day: { type: "string" }, time: { type: "string" }, reason: { type: "string" } },
                  required: ["day", "time", "reason"],
                },
                best_sms_time: {
                  type: "object",
                  properties: { day: { type: "string" }, time: { type: "string" }, reason: { type: "string" } },
                  required: ["day", "time", "reason"],
                },
                best_email_time: {
                  type: "object",
                  properties: { day: { type: "string" }, time: { type: "string" }, reason: { type: "string" } },
                  required: ["day", "time", "reason"],
                },
                urgency: { type: "string", enum: ["immediate", "this_week", "next_week", "low"] },
                urgency_reason: { type: "string" },
                contact_frequency: { type: "string", enum: ["daily", "every_2_days", "weekly", "biweekly"] },
                avoid_times: { type: "array", items: { type: "string" } },
                personalization_tip: { type: "string" },
              },
              required: ["best_call_time", "best_sms_time", "best_email_time", "urgency", "urgency_reason", "contact_frequency", "avoid_times", "personalization_tip"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "timing_recommendation" } },
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
    console.error("ai-timing-detector error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

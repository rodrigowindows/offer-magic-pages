import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { properties, campaigns, leads, notes } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Você é um analista de investimentos imobiliários. Gere um RESUMO EXECUTIVO em português para os seguintes leads/propriedades.

O resumo deve incluir:
1. **Visão Geral**: Quantas propriedades, valores totais, status predominante
2. **Leads Quentes**: Quais propriedades têm maior potencial (baseado em AI Score, interações, respostas)
3. **Histórico de Contato**: Resumo das campanhas enviadas, taxas de resposta, canais usados
4. **Leads Captados**: Se há leads que responderam formulários, detalhes relevantes
5. **Alertas**: Leads esfriando (sem contato recente), follow-ups pendentes, oportunidades perdidas
6. **Próximos Passos Recomendados**: Ações concretas priorizadas por impacto

Dados das Propriedades (${properties?.length || 0}):
${JSON.stringify(properties?.slice(0, 20), null, 2)}

Campanhas Enviadas (${campaigns?.length || 0}):
${JSON.stringify(campaigns?.slice(0, 30), null, 2)}

Leads Captados (${leads?.length || 0}):
${JSON.stringify(leads?.slice(0, 15), null, 2)}

Notas (${notes?.length || 0}):
${JSON.stringify(notes?.slice(0, 15), null, 2)}

Responda em português brasileiro, de forma concisa e acionável. Use emojis para organizar visualmente.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a real estate investment analyst. Respond in Portuguese (Brazil). Be concise and actionable." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service error");
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "Nenhum resumo gerado.";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Lead Summary error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

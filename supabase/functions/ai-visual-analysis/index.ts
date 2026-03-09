import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl, address, propertyData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    if (!imageUrl) throw new Error('Image URL is required');

    const messages: any[] = [
      {
        role: 'system',
        content: `Você é um avaliador visual de propriedades imobiliárias especializado em detectar sinais de distress e estimar condições. Analise a foto e forneça uma avaliação detalhada.`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analise esta foto da propriedade${address ? ` em ${address}` : ''}.
${propertyData ? `Dados: ${JSON.stringify(propertyData)}` : ''}

Retorne JSON com:
- condition_score: 1-10 (10 = excelente)
- condition_category: "excellent" | "good" | "fair" | "poor" | "distressed"
- distress_signals: array de sinais de distress detectados (ex: "telhado danificado", "jardim abandonado")
- positive_features: array de características positivas
- estimated_repair_cost_low: estimativa baixa de reparo em USD
- estimated_repair_cost_high: estimativa alta de reparo em USD
- appears_vacant: boolean
- curb_appeal: 1-10
- investment_notes: observações para investidor (max 200 chars)
- roof_condition: "good" | "fair" | "poor" | "needs_replacement"
- exterior_condition: "good" | "fair" | "poor"
- landscaping_condition: "maintained" | "overgrown" | "neglected"

RETORNE APENAS JSON válido.`
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl }
          }
        ]
      }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || '{}';
    const jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const analysis = JSON.parse(jsonStr);

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Visual analysis error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

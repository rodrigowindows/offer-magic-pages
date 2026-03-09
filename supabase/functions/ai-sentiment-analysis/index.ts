import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { texts, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const prompt = `Analise o sentimento de cada resposta de lead imobiliário abaixo.

Contexto: ${context || 'Respostas de leads a ofertas de compra de propriedades'}

Textos para análise:
${texts.map((t: any, i: number) => `[${i}] "${t.text}" (de: ${t.from || 'desconhecido'})`).join('\n')}

Para cada texto retorne um JSON array com:
- index: número do texto
- sentiment: "positive" | "negative" | "neutral" | "interested" | "urgent"
- score: -1.0 a 1.0 (negativo a positivo)
- key_signals: array de sinais detectados (ex: "quer vender rápido", "preço baixo")
- suggested_response: resposta sugerida curta (max 150 chars)
- priority: "high" | "medium" | "low"

RETORNE APENAS JSON array válido, sem markdown.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um analista de sentimento especializado em comunicação imobiliária. Responda APENAS com JSON válido.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error('AI service error');
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || '[]';
    const jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const analysis = JSON.parse(jsonStr);

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { addresses } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Fetch existing addresses
    const { data: existing } = await supabase
      .from('properties')
      .select('id, address, city, state, zip_code')
      .limit(1000);

    if (!existing || existing.length === 0) {
      return new Response(JSON.stringify({ duplicates: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Compare estes endereços importados com os endereços existentes no banco de dados e identifique DUPLICATAS.

Considere duplicatas: typos, abreviações diferentes (St vs Street), números iguais com formatação diferente, espaços extras, etc.

ENDEREÇOS IMPORTADOS:
${addresses.map((a: any, i: number) => `[${i}] ${a.address}, ${a.city || ''} ${a.state || ''} ${a.zip || ''}`).join('\n')}

ENDEREÇOS EXISTENTES NO BANCO:
${existing.map((e: any) => `[${e.id}] ${e.address}, ${e.city} ${e.state} ${e.zip_code}`).join('\n')}

Para cada duplicata encontrada, retorne JSON array com:
- import_index: índice do endereço importado
- existing_id: ID do endereço existente no banco
- import_address: endereço importado original
- existing_address: endereço existente original
- confidence: 0.0 a 1.0 (certeza da duplicata)
- reason: explicação curta da duplicata (ex: "mesmo número, rua abreviada")

RETORNE APENAS duplicatas com confidence >= 0.7. Retorne JSON array válido apenas.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um especialista em normalização de endereços. Identifique duplicatas considerando variações comuns. Responda APENAS com JSON válido.' },
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
    const duplicates = JSON.parse(jsonStr);

    return new Response(JSON.stringify({ duplicates }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Duplicate detector error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

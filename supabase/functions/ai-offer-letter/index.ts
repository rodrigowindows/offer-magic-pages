import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { property, tone, language, sellerName, includeOfferRange } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const toneDescriptions: Record<string, string> = {
      friendly: 'amigável e acolhedor, como um vizinho que quer ajudar',
      professional: 'profissional e direto, focado em números e fatos',
      empathetic: 'empático e compreensivo, reconhecendo a situação do dono',
      urgent: 'com senso de urgência, enfatizando a janela de oportunidade',
    };

    const offerAmount = property.cash_offer_amount || 0;
    const offerRange60 = Math.round(offerAmount * 0.6);

    const prompt = `Gere uma carta de oferta personalizada para compra de propriedade.

DADOS DA PROPRIEDADE:
- Endereço: ${property.address}, ${property.city}, ${property.state} ${property.zip_code}
- Proprietário: ${property.owner_name || 'Proprietário'}
- Valor Estimado: $${property.estimated_value?.toLocaleString() || 'N/A'}
- Oferta Cash: $${offerAmount.toLocaleString()}
${includeOfferRange ? `- Faixa de Oferta: $${offerRange60.toLocaleString()} - $${offerAmount.toLocaleString()}` : ''}
- Quartos: ${property.bedrooms || 'N/A'} | Banheiros: ${property.bathrooms || 'N/A'}
- Área: ${property.square_feet || 'N/A'} sqft | Ano: ${property.year_built || 'N/A'}

CONFIGURAÇÕES:
- Tom: ${toneDescriptions[tone] || 'profissional'}
- Idioma: ${language || 'English'}
- Nome do Comprador: ${sellerName || 'MyLocalInvest'}
- Telefone: 786 882 8251

Gere a carta com:
1. Saudação personalizada ao proprietário
2. Introdução breve explicando quem somos
3. A oferta cash com benefícios claros (sem corretores, sem reparos, fechamento rápido)
4. 3-4 benefícios chave de vender para nós
5. Call to action claro
6. Assinatura profissional

Retorne JSON com:
- letter_text: texto completo da carta formatado com parágrafos
- subject_line: assunto para email (max 60 chars)
- key_selling_points: array de 3-4 benefícios destacados
- personalization_notes: notas sobre personalização aplicada

RETORNE APENAS JSON válido.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: `Você é um copywriter especializado em cartas de oferta imobiliária. Escreva em ${language || 'English'}. Responda APENAS com JSON válido.` },
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
    const content = aiData.choices?.[0]?.message?.content || '{}';
    const jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const letter = JSON.parse(jsonStr);

    return new Response(JSON.stringify({ letter }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Offer letter error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

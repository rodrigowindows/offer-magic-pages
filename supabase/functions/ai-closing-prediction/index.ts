import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { propertyIds } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Fetch comprehensive data
    const [{ data: properties }, { data: campaigns }, { data: leads }, { data: notes }] = await Promise.all([
      supabase.from('properties').select('id, address, owner_name, lead_status, cash_offer_amount, estimated_value, email_sent, sms_sent, letter_sent, phone_call_made, meeting_scheduled, answer_flag, ai_score, lead_score, last_contact_date, created_at, bedrooms, bathrooms, square_feet, year_built, tags, arv, mao').in('id', propertyIds),
      supabase.from('campaign_logs').select('property_id, channel, status, link_clicked, first_response_at, sent_at').in('property_id', propertyIds).limit(200),
      supabase.from('property_leads').select('property_id, status, interest_level, selling_timeline').in('property_id', propertyIds),
      supabase.from('property_notes').select('property_id, note_text, created_at').in('property_id', propertyIds).order('created_at', { ascending: false }).limit(50),
    ]);

    // Historical closed deals for context
    const { data: closedDeals } = await supabase
      .from('properties')
      .select('cash_offer_amount, estimated_value, lead_status, created_at, bedrooms, bathrooms, square_feet')
      .eq('lead_status', 'closed')
      .limit(50);

    const prompt = `Analise estes leads imobiliários e PREVEJA a probabilidade de fechamento baseado nos dados históricos e padrões.

DADOS HISTÓRICOS DE DEALS FECHADOS (para referência):
${JSON.stringify(closedDeals?.map(d => ({ offer: d.cash_offer_amount, value: d.estimated_value, beds: d.bedrooms, sqft: d.square_feet })) || [])}

LEADS PARA ANÁLISE:
${JSON.stringify(properties?.map(p => ({
  id: p.id, address: p.address, status: p.lead_status, offer: p.cash_offer_amount, value: p.estimated_value,
  ai_score: p.ai_score, arv: p.arv, mao: p.mao,
  contact: { email: p.email_sent, sms: p.sms_sent, letter: p.letter_sent, call: p.phone_call_made, meeting: p.meeting_scheduled, answered: p.answer_flag },
  days_in_pipeline: Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400000),
  last_contact: p.last_contact_date,
})))}

ENGAJAMENTO DE CAMPANHAS:
${JSON.stringify(campaigns?.reduce((acc: any, c: any) => { acc[c.property_id] = acc[c.property_id] || { total: 0, clicked: 0, responded: 0 }; acc[c.property_id].total++; if (c.link_clicked) acc[c.property_id].clicked++; if (c.first_response_at) acc[c.property_id].responded++; return acc; }, {}))}

LEADS CAPTADOS:
${JSON.stringify(leads?.map(l => ({ property_id: l.property_id, interest: l.interest_level, timeline: l.selling_timeline })))}

NOTAS:
${JSON.stringify(notes?.map(n => ({ property_id: n.property_id, text: n.note_text?.substring(0, 100) })))}

Para cada propriedade, retorne JSON array com:
- property_id
- closing_probability: número 0-100
- confidence: "high" | "medium" | "low"
- key_factors: array de fatores positivos e negativos (max 4)
- estimated_timeline_days: estimativa de dias até fechamento
- risk_level: "low" | "medium" | "high"
- recommendation: ação recomendada curta (max 100 chars)

RETORNE APENAS JSON array válido.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'Você é um analista preditivo de investimentos imobiliários. Use dados históricos para prever probabilidades. Responda APENAS com JSON válido.' },
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
    const predictions = JSON.parse(jsonStr);

    return new Response(JSON.stringify({ predictions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Closing prediction error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

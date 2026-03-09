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

    const { data: properties } = await supabase
      .from('properties')
      .select('id, address, owner_name, lead_status, cash_offer_amount, estimated_value, email_sent, sms_sent, letter_sent, phone_call_made, meeting_scheduled, last_contact_date, next_followup_date, ai_score, tags')
      .in('id', propertyIds);

    const { data: campaigns } = await supabase
      .from('campaign_logs')
      .select('property_id, channel, status, link_clicked, sent_at, first_response_at')
      .in('property_id', propertyIds)
      .order('sent_at', { ascending: false })
      .limit(100);

    const { data: reminders } = await supabase
      .from('follow_up_reminders')
      .select('property_id, reminder_type, due_date, is_completed')
      .in('property_id', propertyIds)
      .eq('is_completed', false);

    const prompt = `Analise estes leads imobiliários e para CADA um, recomende o próximo passo ideal.

PROPRIEDADES:
${JSON.stringify(properties?.map(p => ({
  id: p.id, address: p.address, owner: p.owner_name, status: p.lead_status,
  offer: p.cash_offer_amount, value: p.estimated_value, ai_score: p.ai_score,
  contacted: { email: p.email_sent, sms: p.sms_sent, letter: p.letter_sent, call: p.phone_call_made, meeting: p.meeting_scheduled },
  last_contact: p.last_contact_date, next_followup: p.next_followup_date,
})))}

CAMPANHAS RECENTES:
${JSON.stringify(campaigns?.map(c => ({ property_id: c.property_id, channel: c.channel, clicked: c.link_clicked, responded: !!c.first_response_at })))}

LEMBRETES PENDENTES:
${JSON.stringify(reminders)}

Para cada propriedade retorne um JSON array com objetos contendo:
- property_id
- recommended_action: "sms" | "email" | "call" | "letter" | "meeting" | "adjust_offer" | "wait"
- urgency: "high" | "medium" | "low"
- reason: explicação curta (max 80 chars)
- suggested_message: mensagem sugerida se aplicável (max 200 chars)
- days_to_wait: número de dias para esperar (0 se ação imediata)

RETORNE APENAS o JSON array, sem markdown.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'Você é um estrategista de vendas imobiliárias. Responda APENAS com JSON válido.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error('AI service error');
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || '[]';
    
    // Parse JSON from response (strip markdown if present)
    const jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const recommendations = JSON.parse(jsonStr);

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('AI Follow-up error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

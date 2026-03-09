import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { propertyId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Fetch chat messages/notifications for this property
    const { data: notifications } = await supabase
      .from('notifications')
      .select('event_type, message, metadata, created_at')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: true })
      .limit(50);

    // Fetch notes as conversation context
    const { data: notes } = await supabase
      .from('property_notes')
      .select('note_text, created_at')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: true })
      .limit(30);

    // Fetch leads
    const { data: leads } = await supabase
      .from('property_leads')
      .select('full_name, email, phone, status, interest_level, selling_timeline, notes, created_at')
      .eq('property_id', propertyId)
      .limit(10);

    const { data: property } = await supabase
      .from('properties')
      .select('address, owner_name, cash_offer_amount, estimated_value, lead_status')
      .eq('id', propertyId)
      .single();

    const prompt = `Resuma todas as interações e conversas com este lead imobiliário. Extraia informações-chave.

PROPRIEDADE: ${JSON.stringify(property)}

NOTIFICAÇÕES/CHAT:
${JSON.stringify(notifications?.map(n => ({ type: n.event_type, msg: n.message, meta: n.metadata, date: n.created_at })))}

NOTAS DO AGENTE:
${JSON.stringify(notes?.map(n => ({ text: n.note_text, date: n.created_at })))}

LEADS CAPTADOS:
${JSON.stringify(leads)}

Retorne JSON com:
- summary: resumo executivo da conversa (max 300 chars)
- key_info_extracted: objeto com { motivation, timeline, objections, budget, decision_makers, urgency_level }
- sentiment_trend: "improving" | "declining" | "stable" | "unknown"
- total_interactions: número de interações
- last_interaction_date: data da última interação
- hot_topics: array de tópicos principais discutidos
- next_best_action: próxima ação recomendada (max 150 chars)
- risk_factors: array de riscos identificados

RETORNE APENAS JSON válido.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'Você é um analista de CRM especializado em extrair insights de conversas imobiliárias. Responda APENAS com JSON válido.' },
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
    const conversationSummary = JSON.parse(jsonStr);

    return new Response(JSON.stringify({ conversationSummary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Conversation summary error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

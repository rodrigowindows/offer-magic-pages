import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString();

    // Gather comprehensive stats
    const [
      { count: totalProps },
      { data: statusCounts },
      { data: recentCampaigns },
      { data: coolingLeads },
      { data: hotLeads },
      { data: recentLeads },
      { data: pendingReminders },
      { data: recentClicks },
    ] = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase.from('properties').select('lead_status'),
      supabase.from('campaign_logs').select('channel, status, link_clicked, sent_at').gte('sent_at', sevenDaysAgo).limit(200),
      supabase.from('properties').select('address, owner_name, lead_status, last_contact_date, ai_score')
        .in('lead_status', ['contacted', 'following_up'])
        .or(`last_contact_date.is.null,last_contact_date.lt.${threeDaysAgo}`)
        .limit(20),
      supabase.from('properties').select('address, owner_name, ai_score, lead_status, cash_offer_amount')
        .not('ai_score', 'is', null).order('ai_score', { ascending: false }).limit(10),
      supabase.from('property_leads').select('full_name, interest_level, created_at')
        .gte('created_at', sevenDaysAgo).order('created_at', { ascending: false }).limit(10),
      supabase.from('follow_up_reminders').select('property_id, reminder_type, due_date')
        .eq('is_completed', false).lte('due_date', now.toISOString()).limit(20),
      supabase.from('campaign_logs').select('property_address, channel')
        .eq('link_clicked', true).gte('sent_at', sevenDaysAgo).limit(20),
    ]);

    const statusDist: Record<string, number> = {};
    statusCounts?.forEach((p: any) => { statusDist[p.lead_status] = (statusDist[p.lead_status] || 0) + 1; });

    // Campaign performance
    const channelStats: Record<string, { sent: number; clicked: number }> = {};
    recentCampaigns?.forEach((c: any) => {
      if (!channelStats[c.channel]) channelStats[c.channel] = { sent: 0, clicked: 0 };
      channelStats[c.channel].sent++;
      if (c.link_clicked) channelStats[c.channel].clicked++;
    });

    const prompt = `Gere um digest diário de insights para um investidor imobiliário baseado nos dados REAIS abaixo.

DADOS DO PIPELINE (${now.toLocaleDateString('pt-BR')}):
- Total propriedades: ${totalProps}
- Distribuição: ${JSON.stringify(statusDist)}
- Performance campanhas (7 dias): ${JSON.stringify(channelStats)}
- Leads esfriando (sem contato 3+ dias): ${JSON.stringify(coolingLeads?.map(l => ({ address: l.address, owner: l.owner_name, status: l.lead_status, last_contact: l.last_contact_date, score: l.ai_score })))}
- Top leads por AI Score: ${JSON.stringify(hotLeads?.map(l => ({ address: l.address, score: l.ai_score, status: l.lead_status })))}
- Novos leads captados (7 dias): ${JSON.stringify(recentLeads)}
- Follow-ups vencidos: ${pendingReminders?.length || 0}
- Cliques recentes: ${JSON.stringify(recentClicks?.map(c => ({ address: c.property_address, channel: c.channel })))}

Gere um digest com EXATAMENTE estas seções em JSON:
- greeting: saudação curta personalizada com data
- urgent_actions: array de ações urgentes (max 5) com { icon: emoji, text, priority: "high"|"medium" }
- pipeline_summary: resumo do pipeline em 2-3 frases
- cooling_leads_alert: { count, top_3: array de { address, days_without_contact, suggested_action } }
- campaign_insights: { best_channel, worst_channel, overall_engagement_rate, tip }
- opportunities: array de oportunidades detectadas (max 3) com { text, potential_value }
- daily_tip: dica do dia para o investidor

RETORNE APENAS JSON válido.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'Você é um consultor estratégico de investimentos imobiliários. Gere insights acionáveis e concisos. Responda em português brasileiro. APENAS JSON válido.' },
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
    const digest = JSON.parse(jsonStr);

    return new Response(JSON.stringify({ digest }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Daily digest error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

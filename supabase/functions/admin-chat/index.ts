import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch real-time database stats to inject into context
    const [
      { count: totalProps },
      { data: statusCounts },
      { data: recentLeads },
      { count: campaignCount },
      { data: hotLeads },
    ] = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase.from('properties').select('lead_status'),
      supabase.from('property_leads').select('full_name, email, property_id, status, interest_level, created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('campaign_logs').select('*', { count: 'exact', head: true }),
      supabase.from('properties').select('address, city, owner_name, estimated_value, cash_offer_amount, lead_status, ai_score, last_contact_date').not('ai_score', 'is', null).order('ai_score', { ascending: false }).limit(10),
    ]);

    // Calculate status distribution
    const statusDist: Record<string, number> = {};
    statusCounts?.forEach((p: any) => {
      statusDist[p.lead_status] = (statusDist[p.lead_status] || 0) + 1;
    });

    // Find stale leads (no contact in 7+ days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: staleLeads } = await supabase
      .from('properties')
      .select('address, owner_name, lead_status, last_contact_date')
      .in('lead_status', ['contacted', 'following_up'])
      .or(`last_contact_date.is.null,last_contact_date.lt.${sevenDaysAgo}`)
      .limit(10);

    const dbContext = `
DADOS REAIS DO BANCO (atualizado agora):
- Total de propriedades: ${totalProps || 0}
- Distribuição por status: ${JSON.stringify(statusDist)}
- Campanhas enviadas: ${campaignCount || 0}
- Top leads por AI Score: ${JSON.stringify(hotLeads?.map(l => ({ address: l.address, ai_score: l.ai_score, status: l.lead_status, owner: l.owner_name })) || [])}
- Leads captados recentes: ${JSON.stringify(recentLeads?.map(l => ({ name: l.full_name, email: l.email, status: l.status, interest: l.interest_level })) || [])}
- Leads esfriando (sem contato 7+ dias): ${JSON.stringify(staleLeads?.map(l => ({ address: l.address, owner: l.owner_name, status: l.lead_status, lastContact: l.last_contact_date })) || [])}
`;

    const systemPrompt = `Você é um assistente IA para gestão de propriedades e leads imobiliários. Responda em português brasileiro.

Você tem acesso a dados REAIS do banco de dados. Use-os para responder perguntas.

${dbContext}

Capacidades:
- Consultar estatísticas de propriedades e leads
- Identificar leads quentes e frios
- Sugerir próximos passos para cada lead
- Analisar performance de campanhas
- Dar insights sobre o pipeline de vendas

Campos disponíveis nas propriedades:
- lead_status: new, contacted, following_up, meeting_scheduled, offer_made, closed, not_interested
- address, city, state, zip_code
- owner_name, owner_phone, owner_address
- estimated_value, cash_offer_amount
- ai_score (0-100), lead_score
- tags, batch_name, approval_status

Seja conciso, use dados reais, e sugira ações específicas.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Admin chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

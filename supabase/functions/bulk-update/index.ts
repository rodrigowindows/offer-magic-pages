import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { updates } = await req.json();

    if (!updates || !Array.isArray(updates)) {
      return new Response(JSON.stringify({ error: 'Missing updates array' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const update of updates) {
      const { id, ...data } = update;
      if (!id) {
        errorCount++;
        errors.push('Missing id in update');
        continue;
      }

      const { error } = await supabase
        .from('properties')
        .update(data)
        .eq('id', id);

      if (error) {
        errorCount++;
        errors.push(`${id}: ${error.message}`);
      } else {
        successCount++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      successCount,
      errorCount,
      errors: errors.slice(0, 10),
      total: updates.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

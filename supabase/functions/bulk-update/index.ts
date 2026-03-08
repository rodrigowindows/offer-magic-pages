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

    const body = await req.json();

    // Mode 1: Full SQL text
    if (body.sql_text) {
      const sql = body.sql_text as string;
      
      // Safety: only allow UPDATE statements
      const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
      for (const stmt of statements) {
        const upper = stmt.replace(/^--[^\n]*\n/gm, '').trim().toUpperCase();
        if (upper && !upper.startsWith('UPDATE PROPERTIES') && upper !== 'BEGIN' && upper !== 'COMMIT' && !upper.startsWith('--')) {
          return new Response(JSON.stringify({ 
            error: 'Only UPDATE properties statements, BEGIN, and COMMIT allowed',
            rejected: stmt.substring(0, 80)
          }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      const { error } = await supabase.rpc('execute_sql', { sql_query: sql });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'SQL executed successfully',
        statementsCount: statements.filter(s => s.toUpperCase().startsWith('UPDATE')).length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Mode 2: Array of individual statements
    if (body.sql_statements && Array.isArray(body.sql_statements)) {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const stmt of body.sql_statements) {
        const trimmed = stmt.trim().toUpperCase();
        if (!trimmed.startsWith('UPDATE PROPERTIES SET')) {
          errorCount++;
          if (errors.length < 5) errors.push('Not an UPDATE statement');
          continue;
        }

        const { error } = await supabase.rpc('execute_sql', { sql_query: stmt });
        if (error) {
          errorCount++;
          if (errors.length < 5) errors.push(error.message);
        } else {
          successCount++;
        }
      }

      return new Response(JSON.stringify({
        success: true, successCount, errorCount, errors, total: body.sql_statements.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Provide sql_text or sql_statements' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

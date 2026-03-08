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

    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: claims, error: authError } = await authClient.auth.getClaims(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use service role client for the actual updates
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { sql_statements } = await req.json();

    if (!sql_statements || !Array.isArray(sql_statements)) {
      return new Response(JSON.stringify({ error: 'Missing sql_statements array' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Only allow UPDATE statements on properties table
    for (const stmt of sql_statements) {
      const trimmed = stmt.trim().toUpperCase();
      if (!trimmed.startsWith('UPDATE PROPERTIES SET')) {
        return new Response(JSON.stringify({ error: 'Only UPDATE properties SET statements allowed' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const stmt of sql_statements) {
      const { error } = await supabase.rpc('execute_sql', { sql_query: stmt });
      if (error) {
        errorCount++;
        if (errors.length < 5) errors.push(error.message);
      } else {
        successCount++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      successCount,
      errorCount,
      errors,
      total: sql_statements.length
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

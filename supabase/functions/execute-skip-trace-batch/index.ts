import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sql } = await req.json();
    
    if (!sql) {
      return new Response(JSON.stringify({ error: "No SQL provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Execute SQL via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
    });

    // Use direct PostgreSQL connection via pg
    // Actually, use the Supabase management API to run SQL
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    
    if (!dbUrl) {
      return new Response(JSON.stringify({ error: "DB URL not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse SQL into individual statements and execute via supabase client
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Split SQL into individual UPDATE statements
    const statements = sql.split(/;\s*(?=UPDATE|COMMIT|BEGIN)/i).filter((s: string) => s.trim().startsWith('UPDATE'));
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const stmt of statements) {
      const cleanStmt = stmt.trim();
      if (!cleanStmt) continue;
      
      // Extract the UUID from WHERE id = '...'
      const idMatch = cleanStmt.match(/WHERE\s+id\s*=\s*'([^']+)'/i);
      if (!idMatch) {
        errors.push("Could not find ID in statement");
        errorCount++;
        continue;
      }

      // Execute via rpc or direct query
      const { error } = await supabase.rpc('execute_sql', { sql_query: cleanStmt + ';' });
      
      if (error) {
        errors.push(`${idMatch[1]}: ${error.message}`);
        errorCount++;
      } else {
        successCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        total: statements.length,
        updated: successCount, 
        errors: errorCount,
        errorDetails: errors.slice(0, 10)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

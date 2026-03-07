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
    const { statements } = await req.json();
    
    if (!statements || !Array.isArray(statements)) {
      return new Response(JSON.stringify({ error: "Provide 'statements' array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const sql of statements) {
      const { error } = await supabase.rpc('execute_sql', { sql_query: sql });
      if (error) {
        errors.push(error.message);
        errorCount++;
      } else {
        successCount++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, updated: successCount, errors: errorCount, errorDetails: errors.slice(0, 5) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

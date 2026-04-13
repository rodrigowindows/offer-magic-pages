import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-import-secret",
};

// Simple secret to prevent accidental public use
const IMPORT_SECRET = "miami-import-2026";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Check import secret header
  const secret = req.headers.get("x-import-secret");
  if (secret !== IMPORT_SECRET) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: missing x-import-secret header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { records } = await req.json();

    if (!Array.isArray(records) || records.length === 0) {
      return new Response(
        JSON.stringify({ error: "Body must be { records: [...] } with at least 1 item" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Importing ${records.length} properties...`);

    const results = { ok: 0, updated: 0, errors: [] as string[] };

    // Insert in batches of 10
    const BATCH = 10;
    for (let i = 0; i < records.length; i += BATCH) {
      const batch = records.slice(i, i + BATCH);

      const { error } = await supabase
        .from("properties")
        .upsert(batch, { onConflict: "slug", ignoreDuplicates: false });

      if (error) {
        console.error(`Batch ${i}-${i + BATCH} error:`, error.message);
        results.errors.push(`Batch ${i}: ${error.message}`);
      } else {
        results.ok += batch.length;
      }
    }

    console.log(`Done: ${results.ok} ok, ${results.errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: results.errors.length === 0,
        imported: results.ok,
        errors: results.errors,
        total: records.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Fatal error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

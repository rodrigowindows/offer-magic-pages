import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// GET /functions/v1/batch-stats?batch=<name>
//
// Returns counts of approval_status for every row whose batch_name OR
// import_batch matches <name>. Uses HEAD count queries so row limits
// (max_rows = 1000) don't truncate the totals.
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const batch = url.searchParams.get("batch");
    if (!batch) return json({ error: "Missing 'batch' query parameter" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return json({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }, 500);
    }
    const supabase = createClient(supabaseUrl, serviceKey);

    const results: Record<string, Record<string, number | null>> = {
      batch_name: {},
      import_batch: {},
    };

    for (const field of ["batch_name", "import_batch"] as const) {
      const [total, approved, rejected, pendingExplicit, pendingNull] = await Promise.all([
        count(supabase, field, batch),
        count(supabase, field, batch, { status: "approved" }),
        count(supabase, field, batch, { status: "rejected" }),
        count(supabase, field, batch, { status: "pending" }),
        count(supabase, field, batch, { statusIsNull: true }),
      ]);

      results[field] = {
        total,
        approved,
        rejected,
        pending: (pendingExplicit ?? 0) + (pendingNull ?? 0),
      };
    }

    const usedField =
      (results.batch_name.total ?? 0) > 0
        ? "batch_name"
        : (results.import_batch.total ?? 0) > 0
        ? "import_batch"
        : null;

    return json({
      batch,
      used_field: usedField,
      counts: usedField ? results[usedField] : null,
      diagnostic: results,
    });
  } catch (err) {
    console.error("batch-stats error:", err);
    return json({ error: "Internal error", detail: String(err) }, 500);
  }
});

async function count(
  supabase: ReturnType<typeof createClient>,
  field: "batch_name" | "import_batch",
  batch: string,
  opts: { status?: string; statusIsNull?: boolean } = {},
): Promise<number | null> {
  let q: any = supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq(field, batch);

  if (opts.status) q = q.eq("approval_status", opts.status);
  if (opts.statusIsNull) q = q.is("approval_status", null);

  const { count: c, error } = await q;
  if (error) {
    console.error(`count(${field}=${batch}, ${JSON.stringify(opts)}):`, error);
    return null;
  }
  return c ?? 0;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

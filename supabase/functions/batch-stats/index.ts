import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// GET /functions/v1/batch-stats?batch=<name>[&field=batch_name|import_batch]
// Returns { batch, field, total, counts: { approved, rejected, pending } }
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const batch = url.searchParams.get("batch");
    const requestedField = url.searchParams.get("field");

    if (!batch) {
      return json({ error: "Missing 'batch' query parameter" }, 400);
    }

    const field = requestedField === "import_batch" ? "import_batch" : "batch_name";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch both fields for diagnostic
    const [byBatchName, byImportBatch] = await Promise.all([
      fetchRows(supabase, "batch_name", batch),
      fetchRows(supabase, "import_batch", batch),
    ]);

    const requestedFieldKey = requestedField === "import_batch" ? "import_batch" : "batch_name";

    // Pick primary result: requested field, or whichever has rows
    let primary = requestedFieldKey === "batch_name" ? byBatchName : byImportBatch;
    let usedField = requestedFieldKey;
    if (primary.rows.length === 0 && !requestedField) {
      const other = requestedFieldKey === "batch_name" ? byImportBatch : byBatchName;
      if (other.rows.length > 0) {
        primary = other;
        usedField = other.usedField;
      }
    }

    const toCounts = (rows: { approval_status: string | null }[]) => {
      const c = { approved: 0, rejected: 0, pending: 0 } as Record<string, number>;
      for (const r of rows) {
        const s = (r.approval_status ?? "pending") as string;
        c[s] = (c[s] ?? 0) + 1;
      }
      return { total: rows.length, ...c };
    };

    return json({
      batch,
      used_field: usedField,
      counts: toCounts(primary.rows),
      diagnostic: {
        batch_name: toCounts(byBatchName.rows),
        import_batch: toCounts(byImportBatch.rows),
      },
    });
  } catch (err) {
    console.error("batch-stats error:", err);
    return json({ error: "Internal error", detail: String(err) }, 500);
  }
});

async function fetchRows(
  supabase: any,
  field: "batch_name" | "import_batch",
  value: string,
) {
  const { data, error } = await supabase
    .from("properties")
    .select("approval_status")
    .eq(field, value);

  if (error) throw error;
  return { rows: (data ?? []) as { approval_status: string | null }[], usedField: field };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

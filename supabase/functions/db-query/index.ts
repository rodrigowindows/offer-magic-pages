import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Generic read/query endpoint using PostgREST semantics.
 *
 * POST /functions/v1/db-query
 * Headers:
 *   X-Admin-Secret: <value of ADMIN_QUERY_SECRET env var>
 * Body (JSON):
 *   {
 *     "table":   "properties",
 *     "select":  "id,address,approval_status",   // default "*"
 *     "filters": [                               // optional, ANDed
 *       { "field": "batch_name", "op": "eq",  "value": "miami-2026-04-13-1k" },
 *       { "field": "ai_score",   "op": "gte", "value": 60 }
 *     ],
 *     "order":   { "field": "ai_score", "ascending": false },  // optional
 *     "limit":   100,                            // default 1000, max 10000
 *     "count":   "exact"                         // optional: "exact" | "planned"
 *   }
 *
 * Allowed ops: eq, neq, gt, gte, lt, lte, like, ilike, is, in.
 * Reads only — no insert/update/delete/rpc. Locked to a small allow-list
 * of tables; raw SQL is intentionally not exposed.
 */

const ALLOWED_TABLES = new Set([
  "properties",
  "campaigns",
  "campaign_targets",
  "campaign_clicks",
  "lead_activities",
  "scheduled_campaigns",
  "manual_comps_links",
  "ab_tests",
  "ab_test_events",
]);

const ALLOWED_OPS = new Set([
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "like",
  "ilike",
  "is",
  "in",
]);

const MAX_LIMIT = 10_000;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Use POST" }, 405);
  }

  // --- auth via shared secret header ---
  const expected = Deno.env.get("ADMIN_QUERY_SECRET");
  if (!expected) {
    return json({ error: "Server not configured: ADMIN_QUERY_SECRET missing" }, 500);
  }
  const provided = req.headers.get("x-admin-secret") ?? "";
  if (!timingSafeEqual(provided, expected)) {
    return json({ error: "Unauthorized" }, 401);
  }

  // --- parse body ---
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body must be JSON" }, 400);
  }

  const table = String(body.table ?? "").trim();
  if (!table) return json({ error: "Missing 'table'" }, 400);
  if (!ALLOWED_TABLES.has(table)) {
    return json(
      { error: `Table '${table}' not allowed`, allowed: [...ALLOWED_TABLES] },
      400,
    );
  }

  const select = typeof body.select === "string" && body.select.trim() ? body.select : "*";
  const limit = clampLimit(body.limit);
  const filters = Array.isArray(body.filters) ? body.filters : [];
  const order = body.order && typeof body.order === "object" ? body.order : null;
  const count = body.count === "exact" || body.count === "planned" ? body.count : undefined;

  // --- execute ---
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let q: any = supabase.from(table).select(select, count ? { count } : undefined);

  for (const f of filters) {
    const op = String(f?.op ?? "");
    const field = String(f?.field ?? "");
    if (!field || !ALLOWED_OPS.has(op)) {
      return json({ error: `Invalid filter: ${JSON.stringify(f)}` }, 400);
    }
    q = q[op](field, f.value);
  }

  if (order?.field) {
    q = q.order(String(order.field), { ascending: order.ascending !== false });
  }

  q = q.limit(limit);

  const { data, error, count: total } = await q;
  if (error) {
    console.error("db-query error:", error);
    return json({ error: error.message, details: error.details ?? null }, 400);
  }

  return json({ table, rows: data ?? [], returned: (data ?? []).length, total: total ?? null });
});

function clampLimit(v: unknown): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n) || n <= 0) return 1000;
  return Math.min(n, MAX_LIMIT);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

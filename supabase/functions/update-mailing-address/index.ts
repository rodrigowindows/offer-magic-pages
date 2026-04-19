import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface UpdatePayload {
  property_id?: string;
  slug?: string;
  confirmed_mailing_address?: string;
  confirmed_mailing_city?: string;
  confirmed_mailing_state?: string;
  confirmed_mailing_zip?: string;
  owner_name?: string;
}

interface BatchPayload {
  updates: UpdatePayload[];
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Simple API key auth (uses Supabase anon key as bearer)
    const authHeader = req.headers.get("authorization") || req.headers.get("apikey") || "";
    const expectedKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    if (!authHeader || (!authHeader.includes(expectedKey) && authHeader !== expectedKey)) {
      return new Response(JSON.stringify({ error: "Unauthorized. Provide apikey header." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const updates: UpdatePayload[] = Array.isArray(body?.updates) ? body.updates : [body];

    if (!updates.length) {
      return new Response(JSON.stringify({ error: "No updates provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results: any[] = [];

    for (const u of updates) {
      if (!u.property_id && !u.slug) {
        results.push({ ok: false, error: "Missing property_id or slug", input: u });
        continue;
      }

      const patch: Record<string, any> = {};
      if (u.confirmed_mailing_address !== undefined) patch.confirmed_mailing_address = u.confirmed_mailing_address;
      if (u.confirmed_mailing_city !== undefined) patch.confirmed_mailing_city = u.confirmed_mailing_city;
      if (u.confirmed_mailing_state !== undefined) patch.confirmed_mailing_state = u.confirmed_mailing_state;
      if (u.confirmed_mailing_zip !== undefined) patch.confirmed_mailing_zip = u.confirmed_mailing_zip;
      if (u.owner_name !== undefined) patch.owner_name = u.owner_name;
      patch.updated_at = new Date().toISOString();

      if (Object.keys(patch).length === 1) {
        results.push({ ok: false, error: "No fields to update", input: u });
        continue;
      }

      let q = supabase.from("properties").update(patch);
      if (u.property_id) q = q.eq("id", u.property_id);
      else q = q.eq("slug", u.slug!);

      const { data, error } = await q.select("id, slug, confirmed_mailing_address, confirmed_mailing_city, confirmed_mailing_state, confirmed_mailing_zip, owner_name").maybeSingle();

      if (error) {
        results.push({ ok: false, error: error.message, input: u });
      } else if (!data) {
        results.push({ ok: false, error: "Property not found", input: u });
      } else {
        results.push({ ok: true, property: data });
      }
    }

    const okCount = results.filter(r => r.ok).length;
    return new Response(
      JSON.stringify({ success: true, updated: okCount, total: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("update-mailing-address error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

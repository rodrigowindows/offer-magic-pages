import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const csvEscape = (val: any): string => {
  if (val === null || val === undefined) return '';
  const s = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const toCsv = (rows: Record<string, any>[]): string => {
  if (rows.length === 0) return '';
  const headers = Array.from(
    rows.reduce((acc, r) => {
      Object.keys(r).forEach((k) => acc.add(k));
      return acc;
    }, new Set<string>())
  );
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  return lines.join('\n');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'download';
    const batch = url.searchParams.get('batch');
    const approvedOnly = url.searchParams.get('approved_only') === '1';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // List batches with ~1000 properties
    if (action === 'list') {
      // Paginate to bypass 1000-row limit
      const counts = new Map<string, number>();
      const pageSize = 1000;
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from('properties')
          .select('batch_name, import_batch')
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        for (const row of data) {
          const name = (row as any).batch_name || (row as any).import_batch;
          if (name) counts.set(name, (counts.get(name) || 0) + 1);
        }
        if (data.length < pageSize) break;
        from += pageSize;
      }

      // Show all batches with 100+ properties (was 800-1200, too restrictive)
      const batches = Array.from(counts.entries())
        .filter(([, c]) => c >= 100)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b[1] ? b.count - a.count : 0);

      return new Response(JSON.stringify({ batches }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!batch) {
      return new Response(JSON.stringify({ error: 'batch param required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch properties (try batch_name first, fallback to import_batch)
    let { data: properties, error: pErr } = await supabase
      .from('properties')
      .select('*')
      .eq('batch_name', batch)
      .order('lead_score', { ascending: false, nullsFirst: false });

    if (pErr) throw pErr;

    if (!properties || properties.length === 0) {
      const fallback = await supabase
        .from('properties')
        .select('*')
        .eq('import_batch', batch)
        .order('lead_score', { ascending: false, nullsFirst: false });
      if (fallback.error) throw fallback.error;
      properties = fallback.data || [];
    }

    if (properties.length === 0) {
      return new Response(JSON.stringify({ error: 'no properties for batch' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ids = properties.map((p: any) => p.id);

    // Fetch related data in parallel
    const [comps, history] = await Promise.all([
      supabase.from('manual_comps_links').select('*').in('property_id', ids),
      supabase.from('comps_analysis_history').select('*').in('property_id', ids),
    ]);

    const compsByProp = new Map<string, any[]>();
    for (const c of comps.data || []) {
      const arr = compsByProp.get((c as any).property_id) || [];
      arr.push(c);
      compsByProp.set((c as any).property_id, arr);
    }

    const histByProp = new Map<string, any>();
    for (const h of history.data || []) {
      const pid = (h as any).property_id;
      const existing = histByProp.get(pid);
      if (!existing || new Date((h as any).created_at) > new Date(existing.created_at)) {
        histByProp.set(pid, h);
      }
    }

    const enriched = properties.map((p: any) => {
      const cs = compsByProp.get(p.id) || [];
      const h = histByProp.get(p.id);
      return {
        ...p,
        manual_comps_count: cs.length,
        manual_comps_data: cs
          .map(
            (c: any) =>
              `[${c.source}] ${c.url}${c.notes ? ' | notes: ' + c.notes : ''}`
          )
          .join('\n---\n'),
        latest_comps_radius: h?.search_radius_miles || null,
        latest_comps_source: h?.data_source || null,
        latest_comps_value_min: h?.suggested_value_min || null,
        latest_comps_value_max: h?.suggested_value_max || null,
        latest_comps_notes: h?.notes || null,
        latest_comps_count: h?.comparables_count || null,
      };
    });

    const csv = toCsv(enriched);

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${batch}_FULL.csv"`,
      },
    });
  } catch (e) {
    console.error('export-batch-csv error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

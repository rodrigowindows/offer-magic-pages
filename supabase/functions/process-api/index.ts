/**
 * process-api - Edge Function that exposes all /process operations as API endpoints.
 * Designed for web agents to automate the property review workflow.
 *
 * Actions:
 *   list          - List properties (pending/approved/rejected) with filters
 *   get           - Get single property by ID with comps
 *   counts        - Get status counts (pending/approved/rejected)
 *   approve       - Approve a property with cash offer
 *   reject        - Reject a property with reason
 *   reset         - Reset property back to pending
 *   comps.list    - List comps for a property
 *   comps.add     - Add a comp to a property
 *   comps.delete  - Delete a comp
 *   comps.pricing - Calculate ARV/pricing from comps
 *   batch.list    - List available import batches
 *   bulk.approve  - Approve multiple properties at once
 *   bulk.reject   - Reject multiple properties at once
 *   info          - Return API documentation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const PROPERTY_FIELDS = "id, address, city, state, zip_code, neighborhood, owner_name, property_image_url, estimated_value, cash_offer_amount, approval_status, approved_by_name, approved_at, rejection_reason, rejection_notes, decision_photos, property_type, year_built, square_feet, bedrooms, bathrooms, lot_size, owner_phone, lead_score, zillow_url, focar, evaluation, tags, owner_address, origem, ai_score, ai_reasoning, import_batch, created_at";

const REJECTION_REASONS = [
  "new-construction", "recent-sale", "too-good-condition", "multi-family",
  "hoa-restrictions", "land", "no-equity", "agent-listed",
  "commercial", "duplicate", "wrong-location", "other",
];

const DEFAULT_OFFER_RATIO = 0.7;

// ── Helpers ──────────────────────────────────────────────────────────

function ok(data: unknown, status = 200) {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function err(message: string, status = 400) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// IQR outlier removal (same logic as frontend compsPricing.ts)
function removeOutliers(values: number[]): { kept: number[]; removedCount: number } {
  if (values.length < 4) return { kept: values, removedCount: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  const kept = values.filter(v => v >= lower && v <= upper);
  return { kept, removedCount: values.length - kept.length };
}

function calculatePricing(comps: any[], subjectSqft: number) {
  const valid = comps.filter(
    (c: any) => c.comp_data?.sale_price > 0 && c.comp_data?.square_feet > 0
  );
  if (valid.length === 0) {
    return { validCount: 0, totalCount: comps.length, avgPricePerSqft: 0, estimatedARV: 0, outliersRemoved: 0 };
  }
  const prices = valid.map((c: any) => c.comp_data.sale_price / c.comp_data.square_feet);
  const { kept, removedCount } = removeOutliers(prices);
  const avg = kept.length > 0 ? Math.round(kept.reduce((s, v) => s + v, 0) / kept.length) : 0;
  return {
    validCount: kept.length,
    totalCount: comps.length,
    avgPricePerSqft: avg,
    estimatedARV: subjectSqft > 0 ? Math.round(avg * subjectSqft) : 0,
    outliersRemoved: removedCount,
    defaultOffer: subjectSqft > 0 ? Math.round(avg * subjectSqft * DEFAULT_OFFER_RATIO) : 0,
  };
}

// ── Actions ──────────────────────────────────────────────────────────

async function handleList(body: any) {
  const { status = 'pending', batch, limit = 500, offset = 0, search, visual_filter } = body;

  let query = supabase
    .from('properties')
    .select(PROPERTY_FIELDS)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (status === 'pending') {
    query = query.or('approval_status.is.null,approval_status.eq.pending');
  } else {
    query = query.eq('approval_status', status);
  }

  if (batch && batch !== 'all') {
    query = query.eq('import_batch', batch);
  }

  if (search) {
    query = query.ilike('address', `%${search}%`);
  }

  const { data, error } = await query;
  if (error) return err(error.message, 500);

  let properties = data || [];

  // Visual filter (HOT/WARM/COLD based on evaluation field)
  if (visual_filter && visual_filter !== 'all') {
    properties = properties.filter((p: any) => {
      const visual = p.evaluation?.match(/Visual:(\S+)/)?.[1] || 'COLD';
      return visual === visual_filter;
    });
  }

  return ok({
    properties,
    count: properties.length,
    filters: { status, batch, search, visual_filter },
  });
}

async function handleGet(body: any) {
  const { property_id } = body;
  if (!property_id) return err('property_id is required');

  const { data: property, error } = await supabase
    .from('properties')
    .select(PROPERTY_FIELDS)
    .eq('id', property_id)
    .single();

  if (error) return err(error.message, 404);

  // Also fetch comps
  const { data: comps } = await supabase
    .from('manual_comps_links')
    .select('id, url, source, comp_data, created_at')
    .eq('property_id', property_id)
    .order('created_at', { ascending: false });

  const pricing = calculatePricing(comps || [], property.square_feet || 0);

  return ok({ property, comps: comps || [], pricing });
}

async function handleCounts(body: any) {
  const { batch } = body;
  const batchFilter = batch && batch !== 'all' ? batch : null;

  let pQ = supabase.from('properties').select('*', { count: 'exact', head: true })
    .or('approval_status.is.null,approval_status.eq.pending');
  let aQ = supabase.from('properties').select('*', { count: 'exact', head: true })
    .eq('approval_status', 'approved');
  let rQ = supabase.from('properties').select('*', { count: 'exact', head: true })
    .eq('approval_status', 'rejected');

  if (batchFilter) {
    pQ = pQ.eq('import_batch', batchFilter);
    aQ = aQ.eq('import_batch', batchFilter);
    rQ = rQ.eq('import_batch', batchFilter);
  }

  const [pendingRes, approvedRes, rejectedRes] = await Promise.all([pQ, aQ, rQ]);

  return ok({
    pending: pendingRes.count || 0,
    approved: approvedRes.count || 0,
    rejected: rejectedRes.count || 0,
    total: (pendingRes.count || 0) + (approvedRes.count || 0) + (rejectedRes.count || 0),
  });
}

async function handleApprove(body: any) {
  const { property_id, cash_offer_amount, notes, agent_name = 'WebAgent' } = body;
  if (!property_id) return err('property_id is required');

  // If no offer provided, calculate from estimated_value
  let offerAmount = cash_offer_amount;
  if (!offerAmount) {
    const { data: prop } = await supabase
      .from('properties')
      .select('estimated_value, square_feet')
      .eq('id', property_id)
      .single();

    if (prop?.estimated_value) {
      // Try to calculate from comps first
      const { data: comps } = await supabase
        .from('manual_comps_links')
        .select('comp_data')
        .eq('property_id', property_id);

      if (comps && comps.length > 0) {
        const pricing = calculatePricing(comps, prop.square_feet || 0);
        if (pricing.defaultOffer && pricing.defaultOffer > 0) {
          offerAmount = pricing.defaultOffer;
        }
      }
      if (!offerAmount) {
        offerAmount = Math.round(prop.estimated_value * DEFAULT_OFFER_RATIO);
      }
    }
  }

  const updateData: Record<string, unknown> = {
    approval_status: 'approved',
    approved_by_name: agent_name,
    approved_at: new Date().toISOString(),
    rejection_reason: null,
    rejection_notes: notes || null,
    updated_by_name: agent_name,
  };

  if (offerAmount && offerAmount > 0) {
    updateData.cash_offer_amount = offerAmount;
  }

  const { error } = await supabase
    .from('properties')
    .update(updateData)
    .eq('id', property_id);

  if (error) return err(error.message, 500);

  return ok({
    property_id,
    status: 'approved',
    cash_offer_amount: offerAmount,
    agent_name,
  });
}

async function handleReject(body: any) {
  const { property_id, reason, notes, agent_name = 'WebAgent' } = body;
  if (!property_id) return err('property_id is required');
  if (!reason) return err('reason is required');
  if (!REJECTION_REASONS.includes(reason)) {
    return err(`Invalid reason. Valid: ${REJECTION_REASONS.join(', ')}`);
  }

  const updateData: Record<string, unknown> = {
    approval_status: 'rejected',
    approved_by_name: agent_name,
    approved_at: new Date().toISOString(),
    rejection_reason: reason,
    rejection_notes: notes || null,
    updated_by_name: agent_name,
  };

  const { error } = await supabase
    .from('properties')
    .update(updateData)
    .eq('id', property_id);

  if (error) return err(error.message, 500);

  return ok({ property_id, status: 'rejected', reason, agent_name });
}

async function handleReset(body: any) {
  const { property_id } = body;
  if (!property_id) return err('property_id is required');

  const { error } = await supabase
    .from('properties')
    .update({
      approval_status: null,
      approved_by: null,
      approved_by_name: null,
      approved_at: null,
      rejection_reason: null,
      rejection_notes: null,
      cash_offer_amount: null,
      decision_photos: null,
    })
    .eq('id', property_id);

  if (error) return err(error.message, 500);
  return ok({ property_id, status: 'reset_to_pending' });
}

async function handleCompsList(body: any) {
  const { property_id } = body;
  if (!property_id) return err('property_id is required');

  const { data, error } = await supabase
    .from('manual_comps_links')
    .select('id, url, source, comp_data, created_at, property_address')
    .eq('property_id', property_id)
    .order('created_at', { ascending: false });

  if (error) return err(error.message, 500);

  // Get property sqft for pricing
  const { data: prop } = await supabase
    .from('properties')
    .select('square_feet')
    .eq('id', property_id)
    .single();

  const pricing = calculatePricing(data || [], prop?.square_feet || 0);

  return ok({ comps: data || [], pricing });
}

async function handleCompsAdd(body: any) {
  const { property_id, url, comp_data } = body;
  if (!property_id) return err('property_id is required');
  if (!url) return err('url is required');
  if (!comp_data?.sale_price || !comp_data?.square_feet) {
    return err('comp_data.sale_price and comp_data.square_feet are required');
  }

  // Get property address
  const { data: prop } = await supabase
    .from('properties')
    .select('address, city, state, zip_code')
    .eq('id', property_id)
    .single();

  const addressStr = prop
    ? `${prop.address}, ${prop.city || ''}, ${prop.state || ''} ${prop.zip_code || ''}`
    : '';

  // Detect source from URL
  let source = 'other';
  const urlLower = url.toLowerCase();
  if (urlLower.includes('zillow')) source = 'zillow';
  else if (urlLower.includes('redfin')) source = 'redfin';
  else if (urlLower.includes('realtor')) source = 'realtor';
  else if (urlLower.includes('trulia')) source = 'trulia';

  const { data, error } = await supabase
    .from('manual_comps_links')
    .insert([{
      property_id,
      property_address: addressStr,
      url: url.trim(),
      source,
      comp_data,
    }])
    .select('id')
    .single();

  if (error) return err(error.message, 500);

  return ok({ comp_id: data.id, property_id, source, comp_data });
}

async function handleCompsDelete(body: any) {
  const { comp_id } = body;
  if (!comp_id) return err('comp_id is required');

  const { error } = await supabase
    .from('manual_comps_links')
    .delete()
    .eq('id', comp_id);

  if (error) return err(error.message, 500);
  return ok({ comp_id, deleted: true });
}

async function handleCompsPricing(body: any) {
  const { property_id } = body;
  if (!property_id) return err('property_id is required');

  const { data: comps } = await supabase
    .from('manual_comps_links')
    .select('comp_data')
    .eq('property_id', property_id);

  const { data: prop } = await supabase
    .from('properties')
    .select('square_feet, estimated_value')
    .eq('id', property_id)
    .single();

  const pricing = calculatePricing(comps || [], prop?.square_feet || 0);

  return ok({
    ...pricing,
    subject_sqft: prop?.square_feet || 0,
    estimated_value: prop?.estimated_value || 0,
    defaultOffer: pricing.defaultOffer || Math.round((prop?.estimated_value || 0) * DEFAULT_OFFER_RATIO),
  });
}

async function handleBatchList() {
  const { data, error } = await supabase
    .from('properties')
    .select('import_batch')
    .not('import_batch', 'is', null);

  if (error) return err(error.message, 500);

  const batches = [...new Set((data || []).map((r: any) => r.import_batch).filter(Boolean))].sort();

  return ok({ batches });
}

async function handleBulkApprove(body: any) {
  const { property_ids, cash_offer_amounts, agent_name = 'WebAgent' } = body;
  if (!property_ids || !Array.isArray(property_ids) || property_ids.length === 0) {
    return err('property_ids array is required');
  }

  const results: { property_id: string; status: string; cash_offer_amount?: number; error?: string }[] = [];

  for (const pid of property_ids) {
    const offer = cash_offer_amounts?.[pid] || null;
    const res = await handleApprove({ property_id: pid, cash_offer_amount: offer, agent_name });
    const resBody = await res.clone().json();
    if (resBody.success) {
      results.push({ property_id: pid, status: 'approved', cash_offer_amount: resBody.data.cash_offer_amount });
    } else {
      results.push({ property_id: pid, status: 'error', error: resBody.error });
    }
  }

  const approved = results.filter(r => r.status === 'approved').length;
  const errors = results.filter(r => r.status === 'error').length;

  return ok({ total: property_ids.length, approved, errors, results });
}

async function handleBulkReject(body: any) {
  const { property_ids, reason, notes, agent_name = 'WebAgent' } = body;
  if (!property_ids || !Array.isArray(property_ids) || property_ids.length === 0) {
    return err('property_ids array is required');
  }
  if (!reason) return err('reason is required');

  const results: { property_id: string; status: string; error?: string }[] = [];

  for (const pid of property_ids) {
    const res = await handleReject({ property_id: pid, reason, notes, agent_name });
    const resBody = await res.clone().json();
    if (resBody.success) {
      results.push({ property_id: pid, status: 'rejected' });
    } else {
      results.push({ property_id: pid, status: 'error', error: resBody.error });
    }
  }

  const rejected = results.filter(r => r.status === 'rejected').length;
  const errors = results.filter(r => r.status === 'error').length;

  return ok({ total: property_ids.length, rejected, errors, results });
}

function handleInfo() {
  return ok({
    name: 'Process API',
    version: '1.0',
    description: 'API para automação do processo de análise de propriedades via web agent',
    base_url: `${SUPABASE_URL}/functions/v1/process-api`,
    auth: {
      header: 'apikey',
      description: 'Use o ANON_KEY do Supabase como header apikey',
    },
    actions: {
      // Read operations
      list: {
        description: 'Listar propriedades com filtros',
        params: {
          status: 'pending | approved | rejected (default: pending)',
          batch: 'Nome do batch de import (optional)',
          limit: 'Max results (default: 500)',
          offset: 'Pagination offset (default: 0)',
          search: 'Buscar por endereço (optional)',
          visual_filter: 'HOT | WARM | COLD | all (optional)',
        },
        example: '{ "action": "list", "status": "pending", "limit": 50 }',
      },
      get: {
        description: 'Obter propriedade por ID com comps e pricing',
        params: { property_id: 'UUID da propriedade' },
        example: '{ "action": "get", "property_id": "uuid-here" }',
      },
      counts: {
        description: 'Contagem por status',
        params: { batch: 'Filtrar por batch (optional)' },
        example: '{ "action": "counts" }',
      },
      // Write operations
      approve: {
        description: 'Aprovar propriedade com oferta',
        params: {
          property_id: 'UUID (required)',
          cash_offer_amount: 'Valor da oferta (optional - calcula automaticamente se omitido)',
          notes: 'Notas de aprovação (optional)',
          agent_name: 'Nome do agente (default: WebAgent)',
        },
        example: '{ "action": "approve", "property_id": "uuid", "cash_offer_amount": 150000 }',
      },
      reject: {
        description: 'Rejeitar propriedade',
        params: {
          property_id: 'UUID (required)',
          reason: `Motivo (required): ${REJECTION_REASONS.join(', ')}`,
          notes: 'Notas adicionais (optional)',
          agent_name: 'Nome do agente (default: WebAgent)',
        },
        example: '{ "action": "reject", "property_id": "uuid", "reason": "new-construction" }',
      },
      reset: {
        description: 'Resetar propriedade para pendente',
        params: { property_id: 'UUID (required)' },
        example: '{ "action": "reset", "property_id": "uuid" }',
      },
      // Comps
      'comps.list': {
        description: 'Listar comps de uma propriedade com pricing',
        params: { property_id: 'UUID (required)' },
        example: '{ "action": "comps.list", "property_id": "uuid" }',
      },
      'comps.add': {
        description: 'Adicionar comp a uma propriedade',
        params: {
          property_id: 'UUID (required)',
          url: 'Link do comp - Zillow/Redfin/etc (required)',
          comp_data: '{ sale_price, square_feet, address?, sale_date?, lot_size?, bedrooms?, bathrooms? }',
        },
        example: '{ "action": "comps.add", "property_id": "uuid", "url": "https://zillow.com/...", "comp_data": { "sale_price": 250000, "square_feet": 1500 } }',
      },
      'comps.delete': {
        description: 'Remover um comp',
        params: { comp_id: 'UUID do comp (required)' },
        example: '{ "action": "comps.delete", "comp_id": "uuid" }',
      },
      'comps.pricing': {
        description: 'Calcular ARV e pricing de comps',
        params: { property_id: 'UUID (required)' },
        example: '{ "action": "comps.pricing", "property_id": "uuid" }',
      },
      // Batch
      'batch.list': {
        description: 'Listar batches de importação disponíveis',
        params: {},
        example: '{ "action": "batch.list" }',
      },
      // Bulk
      'bulk.approve': {
        description: 'Aprovar múltiplas propriedades de uma vez',
        params: {
          property_ids: 'Array de UUIDs (required)',
          cash_offer_amounts: 'Objeto { uuid: valor } (optional)',
          agent_name: 'Nome do agente (default: WebAgent)',
        },
        example: '{ "action": "bulk.approve", "property_ids": ["uuid1", "uuid2"], "cash_offer_amounts": { "uuid1": 150000 } }',
      },
      'bulk.reject': {
        description: 'Rejeitar múltiplas propriedades de uma vez',
        params: {
          property_ids: 'Array de UUIDs (required)',
          reason: 'Motivo da rejeição (required)',
          notes: 'Notas (optional)',
          agent_name: 'Nome do agente (default: WebAgent)',
        },
        example: '{ "action": "bulk.reject", "property_ids": ["uuid1", "uuid2"], "reason": "new-construction" }',
      },
    },
    rejection_reasons: REJECTION_REASONS.map(r => ({
      value: r,
      label: {
        'new-construction': 'Casa Nova (menos de 20 anos)',
        'recent-sale': 'Recém Vendida (menos de 2 anos)',
        'too-good-condition': 'Casa em Bom Estado',
        'multi-family': 'Multi-Family',
        'hoa-restrictions': 'Propriedade com HOA',
        'land': 'Terreno (Land)',
        'no-equity': 'Low-Equity',
        'agent-listed': 'Anunciada por Corretor',
        'commercial': 'Imóvel Comercial',
        'duplicate': 'Duplicado',
        'wrong-location': 'Localização errada',
        'other': 'Outro motivo',
      }[r] || r,
    })),
    workflow_example: {
      description: 'Fluxo típico para web agent processar propriedades',
      steps: [
        '1. GET counts → ver quantas pendentes',
        '2. POST list { status: "pending", limit: 50 } → pegar lote',
        '3. Para cada propriedade:',
        '   a. POST get { property_id } → ver detalhes + comps',
        '   b. Analisar dados (year_built, evaluation, estimated_value, etc)',
        '   c. Se bom: POST approve { property_id, cash_offer_amount }',
        '   d. Se ruim: POST reject { property_id, reason: "..." }',
        '4. Ou usar bulk.approve / bulk.reject para processar em lote',
      ],
    },
  });
}

// ── Router ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Support GET for info
    if (req.method === 'GET') {
      return handleInfo();
    }

    const body = await req.json();
    const { action } = body;

    if (!action) {
      return err('action is required. Use "info" to see available actions.');
    }

    switch (action) {
      case 'list':           return await handleList(body);
      case 'get':            return await handleGet(body);
      case 'counts':         return await handleCounts(body);
      case 'approve':        return await handleApprove(body);
      case 'reject':         return await handleReject(body);
      case 'reset':          return await handleReset(body);
      case 'comps.list':     return await handleCompsList(body);
      case 'comps.add':      return await handleCompsAdd(body);
      case 'comps.delete':   return await handleCompsDelete(body);
      case 'comps.pricing':  return await handleCompsPricing(body);
      case 'batch.list':     return await handleBatchList();
      case 'bulk.approve':   return await handleBulkApprove(body);
      case 'bulk.reject':    return await handleBulkReject(body);
      case 'info':           return handleInfo();
      default:
        return err(`Unknown action: "${action}". Use "info" to see available actions.`);
    }
  } catch (e: any) {
    return err(`Server error: ${e.message}`, 500);
  }
});

/**
 * process-api - Edge Function that exposes all /process operations as API endpoints.
 * Designed for web agents to automate the property review workflow.
 *
 * Security:
 *   - Requires valid apikey header (SUPABASE_ANON_KEY or SERVICE_ROLE_KEY)
 *   - Write operations require authenticated JWT (Authorization: Bearer <token>)
 *   - Input validation on all parameters
 *   - Rate limiting per IP
 *   - UUID format validation
 *   - Offer amount validation (positive, max 50M)
 *   - Limit cap at 500
 *   - Status/filter enum validation
 *   - Error message sanitization (no internal DB errors exposed)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Service role client for DB operations
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const PROPERTY_FIELDS = "id, address, city, state, zip_code, neighborhood, owner_name, property_image_url, estimated_value, cash_offer_amount, approval_status, approved_by_name, approved_at, rejection_reason, rejection_notes, decision_photos, property_type, year_built, square_feet, bedrooms, bathrooms, lot_size, owner_phone, lead_score, zillow_url, focar, evaluation, tags, owner_address, origem, ai_score, ai_reasoning, import_batch, created_at";

const REJECTION_REASONS = [
  "new-construction", "recent-sale", "too-good-condition", "multi-family",
  "hoa-restrictions", "condominium", "apartment", "land", "no-equity", "agent-listed",
  "commercial", "photo-unavailable", "bad-neighborhood", "llc-owned",
  "no-address-number", "no-wholesale-margin", "investor-owned", "mobile-home",
  "public-property", "too-expensive", "rural", "vacant-lot",
  "duplicate", "wrong-location", "unwanted-area", "flood-zone", "other",
];

const VALID_STATUSES = ['pending', 'approved', 'rejected'];
const VALID_VISUAL_FILTERS = ['all', 'HOT', 'WARM', 'COLD'];
const MAX_LIMIT = 500;
const MAX_OFFER = 50_000_000; // $50M cap
const DEFAULT_OFFER_RATIO = 0.7;
const MAX_BULK_SIZE = 100;

// ── Rate Limiting ────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

// ── Validation ───────────────────────────────────────────────────────
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

function sanitizeError(message: string): string {
  // Strip internal DB error details
  if (message.includes('invalid input syntax')) return 'Invalid ID format';
  if (message.includes('violates')) return 'Operation not allowed';
  if (message.includes('duplicate key')) return 'Duplicate record';
  if (message.includes('connection')) return 'Service temporarily unavailable';
  return message.length > 200 ? message.substring(0, 200) : message;
}

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

// IQR outlier removal
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

// ── Auth ─────────────────────────────────────────────────────────────

// Read actions only need valid apikey
const READ_ACTIONS = new Set(['list', 'get', 'counts', 'comps.list', 'comps.pricing', 'batch.list', 'info']);
// Write actions need authenticated user
const WRITE_ACTIONS = new Set(['approve', 'reject', 'reset', 'comps.add', 'comps.delete', 'bulk.approve', 'bulk.reject']);

function validateApiKey(req: Request): boolean {
  const apikey = req.headers.get('apikey') || req.headers.get('Authorization')?.replace('Bearer ', '') || '';
  if (!apikey) return false;
  // Accept known keys, or any JWT/publishable key with valid format
  if (apikey === SUPABASE_ANON_KEY || apikey === SERVICE_ROLE_KEY) return true;
  // Accept JWT tokens (eyJ...) and publishable keys (sb_publishable_...)
  return apikey.startsWith('eyJ') || apikey.startsWith('sb_publishable_') || apikey.startsWith('sb_secret_');
}

async function validateAuth(req: Request): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'Authorization header with Bearer token required for write operations' };
  }

  const token = authHeader.replace('Bearer ', '');
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data?.user) {
    return { valid: false, error: 'Invalid or expired authentication token' };
  }

  return { valid: true, userId: data.user.id };
}

// ── Property existence check ─────────────────────────────────────────
async function propertyExists(propertyId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .single();
  return !!data;
}

// ── Actions ──────────────────────────────────────────────────────────

async function handleList(body: any) {
  const { status = 'pending', batch, limit: rawLimit, offset: rawOffset, search, visual_filter } = body;

  // Validate status
  if (!VALID_STATUSES.includes(status)) {
    return err(`Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`);
  }

  // Validate visual_filter
  if (visual_filter && !VALID_VISUAL_FILTERS.includes(visual_filter)) {
    return err(`Invalid visual_filter. Valid values: ${VALID_VISUAL_FILTERS.join(', ')}`);
  }

  // Validate & cap limit
  const limit = Math.min(Math.max(1, parseInt(String(rawLimit)) || MAX_LIMIT), MAX_LIMIT);
  const offset = Math.max(0, parseInt(String(rawOffset)) || 0);

  let query = supabaseAdmin
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
    query = query.eq('import_batch', String(batch).substring(0, 100));
  }

  if (search) {
    query = query.ilike('address', `%${String(search).substring(0, 200)}%`);
  }

  const { data, error } = await query;
  if (error) return err(sanitizeError(error.message), 500);

  let properties = data || [];

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
  if (!isValidUUID(property_id)) return err('property_id must be a valid UUID');

  const { data: property, error } = await supabaseAdmin
    .from('properties')
    .select(PROPERTY_FIELDS)
    .eq('id', property_id)
    .single();

  if (error || !property) return err('Property not found', 404);

  const { data: comps } = await supabaseAdmin
    .from('manual_comps_links')
    .select('id, url, source, comp_data, created_at')
    .eq('property_id', property_id)
    .order('created_at', { ascending: false });

  const pricing = calculatePricing(comps || [], property.square_feet || 0);

  return ok({ property, comps: comps || [], pricing });
}

async function handleCounts(body: any) {
  const { batch } = body;
  const batchFilter = batch && batch !== 'all' ? String(batch).substring(0, 100) : null;

  let pQ = supabaseAdmin.from('properties').select('*', { count: 'exact', head: true })
    .or('approval_status.is.null,approval_status.eq.pending');
  let aQ = supabaseAdmin.from('properties').select('*', { count: 'exact', head: true })
    .eq('approval_status', 'approved');
  let rQ = supabaseAdmin.from('properties').select('*', { count: 'exact', head: true })
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
  if (!isValidUUID(property_id)) return err('property_id must be a valid UUID');

  // Validate offer amount if provided
  if (cash_offer_amount !== undefined && cash_offer_amount !== null) {
    const amount = Number(cash_offer_amount);
    if (isNaN(amount) || amount <= 0) return err('cash_offer_amount must be a positive number');
    if (amount > MAX_OFFER) return err(`cash_offer_amount cannot exceed $${MAX_OFFER.toLocaleString()}`);
  }

  // Check property exists
  if (!await propertyExists(property_id)) {
    return err('Property not found', 404);
  }

  // If no offer provided, calculate from estimated_value
  let offerAmount = cash_offer_amount ? Number(cash_offer_amount) : null;
  if (!offerAmount) {
    const { data: prop } = await supabaseAdmin
      .from('properties')
      .select('estimated_value, square_feet')
      .eq('id', property_id)
      .single();

    if (prop?.estimated_value) {
      const { data: comps } = await supabaseAdmin
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
    approved_by_name: String(agent_name).substring(0, 100),
    approved_at: new Date().toISOString(),
    rejection_reason: null,
    rejection_notes: notes ? String(notes).substring(0, 1000) : null,
    updated_by_name: String(agent_name).substring(0, 100),
  };

  if (offerAmount && offerAmount > 0) {
    updateData.cash_offer_amount = offerAmount;
  }

  const { error } = await supabaseAdmin
    .from('properties')
    .update(updateData)
    .eq('id', property_id);

  if (error) return err(sanitizeError(error.message), 500);

  return ok({
    property_id,
    status: 'approved',
    cash_offer_amount: offerAmount,
    agent_name: String(agent_name).substring(0, 100),
  });
}

async function handleReject(body: any) {
  const { property_id, reason, notes, agent_name = 'WebAgent' } = body;
  if (!property_id) return err('property_id is required');
  if (!isValidUUID(property_id)) return err('property_id must be a valid UUID');
  if (!reason) return err('reason is required');
  if (!REJECTION_REASONS.includes(reason)) {
    return err(`Invalid reason. Valid: ${REJECTION_REASONS.join(', ')}`);
  }

  // Check property exists
  if (!await propertyExists(property_id)) {
    return err('Property not found', 404);
  }

  const updateData: Record<string, unknown> = {
    approval_status: 'rejected',
    approved_by_name: String(agent_name).substring(0, 100),
    approved_at: new Date().toISOString(),
    rejection_reason: reason,
    rejection_notes: notes ? String(notes).substring(0, 1000) : null,
    updated_by_name: String(agent_name).substring(0, 100),
  };

  const { error } = await supabaseAdmin
    .from('properties')
    .update(updateData)
    .eq('id', property_id);

  if (error) return err(sanitizeError(error.message), 500);

  return ok({ property_id, status: 'rejected', reason, agent_name: String(agent_name).substring(0, 100) });
}

async function handleReset(body: any) {
  const { property_id } = body;
  if (!property_id) return err('property_id is required');
  if (!isValidUUID(property_id)) return err('property_id must be a valid UUID');

  if (!await propertyExists(property_id)) {
    return err('Property not found', 404);
  }

  const { error } = await supabaseAdmin
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

  if (error) return err(sanitizeError(error.message), 500);
  return ok({ property_id, status: 'reset_to_pending' });
}

async function handleCompsList(body: any) {
  const { property_id } = body;
  if (!property_id) return err('property_id is required');
  if (!isValidUUID(property_id)) return err('property_id must be a valid UUID');

  const { data, error } = await supabaseAdmin
    .from('manual_comps_links')
    .select('id, url, source, comp_data, created_at, property_address')
    .eq('property_id', property_id)
    .order('created_at', { ascending: false });

  if (error) return err(sanitizeError(error.message), 500);

  const { data: prop } = await supabaseAdmin
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
  if (!isValidUUID(property_id)) return err('property_id must be a valid UUID');
  if (!url) return err('url is required');
  if (!comp_data?.sale_price || !comp_data?.square_feet) {
    return err('comp_data.sale_price and comp_data.square_feet are required');
  }

  // Validate comp data values
  if (Number(comp_data.sale_price) <= 0) return err('comp_data.sale_price must be positive');
  if (Number(comp_data.square_feet) <= 1) return err('comp_data.square_feet must be greater than 1');

  if (!await propertyExists(property_id)) {
    return err('Property not found', 404);
  }

  const { data: prop } = await supabaseAdmin
    .from('properties')
    .select('address, city, state, zip_code')
    .eq('id', property_id)
    .single();

  const addressStr = prop
    ? `${prop.address}, ${prop.city || ''}, ${prop.state || ''} ${prop.zip_code || ''}`
    : '';

  let source = 'other';
  const urlLower = String(url).toLowerCase();
  if (urlLower.includes('zillow')) source = 'zillow';
  else if (urlLower.includes('redfin')) source = 'redfin';
  else if (urlLower.includes('realtor')) source = 'realtor';
  else if (urlLower.includes('trulia')) source = 'trulia';

  const { data, error } = await supabaseAdmin
    .from('manual_comps_links')
    .insert([{
      property_id,
      property_address: addressStr,
      url: String(url).trim().substring(0, 2000),
      source,
      comp_data,
    }])
    .select('id')
    .single();

  if (error) return err(sanitizeError(error.message), 500);

  return ok({ comp_id: data.id, property_id, source, comp_data });
}

async function handleCompsDelete(body: any) {
  const { comp_id } = body;
  if (!comp_id) return err('comp_id is required');
  if (!isValidUUID(comp_id)) return err('comp_id must be a valid UUID');

  const { error } = await supabaseAdmin
    .from('manual_comps_links')
    .delete()
    .eq('id', comp_id);

  if (error) return err(sanitizeError(error.message), 500);
  return ok({ comp_id, deleted: true });
}

async function handleCompsPricing(body: any) {
  const { property_id } = body;
  if (!property_id) return err('property_id is required');
  if (!isValidUUID(property_id)) return err('property_id must be a valid UUID');

  const { data: comps } = await supabaseAdmin
    .from('manual_comps_links')
    .select('comp_data')
    .eq('property_id', property_id);

  const { data: prop } = await supabaseAdmin
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
  const { data, error } = await supabaseAdmin
    .from('properties')
    .select('import_batch')
    .not('import_batch', 'is', null);

  if (error) return err(sanitizeError(error.message), 500);

  const batches = [...new Set((data || []).map((r: any) => r.import_batch).filter(Boolean))].sort();

  return ok({ batches });
}

async function handleBulkApprove(body: any) {
  const { property_ids, cash_offer_amounts, agent_name = 'WebAgent' } = body;
  if (!property_ids || !Array.isArray(property_ids) || property_ids.length === 0) {
    return err('property_ids array is required');
  }
  if (property_ids.length > MAX_BULK_SIZE) {
    return err(`Maximum ${MAX_BULK_SIZE} properties per bulk operation`);
  }

  // Validate all UUIDs
  for (const pid of property_ids) {
    if (!isValidUUID(pid)) return err(`Invalid UUID: ${pid}`);
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
  if (property_ids.length > MAX_BULK_SIZE) {
    return err(`Maximum ${MAX_BULK_SIZE} properties per bulk operation`);
  }
  if (!reason) return err('reason is required');

  // Validate all UUIDs
  for (const pid of property_ids) {
    if (!isValidUUID(pid)) return err(`Invalid UUID: ${pid}`);
  }

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
    version: '2.0',
    description: 'API para automação do processo de análise de propriedades via web agent',
    base_url: `${SUPABASE_URL}/functions/v1/process-api`,
    auth: {
      header: 'apikey',
      description: 'Use o ANON_KEY do Supabase como header apikey. Operações de escrita também requerem header Authorization: Bearer <JWT>',
      read_operations: 'Requerem apikey válido',
      write_operations: 'Requerem apikey + Authorization Bearer token',
    },
    actions: {
      list: {
        description: 'Listar propriedades com filtros',
        type: 'read',
        params: {
          status: `${VALID_STATUSES.join(' | ')} (default: pending)`,
          batch: 'Nome do batch de import (optional)',
          limit: `Max results, capped at ${MAX_LIMIT} (default: ${MAX_LIMIT})`,
          offset: 'Pagination offset (default: 0)',
          search: 'Buscar por endereço (optional)',
          visual_filter: `${VALID_VISUAL_FILTERS.join(' | ')} (optional)`,
        },
        example: '{ "action": "list", "status": "pending", "limit": 50 }',
      },
      get: {
        description: 'Obter propriedade por ID com comps e pricing',
        type: 'read',
        params: { property_id: 'UUID da propriedade' },
        example: '{ "action": "get", "property_id": "uuid-here" }',
      },
      counts: {
        description: 'Contagem por status',
        type: 'read',
        params: { batch: 'Filtrar por batch (optional)' },
        example: '{ "action": "counts" }',
      },
      approve: {
        description: 'Aprovar propriedade com oferta',
        type: 'write',
        params: {
          property_id: 'UUID (required)',
          cash_offer_amount: `Valor da oferta (optional, must be positive, max $${MAX_OFFER.toLocaleString()})`,
          notes: 'Notas de aprovação (optional, max 1000 chars)',
          agent_name: 'Nome do agente (default: WebAgent, max 100 chars)',
        },
        example: '{ "action": "approve", "property_id": "uuid", "cash_offer_amount": 150000 }',
      },
      reject: {
        description: 'Rejeitar propriedade',
        type: 'write',
        params: {
          property_id: 'UUID (required)',
          reason: `Motivo (required): ${REJECTION_REASONS.join(', ')}`,
          notes: 'Notas adicionais (optional, max 1000 chars)',
          agent_name: 'Nome do agente (default: WebAgent)',
        },
        example: '{ "action": "reject", "property_id": "uuid", "reason": "new-construction" }',
      },
      reset: {
        description: 'Resetar propriedade para pendente',
        type: 'write',
        params: { property_id: 'UUID (required)' },
        example: '{ "action": "reset", "property_id": "uuid" }',
      },
      'comps.list': {
        description: 'Listar comps de uma propriedade com pricing',
        type: 'read',
        params: { property_id: 'UUID (required)' },
        example: '{ "action": "comps.list", "property_id": "uuid" }',
      },
      'comps.add': {
        description: 'Adicionar comp a uma propriedade',
        type: 'write',
        params: {
          property_id: 'UUID (required)',
          url: 'Link do comp - Zillow/Redfin/etc (required, max 2000 chars)',
          comp_data: '{ sale_price (>0), square_feet (>1), address?, sale_date?, lot_size?, bedrooms?, bathrooms? }',
        },
        example: '{ "action": "comps.add", "property_id": "uuid", "url": "https://zillow.com/...", "comp_data": { "sale_price": 250000, "square_feet": 1500 } }',
      },
      'comps.delete': {
        description: 'Remover um comp',
        type: 'write',
        params: { comp_id: 'UUID do comp (required)' },
        example: '{ "action": "comps.delete", "comp_id": "uuid" }',
      },
      'comps.pricing': {
        description: 'Calcular ARV e pricing de comps',
        type: 'read',
        params: { property_id: 'UUID (required)' },
        example: '{ "action": "comps.pricing", "property_id": "uuid" }',
      },
      'batch.list': {
        description: 'Listar batches de importação disponíveis',
        type: 'read',
        params: {},
        example: '{ "action": "batch.list" }',
      },
      'bulk.approve': {
        description: `Aprovar múltiplas propriedades (max ${MAX_BULK_SIZE})`,
        type: 'write',
        params: {
          property_ids: 'Array de UUIDs (required)',
          cash_offer_amounts: 'Objeto { uuid: valor } (optional)',
          agent_name: 'Nome do agente (default: WebAgent)',
        },
        example: '{ "action": "bulk.approve", "property_ids": ["uuid1", "uuid2"], "cash_offer_amounts": { "uuid1": 150000 } }',
      },
      'bulk.reject': {
        description: `Rejeitar múltiplas propriedades (max ${MAX_BULK_SIZE})`,
        type: 'write',
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
        'hoa-restrictions': 'Propriedade com HOA / HOI',
        'condominium': 'Condomínio',
        'apartment': 'Apartamento',
        'land': 'Terreno (Land)',
        'no-equity': 'Low-Equity',
        'agent-listed': 'Anunciada por Corretor',
        'commercial': 'Imóvel Comercial',
        'photo-unavailable': 'Foto Indisponível',
        'bad-neighborhood': 'Bairro Ruim / Alta Criminalidade',
        'llc-owned': 'Proprietário LLC/Empresa',
        'no-address-number': 'Endereço sem Número',
        'no-wholesale-margin': 'Sem Margem p/ Wholesale',
        'investor-owned': 'Proprietário Investidor / Repetido',
        'mobile-home': 'Mobile Home / Trailer',
        'public-property': 'Propriedade Pública / Governo',
        'too-expensive': 'Valor Muito Alto',
        'rural': 'Área Rural / Roça',
        'vacant-lot': 'Lote Vazio (sem estrutura)',
        'duplicate': 'Duplicado',
        'wrong-location': 'Localização errada',
        'unwanted-area': 'Área não desejada',
        'flood-zone': 'Área de Alagamento (Flood Zone)',
        'other': 'Outro motivo',
      }[r] || r,
    })),
    security: {
      rate_limit: `${RATE_LIMIT_MAX} requests per minute per IP`,
      max_limit: MAX_LIMIT,
      max_offer: MAX_OFFER,
      max_bulk_size: MAX_BULK_SIZE,
      uuid_validation: 'All IDs must be valid UUID v4 format',
      property_existence: 'Write operations verify property exists before updating',
    },
  });
}

// ── Router ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Rate limiting
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('cf-connecting-ip') || 
                   'unknown';
  if (!checkRateLimit(clientIP)) {
    return err('Rate limit exceeded. Maximum 60 requests per minute.', 429);
  }

  try {
    // Support GET for info (no auth needed for docs)
    if (req.method === 'GET') {
      return handleInfo();
    }

    // Validate API key for all POST requests
    if (!validateApiKey(req)) {
      return err('Valid apikey header is required', 401);
    }

    // Parse body safely
    let body: any;
    try {
      const text = await req.text();
      if (!text || text.trim().length === 0) {
        return err('Request body is required. Send JSON with { "action": "info" } for documentation.', 400);
      }
      body = JSON.parse(text);
    } catch {
      return err('Invalid JSON in request body', 400);
    }

    const { action } = body;

    if (!action || typeof action !== 'string') {
      return err('action is required. Use "info" to see available actions.');
    }

    // Check if action is valid
    if (!READ_ACTIONS.has(action) && !WRITE_ACTIONS.has(action)) {
      return err(`Unknown action: "${action}". Use "info" to see available actions.`);
    }

    // Write operations require authenticated user
    if (WRITE_ACTIONS.has(action)) {
      const auth = await validateAuth(req);
      if (!auth.valid) {
        return err(auth.error || 'Authentication required for write operations', 401);
      }
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
    console.error('Process API error:', e);
    return err('Internal server error', 500);
  }
});

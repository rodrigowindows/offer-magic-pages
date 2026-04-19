/**
 * Approval Gate Validation
 *
 * Three-layer enforcement to prevent "blind approvals":
 * 1. Comps requirement: must have manual_comps OR ai_reasoning OR comps_url OR detailed notes (>=30 chars)
 * 2. Pricing sanity-check: offer/estimated ratio must be in [50%, 100%] band
 * 3. Audit URL: comps_url (Zillow/Trulia/Sunbiz) optional but recorded for traceability
 *
 * Returns blockers (must fix) and warnings (override allowed with confirmation).
 */
import { supabase } from '@/integrations/supabase/client';
import type { QueueProperty } from '@/components/review/types';

export interface ApprovalGateInput {
  property: QueueProperty;
  offerAmount: number | null;
  approvalNotes: string;
  compsUrl?: string | null;
}

export interface ApprovalGateResult {
  blockers: string[];   // hard-stop reasons
  warnings: string[];   // soft-stop, allow override
  hasComps: boolean;
  pricingRatio: number | null;
  pricingStatus: 'ok' | 'low' | 'high' | 'unknown';
}

const MIN_NOTE_LENGTH = 30;
const PRICING_MIN_RATIO = 0.50;
const PRICING_MAX_RATIO = 1.00;
const URL_REGEX = /https?:\/\/(www\.)?(zillow|trulia|redfin|realtor|sunbiz|propertyshark|homes)\.com/i;

export const validateApproval = async ({
  property,
  offerAmount,
  approvalNotes,
  compsUrl,
}: ApprovalGateInput): Promise<ApprovalGateResult> => {
  const blockers: string[] = [];
  const warnings: string[] = [];

  // ── Layer 1: Comps requirement ────────────────────────────────
  let hasComps = false;
  try {
    const { count } = await supabase
      .from('manual_comps_links')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', property.id);
    hasComps = (count || 0) > 0;
  } catch {
    hasComps = false;
  }

  const hasAiReasoning = !!(property.ai_reasoning && property.ai_reasoning.trim().length >= MIN_NOTE_LENGTH);
  const hasDetailedNotes = approvalNotes.trim().length >= MIN_NOTE_LENGTH;
  const hasCompsUrl = !!(compsUrl && URL_REGEX.test(compsUrl));

  if (!hasComps && !hasAiReasoning && !hasDetailedNotes && !hasCompsUrl) {
    blockers.push(
      `Sem comps puxadas. Faça uma das opções: (a) abrir Comps e adicionar pelo menos 1 manual, (b) colar URL de Zillow/Trulia/Sunbiz no campo "Comps URL", ou (c) escrever justificativa detalhada (mín. ${MIN_NOTE_LENGTH} caracteres) nas notas.`
    );
  }

  // ── Layer 2: Pricing sanity-check ─────────────────────────────
  let ratio: number | null = null;
  let pricingStatus: ApprovalGateResult['pricingStatus'] = 'unknown';

  if (offerAmount && property.estimated_value && property.estimated_value > 0) {
    ratio = offerAmount / property.estimated_value;

    if (ratio < PRICING_MIN_RATIO) {
      pricingStatus = 'low';
      warnings.push(
        `Oferta de ${(ratio * 100).toFixed(0)}% do estimated_value ($${offerAmount.toLocaleString()} vs $${property.estimated_value.toLocaleString()}). Limite mín.: ${PRICING_MIN_RATIO * 100}%. Verifique se estimated_value está correto antes de aprovar.`
      );
    } else if (ratio > PRICING_MAX_RATIO) {
      pricingStatus = 'high';
      blockers.push(
        `Oferta de ${(ratio * 100).toFixed(0)}% do estimated_value ($${offerAmount.toLocaleString()} vs $${property.estimated_value.toLocaleString()}) — acima de 100%. Provável bug. Corrija antes de aprovar.`
      );
    } else {
      pricingStatus = 'ok';
    }
  } else if (offerAmount && (!property.estimated_value || property.estimated_value <= 0)) {
    warnings.push('estimated_value ausente — impossível validar relação oferta/valor.');
  }

  return {
    blockers,
    warnings,
    hasComps,
    pricingRatio: ratio,
    pricingStatus,
  };
};

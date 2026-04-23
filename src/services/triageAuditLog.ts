/**
 * Triage audit log writer — records every rejection/skip decision with the
 * rules that were active at decision time.
 */
import { supabase } from '@/integrations/supabase/client';
import { REJECTION_REASONS } from '@/components/review/constants';
import { getTriggeredRuleKeys } from './triageEvaluator';
import type { QueueProperty } from '@/components/review/types';

export type TriageDecision = 'rejected' | 'skipped' | 'approved_with_warnings';

export interface LogTriageDecisionInput {
  property: Pick<QueueProperty, 'id' | 'address' | 'flood_zone' | 'cash_offer_amount' | 'estimated_value' | 'ai_score' | 'lead_score'> & Record<string, any>;
  decision: TriageDecision;
  decisionReason?: string | null;
  notes?: string | null;
  decidedBy?: string | null;
  decidedByName?: string | null;
  bulkAction?: boolean;
  /** Optional override for triggered rules (e.g. when caller already has them). */
  triggeredRules?: string[];
  /** Extra context to store in metadata jsonb. */
  metadata?: Record<string, any>;
}

/**
 * Insert one immutable audit row. Failures are logged to console but do NOT
 * throw — the parent decision should never be blocked by audit-log issues.
 */
export async function logTriageDecision(input: LogTriageDecisionInput): Promise<void> {
  try {
    const triggered = input.triggeredRules ?? getTriggeredRuleKeys(input.property as QueueProperty);
    const reasonLabel = input.decisionReason
      ? REJECTION_REASONS.find(r => r.value === input.decisionReason)?.label ?? null
      : null;

    const payload = {
      property_id: input.property.id,
      property_address: input.property.address ?? null,
      decision: input.decision,
      decision_reason: input.decisionReason ?? null,
      decision_reason_label: reasonLabel,
      triggered_rules: triggered,
      flood_zone: (input.property.flood_zone as string | null) ?? null,
      notes: input.notes?.trim() || null,
      decided_by: input.decidedBy ?? null,
      decided_by_name: input.decidedByName ?? null,
      bulk_action: !!input.bulkAction,
      metadata: {
        cash_offer_amount: input.property.cash_offer_amount ?? null,
        estimated_value: input.property.estimated_value ?? null,
        ai_score: input.property.ai_score ?? null,
        lead_score: input.property.lead_score ?? null,
        ...(input.metadata ?? {}),
      },
    };

    const { error } = await supabase.from('triage_audit_log').insert(payload);
    if (error) {
      console.error('[triage_audit_log] insert failed', error, payload);
    }
  } catch (err) {
    console.error('[triage_audit_log] unexpected error', err);
  }
}

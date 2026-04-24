/**
 * Triage rule evaluator — single source of truth for which rejection rules
 * a property triggers. Used by:
 *   - <TriageChecklist /> for visual display
 *   - useReviewActions / BulkActions to populate triage_audit_log
 */
import { analyzePropertyAlerts, type PropertyAlertInput } from '@/services/propertyAlerts';
import type { QueueProperty } from '@/components/review/types';

export const HIGH_RISK_FLOOD_ZONES = ['AE', 'VE', 'A', 'V', 'AH', 'AO'];

export type TriageSeverity = 'block' | 'warn' | 'pass';

export interface TriageCheckItem {
  key: string;
  label: string;
  severity: TriageSeverity;
  detail?: string;
  /** Matching code in REJECTION_REASONS (when applicable). */
  rejectionCode?: string;
}

/** Detect every triage rule a property triggers. Pure function — no side effects. */
export function evaluateTriage(p: QueueProperty): TriageCheckItem[] {
  const checks: TriageCheckItem[] = [];
  const tags = Array.isArray(p.tags) ? p.tags.map(t => String(t).toLowerCase()) : [];
  const ownerName = (p.owner_name || '').toUpperCase();
  const propType = (p.property_type || '').toLowerCase();
  const currentYear = new Date().getFullYear();

  // 1. AGENT LISTED — top critical rule
  const agentListed = tags.some(t => t.includes('agent') || t.includes('mls') || t.includes('listed')) ||
    (p as any).agent_listed === true;
  checks.push({
    key: 'agent-listed',
    label: 'Listado por corretor (Agent / MLS)',
    severity: agentListed ? 'block' : 'pass',
    detail: agentListed ? 'Pular skip trace, comps, oferta e comunicação.' : 'Não listado',
    rejectionCode: 'agent-listed',
  });

  // 2. FLOOD ZONE
  const floodZone = (p.flood_zone || '').toUpperCase();
  const inFloodRisk = !!floodZone && HIGH_RISK_FLOOD_ZONES.includes(floodZone);
  checks.push({
    key: 'flood-zone',
    label: 'Flood Zone (FEMA)',
    severity: inFloodRisk ? 'warn' : 'pass',
    detail: floodZone
      ? `Zone ${floodZone}${inFloodRisk ? ' — ALTO RISCO (analista decide)' : ' (zona segura)'}`
      : 'Não verificado',
    rejectionCode: inFloodRisk ? 'flood-zone' : undefined,
  });

  // 3. NEW CONSTRUCTION (<20 anos)
  if (p.year_built && p.year_built > currentYear - 20) {
    checks.push({
      key: 'new-construction',
      label: 'Casa nova (<20 anos)',
      severity: 'block',
      detail: `Construída em ${p.year_built}`,
      rejectionCode: 'new-construction',
    });
  }

  // 4. LLC OWNED
  if (/\b(LLC|INC|CORP|TRUST|LP|LLP)\b/.test(ownerName)) {
    checks.push({
      key: 'llc-owned',
      label: 'Proprietário LLC / Empresa',
      severity: 'block',
      detail: ownerName,
      rejectionCode: 'llc-owned',
    });
  }

  // 5. PROPERTY TYPE BLOCKERS
  if (propType.includes('condo')) {
    checks.push({ key: 'condominium', label: 'Condomínio', severity: 'block', rejectionCode: 'condominium' });
  }
  if (propType.includes('apartment')) {
    checks.push({ key: 'apartment', label: 'Apartamento', severity: 'block', rejectionCode: 'apartment' });
  }
  if (propType.includes('mobile') || propType.includes('manufactured')) {
    checks.push({ key: 'mobile-home', label: 'Mobile Home / Trailer', severity: 'block', rejectionCode: 'mobile-home' });
  }
  if (propType.includes('commercial')) {
    checks.push({ key: 'commercial', label: 'Imóvel Comercial', severity: 'block', rejectionCode: 'commercial' });
  }
  if (propType.includes('multi') || /\b(duplex|triplex|fourplex|4-plex)\b/.test(propType)) {
    checks.push({ key: 'multi-family', label: 'Multi-Family', severity: 'block', rejectionCode: 'multi-family' });
  }
  if (propType.includes('land') || propType.includes('vacant')) {
    checks.push({ key: 'land', label: 'Terreno / Lote vazio', severity: 'block', rejectionCode: 'land' });
  }

  // 6. NO PHOTO
  if (!p.property_image_url) {
    checks.push({
      key: 'photo-unavailable',
      label: 'Foto indisponível',
      severity: 'block',
      detail: 'Impossível avaliar visualmente',
      rejectionCode: 'photo-unavailable',
    });
  }

  // 7. NO ADDRESS NUMBER
  if (p.address && !/^\d/.test(p.address.trim())) {
    checks.push({
      key: 'no-address-number',
      label: 'Endereço sem número',
      severity: 'warn',
      detail: p.address,
      rejectionCode: 'no-address-number',
    });
  }

  // 8. RECENT SALE (<2 anos)
  if (p.last_sale_date) {
    const saleDate = new Date(p.last_sale_date);
    const monthsAgo = (Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo < 24) {
      checks.push({
        key: 'recent-sale',
        label: 'Recém vendida (<2 anos)',
        severity: 'block',
        detail: `Vendida ${Math.round(monthsAgo)} meses atrás`,
        rejectionCode: 'recent-sale',
      });
    }
  }

  // 9. NO WHOLESALE MARGIN (<15%)
  if (p.cash_offer_amount && p.estimated_value && p.estimated_value > 0) {
    const offerPct = (p.cash_offer_amount / p.estimated_value) * 100;
    if (offerPct > 85) {
      checks.push({
        key: 'no-wholesale-margin',
        label: 'Sem margem para wholesale',
        severity: 'block',
        detail: `Oferta = ${offerPct.toFixed(0)}% do valor (mín 85%)`,
        rejectionCode: 'no-wholesale-margin',
      });
    }
  }

  // 10. DATA QUALITY ALERTS via shared service
  const dataAlerts = analyzePropertyAlerts(p as unknown as PropertyAlertInput);
  dataAlerts.forEach(a => {
    checks.push({
      key: `alert-${a.code}`,
      label: a.message,
      severity: a.severity === 'critical' ? 'block' : 'warn',
    });
  });

  // GUARD: Flood-zone outcomes must never auto-reject (analyst-only decision).
  // Downgrade any 'block' on flood-related checks to 'warn' regardless of upstream rules.
  return checks.map(c => enforceFloodZoneWarningGuard(c));
}

/**
 * GUARD — Flood-zone rules must NEVER auto-reject a property. FEMA flagging
 * is informational; the analyst always makes the final call. This guard runs
 * AFTER all evaluator rules, so even if a future rule change accidentally
 * promotes a flood-zone check to 'block', it gets clamped back to 'warn'.
 */
export function enforceFloodZoneWarningGuard(check: TriageCheckItem): TriageCheckItem {
  const isFloodCheck =
    check.key === 'flood-zone' ||
    check.rejectionCode === 'flood-zone' ||
    check.key.startsWith('alert-flood') ||
    /flood/i.test(check.label);

  if (isFloodCheck && check.severity === 'block') {
    return {
      ...check,
      severity: 'warn',
      detail: (check.detail ? check.detail + ' · ' : '') + '[guard] flood-zone nunca auto-rejeita',
    };
  }
  return check;
}

/** Return the list of triggered (block + warn) rule keys, suitable for audit log. */
export function getTriggeredRuleKeys(p: QueueProperty): string[] {
  return evaluateTriage(p)
    .filter(c => c.severity !== 'pass')
    .map(c => c.key);
}

export interface GuardTrigger {
  key: string;
  label: string;
  originalSeverity: TriageSeverity;
  finalSeverity: TriageSeverity;
  reason: string;
}

/**
 * Detect which checks would have been 'block' but were downgraded to 'warn'
 * by enforceFloodZoneWarningGuard. Used to feed the audit log so we can prove
 * the guard fired for a given property/decision.
 */
export function getGuardTriggers(p: QueueProperty): GuardTrigger[] {
  const triggers: GuardTrigger[] = [];
  const tags = Array.isArray(p.tags) ? p.tags.map(t => String(t).toLowerCase()) : [];
  const floodZone = (p.flood_zone || '').toUpperCase();
  const inFloodRisk = !!floodZone && HIGH_RISK_FLOOD_ZONES.includes(floodZone);

  // The flood-zone rule itself uses 'warn' as its native severity, but if the
  // guard catches *anything* flood-related (including data-quality alerts) at
  // 'block', we record it. Re-run the raw rule emission to compare.
  if (inFloodRisk) {
    const raw = { key: 'flood-zone', label: 'Flood Zone (FEMA)', severity: 'warn' as TriageSeverity, rejectionCode: 'flood-zone' };
    const guarded = enforceFloodZoneWarningGuard({ ...raw, severity: 'block' });
    if (guarded.severity === 'warn') {
      triggers.push({
        key: raw.key,
        label: raw.label,
        originalSeverity: 'block',
        finalSeverity: 'warn',
        reason: `Zone ${floodZone} is high-risk (FEMA) but flood-zone never auto-rejects — analyst decides.`,
      });
    }
  }

  // Also surface any evaluator-emitted flood check that ended at 'warn' when
  // the natural severity could have been 'block' (defensive — covers future rules).
  evaluateTriage(p).forEach(c => {
    const isFlood =
      c.key === 'flood-zone' ||
      c.rejectionCode === 'flood-zone' ||
      c.key.startsWith('alert-flood') ||
      /flood/i.test(c.label);
    if (isFlood && c.severity === 'warn' && c.detail?.includes('[guard]')) {
      if (!triggers.some(t => t.key === c.key)) {
        triggers.push({
          key: c.key,
          label: c.label,
          originalSeverity: 'block',
          finalSeverity: 'warn',
          reason: 'enforceFloodZoneWarningGuard downgraded block → warn',
        });
      }
    }
  });

  // Tags hint (e.g. importer set agent-listed manually) — not flood-related, skip.
  void tags;
  return triggers;
}

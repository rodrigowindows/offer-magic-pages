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

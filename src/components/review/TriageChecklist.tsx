import { CheckCircle2, XCircle, AlertTriangle, Waves, UserX, Ban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { REJECTION_REASONS } from './constants';
import { analyzePropertyAlerts, type PropertyAlertInput } from '@/services/propertyAlerts';
import type { QueueProperty } from './types';

const HIGH_RISK_FLOOD_ZONES = ['AE', 'VE', 'A', 'V', 'AH', 'AO'];

type Severity = 'block' | 'warn' | 'pass';

interface CheckItem {
  key: string;
  label: string;
  severity: Severity;
  detail?: string;
  rejectionCode?: string;
}

/** Detect which triage rules a property triggers. */
function evaluateTriage(p: QueueProperty): CheckItem[] {
  const checks: CheckItem[] = [];
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
  const inFloodRisk = floodZone && HIGH_RISK_FLOOD_ZONES.includes(floodZone);
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

  return checks;
}

interface TriageChecklistProps {
  property: QueueProperty;
  /** When provided, called with the suggested rejection code if the user clicks "use this reason". */
  onSuggestRejection?: (code: string) => void;
}

const SEVERITY_STYLES: Record<Severity, { icon: any; bg: string; text: string; border: string; iconColor: string }> = {
  block: {
    icon: XCircle,
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-900 dark:text-red-200',
    border: 'border-red-300 dark:border-red-800',
    iconColor: 'text-red-600',
  },
  warn: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-900 dark:text-amber-200',
    border: 'border-amber-300 dark:border-amber-800',
    iconColor: 'text-amber-600',
  },
  pass: {
    icon: CheckCircle2,
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    text: 'text-emerald-900 dark:text-emerald-200',
    border: 'border-emerald-200 dark:border-emerald-800',
    iconColor: 'text-emerald-600',
  },
};

export const TriageChecklist = ({ property, onSuggestRejection }: TriageChecklistProps) => {
  const checks = evaluateTriage(property);
  const blockers = checks.filter(c => c.severity === 'block');
  const warnings = checks.filter(c => c.severity === 'warn');
  const passes = checks.filter(c => c.severity === 'pass');

  const hasBlockers = blockers.length > 0;
  const agentBlock = blockers.find(b => b.key === 'agent-listed');

  return (
    <div className={`rounded-md border-2 ${hasBlockers ? 'border-red-400 bg-red-50/50 dark:bg-red-950/20' : 'border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20'} p-2 space-y-1.5`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {hasBlockers ? (
            <Ban className="h-3.5 w-3.5 text-red-600" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          )}
          <h4 className="text-xs font-bold uppercase tracking-wide">Checklist de Triagem</h4>
        </div>
        <div className="flex gap-1">
          {blockers.length > 0 && (
            <Badge variant="destructive" className="text-[9px] px-1 py-0">{blockers.length} bloqueio{blockers.length > 1 ? 's' : ''}</Badge>
          )}
          {warnings.length > 0 && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-100 text-amber-700 border-amber-300">{warnings.length} aviso{warnings.length > 1 ? 's' : ''}</Badge>
          )}
          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-emerald-50 text-emerald-700 border-emerald-300">{passes.length} OK</Badge>
        </div>
      </div>

      {/* Agent-listed = special prominent banner */}
      {agentBlock && (
        <div className="flex items-start gap-1.5 p-1.5 rounded bg-red-600 text-white border-2 border-red-800">
          <UserX className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1 text-[11px] leading-tight">
            <strong className="block">⛔ AGENT LISTED — REJEITAR IMEDIATAMENTE</strong>
            <span className="opacity-90">Não rodar skip trace, comps, oferta nem comunicação.</span>
          </div>
          {onSuggestRejection && (
            <button
              type="button"
              onClick={() => onSuggestRejection('agent-listed')}
              className="text-[10px] font-bold bg-white text-red-700 px-2 py-0.5 rounded hover:bg-red-50 shrink-0"
            >
              Usar motivo
            </button>
          )}
        </div>
      )}

      {/* Blockers + warnings list */}
      {(blockers.length > 0 || warnings.length > 0) && (
        <ul className="space-y-1">
          {[...blockers.filter(b => b.key !== 'agent-listed'), ...warnings].map(c => {
            const styles = SEVERITY_STYLES[c.severity];
            const Icon = c.key === 'flood-zone' ? Waves : styles.icon;
            const reasonLabel = c.rejectionCode
              ? REJECTION_REASONS.find(r => r.value === c.rejectionCode)?.label
              : undefined;
            return (
              <li
                key={c.key}
                className={`flex items-start gap-1.5 p-1 rounded border ${styles.bg} ${styles.border}`}
              >
                <Icon className={`h-3 w-3 shrink-0 mt-0.5 ${styles.iconColor}`} />
                <div className={`flex-1 text-[11px] leading-tight ${styles.text}`}>
                  <span className="font-semibold">{c.label}</span>
                  {c.detail && <span className="opacity-80"> — {c.detail}</span>}
                  {reasonLabel && (
                    <span className="ml-1 text-[9px] opacity-70 italic">({reasonLabel})</span>
                  )}
                </div>
                {c.rejectionCode && onSuggestRejection && (
                  <button
                    type="button"
                    onClick={() => onSuggestRejection(c.rejectionCode!)}
                    className="text-[9px] font-bold bg-white/80 text-red-700 px-1.5 py-0.5 rounded hover:bg-white border border-red-300 shrink-0"
                    title="Usar este motivo na rejeição"
                  >
                    Usar
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* All clear */}
      {!hasBlockers && warnings.length === 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
          <CheckCircle2 className="h-3 w-3" />
          Nenhuma regra crítica disparada — pronto para aprovar.
        </div>
      )}

      {/* Footer hint when blockers exist */}
      {hasBlockers && (
        <p className="text-[10px] text-red-700 dark:text-red-300 italic border-t border-red-300 pt-1">
          Resolva os bloqueios ou rejeite usando um dos motivos sugeridos acima.
        </p>
      )}
    </div>
  );
};

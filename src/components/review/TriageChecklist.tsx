import { CheckCircle2, XCircle, AlertTriangle, Waves, UserX, Ban, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { REJECTION_REASONS, FLOOD_ZONE_EXPLANATIONS } from './constants';
import { evaluateTriage, type TriageSeverity } from '@/services/triageEvaluator';
import type { QueueProperty } from './types';

type Severity = TriageSeverity;

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
        <TooltipProvider delayDuration={150}>
          <ul className="space-y-1">
            {[...blockers.filter(b => b.key !== 'agent-listed'), ...warnings].map(c => {
              const styles = SEVERITY_STYLES[c.severity];
              const Icon = c.key === 'flood-zone' ? Waves : styles.icon;
              const reason = c.rejectionCode
                ? REJECTION_REASONS.find(r => r.value === c.rejectionCode)
                : undefined;
              // Flood zone gets its own zone-specific explanation
              const floodZone = c.key === 'flood-zone' ? (property.flood_zone || '').toUpperCase() : '';
              const floodInfo = floodZone ? FLOOD_ZONE_EXPLANATIONS[floodZone] : undefined;
              const tooltipText = floodInfo?.explanation || reason?.explanation;
              return (
                <li
                  key={c.key}
                  className={`flex items-start gap-1.5 p-1 rounded border ${styles.bg} ${styles.border}`}
                >
                  <Icon className={`h-3 w-3 shrink-0 mt-0.5 ${styles.iconColor}`} />
                  <div className={`flex-1 text-[11px] leading-tight ${styles.text}`}>
                    <span className="font-semibold inline-flex items-center gap-1">
                      {c.label}
                      {tooltipText && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex" aria-label="Por que esta regra">
                              <Info className="h-2.5 w-2.5 opacity-60 hover:opacity-100" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-xs leading-snug">
                            <p className="font-bold mb-1">{reason?.label || c.label}</p>
                            <p className="opacity-90">{tooltipText}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </span>
                    {c.detail && <span className="opacity-80"> — {c.detail}</span>}
                    {reason && (
                      <span className="ml-1 text-[9px] opacity-70 italic">({reason.label})</span>
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
        </TooltipProvider>
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

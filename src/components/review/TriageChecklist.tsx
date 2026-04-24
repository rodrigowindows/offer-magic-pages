import { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Waves, UserX, Ban, Info, ShieldAlert, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { REJECTION_REASONS, FLOOD_ZONE_EXPLANATIONS } from './constants';
import { evaluateTriage, getGuardTriggers, type TriageSeverity } from '@/services/triageEvaluator';
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
  const [policyOpen, setPolicyOpen] = useState(false);
  const dismissKey = `triage:guard-dismissed:${property.id}`;
  const [guardDismissed, setGuardDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(dismissKey) === '1';
    } catch {
      return false;
    }
  });
  const dismissGuard = () => {
    try { sessionStorage.setItem(dismissKey, '1'); } catch {}
    setGuardDismissed(true);
  };
  const checks = evaluateTriage(property);
  const blockers = checks.filter(c => c.severity === 'block');
  const warnings = checks.filter(c => c.severity === 'warn');
  const passes = checks.filter(c => c.severity === 'pass');
  const guardTriggers = getGuardTriggers(property);

  const hasBlockers = blockers.length > 0;
  const agentBlock = blockers.find(b => b.key === 'agent-listed');
  const guardFired = guardTriggers.length > 0 && !guardDismissed;

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

      {/* Flood-zone safety guard notice — analyst must decide */}
      {guardFired && (
        <div className="flex items-start gap-1.5 p-1.5 rounded border-2 border-amber-400 bg-amber-100 dark:bg-amber-950/40 dark:border-amber-700">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-700 dark:text-amber-300" />
          <div className="flex-1 text-[11px] leading-tight text-amber-900 dark:text-amber-100">
            <strong className="block">🛡️ Guard de segurança ativado — Flood Zone forçada para AVISO</strong>
            <span className="opacity-90">
              Zona FEMA{property.flood_zone ? ` ${String(property.flood_zone).toUpperCase()}` : ''} é alto-risco, mas o sistema <u>nunca auto-rejeita</u> por flood zone. A decisão de rejeitar é exclusiva do analista.
            </span>
            {guardTriggers[0]?.reason && (
              <span className="block mt-0.5 text-[10px] opacity-75 italic">{guardTriggers[0].reason}</span>
            )}
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setPolicyOpen(true)}
                className="inline-flex items-center gap-1 text-[10px] font-semibold underline underline-offset-2 hover:opacity-80"
              >
                <BookOpen className="h-2.5 w-2.5" />
                Ver política de rejeição
              </button>
              <button
                type="button"
                onClick={dismissGuard}
                className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded hover:bg-amber-700"
                title="Ocultar este aviso para esta propriedade nesta sessão"
              >
                Entendi
              </button>
            </div>
          </div>
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

      {/* Rejection policy dialog */}
      <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              Política de Rejeição — Flood Zone
            </DialogTitle>
            <DialogDescription>
              Por que zonas FEMA de alto risco nunca rejeitam automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm leading-relaxed">
            <section>
              <h4 className="font-semibold mb-1">🛡️ Princípio do Guard de Segurança</h4>
              <p className="text-muted-foreground">
                Mesmo que uma propriedade esteja em zona FEMA classificada como alto-risco
                (AE, VE, A, V, AH, AO), o sistema <strong>nunca</strong> auto-rejeita por flood zone.
                Qualquer regra que tente bloquear é forçada para <strong>aviso</strong> pelo guard.
              </p>
            </section>

            <section>
              <h4 className="font-semibold mb-1">📋 Por quê?</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Mapas FEMA contêm imprecisões — um lote pode estar parcialmente fora da zona.</li>
                <li>Elevação real, base flood elevation (BFE) e seguro NFIP mudam o cálculo.</li>
                <li>Compradores cash aceitam zonas de risco com desconto adequado.</li>
                <li>Decisão envolve due diligence local que o algoritmo não vê.</li>
              </ul>
            </section>

            <section>
              <h4 className="font-semibold mb-1">✅ Responsabilidade do Analista</h4>
              <p className="text-muted-foreground">
                Use o aviso como sinal para investigar (elevação, histórico de claims,
                custo de seguro). A decisão final de rejeitar ou prosseguir é
                <strong> exclusivamente humana</strong> e deve ser registrada nas notas com
                justificativa.
              </p>
            </section>

            <section className="rounded border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-2">
              <p className="text-xs text-amber-900 dark:text-amber-200">
                <strong>Auditoria:</strong> Todo acionamento do guard é registrado em
                <code className="mx-1 px-1 bg-amber-100 dark:bg-amber-900/50 rounded text-[10px]">triage_audit_log.metadata.guard_triggers</code>
                para revisão posterior.
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

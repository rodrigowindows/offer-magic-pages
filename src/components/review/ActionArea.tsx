import { useState, useEffect, useMemo } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowRight,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Undo2,
  XCircle,
  BarChart3,
  SkipForward,
  RefreshCw,
} from 'lucide-react';
import type { ApprovePhase, StatusFilter } from './types';
import { REJECTION_REASONS } from './constants';
import { formatCurrency } from '@/lib/utils';
import { DecisionPhotoUpload } from './DecisionPhotoUpload';
import { hasBlockingAlerts, getCriticalAlerts, type PropertyAlertInput } from '@/services/propertyAlerts';

interface ActionAreaProps {
  statusFilter: StatusFilter;
  approvePhase: ApprovePhase;
  isProcessing: boolean;
  currentIndex: number;
  totalFiltered: number;
  compsCount: number;
  // Current property for alert checking
  currentProperty?: PropertyAlertInput | null;
  // Reject form state
  showRejectForm: boolean;
  selectedReason: string;
  rejectionNotes: string;
  // Offer state
  quickOfferAmount: string;
  compsARV: number | null;
  pendingEstimatedValue: number | null;
  // Approval notes
  approvalNotes: string;
  onApprovalNotesChange: (notes: string) => void;
  // Comps audit URL
  compsUrl: string;
  onCompsUrlChange: (url: string) => void;
  gateOverride?: boolean;
  // Photos
  decisionPhotos: File[];
  onDecisionPhotosChange: (files: File[]) => void;
  // Callbacks
  onStartApprove: () => void;
  onSkipComps: () => void;
  onCancelApprove: () => void;
  onConfirmOffer: () => void;
  onShowRejectForm: () => void;
  onHideRejectForm: () => void;
  onReject: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onReasonChange: (reason: string) => void;
  onNotesChange: (notes: string) => void;
  onOfferAmountChange: (amount: string) => void;
}

/** Small comps button - scrolls to inline form */
const CompsButton = ({ count }: { count: number }) => (
  <Button
    variant="outline"
    size="sm"
    onClick={() => document.getElementById('inline-comps-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
    className="gap-1 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 h-8"
  >
    <BarChart3 className="h-3 w-3" />
    Comps
    <Badge variant="secondary" className="text-[10px] px-1 min-w-[16px]">{count}</Badge>
  </Button>
);

/** Navigation bar - always shown at top of action area */
const NavBar = ({ currentIndex, totalFiltered, onPrevious, onNext, compsCount }: {
  currentIndex: number;
  totalFiltered: number;
  onPrevious: () => void;
  onNext: () => void;
  compsCount: number;
}) => (
  <div className="flex items-center justify-between gap-2">
    <Button
      variant="outline"
      onClick={onPrevious}
      disabled={currentIndex === 0}
      className="h-10 sm:h-12 px-3 sm:px-5 text-sm sm:text-base font-bold gap-1.5"
    >
      <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      Anterior
    </Button>
    <div className="flex items-center gap-2">
      <CompsButton count={compsCount} />
      <span className="text-base sm:text-lg font-extrabold text-muted-foreground tabular-nums whitespace-nowrap">
        {currentIndex + 1} / {totalFiltered}
      </span>
    </div>
    <Button
      variant="outline"
      onClick={onNext}
      disabled={currentIndex === totalFiltered - 1}
      className="h-10 sm:h-12 px-3 sm:px-5 text-sm sm:text-base font-bold gap-1.5"
    >
      Próxima
      <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
    </Button>
  </div>
);

export const ActionArea = ({
  statusFilter,
  approvePhase,
  isProcessing,
  currentIndex,
  totalFiltered,
  compsCount,
  currentProperty,
  showRejectForm,
  selectedReason,
  rejectionNotes,
  quickOfferAmount,
  compsARV,
  pendingEstimatedValue,
  approvalNotes,
  onApprovalNotesChange,
  decisionPhotos,
  onDecisionPhotosChange,
  onStartApprove,
  onSkipComps,
  onCancelApprove,
  onConfirmOffer,
  onShowRejectForm,
  onHideRejectForm,
  onReject,
  onNext,
  onPrevious,
  onReasonChange,
  onNotesChange,
  onOfferAmountChange,
}: ActionAreaProps) => {
  const [showReDecide, setShowReDecide] = useState(false);
  const [forceApproval, setForceApproval] = useState(false);

  // Check for blocking alerts on current property
  const blockingCheck = useMemo(() => {
    if (!currentProperty) return { blocked: false, reasons: [] };
    return hasBlockingAlerts(currentProperty);
  }, [currentProperty]);

  const criticalAlerts = useMemo(() => {
    if (!currentProperty) return [];
    return getCriticalAlerts(currentProperty);
  }, [currentProperty]);

  // Reset force approval when property changes
  useEffect(() => {
    setForceApproval(false);
  }, [currentIndex]);

  useEffect(() => {
    setShowReDecide(false);
  }, [currentIndex]);

  /** Alert banner shown when there are critical issues */
  const AlertBanner = () => {
    if (criticalAlerts.length === 0) return null;
    return (
      <div className="bg-red-50 border border-red-300 rounded-lg p-2 space-y-1">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
          <span className="text-[11px] font-bold text-red-800">
            ⛔ {criticalAlerts.length} alerta{criticalAlerts.length > 1 ? 's' : ''} crítico{criticalAlerts.length > 1 ? 's' : ''}
          </span>
        </div>
        {criticalAlerts.map((a, i) => (
          <p key={i} className="text-[10px] text-red-700 pl-5">• {a.message}</p>
        ))}
        {blockingCheck.blocked && !forceApproval && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full h-6 text-[10px] border-red-300 text-red-700 hover:bg-red-100 mt-1"
            onClick={() => {
              if (window.confirm('⚠️ Esta propriedade tem alertas críticos.\n\nDeseja forçar a aprovação mesmo assim?')) {
                setForceApproval(true);
              }
            }}
          >
            🔓 Forçar Aprovação (ignorar alertas)
          </Button>
        )}
      </div>
    );
  };

  const isBlocked = blockingCheck.blocked && !forceApproval;

  // Browsing approved/rejected - show nav + "Alterar Decisão"
  if (statusFilter !== 'pending' && !showReDecide) {
    return (
      <div className="pt-2 border-t space-y-2">
        <NavBar currentIndex={currentIndex} totalFiltered={totalFiltered} onPrevious={onPrevious} onNext={onNext} compsCount={compsCount} />
        <Button
          variant="outline"
          onClick={() => setShowReDecide(true)}
          className="w-full h-9 gap-2 text-xs font-bold border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Alterar Decisão
        </Button>
      </div>
    );
  }

  // Phase: choose (Comps or Skip)
  if (approvePhase === 'choose') {
    return (
      <div className="pt-2 border-t space-y-2">
        <NavBar currentIndex={currentIndex} totalFiltered={totalFiltered} onPrevious={onPrevious} onNext={onNext} compsCount={compsCount} />
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-2 sm:p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-bold text-blue-800">Adicionar comps antes da oferta?</p>
              {compsCount > 0 && <Badge variant="secondary" className="text-[10px]">{compsCount} salvo{compsCount > 1 ? 's' : ''}</Badge>}
            </div>
            <Button variant="ghost" size="sm" onClick={onCancelApprove} className="text-xs text-muted-foreground gap-1 h-6">
              <Undo2 className="h-3 w-3" />
              <kbd className="px-1 py-0.5 text-[10px] bg-white border rounded">Esc</kbd>
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => {
              document.getElementById('inline-comps-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Focus the URL input
              setTimeout(() => {
                const input = document.querySelector('[data-section="inline-comp-form"] input[type="url"]') as HTMLInputElement;
                input?.focus();
              }, 400);
            }} className="flex-1 h-10 sm:h-12 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-bold gap-2">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              COMPS
              <kbd className="hidden sm:inline ml-1 px-1 py-0.5 text-[10px] font-normal bg-blue-800/40 rounded">C</kbd>
            </Button>
            <Button onClick={onSkipComps} variant="outline" className="flex-1 h-10 sm:h-12 border-blue-300 text-blue-700 hover:bg-blue-100 text-sm sm:text-base font-bold gap-2">
              <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
              PULAR
              <kbd className="hidden sm:inline ml-1 px-1 py-0.5 text-[10px] font-normal bg-blue-100 border-blue-200 border rounded">N</kbd>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Phase: offer input
  if (approvePhase === 'offer') {
    const baseValue = compsARV || pendingEstimatedValue;
    const label = compsARV ? 'ARV' : 'Est.';

    return (
      <div className="pt-2 border-t space-y-2">
        <NavBar currentIndex={currentIndex} totalFiltered={totalFiltered} onPrevious={onPrevious} onNext={onNext} compsCount={compsCount} />
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-2 sm:p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-green-800">
              Valor da Oferta
              {compsARV && <span className="ml-1 text-[10px] font-normal text-green-600">(ARV: {formatCurrency(compsARV)})</span>}
            </p>
            <Button variant="ghost" size="sm" onClick={onCancelApprove} className="text-xs text-muted-foreground gap-1 h-6">
              <Undo2 className="h-3 w-3" />
              Voltar <kbd className="px-1 py-0.5 text-[10px] bg-white border rounded ml-0.5">Esc</kbd>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2 text-base font-bold text-green-700">$</span>
              <Input
                type="number"
                placeholder="Ex: 150000"
                value={quickOfferAmount}
                onChange={(e) => onOfferAmountChange(e.target.value)}
                data-field="offer-value"
                data-action="offer-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); onConfirmOffer(); }
                  if (e.key === 'Escape') { e.preventDefault(); onCancelApprove(); }
                }}
                className="pl-7 h-10 text-base font-bold border-green-300 focus:border-green-500"
                autoFocus
              />
            </div>
          </div>

          {/* Quick percentage buttons */}
          {baseValue && baseValue > 0 && (
            <div className="flex gap-1 flex-wrap">
              {[60, 65, 70, 75, 80].map(pct => {
                const val = Math.round(baseValue * (pct / 100));
                return (
                  <button
                    key={pct}
                    onClick={() => onOfferAmountChange(val.toString())}
                    className={`px-2 py-1 rounded-md text-[10px] sm:text-xs border transition-colors ${
                      quickOfferAmount === val.toString()
                        ? 'bg-green-600 text-white border-green-600 font-bold'
                        : 'bg-white text-green-800 border-green-200 hover:bg-green-100'
                    }`}
                  >
                    {pct}% {label} = {formatCurrency(val)}
                  </button>
                );
              })}
            </div>
          )}

          <div>
            <Label className="text-[10px] text-green-800">Notas (opcional)</Label>
            <Textarea
              value={approvalNotes}
              onChange={(e) => onApprovalNotesChange(e.target.value)}
              placeholder="Ex: Score 280, bairro bom no Maps..."
              rows={1}
              className="mt-0.5 text-xs bg-white"
            />
          </div>

          <DecisionPhotoUpload files={decisionPhotos} onChange={onDecisionPhotosChange} accent="green" />

          <Button type="button" onClick={onConfirmOffer} disabled={isProcessing} data-action="confirm-offer" className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-bold gap-2">
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
            {isProcessing ? "Aprovando..." : quickOfferAmount ? `APROVAR (${formatCurrency(Number(quickOfferAmount))})` : "APROVAR SEM OFERTA"}
            <kbd className="hidden sm:inline ml-1 px-1 py-0.5 text-[10px] font-normal bg-green-800/40 rounded">Enter</kbd>
          </Button>
        </div>
      </div>
    );
  }

  // Rejection form
  if (showRejectForm) {
    return (
      <div className="pt-2 border-t space-y-2">
        <NavBar currentIndex={currentIndex} totalFiltered={totalFiltered} onPrevious={onPrevious} onNext={onNext} compsCount={compsCount} />
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-red-800">Motivo da Rejeição</p>
            <Button variant="ghost" size="sm" onClick={onHideRejectForm} className="text-xs text-muted-foreground gap-1 h-6">
              <Undo2 className="h-3 w-3" />
              Voltar <kbd className="px-1 py-0.5 text-[10px] bg-white border rounded ml-0.5">Esc</kbd>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
            {REJECTION_REASONS.map((reason, index) => (
              <button
                key={reason.value}
                onClick={() => onReasonChange(reason.value)}
                className={`text-left px-2 py-1.5 rounded-md text-[10px] sm:text-xs border transition-colors ${
                  selectedReason === reason.value
                    ? 'bg-red-600 text-white border-red-600 font-semibold'
                    : 'bg-white text-red-800 border-red-200 hover:bg-red-100'
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  <kbd className={`px-0.5 py-0 text-[9px] rounded ${
                    selectedReason === reason.value ? 'bg-red-800/40' : 'bg-red-100 border border-red-200'
                  }`}>
                    {index + 1 <= 9 ? index + 1 : ''}
                  </kbd>
                  {reason.label}
                </span>
              </button>
            ))}
          </div>

          <div>
            <Label className="text-[10px] text-red-800">Notas (opcional)</Label>
            <Textarea
              value={rejectionNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Detalhes adicionais..."
              rows={1}
              className="mt-0.5 text-xs bg-white"
            />
          </div>

          <DecisionPhotoUpload files={decisionPhotos} onChange={onDecisionPhotosChange} accent="red" />

          <Button type="button" onClick={onReject} disabled={isProcessing || !selectedReason} data-action="confirm-reject" className="w-full h-9 bg-red-600 hover:bg-red-700 text-white font-bold gap-2 text-sm">
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            {isProcessing ? "Rejeitando..." : "CONFIRMAR REJEIÇÃO"}
            <kbd className="hidden sm:inline ml-1 px-1 py-0.5 text-[10px] font-normal bg-red-800/40 rounded">Enter</kbd>
          </Button>
        </div>
      </div>
    );
  }

  // Default: Nav + Approve/Reject buttons
  const isReDeciding = statusFilter !== 'pending';

  return (
    <div className="pt-2 border-t space-y-2">
      {isReDeciding && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-semibold text-amber-700">Alterar decisão desta propriedade:</p>
          <Button variant="ghost" size="sm" onClick={() => setShowReDecide(false)} className="text-xs text-muted-foreground gap-1 h-6">
            <Undo2 className="h-3 w-3" />
            Cancelar
          </Button>
        </div>
      )}

      {/* Navigation bar */}
      <NavBar currentIndex={currentIndex} totalFiltered={totalFiltered} onPrevious={onPrevious} onNext={onNext} compsCount={compsCount} />

      {/* Critical alerts banner */}
      <AlertBanner />

      {/* Approve/Reject buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={isBlocked ? undefined : onStartApprove}
          disabled={isProcessing || isBlocked}
          data-action="approve"
          className={`flex-1 h-12 sm:h-14 text-base sm:text-lg font-bold gap-2 ${
            isBlocked
              ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ThumbsUp className="h-5 w-5 sm:h-6 sm:w-6" />}
          {isProcessing ? "Processando..." : isBlocked ? "BLOQUEADO" : "APROVAR"}
          {!isBlocked && <kbd className="hidden sm:inline ml-1 px-1.5 py-0.5 text-xs font-normal bg-green-800/40 rounded">A</kbd>}
        </Button>
        <Button type="button" onClick={onShowRejectForm} disabled={isProcessing} data-action="reject" variant="outline" className="flex-1 h-12 sm:h-14 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 text-base sm:text-lg font-bold gap-2">
          {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ThumbsDown className="h-5 w-5 sm:h-6 sm:w-6" />}
          REJEITAR
          <kbd className="hidden sm:inline ml-1 px-1.5 py-0.5 text-xs font-normal bg-red-100 border-red-200 border rounded">R</kbd>
        </Button>
      </div>
    </div>
  );
};

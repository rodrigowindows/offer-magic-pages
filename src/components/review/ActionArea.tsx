import { useState, useEffect } from 'react';
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

interface ActionAreaProps {
  statusFilter: StatusFilter;
  approvePhase: ApprovePhase;
  isProcessing: boolean;
  currentIndex: number;
  totalFiltered: number;
  compsCount: number;
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
  // Photos
  decisionPhotos: File[];
  onDecisionPhotosChange: (files: File[]) => void;
  // Callbacks
  onStartApprove: () => void;
  onOpenComps: () => void;
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

/** Small comps button shown persistently */
const CompsButton = ({ onClick, count }: { onClick: () => void; count: number }) => (
  <Button variant="outline" size="sm" onClick={onClick} className="gap-1.5 text-xs border-blue-300 text-blue-700 hover:bg-blue-50">
    <BarChart3 className="h-3.5 w-3.5" />
    Comps
    <Badge variant="secondary" className="text-[10px] px-1.5 min-w-[18px]">{count}</Badge>
  </Button>
);

export const ActionArea = ({
  statusFilter,
  approvePhase,
  isProcessing,
  currentIndex,
  totalFiltered,
  compsCount,
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
  onOpenComps,
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

  // Reset re-decide mode when navigating to another property
  useEffect(() => {
    setShowReDecide(false);
  }, [currentIndex]);
  if (statusFilter !== 'pending' && !showReDecide) {
    return (
      <div className="pt-3 sm:pt-4 border-t space-y-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onPrevious} disabled={currentIndex === 0} className="text-xs text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Anterior
          </Button>
          <div className="flex items-center gap-2">
            <CompsButton onClick={onOpenComps} count={compsCount} />
            <Badge variant="secondary" className="text-xs">
              {statusFilter === 'approved' ? 'Aprovada' : 'Rejeitada'}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onNext} disabled={currentIndex === totalFiltered - 1} className="text-xs text-muted-foreground">
            Próxima
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowReDecide(true)}
          className="w-full h-10 gap-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
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
      <div className="pt-3 sm:pt-4 border-t">
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-bold text-blue-800">Adicionar comps antes da oferta?</p>
              {compsCount > 0 && <Badge variant="secondary" className="text-[10px]">{compsCount} salvo{compsCount > 1 ? 's' : ''}</Badge>}
            </div>
            <Button variant="ghost" size="sm" onClick={onCancelApprove} className="text-xs text-muted-foreground gap-1 h-7">
              <Undo2 className="h-3 w-3" />
              <kbd className="px-1 py-0.5 text-[10px] bg-white border rounded">Esc</kbd>
            </Button>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button onClick={onOpenComps} className="flex-1 h-12 sm:h-14 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-lg font-bold gap-2">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
              COMPS
              <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 text-xs font-normal bg-blue-800/40 rounded">C</kbd>
            </Button>
            <Button onClick={onSkipComps} variant="outline" className="flex-1 h-12 sm:h-14 border-blue-300 text-blue-700 hover:bg-blue-100 text-sm sm:text-lg font-bold gap-2">
              <SkipForward className="h-5 w-5 sm:h-6 sm:w-6" />
              PULAR
              <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 text-xs font-normal bg-blue-100 border-blue-200 border rounded">N</kbd>
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
      <div className="pt-3 sm:pt-4 border-t">
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-green-800">
                Definir Valor da Oferta
                {compsARV && <span className="ml-2 text-xs font-normal text-green-600">(ARV: {formatCurrency(compsARV)})</span>}
              </p>
              <CompsButton onClick={onOpenComps} count={compsCount} />
            </div>
            <Button variant="ghost" size="sm" onClick={onCancelApprove} className="text-xs text-muted-foreground gap-1 h-7">
              <Undo2 className="h-3 w-3" />
              Voltar
              <kbd className="px-1 py-0.5 text-[10px] bg-white border rounded ml-1">Esc</kbd>
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-lg font-bold text-green-700">$</span>
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
                className="pl-8 h-12 text-lg font-bold border-green-300 focus:border-green-500"
                autoFocus
              />
            </div>
          </div>

          {/* Quick percentage buttons */}
          {baseValue && baseValue > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {[60, 65, 70, 75, 80].map(pct => {
                const val = Math.round(baseValue * (pct / 100));
                return (
                  <button
                    key={pct}
                    onClick={() => onOfferAmountChange(val.toString())}
                    className={`px-2.5 py-1.5 rounded-md text-xs border transition-colors ${
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
            <Label className="text-xs text-green-800">Notas (opcional)</Label>
            <Textarea
              value={approvalNotes}
              onChange={(e) => onApprovalNotesChange(e.target.value)}
              placeholder="Ex: Score 280, bairro bom no Maps, casa precisa reforma..."
              rows={2}
              className="mt-1 text-sm bg-white"
            />
          </div>

          <DecisionPhotoUpload files={decisionPhotos} onChange={onDecisionPhotosChange} accent="green" />

          <div className="flex gap-2">
            <Button onClick={onConfirmOffer} disabled={isProcessing} data-action="confirm-offer" className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-bold gap-2">
              <ThumbsUp className="h-5 w-5" />
              {isProcessing ? "..." : quickOfferAmount ? `APROVAR (${formatCurrency(Number(quickOfferAmount))})` : "APROVAR SEM OFERTA"}
              <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 text-xs font-normal bg-green-800/40 rounded">Enter</kbd>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Rejection form
  if (showRejectForm) {
    return (
      <div className="pt-3 sm:pt-4 border-t">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-red-800">Motivo da Rejeição</p>
            <Button variant="ghost" size="sm" onClick={onHideRejectForm} className="text-xs text-muted-foreground gap-1 h-7">
              <Undo2 className="h-3 w-3" />
              Voltar
              <kbd className="px-1 py-0.5 text-[10px] bg-white border rounded ml-1">Esc</kbd>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {REJECTION_REASONS.map((reason, index) => (
              <button
                key={reason.value}
                onClick={() => onReasonChange(reason.value)}
                className={`text-left px-2.5 py-2 rounded-md text-xs sm:text-sm border transition-colors ${
                  selectedReason === reason.value
                    ? 'bg-red-600 text-white border-red-600 font-semibold'
                    : 'bg-white text-red-800 border-red-200 hover:bg-red-100'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <kbd className={`px-1 py-0.5 text-[10px] rounded ${
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
            <Label className="text-xs text-red-800">Notas (opcional)</Label>
            <Textarea
              value={rejectionNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Detalhes adicionais..."
              rows={2}
              className="mt-1 text-sm bg-white"
            />
          </div>

          <DecisionPhotoUpload files={decisionPhotos} onChange={onDecisionPhotosChange} accent="red" />

          <Button onClick={onReject} disabled={isProcessing || !selectedReason} data-action="confirm-reject" className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-bold gap-2">
            <XCircle className="h-5 w-5" />
            {isProcessing ? "Rejeitando..." : "CONFIRMAR REJEIÇÃO"}
            <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 text-xs font-normal bg-red-800/40 rounded">Enter</kbd>
          </Button>
        </div>
      </div>
    );
  }

  // Default: Approve/Reject buttons + navigation + persistent comps
  const isReDeciding = statusFilter !== 'pending';

  return (
    <div className="pt-3 sm:pt-4 border-t space-y-3">
      {isReDeciding && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-semibold text-amber-700">Alterar decisão desta propriedade:</p>
          <Button variant="ghost" size="sm" onClick={() => setShowReDecide(false)} className="text-xs text-muted-foreground gap-1 h-7">
            <Undo2 className="h-3 w-3" />
            Cancelar
          </Button>
        </div>
      )}

      <div className="flex gap-2 sm:gap-3">
        <Button onClick={onStartApprove} disabled={isProcessing} data-action="approve" className="flex-1 h-12 sm:h-14 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-lg font-bold gap-2">
          <ThumbsUp className="h-5 w-5 sm:h-6 sm:w-6" />
          {isProcessing ? "..." : "APROVAR"}
          <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 text-xs font-normal bg-green-800/40 rounded">A</kbd>
        </Button>
        <Button onClick={onShowRejectForm} disabled={isProcessing} data-action="reject" variant="outline" className="flex-1 h-12 sm:h-14 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 text-sm sm:text-lg font-bold gap-2">
          <ThumbsDown className="h-5 w-5 sm:h-6 sm:w-6" />
          REJEITAR
          <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 text-xs font-normal bg-red-100 border-red-200 border rounded">R</kbd>
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onPrevious} disabled={currentIndex === 0} className="text-xs text-muted-foreground h-10 px-3">
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Anterior
        </Button>
        <div className="flex items-center gap-2">
          <CompsButton onClick={onOpenComps} count={compsCount} />
          <span className="text-sm font-bold text-muted-foreground tabular-nums">
            {currentIndex + 1}/{totalFiltered}
          </span>
        </div>
        <Button onClick={onNext} disabled={currentIndex === totalFiltered - 1} className={`h-10 px-5 text-sm font-bold gap-2 ${isReDeciding ? 'bg-slate-600 hover:bg-slate-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
          {isReDeciding ? <ArrowRight className="h-4 w-4" /> : <SkipForward className="h-4 w-4" />}
          {isReDeciding ? 'Próxima' : 'Pular'}
        </Button>
      </div>
    </div>
  );
};

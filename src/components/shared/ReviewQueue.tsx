import { useCallback, useEffect, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { FilterBar } from "@/components/review/FilterBar";
import { PropertyCard } from "@/components/review/PropertyCard";
import { ActionArea } from "@/components/review/ActionArea";
import { SwipeOverlay } from "@/components/review/SwipeOverlay";
import { useReviewQueue } from "@/hooks/useReviewQueue";
import { useReviewActions } from "@/hooks/useReviewActions";
import { useUndoDecision } from "@/hooks/useUndoDecision";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { extractCompsQualityMetadata } from "@/utils/compsQualityExtractor";


interface ReviewQueueProps {
  selectedBatch?: string;
}

export const ReviewQueue = ({ selectedBatch }: ReviewQueueProps) => {
  const queue = useReviewQueue(selectedBatch);
  const cardRef = useRef<HTMLDivElement>(null);

  const advanceAfterAction = useCallback(async () => {
    await queue.fetchProperties();
    await queue.fetchDailyStats();
    queue.fetchStatusCounts();
  }, [queue.fetchProperties, queue.fetchDailyStats, queue.fetchStatusCounts]);

  const undo = useUndoDecision(advanceAfterAction);

  // Extract comps quality metadata for property alerts validation
  const compsQuality = useMemo(
    () => extractCompsQualityMetadata(queue.currentComps || []),
    [queue.currentComps],
  );

  const actions = useReviewActions({
    currentProperty: queue.currentProperty,
    currentIndex: queue.currentIndex,
    onAdvance: advanceAfterAction,
    fetchCurrentComps: queue.fetchCurrentComps,
    onActionComplete: (propertyId, address, action, prevData) => {
      undo.recordAction(propertyId, address, action, prevData);
    },
  });

  // ── Keyboard shortcuts for navigation (←/→) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (actions.approvePhase || actions.showRejectForm) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); queue.handlePrevious(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); queue.handleNext(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [queue.handleNext, queue.handlePrevious, actions.approvePhase, actions.showRejectForm]);

  // ── Mobile swipe gestures ──
  const swipeState = useSwipeGesture({
    containerRef: cardRef as React.RefObject<HTMLElement>,
    onSwipeRight: () => {
      if (queue.statusFilter === 'pending' && !actions.approvePhase && !actions.showRejectForm) {
        actions.handleStartApprove();
      }
    },
    onSwipeLeft: () => {
      if (queue.statusFilter === 'pending' && !actions.approvePhase && !actions.showRejectForm) {
        actions.setShowRejectForm(true);
      }
    },
    threshold: 80,
  });

  // ── Prefetch next property's comps ──
  const nextProperty = queue.filteredProperties[queue.currentIndex + 1];
  useEffect(() => {
    if (nextProperty?.id) {
      queue.fetchCurrentComps(nextProperty.id).catch(() => {});
    }
  }, [nextProperty?.id]);

  // ── Auto-score: trigger AI score for properties without one ──
  useEffect(() => {
    if (queue.currentProperty && queue.currentProperty.ai_score == null && queue.statusFilter === 'pending') {
      import('@/hooks/useAIScore').then(({ useAIScoreStatic }) => {
        useAIScoreStatic(queue.currentProperty!).catch(() => {});
      });
    }
  }, [queue.currentProperty?.id]);

  // ── Render ────────────────────────────────────────────────────

  if (queue.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (queue.properties.length === 0 && queue.statusFilter === 'pending') {
    return (
      <EmptyState
        icon={CheckCircle}
        title="Fila Vazia!"
        description="Não há propriedades pendentes para revisar."
        action={{ label: "Ver Aprovadas", onClick: () => queue.setStatusFilter('approved') }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full px-1 sm:px-0">
      {/* Filters + Undo - compact top bar */}
      <div className="shrink-0 space-y-1 mb-1">
        <div className="flex items-center justify-between gap-1">
          <FilterBar
            statusFilter={queue.statusFilter}
            onStatusChange={queue.setStatusFilter}
            statusCounts={queue.statusCounts}
            visualFilter={queue.visualFilter}
            onVisualChange={queue.setVisualFilter}
            visualCounts={queue.visualCounts}
            totalProperties={queue.properties.length}
            searchQuery={queue.searchQuery}
            onSearchChange={queue.setSearchQuery}
            smartFilter={queue.smartFilter}
            onSmartFilterChange={queue.setSmartFilter}
            readyToContactCount={queue.readyToContactCount}
          />
          {undo.canUndo && (
            <Button variant="outline" size="sm" onClick={undo.undoLastAction} className="h-6 px-2 text-[10px] gap-1 text-amber-700 border-amber-300 hover:bg-amber-50 shrink-0">
              <Undo2 className="h-2.5 w-2.5" />
              Desfazer
            </Button>
          )}
        </div>
      </div>

      {/* Property Card + Action Area - fills remaining space */}
      {queue.currentProperty && (
        <Card ref={cardRef} className="relative flex-1 flex flex-col overflow-hidden min-h-0 bg-card">
          {/* Swipe overlay for mobile */}
          <SwipeOverlay
            swiping={swipeState.swiping}
            direction={swipeState.direction}
            deltaX={swipeState.deltaX}
          />

          <CardContent className="flex flex-col flex-1 p-1 sm:p-1.5 space-y-1 min-h-0">
            {/* Property card - scrollable content area */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-card rounded-lg">
              <PropertyCard
                property={queue.currentProperty}
                allProperties={queue.properties}
                onScoreSaved={queue.fetchProperties}
                avgCompPrice={queue.avgCompPrice}
                comps={queue.currentComps}
                onCompAdded={() => queue.fetchCurrentComps(queue.currentProperty!.id)}
                onDeleteComp={async (compId) => {
                  const { supabase } = await import('@/integrations/supabase/client');
                  await supabase.from('manual_comps_links').delete().eq('id', compId);
                  queue.fetchCurrentComps(queue.currentProperty!.id);
                }}
              />
            </div>

            {/* Action area - always visible at bottom, never scrolls */}
            <div className="shrink-0">
              <ActionArea
                statusFilter={queue.statusFilter}
                approvePhase={actions.approvePhase}
                isProcessing={actions.isProcessing}
                currentIndex={queue.currentIndex}
                totalFiltered={queue.filteredProperties.length}
                compsCount={queue.currentCompsCount}
                currentProperty={queue.currentProperty ? {
                  id: queue.currentProperty.id,
                  address: queue.currentProperty.address,
                  estimated_value: queue.currentProperty.estimated_value,
                  cash_offer_amount: queue.currentProperty.cash_offer_amount,
                  arv: (queue.currentProperty as any).arv ?? null,
                  mao: queue.currentProperty.mao,
                  square_feet: queue.currentProperty.square_feet,
                  avg_price_per_sqft: (queue.currentProperty as any).avg_price_per_sqft ?? null,
                  approval_status: queue.currentProperty.approval_status,
                  owner_name: queue.currentProperty.owner_name,
                  tags: Array.isArray(queue.currentProperty.tags) ? queue.currentProperty.tags : queue.currentProperty.tags ? [queue.currentProperty.tags] : null,
                  bedrooms: queue.currentProperty.bedrooms,
                  bathrooms: queue.currentProperty.bathrooms,
                  year_built: queue.currentProperty.year_built,
                  ai_score: queue.currentProperty.ai_score,
                  property_type: queue.currentProperty.property_type,
                  lot_size: queue.currentProperty.lot_size,
                  dnc_flag: (queue.currentProperty as any).dnc_flag ?? null,
                  deceased: (queue.currentProperty as any).deceased ?? null,
                  wholesale_value: (queue.currentProperty as any).wholesale_value ?? null,
                  wholesale_pct: (queue.currentProperty as any).wholesale_pct ?? null,
                  renovation_value: (queue.currentProperty as any).renovation_value ?? null,
                  renovation_pct: (queue.currentProperty as any).renovation_pct ?? null,
                  city: queue.currentProperty.city ?? null,
                  zip_code: (queue.currentProperty as any).zip_code ?? null,
                  comps_count: compsQuality.comps_count,
                  comps_zip_codes: compsQuality.comps_zip_codes,
                  comps_min_sqft: compsQuality.comps_min_sqft,
                  comps_avg_sqft: compsQuality.comps_avg_sqft,
                  comps_property_types: compsQuality.comps_property_types,
                } : null}
                showRejectForm={actions.showRejectForm}
                selectedReason={actions.selectedReason}
                rejectionNotes={actions.rejectionNotes}
                quickOfferAmount={actions.quickOfferAmount}
                compsARV={actions.compsARV}
                pendingEstimatedValue={actions.pendingApproveProperty?.estimated_value ?? null}
                approvalNotes={actions.approvalNotes}
                onApprovalNotesChange={actions.setApprovalNotes}
                decisionPhotos={actions.decisionPhotos}
                onDecisionPhotosChange={actions.setDecisionPhotos}
                onStartApprove={actions.handleStartApprove}
                onSkipComps={actions.handleSkipComps}
                onCancelApprove={actions.handleCancelApprove}
                onConfirmOffer={actions.handleConfirmOffer}
                onShowRejectForm={() => actions.setShowRejectForm(true)}
                onHideRejectForm={() => { actions.setShowRejectForm(false); actions.setSelectedReason(""); actions.setRejectionNotes(""); }}
                onReject={actions.handleReject}
                onNext={queue.handleNext}
                onPrevious={queue.handlePrevious}
                onReasonChange={actions.setSelectedReason}
                onNotesChange={actions.setRejectionNotes}
                onOfferAmountChange={actions.setQuickOfferAmount}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

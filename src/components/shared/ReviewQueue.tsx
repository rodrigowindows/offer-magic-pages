import { useCallback, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Target, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./EmptyState";
import { CompsModal } from "@/components/process/CompsModal";
import { FilterBar } from "@/components/review/FilterBar";
import { PropertyCard } from "@/components/review/PropertyCard";
import { ActionArea } from "@/components/review/ActionArea";
import { InlineCompsList } from "@/components/review/InlineCompsList";
import { SpeedTracker } from "@/components/review/SpeedTracker";
import { CompletenessIndicator } from "@/components/review/CompletenessIndicator";
import { useReviewQueue } from "@/hooks/useReviewQueue";
import { useReviewActions } from "@/hooks/useReviewActions";
import { useUndoDecision } from "@/hooks/useUndoDecision";
import { useToast } from "@/hooks/use-toast";

interface ReviewQueueProps {
  selectedBatch?: string;
}

export const ReviewQueue = ({ selectedBatch }: ReviewQueueProps) => {
  const queue = useReviewQueue(selectedBatch);
  const { toast } = useToast();

  const advanceAfterAction = useCallback(async () => {
    await queue.fetchProperties();
    await queue.fetchDailyStats();
    queue.fetchStatusCounts();
  }, [queue.fetchProperties, queue.fetchDailyStats, queue.fetchStatusCounts]);

  const undo = useUndoDecision(advanceAfterAction);

  const actions = useReviewActions({
    currentProperty: queue.currentProperty,
    currentIndex: queue.currentIndex,
    onAdvance: advanceAfterAction,
    fetchCurrentComps: queue.fetchCurrentComps,
    onActionComplete: (propertyId, address, action, prevData) => {
      undo.recordAction(propertyId, address, action, prevData);
    },
  });

  // ── Prefetch next property's comps ──
  const nextProperty = queue.filteredProperties[queue.currentIndex + 1];
  useEffect(() => {
    if (nextProperty?.id) {
      // Silently prefetch comps for next property
      queue.fetchCurrentComps(nextProperty.id).catch(() => {});
    }
  }, [nextProperty?.id]);

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
      {/* Stats + Speed Tracker + Filters */}
      <div className="shrink-0 space-y-1 mb-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] shrink-0">
            <Target className="h-3 w-3 text-blue-500" />
            <span className="font-bold">{queue.dailyStats?.reviewed_today || 0}</span>
            <span className="text-muted-foreground text-[10px]">hoje</span>
            <div className="w-px h-3 bg-border" />
            <CheckCircle className="h-2.5 w-2.5 text-green-500" />
            <span className="font-bold text-green-700 dark:text-green-400">{queue.dailyStats?.approved_today || 0}</span>
            <div className="w-px h-3 bg-border" />
            <XCircle className="h-2.5 w-2.5 text-red-500" />
            <span className="font-bold text-red-700 dark:text-red-400">{queue.dailyStats?.rejected_today || 0}</span>
          </div>
          <SpeedTracker dailyStats={queue.dailyStats} />
        </div>

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
        />
      </div>

      {/* Property Card */}
      {queue.currentProperty && (
        <Card className="flex-1 flex flex-col overflow-hidden min-h-0 bg-card">
          <CardContent className="flex flex-col flex-1 p-1 sm:p-1.5 space-y-1 min-h-0">
            {/* Completeness badge */}
            <div className="flex items-center justify-end px-1">
              <CompletenessIndicator property={queue.currentProperty} />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 bg-card rounded-lg">
              <PropertyCard
                property={queue.currentProperty}
                allProperties={queue.properties}
                onScoreSaved={queue.fetchProperties}
                avgCompPrice={queue.avgCompPrice}
              />
              {queue.currentComps.length > 0 && (
                <InlineCompsList
                  comps={queue.currentComps}
                  onOpenComps={actions.handleOpenComps}
                  subjectSqft={queue.currentProperty.square_feet}
                />
              )}
            </div>

            <div className="shrink-0">
              <ActionArea
                statusFilter={queue.statusFilter}
                approvePhase={actions.approvePhase}
                isProcessing={actions.isProcessing}
                currentIndex={queue.currentIndex}
                totalFiltered={queue.filteredProperties.length}
                compsCount={queue.currentCompsCount}
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
                onOpenComps={actions.handleOpenComps}
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

      {/* Comps Modal */}
      <CompsModal
        open={!!actions.compsModalProperty}
        onClose={actions.handleCompsModalClose}
        property={actions.compsModalProperty}
      />
    </div>
  );
};

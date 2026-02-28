import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "./EmptyState";
import { CompsModal } from "@/components/process/CompsModal";
import { FilterBar } from "@/components/review/FilterBar";
import { PropertyCard } from "@/components/review/PropertyCard";
import { ActionArea } from "@/components/review/ActionArea";
import { InlineCompsList } from "@/components/review/InlineCompsList";
import { AIScorePanel } from "@/components/review/AIScorePanel";
import { PropertyNotesPanel } from "@/components/property/PropertyNotesPanel";
import type { QueueProperty, ApprovePhase, StatusFilter, DailyStats, StatusCounts } from "@/components/review/types";
import { REJECTION_REASONS } from "@/components/review/constants";
import { getVisualCategory, countByVisual } from "@/components/review/helpers";
import { defaultOffer, formatCurrency } from "@/lib/utils";
import { calculateCompsPricing } from "@/services/compsPricing";
import type { SavedComp } from "@/hooks/useComps";

const PROPERTY_FIELDS = "id, address, city, state, zip_code, neighborhood, owner_name, property_image_url, estimated_value, cash_offer_amount, approval_status, approved_by_name, approved_at, rejection_reason, rejection_notes, decision_photos, property_type, year_built, square_feet, bedrooms, bathrooms, lot_size, owner_phone, lead_score, zillow_url, focar, evaluation, tags, owner_address, origem, ai_score, ai_reasoning";

interface ReviewQueueProps {
  selectedBatch?: string;
}

export const ReviewQueue = ({ selectedBatch }: ReviewQueueProps) => {
  const [properties, setProperties] = useState<QueueProperty[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [visualFilter, setVisualFilter] = useState<string>('all');
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ pending: 0, approved: 0, rejected: 0 });

  // Reject form
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");

  // Approve flow: null → 'choose' → 'comps' → 'offer'
  const [approvePhase, setApprovePhase] = useState<ApprovePhase>(null);
  const [pendingApproveProperty, setPendingApproveProperty] = useState<QueueProperty | null>(null);
  const [compsModalProperty, setCompsModalProperty] = useState<QueueProperty | null>(null);
  const [compsARV, setCompsARV] = useState<number | null>(null);
  const [quickOfferAmount, setQuickOfferAmount] = useState("");
  const [currentCompsCount, setCurrentCompsCount] = useState(0);
  const [currentComps, setCurrentComps] = useState<SavedComp[]>([]);
  const [decisionPhotos, setDecisionPhotos] = useState<File[]>([]);
  const [approvalNotes, setApprovalNotes] = useState("");

  // Inline panels
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [showAIScorePanel, setShowAIScorePanel] = useState(false);

  const { user, userId, userName } = useCurrentUser();
  const { toast } = useToast();

  // Derived
  const visualCounts = countByVisual(properties);
  const filteredProperties = visualFilter === 'all'
    ? properties
    : properties.filter(p => getVisualCategory(p.evaluation) === visualFilter);
  const currentProperty = filteredProperties[currentIndex];

  // ── Data fetching ─────────────────────────────────────────────

  useEffect(() => {
    fetchProperties();
    if (user) {
      fetchDailyStats();
      fetchStatusCounts();
    }
  }, [user, selectedBatch, statusFilter]);

  // Real-time subscription: refresh when another user approves/rejects
  useEffect(() => {
    const channel = supabase
      .channel('properties-approval-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'properties',
        },
        (payload: any) => {
          // Only refresh if the change was made by another user
          if (payload.new?.approved_by && payload.new.approved_by !== userId) {
            fetchProperties();
            fetchStatusCounts();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, selectedBatch, statusFilter]);

  useEffect(() => { setCurrentIndex(0); }, [visualFilter, statusFilter]);

  useEffect(() => {
    setShowRejectForm(false);
    setSelectedReason("");
    setRejectionNotes("");
    setApprovePhase(null);
    setPendingApproveProperty(null);
    setQuickOfferAmount("");
    setCompsARV(null);
    setCurrentCompsCount(0);
    setCurrentComps([]);
    setDecisionPhotos([]);
    setApprovalNotes("");
  }, [currentIndex]);

  // Fetch comps for current property (full data for inline list + count)
  const fetchCurrentComps = useCallback(async (propertyId: string) => {
    try {
      const { data } = await supabase
        .from('manual_comps_links' as any)
        .select('id, url, source, comp_data, created_at')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });
      const comps = (data as unknown as SavedComp[]) || [];
      setCurrentComps(comps);
      setCurrentCompsCount(comps.length);
    } catch {
      setCurrentComps([]);
      setCurrentCompsCount(0);
    }
  }, []);

  useEffect(() => {
    if (currentProperty?.id) fetchCurrentComps(currentProperty.id);
  }, [currentProperty?.id, fetchCurrentComps]);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("properties")
        .select(PROPERTY_FIELDS)
        .order("created_at", { ascending: true })
        .limit(500);

      if (statusFilter === 'pending') {
        query = query.or("approval_status.is.null,approval_status.eq.pending");
      } else {
        query = query.eq("approval_status", statusFilter);
      }
      if (selectedBatch && selectedBatch !== 'all') {
        query = query.eq('import_batch', selectedBatch);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProperties((data as unknown as QueueProperty[]) || []);
    } catch (error: any) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatusCounts = async () => {
    try {
      const batchFilter = selectedBatch && selectedBatch !== 'all' ? selectedBatch : null;

      let pQ = supabase.from("properties").select("*", { count: "exact", head: true })
        .or("approval_status.is.null,approval_status.eq.pending");
      let aQ = supabase.from("properties").select("*", { count: "exact", head: true })
        .eq("approval_status", "approved");
      let rQ = supabase.from("properties").select("*", { count: "exact", head: true })
        .eq("approval_status", "rejected");

      if (batchFilter) {
        pQ = pQ.eq('import_batch', batchFilter);
        aQ = aQ.eq('import_batch', batchFilter);
        rQ = rQ.eq('import_batch', batchFilter);
      }

      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([pQ, aQ, rQ]);
      setStatusCounts({
        pending: pendingRes.count || 0,
        approved: approvedRes.count || 0,
        rejected: rejectedRes.count || 0,
      });
    } catch (err) {
      console.error('Error fetching status counts:', err);
    }
  };

  const fetchDailyStats = async () => {
    if (!user) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: userReviews } = await supabase
        .from("properties")
        .select("approval_status")
        .eq("approved_by", user.id)
        .gte("approved_at", today.toISOString());

      const approved = userReviews?.filter(p => p.approval_status === "approved").length || 0;
      const rejected = userReviews?.filter(p => p.approval_status === "rejected").length || 0;
      setDailyStats({
        reviewed_today: approved + rejected,
        approved_today: approved,
        rejected_today: rejected,
      });
    } catch (error: any) {
      console.error("Error fetching daily stats:", error);
    }
  };

  // ── Navigation ────────────────────────────────────────────────

  const handleNext = () => {
    if (currentIndex < filteredProperties.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      toast({ title: "Fim da lista", description: "Você chegou ao final das propriedades filtradas." });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  // ── Approve flow ──────────────────────────────────────────────

  const resetActionState = () => {
    setShowRejectForm(false);
    setSelectedReason("");
    setRejectionNotes("");
    setQuickOfferAmount("");
    setApprovePhase(null);
    setPendingApproveProperty(null);
    setCompsARV(null);
    setDecisionPhotos([]);
    setApprovalNotes("");
  };

  const uploadDecisionPhotos = async (propertyId: string, decision: string): Promise<string[]> => {
    if (decisionPhotos.length === 0) return [];
    const urls: string[] = [];
    for (const file of decisionPhotos) {
      const ext = file.name.split('.').pop() || 'jpg';
      const ts = Date.now();
      const path = `decisions/${propertyId}/${decision}_${ts}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
      const { error } = await supabase.storage
        .from('property-images')
        .upload(path, file, { contentType: file.type });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(path);
        urls.push(publicUrl);
      }
    }
    return urls;
  };

  const advanceAfterAction = async () => {
    await fetchProperties();
    await fetchDailyStats();
    fetchStatusCounts();
    resetActionState();
  };

  const handleStartApprove = () => {
    if (!currentProperty) return;
    setPendingApproveProperty(currentProperty);
    setApprovePhase('choose');
  };

  const handleOpenComps = () => {
    // Works both inside approve flow and standalone (from Comps button)
    const target = pendingApproveProperty || currentProperty;
    if (target) {
      setCompsModalProperty(target);
      if (pendingApproveProperty) {
        setApprovePhase('comps');
      }
    }
  };

  const handleSkipComps = () => {
    setCompsARV(null);
    setApprovePhase('offer');
    if (pendingApproveProperty?.estimated_value) {
      setQuickOfferAmount(defaultOffer(pendingApproveProperty.estimated_value).toString());
    }
  };

  const handleCompsModalClose = async () => {
    const targetProperty = compsModalProperty;
    setCompsModalProperty(null);

    // Refresh inline comps list
    if (targetProperty?.id) {
      fetchCurrentComps(targetProperty.id);
    }

    // If not in approve flow, just close (standalone mode)
    if (!pendingApproveProperty) {
      setApprovePhase(null);
      return;
    }
    try {
      const { data: comps } = await supabase
        .from('manual_comps_links' as any)
        .select('comp_data')
        .eq('property_id', pendingApproveProperty.id);

      const validComps = (comps as any[] || []).filter(
        (c: any) => c.comp_data?.sale_price && c.comp_data?.square_feet && c.comp_data.square_feet > 0
      );

      if (validComps.length > 0 && pendingApproveProperty.square_feet) {
        const avgPricePerSqft = validComps.reduce(
          (sum: number, c: any) => sum + (c.comp_data.sale_price / c.comp_data.square_feet), 0
        ) / validComps.length;
        const arv = Math.round(pendingApproveProperty.square_feet * avgPricePerSqft);
        setCompsARV(arv);
        setQuickOfferAmount(defaultOffer(arv).toString());
      } else {
        setCompsARV(null);
        if (pendingApproveProperty.estimated_value) {
          setQuickOfferAmount(defaultOffer(pendingApproveProperty.estimated_value).toString());
        }
      }
    } catch {
      setCompsARV(null);
      if (pendingApproveProperty?.estimated_value) {
        setQuickOfferAmount(defaultOffer(pendingApproveProperty.estimated_value).toString());
      }
    }
    setApprovePhase('offer');
  };

  const handleConfirmOffer = async () => {
    if (!userId || !userName || !pendingApproveProperty) return;
    setIsProcessing(true);
    try {
      // Upload decision photos
      const photoUrls = await uploadDecisionPhotos(pendingApproveProperty.id, 'approved');

      const offerValue = quickOfferAmount ? parseFloat(quickOfferAmount) : null;
      const updateData: any = {
        approval_status: "approved",
        approved_by: userId,
        approved_by_name: userName,
        approved_at: new Date().toISOString(),
        rejection_reason: null,
        rejection_notes: approvalNotes.trim() || null,
        updated_by: userId,
        updated_by_name: userName,
      };
      if (offerValue && offerValue > 0) {
        updateData.cash_offer_amount = offerValue;
      }
      if (photoUrls.length > 0) {
        updateData.decision_photos = photoUrls;
      }
      const { error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", pendingApproveProperty.id);
      if (error) throw error;
      toast({
        title: "Aprovado!",
        description: `${pendingApproveProperty.address}${offerValue ? ` - Oferta: ${formatCurrency(offerValue)}` : ''}`,
      });
      await advanceAfterAction();
    } catch (error: any) {
      toast({ title: "Erro ao aprovar", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelApprove = () => resetActionState();

  // ── Reject ────────────────────────────────────────────────────

  const handleReject = async () => {
    if (!userId || !userName || !currentProperty || !selectedReason) return;
    setIsProcessing(true);
    try {
      // Upload decision photos
      const photoUrls = await uploadDecisionPhotos(currentProperty.id, 'rejected');

      const updateData: any = {
        approval_status: "rejected",
        approved_by: userId,
        approved_by_name: userName,
        approved_at: new Date().toISOString(),
        rejection_reason: selectedReason,
        rejection_notes: rejectionNotes.trim() || null,
        updated_by: userId,
        updated_by_name: userName,
      };
      if (photoUrls.length > 0) {
        updateData.decision_photos = photoUrls;
      }
      const { error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", currentProperty.id);
      if (error) throw error;
      const reasonLabel = REJECTION_REASONS.find(r => r.value === selectedReason)?.label;
      toast({ title: "Rejeitado", description: `${currentProperty.address} - ${reasonLabel}` });
      await advanceAfterAction();
    } catch (error: any) {
      toast({ title: "Erro ao rejeitar", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Keyboard shortcuts ────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (isProcessing) return;

      if (approvePhase === 'choose') {
        switch (e.key) {
          case 'c': case 'C': e.preventDefault(); handleOpenComps(); return;
          case 'n': case 'N': case 'ArrowRight': e.preventDefault(); handleSkipComps(); return;
          case 'Escape': e.preventDefault(); handleCancelApprove(); return;
        }
        return;
      }
      if (approvePhase === 'offer') {
        switch (e.key) {
          case 'Enter': e.preventDefault(); handleConfirmOffer(); return;
          case 'Escape': e.preventDefault(); handleCancelApprove(); return;
        }
        return;
      }
      if (!currentProperty) return;

      switch (e.key) {
        case 'a': case 'A':
          if (!showRejectForm) { e.preventDefault(); handleStartApprove(); }
          break;
        case 'r': case 'R':
          if (!approvePhase) { e.preventDefault(); setShowRejectForm(true); }
          break;
        case 'ArrowRight':
          if (!showRejectForm && !approvePhase) { e.preventDefault(); handleNext(); }
          break;
        case 'ArrowLeft':
          if (!showRejectForm && !approvePhase) { e.preventDefault(); handlePrevious(); }
          break;
        case 'Escape':
          if (showRejectForm) { e.preventDefault(); setShowRejectForm(false); setSelectedReason(""); setRejectionNotes(""); }
          break;
        case 'Enter':
          if (showRejectForm && selectedReason) { e.preventDefault(); handleReject(); }
          break;
        default:
          if (showRejectForm && e.key >= '1' && e.key <= '9') {
            const index = parseInt(e.key) - 1;
            if (index < REJECTION_REASONS.length) { e.preventDefault(); setSelectedReason(REJECTION_REASONS[index].value); }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, properties.length, currentProperty, showRejectForm, selectedReason, isProcessing, approvePhase]);

  // ── Render ────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (properties.length === 0 && statusFilter === 'pending') {
    return (
      <EmptyState
        icon={CheckCircle}
        title="Fila Vazia!"
        description="Não há propriedades pendentes para revisar."
        action={{ label: "Ver Aprovadas", onClick: () => setStatusFilter('approved') }}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
      {/* Stats bar */}
      <div className="flex items-center justify-between gap-1 p-2 bg-card border rounded-lg text-xs sm:text-sm">
        <div className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-muted-foreground hidden sm:inline">Analisados:</span>
          <span className="font-bold">{dailyStats?.reviewed_today || 0}</span>
          <span className="text-muted-foreground sm:hidden">hoje</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
          <span className="text-muted-foreground hidden sm:inline">Aprovados:</span>
          <span className="font-bold text-green-700">{dailyStats?.approved_today || 0}</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5">
          <XCircle className="h-3.5 w-3.5 text-red-500" />
          <span className="text-muted-foreground hidden sm:inline">Rejeitados:</span>
          <span className="font-bold text-red-700">{dailyStats?.rejected_today || 0}</span>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusCounts={statusCounts}
        visualFilter={visualFilter}
        onVisualChange={setVisualFilter}
        visualCounts={visualCounts}
        totalProperties={properties.length}
      />

      {/* Main Review Card */}
      {currentProperty && (
        <Card>
          <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6 pt-3 sm:pt-6">
            <PropertyCard property={currentProperty} allProperties={properties} onScoreSaved={fetchProperties} />

            <InlineCompsList comps={currentComps} onOpenComps={handleOpenComps} />

            <ActionArea
              statusFilter={statusFilter}
              approvePhase={approvePhase}
              isProcessing={isProcessing}
              currentIndex={currentIndex}
              totalFiltered={filteredProperties.length}
              compsCount={currentCompsCount}
              showRejectForm={showRejectForm}
              selectedReason={selectedReason}
              rejectionNotes={rejectionNotes}
              quickOfferAmount={quickOfferAmount}
              compsARV={compsARV}
              pendingEstimatedValue={pendingApproveProperty?.estimated_value ?? null}
              approvalNotes={approvalNotes}
              onApprovalNotesChange={setApprovalNotes}
              decisionPhotos={decisionPhotos}
              onDecisionPhotosChange={setDecisionPhotos}
              onStartApprove={handleStartApprove}
              onOpenComps={handleOpenComps}
              onSkipComps={handleSkipComps}
              onCancelApprove={handleCancelApprove}
              onConfirmOffer={handleConfirmOffer}
              onShowRejectForm={() => setShowRejectForm(true)}
              onHideRejectForm={() => { setShowRejectForm(false); setSelectedReason(""); setRejectionNotes(""); }}
              onReject={handleReject}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onReasonChange={setSelectedReason}
              onNotesChange={setRejectionNotes}
              onOfferAmountChange={setQuickOfferAmount}
            />
          </CardContent>
        </Card>
      )}

      {/* Comps Modal */}
      <CompsModal
        open={!!compsModalProperty}
        onClose={handleCompsModalClose}
        property={compsModalProperty}
      />
    </div>
  );
};

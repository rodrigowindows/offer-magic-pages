import { useState, useEffect } from "react";
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
import type { QueueProperty, ApprovePhase, StatusFilter, DailyStats, StatusCounts } from "@/components/review/types";
import { REJECTION_REASONS } from "@/components/review/constants";
import { getVisualCategory, countByVisual } from "@/components/review/helpers";
import { defaultOffer, formatCurrency } from "@/lib/utils";

const PROPERTY_FIELDS = "id, address, city, state, zip_code, neighborhood, owner_name, property_image_url, estimated_value, cash_offer_amount, approval_status, property_type, year_built, square_feet, bedrooms, bathrooms, lot_size, owner_phone, lead_score, zillow_url, focar, evaluation, tags, owner_address, origem";

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

  useEffect(() => { setCurrentIndex(0); }, [visualFilter, statusFilter]);

  useEffect(() => {
    setShowRejectForm(false);
    setSelectedReason("");
    setRejectionNotes("");
    setApprovePhase(null);
    setPendingApproveProperty(null);
    setQuickOfferAmount("");
    setCompsARV(null);
  }, [currentIndex]);

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

      setDailyStats({
        reviewed_today: userReviews?.length || 0,
        approved_today: userReviews?.filter(p => p.approval_status === "approved").length || 0,
        rejected_today: userReviews?.filter(p => p.approval_status === "rejected").length || 0,
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
    if (pendingApproveProperty) {
      setCompsModalProperty(pendingApproveProperty);
      setApprovePhase('comps');
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
    setCompsModalProperty(null);
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
      const offerValue = quickOfferAmount ? parseFloat(quickOfferAmount) : null;
      const updateData: any = {
        approval_status: "approved",
        approved_by: userId,
        approved_by_name: userName,
        approved_at: new Date().toISOString(),
        rejection_reason: null,
        rejection_notes: null,
        updated_by: userId,
        updated_by_name: userName,
      };
      if (offerValue && offerValue > 0) {
        updateData.cash_offer_amount = offerValue;
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
      const { error } = await supabase
        .from("properties")
        .update({
          approval_status: "rejected",
          approved_by: userId,
          approved_by_name: userName,
          approved_at: new Date().toISOString(),
          rejection_reason: selectedReason,
          rejection_notes: rejectionNotes.trim() || null,
          updated_by: userId,
          updated_by_name: userName,
        } as any)
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
      if (approvePhase === 'offer') return;
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
          <span className="font-bold">{dailyStats?.reviewed_today || 0}</span>
          <span className="text-muted-foreground">hoje</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
          <span className="font-bold text-green-700">{dailyStats?.approved_today || 0}</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5">
          <XCircle className="h-3.5 w-3.5 text-red-500" />
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
            <PropertyCard property={currentProperty} allProperties={properties} />

            <ActionArea
              statusFilter={statusFilter}
              approvePhase={approvePhase}
              isProcessing={isProcessing}
              currentIndex={currentIndex}
              totalFiltered={filteredProperties.length}
              showRejectForm={showRejectForm}
              selectedReason={selectedReason}
              rejectionNotes={rejectionNotes}
              quickOfferAmount={quickOfferAmount}
              compsARV={compsARV}
              pendingEstimatedValue={pendingApproveProperty?.estimated_value ?? null}
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

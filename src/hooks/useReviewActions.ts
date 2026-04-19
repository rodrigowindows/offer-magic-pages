/**
 * Hook for ReviewQueue approve/reject business logic.
 * Extracted from ReviewQueue.tsx to isolate side-effects.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/use-toast';
import type { QueueProperty, ApprovePhase } from '@/components/review/types';
import { REJECTION_REASONS } from '@/components/review/constants';
import { defaultOffer, formatCurrency } from '@/lib/utils';
import { validateApproval } from '@/lib/approvalValidation';

interface UseReviewActionsOptions {
  currentProperty: QueueProperty | undefined;
  currentIndex: number;
  onAdvance: () => Promise<void>;
  fetchCurrentComps: (propertyId: string) => Promise<void>;
  onActionComplete?: (
    propertyId: string,
    address: string,
    action: 'approved' | 'rejected',
    previousData: { status: string | null; offer: number | null; rejectionReason: string | null; rejectionNotes: string | null }
  ) => void;
}

export const useReviewActions = ({
  currentProperty,
  currentIndex,
  onAdvance,
  fetchCurrentComps,
  onActionComplete,
}: UseReviewActionsOptions) => {
  const { userId, userName } = useCurrentUser();
  const { toast } = useToast();

  // Reject state
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");

  // Approve state
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvePhase, setApprovePhase] = useState<ApprovePhase>(null);
  const [pendingApproveProperty, setPendingApproveProperty] = useState<QueueProperty | null>(null);
  const [compsModalProperty, setCompsModalProperty] = useState<QueueProperty | null>(null);
  const [compsARV, setCompsARV] = useState<number | null>(null);
  const [quickOfferAmount, setQuickOfferAmount] = useState("");
  const [decisionPhotos, setDecisionPhotos] = useState<File[]>([]);
  const [approvalNotes, setApprovalNotes] = useState("");

  // Reset on navigation
  useEffect(() => {
    resetActionState();
  }, [currentIndex]);

  const resetActionState = useCallback(() => {
    setShowRejectForm(false);
    setSelectedReason("");
    setRejectionNotes("");
    setQuickOfferAmount("");
    setApprovePhase(null);
    setPendingApproveProperty(null);
    setCompsARV(null);
    setDecisionPhotos([]);
    setApprovalNotes("");
  }, []);

  const uploadDecisionPhotos = useCallback(async (propertyId: string, decision: string): Promise<string[]> => {
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
  }, [decisionPhotos]);

  // ── Approve flow ──────────────────────────────────────────────

  const handleStartApprove = useCallback(() => {
    if (!currentProperty) return;
    setPendingApproveProperty(currentProperty);
    // Skip the 'choose' phase — go directly to offer input.
    // Comps can be added independently via the Comps tab at any time.
    setApprovePhase('offer');
    // Use ARV if available (Miami data), otherwise fall back to estimated_value
    const base = (currentProperty as any).arv || currentProperty.estimated_value;
    if (base) {
      setQuickOfferAmount(defaultOffer(base).toString());
      if ((currentProperty as any).arv) setCompsARV((currentProperty as any).arv);
    }
  }, [currentProperty]);

  const handleOpenComps = useCallback(() => {
    const target = pendingApproveProperty || currentProperty;
    if (target) {
      setCompsModalProperty(target);
      if (pendingApproveProperty) setApprovePhase('comps');
    }
  }, [pendingApproveProperty, currentProperty]);

  const handleSkipComps = useCallback(() => {
    setCompsARV(null);
    setApprovePhase('offer');
    if (pendingApproveProperty?.estimated_value) {
      setQuickOfferAmount(defaultOffer(pendingApproveProperty.estimated_value).toString());
    }
  }, [pendingApproveProperty]);

  const handleCompsModalClose = useCallback(async () => {
    const targetProperty = compsModalProperty;
    setCompsModalProperty(null);

    if (targetProperty?.id) fetchCurrentComps(targetProperty.id);

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
  }, [compsModalProperty, pendingApproveProperty, fetchCurrentComps]);

  const handleConfirmOffer = useCallback(async () => {
    if (!userId || !userName || !pendingApproveProperty) return;
    setIsProcessing(true);
    try {
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
      if (offerValue && offerValue > 0) updateData.cash_offer_amount = offerValue;
      if (photoUrls.length > 0) updateData.decision_photos = photoUrls;

      const { error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", pendingApproveProperty.id);
      if (error) throw error;

      // Auto-save decision to property_notes
      const noteParts: string[] = [`✅ APROVADO`];
      if (offerValue) noteParts.push(`Oferta: ${formatCurrency(offerValue)}`);
      if (approvalNotes.trim()) noteParts.push(approvalNotes.trim());
      await supabase.from("property_notes").insert({
        property_id: pendingApproveProperty.id,
        note_text: noteParts.join(' — '),
        image_urls: photoUrls.length > 0 ? photoUrls : null,
      });

      toast({
        title: "Aprovado!",
        description: `${pendingApproveProperty.address}${offerValue ? ` - Oferta: ${formatCurrency(offerValue)}` : ''}`,
      });

      onActionComplete?.(pendingApproveProperty.id, pendingApproveProperty.address, 'approved', {
        status: pendingApproveProperty.approval_status || null,
        offer: pendingApproveProperty.cash_offer_amount,
        rejectionReason: pendingApproveProperty.rejection_reason || null,
        rejectionNotes: pendingApproveProperty.rejection_notes || null,
      });

      await onAdvance();
      resetActionState();
    } catch (error: any) {
      toast({ title: "Erro ao aprovar", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, [userId, userName, pendingApproveProperty, quickOfferAmount, approvalNotes, uploadDecisionPhotos, onAdvance, resetActionState, toast]);

  const handleCancelApprove = useCallback(() => resetActionState(), [resetActionState]);

  // ── Reject ────────────────────────────────────────────────────

  const handleReject = useCallback(async () => {
    if (!userId || !userName || !currentProperty || !selectedReason) return;
    setIsProcessing(true);
    try {
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
      if (photoUrls.length > 0) updateData.decision_photos = photoUrls;

      const { error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", currentProperty.id);
      if (error) throw error;

      const reasonLabel = REJECTION_REASONS.find(r => r.value === selectedReason)?.label;
      const noteParts: string[] = [`❌ REJEITADO — ${reasonLabel}`];
      if (rejectionNotes.trim()) noteParts.push(rejectionNotes.trim());
      await supabase.from("property_notes").insert({
        property_id: currentProperty.id,
        note_text: noteParts.join(' — '),
        image_urls: photoUrls.length > 0 ? photoUrls : null,
      });

      toast({ title: "Rejeitado", description: `${currentProperty.address} - ${reasonLabel}` });

      onActionComplete?.(currentProperty.id, currentProperty.address, 'rejected', {
        status: currentProperty.approval_status || null,
        offer: currentProperty.cash_offer_amount,
        rejectionReason: currentProperty.rejection_reason || null,
        rejectionNotes: currentProperty.rejection_notes || null,
      });

      await onAdvance();
      resetActionState();
    } catch (error: any) {
      toast({ title: "Erro ao rejeitar", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, [userId, userName, currentProperty, selectedReason, rejectionNotes, uploadDecisionPhotos, onAdvance, resetActionState, toast]);

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
  }, [currentProperty, showRejectForm, selectedReason, isProcessing, approvePhase, handleStartApprove, handleOpenComps, handleSkipComps, handleCancelApprove, handleConfirmOffer, handleReject]);

  return {
    // State
    isProcessing,
    showRejectForm, setShowRejectForm,
    selectedReason, setSelectedReason,
    rejectionNotes, setRejectionNotes,
    approvePhase,
    pendingApproveProperty,
    compsModalProperty,
    compsARV,
    quickOfferAmount, setQuickOfferAmount,
    decisionPhotos, setDecisionPhotos,
    approvalNotes, setApprovalNotes,
    // Actions
    handleStartApprove,
    handleOpenComps,
    handleSkipComps,
    handleCompsModalClose,
    handleConfirmOffer,
    handleCancelApprove,
    handleReject,
  };
};

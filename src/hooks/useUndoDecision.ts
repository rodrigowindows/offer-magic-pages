/**
 * Hook for undo last review decision.
 * Stores the last action and provides undo capability.
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UndoableAction {
  propertyId: string;
  propertyAddress: string;
  previousStatus: string | null;
  previousOffer: number | null;
  previousRejectionReason: string | null;
  previousRejectionNotes: string | null;
  action: 'approved' | 'rejected';
  timestamp: number;
}

export const useUndoDecision = (onUndo: () => void) => {
  const [lastAction, setLastAction] = useState<UndoableAction | null>(null);
  const { toast } = useToast();

  const recordAction = useCallback((
    propertyId: string,
    propertyAddress: string,
    action: 'approved' | 'rejected',
    previousData: {
      status: string | null;
      offer: number | null;
      rejectionReason: string | null;
      rejectionNotes: string | null;
    }
  ) => {
    setLastAction({
      propertyId,
      propertyAddress,
      previousStatus: previousData.status,
      previousOffer: previousData.offer,
      previousRejectionReason: previousData.rejectionReason,
      previousRejectionNotes: previousData.rejectionNotes,
      action,
      timestamp: Date.now(),
    });
  }, []);

  const undoLastAction = useCallback(async () => {
    if (!lastAction) return;
    // Only allow undo within 30 seconds
    if (Date.now() - lastAction.timestamp > 30000) {
      toast({ title: "Tempo expirado", description: "Desfazer disponível por 30s após a ação.", variant: "destructive" });
      setLastAction(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .update({
          approval_status: lastAction.previousStatus || 'pending',
          cash_offer_amount: lastAction.previousOffer,
          rejection_reason: lastAction.previousRejectionReason,
          rejection_notes: lastAction.previousRejectionNotes,
          approved_by: null,
          approved_by_name: null,
          approved_at: null,
        } as any)
        .eq('id', lastAction.propertyId);

      if (error) throw error;

      toast({
        title: "↩️ Desfeito!",
        description: `${lastAction.propertyAddress} voltou para pendente.`,
      });

      setLastAction(null);
      onUndo();
    } catch (err: any) {
      toast({ title: "Erro ao desfazer", description: err.message, variant: "destructive" });
    }
  }, [lastAction, toast, onUndo]);

  return {
    lastAction,
    recordAction,
    undoLastAction,
    canUndo: !!lastAction && (Date.now() - (lastAction?.timestamp || 0)) < 30000,
  };
};

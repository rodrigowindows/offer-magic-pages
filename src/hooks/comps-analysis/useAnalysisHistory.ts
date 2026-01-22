/**
 * useAnalysisHistory Hook
 * Manages analysis history with Supabase integration
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AnalysisHistoryItem } from '@/components/comps-analysis/types';
import { toast } from 'sonner';

export interface UseAnalysisHistoryReturn {
  history: AnalysisHistoryItem[];
  loading: boolean;
  error: string | null;
  fetchHistory: (propertyId?: string) => Promise<void>;
  saveAnalysis: (data: Partial<AnalysisHistoryItem>) => Promise<void>;
  deleteHistory: (itemId: string) => Promise<void>;
  loadHistoryItem: (item: AnalysisHistoryItem) => void;
}

export const useAnalysisHistory = (): UseAnalysisHistoryReturn => {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch analysis history from Supabase
   */
  const fetchHistory = useCallback(async (propertyId?: string) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('comps_analysis_history')
        .select('*')
        .order('analysis_date', { ascending: false });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setHistory(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch history';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save a new analysis to history
   */
  const saveAnalysis = useCallback(async (data: Partial<AnalysisHistoryItem>) => {
    try {
      setLoading(true);
      setError(null);

      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const analysisData = {
        ...data,
        analyst_user_id: userId,
        analysis_date: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('comps_analysis_history')
        .insert([analysisData]);

      if (insertError) throw insertError;

      toast.success('Analysis saved to history');

      // Refresh history
      await fetchHistory(data.property_id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save analysis';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchHistory]);

  /**
   * Delete an analysis from history
   */
  const deleteHistory = useCallback(async (itemId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('comps_analysis_history')
        .delete()
        .eq('id', itemId);

      if (deleteError) throw deleteError;

      // Update local state
      setHistory((prev) => prev.filter((item) => item.id !== itemId));

      toast.success('History item deleted');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete history';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load a history item (client-side only, emits event for parent to handle)
   */
  const loadHistoryItem = useCallback((item: AnalysisHistoryItem) => {
    // Emit custom event that parent component can listen to
    const event = new CustomEvent('comps-history-load', { detail: item });
    window.dispatchEvent(event);

    toast.info('Loading analysis from history...');
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    fetchHistory,
    saveAnalysis,
    deleteHistory,
    loadHistoryItem,
  };
};

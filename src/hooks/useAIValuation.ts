/**
 * Hook for AI-powered comps valuation
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AIValuationResult {
  suggested_arv: number;
  suggested_price_per_sqft: number;
  confidence: 'high' | 'medium' | 'low';
  analysis: string;
  adjustments?: string;
  suggested_offer_range_min: number;
  suggested_offer_range_max: number;
}

export const useAIValuation = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIValuationResult | null>(null);
  const { toast } = useToast();

  const analyzeComps = useCallback(async (
    property: Record<string, any>,
    comps: Array<{ sale_price?: number; square_feet?: number; address?: string; url?: string; notes?: string }>
  ): Promise<AIValuationResult | null> => {
    if (comps.length === 0) {
      toast({ title: 'Sem comps', description: 'Adicione comparativos antes de analisar.', variant: 'destructive' });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-comps-valuation', {
        body: { property, comps },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: 'Erro', description: data.error, variant: 'destructive' });
        return null;
      }

      setResult(data as AIValuationResult);
      return data as AIValuationResult;
    } catch (err: any) {
      toast({ title: 'Erro AI Valuation', description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { analyzeComps, loading, result };
};

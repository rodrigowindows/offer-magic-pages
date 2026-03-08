/**
 * Hook for AI-powered property scoring
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { handleAIResponseError, withAILoading } from '@/lib/aiErrorHandler';

interface AIScoreResult {
  score: number;
  reasoning: string;
  recommendation: 'approve' | 'reject' | 'review';
}

export const useAIScore = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const scoreProperty = useCallback(async (property: Record<string, any>): Promise<AIScoreResult | null> => {
    return withAILoading(setLoading, 'AI Score', toast, async () => {
      const { data, error } = await supabase.functions.invoke('ai-score-property', {
        body: {
          property: {
            address: property.address,
            city: property.city,
            state: property.state,
            zip_code: property.zip_code,
            estimated_value: property.estimated_value,
            cash_offer_amount: property.cash_offer_amount,
            square_feet: property.square_feet,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            year_built: property.year_built,
            lot_size: property.lot_size,
            owner_name: property.owner_name,
            owner_phone: property.owner_phone,
            neighborhood: property.neighborhood,
            property_type: property.property_type,
            lead_score: property.lead_score,
            tags: property.tags,
            evaluation: property.evaluation,
            focar: property.focar,
            last_sale_price: property.last_sale_price,
            last_sale_date: property.last_sale_date,
          },
        },
      });

      if (error) throw error;
      if (handleAIResponseError(data?.error, { toast, context: 'AI Score' })) return null;

      // Save score to database
      await supabase.from('properties').update({
        ai_score: data.score,
        ai_reasoning: data.reasoning,
      } as any).eq('id', property.id);

      return data as AIScoreResult;
    });
  }, [toast]);

  return { scoreProperty, loading };
};

/**
 * Hook for AI-powered campaign message generation
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { handleAIResponseError, withAILoading } from '@/lib/aiErrorHandler';

export interface AIMessageResult {
  subject?: string;
  body: string;
  variant_b?: string;
  tips: string;
}

export const useAIMessage = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateMessage = useCallback(async (
    property: Record<string, any>,
    channel: 'sms' | 'email' | 'call' | 'letter',
    tone: 'friendly' | 'urgent' | 'professional' | 'empathetic' = 'friendly',
    language: string = 'English'
  ): Promise<AIMessageResult | null> => {
    return withAILoading(setLoading, 'AI Message', toast, async () => {
      const { data, error } = await supabase.functions.invoke('ai-generate-message', {
        body: { property, channel, tone, language },
      });

      if (error) throw error;
      if (handleAIResponseError(data?.error, { toast, context: 'AI Message' })) return null;

      return data as AIMessageResult;
    });
  }, [toast]);

  return { generateMessage, loading };
};

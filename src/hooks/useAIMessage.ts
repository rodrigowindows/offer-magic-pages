/**
 * Hook for AI-powered campaign message generation
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-message', {
        body: { property, channel, tone, language },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: 'Erro', description: data.error, variant: 'destructive' });
        return null;
      }

      return data as AIMessageResult;
    } catch (err: any) {
      toast({ title: 'Erro AI Message', description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { generateMessage, loading };
};

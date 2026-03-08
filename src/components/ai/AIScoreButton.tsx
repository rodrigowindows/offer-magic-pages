/**
 * AI Score Button - Triggers AI scoring for a property in the review queue
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';
import { useAIScore } from '@/hooks/useAIScore';
import { useToast } from '@/hooks/use-toast';

interface AIScoreButtonProps {
  property: Record<string, any>;
  onScoreUpdate?: (score: number, reasoning: string) => void;
}

export const AIScoreButton = ({ property, onScoreUpdate }: AIScoreButtonProps) => {
  const { scoreProperty, loading } = useAIScore();
  const { toast } = useToast();

  const handleScore = async () => {
    const result = await scoreProperty(property);
    if (result) {
      onScoreUpdate?.(result.score, result.reasoning);
      const emoji = result.recommendation === 'approve' ? '✅' : result.recommendation === 'reject' ? '❌' : '🔍';
      toast({
        title: `${emoji} AI Score: ${result.score}`,
        description: result.reasoning,
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleScore}
      disabled={loading}
      className="gap-1.5 text-xs h-8 border-violet-300 text-violet-700 hover:bg-violet-50"
      data-action="ai-score"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5" />
      )}
      {loading ? 'Analisando...' : 'AI Score'}
    </Button>
  );
};

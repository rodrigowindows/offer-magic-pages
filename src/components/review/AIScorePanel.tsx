import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Brain, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIScorePanelProps {
  propertyId: string;
  currentScore: number | null;
  currentReasoning: string | null;
  onSaved: () => void;
}

const scoreColor = (score: number | null) => {
  if (score == null) return 'text-muted-foreground';
  if (score >= 70) return 'text-green-700';
  if (score >= 50) return 'text-yellow-700';
  if (score >= 30) return 'text-orange-600';
  return 'text-red-600';
};

const scoreBg = (score: number | null) => {
  if (score == null) return 'bg-gray-50 border-gray-200';
  if (score >= 70) return 'bg-green-50 border-green-200';
  if (score >= 50) return 'bg-yellow-50 border-yellow-200';
  if (score >= 30) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
};

export const AIScorePanel = ({ propertyId, currentScore, currentReasoning, onSaved }: AIScorePanelProps) => {
  const { toast } = useToast();
  const [score, setScore] = useState(currentScore?.toString() ?? '');
  const [reasoning, setReasoning] = useState(currentReasoning ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const numScore = parseInt(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      toast({ title: 'Score inválido', description: 'Digite um número de 0 a 100', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('properties')
        .update({
          ai_score: numScore,
          ai_reasoning: reasoning.trim() || null,
        } as any)
        .eq('id', propertyId);
      if (error) throw error;
      toast({ title: 'AI Score salvo', description: `Score: ${numScore}/100` });
      onSaved();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`border rounded-lg p-3 space-y-3 ${scoreBg(currentScore)}`}>
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-purple-600" />
        <p className="text-sm font-bold text-purple-800">AI Score</p>
        {currentScore != null && (
          <span className={`text-sm font-bold ${scoreColor(currentScore)}`}>{currentScore}/100</span>
        )}
      </div>

      {currentReasoning && (
        <p className="text-[11px] italic text-muted-foreground">{currentReasoning}</p>
      )}

      <div className="flex items-end gap-2">
        <div className="w-24">
          <Label className="text-xs">Score (0-100)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="h-9 text-sm bg-white"
            placeholder="0-100"
          />
        </div>
        <div className="flex-1">
          <Label className="text-xs">Reasoning</Label>
          <Textarea
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            rows={1}
            className="text-xs bg-white min-h-[36px]"
            placeholder="Score 78/100: Casa 1965 SFR, oferta 62%..."
          />
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm" className="h-9 bg-purple-600 hover:bg-purple-700 text-white">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
};

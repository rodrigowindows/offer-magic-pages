import { useState, useEffect } from 'react';
import { Brain, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIScoreInputProps {
  propertyId: string;
  currentScore: number | null;
  currentReasoning: string | null;
  onSaved?: () => void;
}

export const AIScoreInput = ({ propertyId, currentScore, currentReasoning, onSaved }: AIScoreInputProps) => {
  const [score, setScore] = useState(currentScore != null ? String(currentScore) : '');
  const [reasoning, setReasoning] = useState(currentReasoning || '');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setScore(currentScore != null ? String(currentScore) : '');
    setReasoning(currentReasoning || '');
  }, [propertyId, currentScore, currentReasoning]);

  const handleSave = async () => {
    const numScore = parseInt(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      toast({ title: 'Score inválido', description: 'Digite um valor entre 0 e 100.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('properties')
        .update({ ai_score: numScore, ai_reasoning: reasoning.trim() || null })
        .eq('id', propertyId);
      if (error) throw error;
      toast({ title: 'AI Score salvo!', description: `Score: ${numScore}/100` });
      onSaved?.();
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const scoreColor = currentScore != null
    ? currentScore >= 70 ? 'text-emerald-600' : currentScore >= 50 ? 'text-amber-600' : currentScore >= 30 ? 'text-orange-600' : 'text-red-600'
    : 'text-muted-foreground';

  return (
    <div className="border rounded-lg p-3 bg-muted/10 space-y-2">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <label className="text-sm font-semibold">AI Score</label>
        {currentScore != null && (
          <span className={`text-sm font-bold ${scoreColor}`}>{currentScore}/100</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          max={100}
          value={score}
          onChange={(e) => setScore(e.target.value)}
          className="w-24 h-8 text-sm"
          placeholder="0-100"
        />
        <Button
          size="sm"
          className="gap-1.5 text-xs"
          onClick={handleSave}
          disabled={saving || !score}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Salvar
        </Button>
      </div>
      <Textarea
        value={reasoning}
        onChange={(e) => setReasoning(e.target.value)}
        className="text-xs min-h-[50px]"
        placeholder="Ex: Score 78/100: Casa 1965 SFR, oferta 62%, Lead Score 245..."
      />
    </div>
  );
};

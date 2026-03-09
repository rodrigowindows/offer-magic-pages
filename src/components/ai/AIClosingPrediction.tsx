/**
 * AI Closing Prediction - Shows closing probability for leads
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Loader2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Prediction {
  property_id: string;
  closing_probability: number;
  confidence: string;
  key_factors: string[];
  estimated_timeline_days: number;
  risk_level: string;
  recommendation: string;
}

const riskIcons: Record<string, React.ReactNode> = {
  low: <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />,
  medium: <Clock className="h-3.5 w-3.5 text-yellow-600" />,
  high: <AlertTriangle className="h-3.5 w-3.5 text-red-600" />,
};

interface AIClosingPredictionProps {
  propertyIds: string[];
  trigger?: React.ReactNode;
}

export const AIClosingPrediction = ({ propertyIds, trigger }: AIClosingPredictionProps) => {
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const generate = async () => {
    if (propertyIds.length === 0) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-closing-prediction', {
        body: { propertyIds },
      });
      if (error) throw error;
      if (data?.error) { toast({ title: 'Erro', description: data.error, variant: 'destructive' }); return; }
      setPredictions(data?.predictions || []);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getProbColor = (prob: number) => {
    if (prob >= 70) return 'text-green-700';
    if (prob >= 40) return 'text-yellow-700';
    return 'text-red-700';
  };

  const getProgressColor = (prob: number) => {
    if (prob >= 70) return '[&>div]:bg-green-500';
    if (prob >= 40) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-red-500';
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && predictions.length === 0) generate(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
            <TrendingUp className="h-3.5 w-3.5" />
            Previsão IA
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            Previsão de Fechamento IA
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm text-muted-foreground">Analisando {propertyIds.length} lead(s)...</p>
            </div>
          ) : predictions.length > 0 ? (
            <div className="space-y-3">
              {predictions.sort((a, b) => b.closing_probability - a.closing_probability).map((pred, i) => (
                <div key={i} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${getProbColor(pred.closing_probability)}`}>
                      {pred.closing_probability}%
                    </span>
                    <div className="flex items-center gap-2">
                      {riskIcons[pred.risk_level]}
                      <Badge variant="outline" className="text-[10px]">
                        {pred.confidence === 'high' ? 'Alta confiança' : pred.confidence === 'medium' ? 'Média confiança' : 'Baixa confiança'}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={pred.closing_probability} className={`h-2 ${getProgressColor(pred.closing_probability)}`} />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {pred.key_factors?.map((f, j) => (
                      <Badge key={j} variant="secondary" className="text-[9px]">{f}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>📅 ~{pred.estimated_timeline_days} dias</span>
                  </div>
                  <p className="text-xs text-foreground bg-muted/50 rounded p-2">💡 {pred.recommendation}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma previsão gerada.</div>
          )}
        </ScrollArea>
        {predictions.length > 0 && (
          <Button variant="outline" size="sm" onClick={generate} disabled={loading} className="w-full gap-2">
            <TrendingUp className="h-3.5 w-3.5" /> Regenerar
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

/**
 * AI Visual Property Analysis - Analyze property images for distress signals
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Eye, Loader2, AlertTriangle, CheckCircle2, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VisualAnalysis {
  condition_score: number;
  condition_category: string;
  distress_signals: string[];
  positive_features: string[];
  estimated_repair_cost_low: number;
  estimated_repair_cost_high: number;
  appears_vacant: boolean;
  curb_appeal: number;
  investment_notes: string;
  roof_condition: string;
  exterior_condition: string;
  landscaping_condition: string;
}

interface AIVisualAnalysisProps {
  imageUrl?: string;
  address?: string;
  propertyData?: Record<string, any>;
  trigger?: React.ReactNode;
}

const conditionColors: Record<string, string> = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  fair: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-orange-100 text-orange-800',
  distressed: 'bg-red-100 text-red-800',
};

export const AIVisualAnalysis = ({ imageUrl, address, propertyData, trigger }: AIVisualAnalysisProps) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<VisualAnalysis | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const analyze = async () => {
    if (!imageUrl) {
      toast({ title: 'Sem imagem', description: 'Esta propriedade não tem foto para análise.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-visual-analysis', {
        body: { imageUrl, address, propertyData },
      });
      if (error) throw error;
      if (data?.error) { toast({ title: 'Erro', description: data.error, variant: 'destructive' }); return; }
      setAnalysis(data?.analysis || null);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && !analysis) analyze(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7 border-amber-300 text-amber-700 hover:bg-amber-50" disabled={!imageUrl}>
            <Eye className="h-3 w-3" />
            Análise Visual IA
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-amber-600" />
            Análise Visual IA
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          {loading ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              <p className="text-sm text-muted-foreground">Analisando imagem...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-4">
              {imageUrl && <img src={imageUrl} alt="Property" className="w-full h-40 object-cover rounded-lg" />}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  <span className="text-2xl font-bold">{analysis.condition_score}/10</span>
                </div>
                <Badge className={conditionColors[analysis.condition_category] || 'bg-muted'}>
                  {analysis.condition_category}
                </Badge>
              </div>
              <Progress value={analysis.condition_score * 10} className="h-2" />

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="border rounded-lg p-2">
                  <p className="text-[10px] text-muted-foreground">Telhado</p>
                  <p className="text-xs font-medium">{analysis.roof_condition}</p>
                </div>
                <div className="border rounded-lg p-2">
                  <p className="text-[10px] text-muted-foreground">Exterior</p>
                  <p className="text-xs font-medium">{analysis.exterior_condition}</p>
                </div>
                <div className="border rounded-lg p-2">
                  <p className="text-[10px] text-muted-foreground">Jardim</p>
                  <p className="text-xs font-medium">{analysis.landscaping_condition}</p>
                </div>
              </div>

              {analysis.appears_vacant && (
                <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-xs text-orange-800 font-medium">Propriedade aparenta estar vaga</span>
                </div>
              )}

              {analysis.distress_signals?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-700 mb-1">⚠️ Sinais de Distress:</p>
                  <div className="flex flex-wrap gap-1">
                    {analysis.distress_signals.map((s, i) => (
                      <Badge key={i} variant="destructive" className="text-[9px]">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {analysis.positive_features?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-700 mb-1">✅ Pontos Positivos:</p>
                  <div className="flex flex-wrap gap-1">
                    {analysis.positive_features.map((f, i) => (
                      <Badge key={i} className="text-[9px] bg-green-100 text-green-800">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-semibold mb-1">💰 Custo Estimado de Reparo:</p>
                <p className="text-sm font-bold">
                  ${analysis.estimated_repair_cost_low?.toLocaleString()} - ${analysis.estimated_repair_cost_high?.toLocaleString()}
                </p>
              </div>

              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <p className="text-xs font-semibold text-amber-800 mb-1">📝 Notas para Investidor:</p>
                <p className="text-xs">{analysis.investment_notes}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Curb Appeal:</span>
                <Progress value={analysis.curb_appeal * 10} className="h-1.5 flex-1" />
                <span className="text-xs font-medium">{analysis.curb_appeal}/10</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {imageUrl ? 'Clique para analisar.' : 'Nenhuma imagem disponível.'}
            </div>
          )}
        </ScrollArea>
        {analysis && (
          <Button variant="outline" size="sm" onClick={analyze} disabled={loading} className="w-full gap-2">
            <Eye className="h-3.5 w-3.5" /> Reanalisar
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

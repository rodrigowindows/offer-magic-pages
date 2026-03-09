/**
 * AI Sentiment Analysis - Analyze lead response sentiment
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Loader2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SentimentResult {
  index: number;
  sentiment: string;
  score: number;
  key_signals: string[];
  suggested_response: string;
  priority: string;
}

const sentimentEmojis: Record<string, string> = {
  positive: '😊',
  negative: '😠',
  neutral: '😐',
  interested: '🤩',
  urgent: '🚨',
};

const sentimentColors: Record<string, string> = {
  positive: 'bg-green-100 text-green-800',
  negative: 'bg-red-100 text-red-800',
  neutral: 'bg-gray-100 text-gray-800',
  interested: 'bg-blue-100 text-blue-800',
  urgent: 'bg-orange-100 text-orange-800',
};

interface AISentimentAnalysisProps {
  trigger?: React.ReactNode;
}

export const AISentimentAnalysis = ({ trigger }: AISentimentAnalysisProps) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SentimentResult[]>([]);
  const [inputText, setInputText] = useState('');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const analyze = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const texts = inputText.split('\n').filter(t => t.trim()).map((text, i) => ({ text: text.trim(), from: `Lead ${i + 1}` }));
      const { data, error } = await supabase.functions.invoke('ai-sentiment-analysis', {
        body: { texts },
      });
      if (error) throw error;
      if (data?.error) { toast({ title: 'Erro', description: data.error, variant: 'destructive' }); return; }
      setResults(data?.analysis || []);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 border-pink-300 text-pink-700 hover:bg-pink-50">
            <Heart className="h-3.5 w-3.5" />
            Sentimento IA
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-600" />
            Análise de Sentimento IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Cole as respostas dos leads (uma por linha):</p>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={"Não tenho interesse, obrigado\nQuanto vocês estão oferecendo?\nPreciso vender rápido, me ligue"}
              rows={4}
              className="text-sm"
            />
          </div>
          <Button onClick={analyze} disabled={loading || !inputText.trim()} className="w-full gap-2 bg-pink-600 hover:bg-pink-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? 'Analisando...' : 'Analisar Sentimento'}
          </Button>
        </div>

        <ScrollArea className="max-h-[40vh]">
          {results.length > 0 && (
            <div className="space-y-3 mt-2">
              {results.map((r, i) => (
                <div key={i} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={`${sentimentColors[r.sentiment] || 'bg-gray-100'}`}>
                      {sentimentEmojis[r.sentiment] || '❓'} {r.sentiment}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <div className={`h-2 w-16 rounded-full bg-muted overflow-hidden`}>
                        <div
                          className={`h-full rounded-full ${r.score > 0 ? 'bg-green-500' : r.score < 0 ? 'bg-red-500' : 'bg-gray-400'}`}
                          style={{ width: `${Math.abs(r.score) * 100}%`, marginLeft: r.score < 0 ? `${(1 - Math.abs(r.score)) * 100}%` : 0 }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{(r.score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.key_signals?.map((s, j) => (
                      <Badge key={j} variant="outline" className="text-[9px]">{s}</Badge>
                    ))}
                  </div>
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Resposta sugerida:</p>
                    <p className="text-xs italic">"{r.suggested_response}"</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

/**
 * AI Conversation Summary - Summarize all interactions with a lead
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageSquareText, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConversationSummary {
  summary: string;
  key_info_extracted: {
    motivation?: string;
    timeline?: string;
    objections?: string;
    budget?: string;
    decision_makers?: string;
    urgency_level?: string;
  };
  sentiment_trend: string;
  total_interactions: number;
  last_interaction_date: string;
  hot_topics: string[];
  next_best_action: string;
  risk_factors: string[];
}

const trendIcons: Record<string, React.ReactNode> = {
  improving: <TrendingUp className="h-4 w-4 text-green-600" />,
  declining: <TrendingDown className="h-4 w-4 text-red-600" />,
  stable: <Minus className="h-4 w-4 text-yellow-600" />,
  unknown: <Minus className="h-4 w-4 text-muted-foreground" />,
};

interface AIConversationSummaryProps {
  propertyId: string;
  trigger?: React.ReactNode;
}

export const AIConversationSummary = ({ propertyId, trigger }: AIConversationSummaryProps) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ConversationSummary | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const generate = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('ai-conversation-summary', {
        body: { propertyId },
      });
      if (error) throw error;
      if (result?.error) { toast({ title: 'Erro', description: result.error, variant: 'destructive' }); return; }
      setData(result?.conversationSummary || null);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && !data) generate(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7 border-cyan-300 text-cyan-700 hover:bg-cyan-50">
            <MessageSquareText className="h-3 w-3" />
            Resumo Conversa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareText className="h-5 w-5 text-cyan-600" />
            Resumo de Conversas IA
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh]">
          {loading ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
              <p className="text-sm text-muted-foreground">Analisando conversas...</p>
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {trendIcons[data.sentiment_trend]}
                  <span className="text-sm font-medium capitalize">Sentimento: {data.sentiment_trend}</span>
                </div>
                <Badge variant="outline">{data.total_interactions} interações</Badge>
              </div>

              <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-200">
                <p className="text-sm">{data.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {data.key_info_extracted?.motivation && (
                  <div className="border rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground font-semibold">Motivação</p>
                    <p className="text-xs">{data.key_info_extracted.motivation}</p>
                  </div>
                )}
                {data.key_info_extracted?.timeline && (
                  <div className="border rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground font-semibold">Timeline</p>
                    <p className="text-xs">{data.key_info_extracted.timeline}</p>
                  </div>
                )}
                {data.key_info_extracted?.objections && (
                  <div className="border rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground font-semibold">Objeções</p>
                    <p className="text-xs">{data.key_info_extracted.objections}</p>
                  </div>
                )}
                {data.key_info_extracted?.urgency_level && (
                  <div className="border rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground font-semibold">Urgência</p>
                    <p className="text-xs">{data.key_info_extracted.urgency_level}</p>
                  </div>
                )}
              </div>

              {data.hot_topics?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-1">🔥 Tópicos Principais:</p>
                  <div className="flex flex-wrap gap-1">
                    {data.hot_topics.map((t, i) => (
                      <Badge key={i} variant="secondary" className="text-[9px]">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {data.risk_factors?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-700 mb-1">⚠️ Riscos:</p>
                  <div className="flex flex-wrap gap-1">
                    {data.risk_factors.map((r, i) => (
                      <Badge key={i} variant="destructive" className="text-[9px]">{r}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-semibold mb-1">💡 Próxima Ação Recomendada:</p>
                <p className="text-sm">{data.next_best_action}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">Nenhum dado para resumir.</div>
          )}
        </ScrollArea>
        {data && (
          <Button variant="outline" size="sm" onClick={generate} disabled={loading} className="w-full gap-2">
            <MessageSquareText className="h-3.5 w-3.5" /> Regenerar
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

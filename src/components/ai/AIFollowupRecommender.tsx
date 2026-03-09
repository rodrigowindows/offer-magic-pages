/**
 * AI Follow-up Recommender - Suggests next best action for leads
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2, Mail, MessageSquare, Phone, FileText, Calendar, DollarSign, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Recommendation {
  property_id: string;
  recommended_action: string;
  urgency: string;
  reason: string;
  suggested_message?: string;
  days_to_wait: number;
}

const actionIcons: Record<string, React.ReactNode> = {
  sms: <MessageSquare className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  call: <Phone className="h-3.5 w-3.5" />,
  letter: <FileText className="h-3.5 w-3.5" />,
  meeting: <Calendar className="h-3.5 w-3.5" />,
  adjust_offer: <DollarSign className="h-3.5 w-3.5" />,
  wait: <Clock className="h-3.5 w-3.5" />,
};

const urgencyColors: Record<string, string> = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

interface AIFollowupRecommenderProps {
  propertyIds: string[];
  trigger?: React.ReactNode;
}

export const AIFollowupRecommender = ({ propertyIds, trigger }: AIFollowupRecommenderProps) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const generate = async () => {
    if (propertyIds.length === 0) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-followup-recommender', {
        body: { propertyIds },
      });
      if (error) throw error;
      if (data?.error) { toast({ title: 'Erro', description: data.error, variant: 'destructive' }); return; }
      setRecommendations(data?.recommendations || []);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && recommendations.length === 0) generate(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 border-blue-300 text-blue-700 hover:bg-blue-50">
            <ArrowRight className="h-3.5 w-3.5" />
            Follow-up IA
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-blue-600" />
            Recomendações de Follow-up IA
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-muted-foreground">Analisando {propertyIds.length} lead(s)...</p>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {actionIcons[rec.recommended_action] || <ArrowRight className="h-3.5 w-3.5" />}
                      <span className="text-sm font-medium capitalize">{rec.recommended_action.replace('_', ' ')}</span>
                    </div>
                    <Badge className={`text-[10px] ${urgencyColors[rec.urgency] || ''}`}>
                      {rec.urgency === 'high' ? '🔴 Alta' : rec.urgency === 'medium' ? '🟡 Média' : '🟢 Baixa'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{rec.reason}</p>
                  {rec.suggested_message && (
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-[10px] font-semibold text-muted-foreground mb-1">Mensagem sugerida:</p>
                      <p className="text-xs italic">"{rec.suggested_message}"</p>
                    </div>
                  )}
                  {rec.days_to_wait > 0 && (
                    <p className="text-[10px] text-muted-foreground">⏰ Aguardar {rec.days_to_wait} dia(s)</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma recomendação gerada.</div>
          )}
        </ScrollArea>
        {recommendations.length > 0 && (
          <Button variant="outline" size="sm" onClick={generate} disabled={loading} className="w-full gap-2">
            <ArrowRight className="h-3.5 w-3.5" /> Regenerar
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

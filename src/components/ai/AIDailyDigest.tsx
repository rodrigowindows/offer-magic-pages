/**
 * AI Daily Digest - Dashboard widget with AI-generated daily insights
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, RefreshCw, AlertCircle, Lightbulb, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DigestData {
  greeting: string;
  urgent_actions: Array<{ icon: string; text: string; priority: string }>;
  pipeline_summary: string;
  cooling_leads_alert: {
    count: number;
    top_3: Array<{ address: string; days_without_contact: number; suggested_action: string }>;
  };
  campaign_insights: {
    best_channel: string;
    worst_channel: string;
    overall_engagement_rate: string;
    tip: string;
  };
  opportunities: Array<{ text: string; potential_value: string }>;
  daily_tip: string;
}

export const AIDailyDigest = () => {
  const [loading, setLoading] = useState(false);
  const [digest, setDigest] = useState<DigestData | null>(null);
  const { toast } = useToast();

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-daily-digest', { body: {} });
      if (error) throw error;
      if (data?.error) { toast({ title: 'Erro', description: data.error, variant: 'destructive' }); return; }
      setDigest(data?.digest || null);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!digest && !loading) {
    return (
      <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50">
        <CardContent className="p-4 flex flex-col items-center gap-3">
          <Sparkles className="h-8 w-8 text-violet-500" />
          <p className="text-sm text-center text-muted-foreground">Gere insights diários do seu pipeline com IA</p>
          <Button onClick={generate} className="gap-2 bg-violet-600 hover:bg-violet-700">
            <Sparkles className="h-4 w-4" />
            Gerar Daily Digest IA
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-violet-200">
        <CardContent className="p-8 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="text-sm text-muted-foreground">Analisando seu pipeline...</p>
        </CardContent>
      </Card>
    );
  }

  if (!digest) return null;

  return (
    <Card className="border-violet-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            Daily Digest IA
          </div>
          <Button variant="ghost" size="sm" onClick={generate} disabled={loading} className="h-7 w-7 p-0">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{digest.greeting}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Urgent Actions */}
        {digest.urgent_actions?.length > 0 && (
          <div>
            <p className="text-xs font-semibold flex items-center gap-1 mb-2">
              <AlertCircle className="h-3.5 w-3.5 text-red-500" /> Ações Urgentes
            </p>
            <div className="space-y-1.5">
              {digest.urgent_actions.map((a, i) => (
                <div key={i} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${a.priority === 'high' ? 'bg-red-50 border border-red-100' : 'bg-yellow-50 border border-yellow-100'}`}>
                  <span>{a.icon}</span>
                  <span>{a.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pipeline Summary */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs font-semibold mb-1 flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-blue-500" /> Pipeline
          </p>
          <p className="text-xs">{digest.pipeline_summary}</p>
        </div>

        {/* Cooling Leads */}
        {digest.cooling_leads_alert?.count > 0 && (
          <div>
            <p className="text-xs font-semibold text-orange-700 mb-1">
              🥶 {digest.cooling_leads_alert.count} leads esfriando
            </p>
            <div className="space-y-1">
              {digest.cooling_leads_alert.top_3?.map((l, i) => (
                <div key={i} className="text-[10px] bg-orange-50 rounded p-1.5 border border-orange-100">
                  <span className="font-medium">{l.address}</span>
                  <span className="text-orange-600 ml-1">({l.days_without_contact}d sem contato)</span>
                  <p className="text-orange-700 mt-0.5">→ {l.suggested_action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Campaign Insights */}
        {digest.campaign_insights && (
          <div className="grid grid-cols-2 gap-2">
            <div className="border rounded-lg p-2 text-center">
              <p className="text-[9px] text-muted-foreground">Melhor Canal</p>
              <p className="text-xs font-bold text-green-700">{digest.campaign_insights.best_channel}</p>
            </div>
            <div className="border rounded-lg p-2 text-center">
              <p className="text-[9px] text-muted-foreground">Engajamento</p>
              <p className="text-xs font-bold">{digest.campaign_insights.overall_engagement_rate}</p>
            </div>
          </div>
        )}

        {/* Opportunities */}
        {digest.opportunities?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-green-700 mb-1">💎 Oportunidades</p>
            {digest.opportunities.map((o, i) => (
              <div key={i} className="text-xs bg-green-50 rounded p-2 border border-green-100 mb-1">
                {o.text}
              </div>
            ))}
          </div>
        )}

        {/* Daily Tip */}
        <div className="bg-violet-50 rounded-lg p-3 border border-violet-200">
          <p className="text-xs flex items-center gap-1">
            <Lightbulb className="h-3.5 w-3.5 text-violet-600" />
            <span className="font-semibold text-violet-800">Dica do Dia:</span>
          </p>
          <p className="text-xs mt-1">{digest.daily_tip}</p>
        </div>
      </CardContent>
    </Card>
  );
};

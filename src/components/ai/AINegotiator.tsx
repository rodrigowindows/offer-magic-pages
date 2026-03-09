import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { handleAIResponseError, withAILoading } from "@/lib/aiErrorHandler";
import { Swords, Shield, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface NegotiationResult {
  counter_offer: number;
  counter_offer_rationale: string;
  opening_script: string;
  objection_handlers: { objection: string; response: string }[];
  leverage_points: string[];
  risk_level: "low" | "medium" | "high";
  recommended_strategy: "aggressive" | "balanced" | "conservative";
  walkaway_price: number;
  tips: string[];
}

interface Props {
  property: Record<string, any>;
}

export const AINegotiator = ({ property }: Props) => {
  const [result, setResult] = useState<NegotiationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const analyze = async () => {
    const data = await withAILoading(setLoading, "AI Negotiator", toast, async () => {
      const { data, error } = await supabase.functions.invoke("ai-negotiator", {
        body: { property },
      });
      if (error) throw error;
      if (handleAIResponseError(data?.error, { toast, context: "AI Negotiator" })) return null;
      return data as NegotiationResult;
    });
    if (data) {
      setResult(data);
      setExpanded(true);
    }
  };

  const riskColor = (r: string) => r === "low" ? "text-green-600" : r === "medium" ? "text-yellow-600" : "text-red-600";
  const strategyIcon = (s: string) => s === "aggressive" ? <Swords className="h-4 w-4" /> : s === "conservative" ? <Shield className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />;

  if (!result) {
    return (
      <Button variant="outline" size="sm" onClick={analyze} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
        AI Negotiator
      </Button>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-primary" />
            AI Negotiation Strategy
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={riskColor(result.risk_level)}>
              {result.risk_level} risk
            </Badge>
            <Badge variant="secondary" className="gap-1">
              {strategyIcon(result.recommended_strategy)}
              {result.recommended_strategy}
            </Badge>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardTitle>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Counter Offer</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">${result.counter_offer.toLocaleString()}</p>
              <p className="text-xs mt-1">{result.counter_offer_rationale}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Walk-away Price</p>
              <p className="text-lg font-bold text-red-700 dark:text-red-400">${result.walkaway_price.toLocaleString()}</p>
            </div>
          </div>

          <div>
            <p className="font-semibold mb-1">📞 Opening Script</p>
            <p className="bg-muted p-3 rounded-lg italic">"{result.opening_script}"</p>
          </div>

          <div>
            <p className="font-semibold mb-2">🛡️ Objection Handlers</p>
            <div className="space-y-2">
              {result.objection_handlers.map((oh, i) => (
                <div key={i} className="border rounded-lg p-2">
                  <p className="text-xs font-semibold text-destructive">❌ "{oh.objection}"</p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">✅ {oh.response}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold mb-1">💪 Leverage Points</p>
            <ul className="list-disc pl-4 space-y-1">
              {result.leverage_points.map((lp, i) => <li key={i}>{lp}</li>)}
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-1">💡 Tips</p>
            <ul className="list-disc pl-4 space-y-1">
              {result.tips.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>

          <Button variant="outline" size="sm" onClick={analyze} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Regenerate Strategy
          </Button>
        </CardContent>
      )}
    </Card>
  );
};

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { handleAIResponseError, withAILoading } from "@/lib/aiErrorHandler";
import { BarChart3, Trophy, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface DealRanking {
  address: string;
  rank: number;
  roi_estimate_pct: number;
  risk_score: number;
  deal_grade: "A" | "B" | "C" | "D";
  strengths: string[];
  weaknesses: string[];
}

interface ComparisonResult {
  ranking: DealRanking[];
  best_deal: string;
  best_deal_reason: string;
  overall_analysis: string;
  recommendation: string;
}

interface Props {
  properties: Record<string, any>[];
}

const gradeColor: Record<string, string> = {
  A: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  B: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  C: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  D: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export const AIDealComparator = ({ properties }: Props) => {
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const compare = async () => {
    if (properties.length < 2) {
      toast({ title: "Mínimo 2 propriedades", description: "Selecione pelo menos 2 propriedades para comparar.", variant: "destructive" });
      return;
    }
    const data = await withAILoading(setLoading, "AI Comparator", toast, async () => {
      const { data, error } = await supabase.functions.invoke("ai-deal-comparator", {
        body: { properties },
      });
      if (error) throw error;
      if (handleAIResponseError(data?.error, { toast, context: "AI Comparator" })) return null;
      return data as ComparisonResult;
    });
    if (data) {
      setResult(data);
      setExpanded(true);
    }
  };

  if (!result) {
    return (
      <Button variant="outline" size="sm" onClick={compare} disabled={loading || properties.length < 2} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
        AI Compare ({properties.length})
      </Button>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            AI Deal Comparison
          </span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CardTitle>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4 text-sm">
          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg flex items-start gap-2">
            <Trophy className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-bold text-green-700 dark:text-green-400">🏆 {result.best_deal}</p>
              <p className="text-xs">{result.best_deal_reason}</p>
            </div>
          </div>

          <div className="space-y-3">
            {result.ranking.sort((a, b) => a.rank - b.rank).map((deal) => (
              <div key={deal.address} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">#{deal.rank} {deal.address}</span>
                  <div className="flex items-center gap-2">
                    <Badge className={gradeColor[deal.deal_grade]}>{deal.deal_grade}</Badge>
                    <Badge variant="outline">{deal.roi_estimate_pct}% ROI</Badge>
                    <Badge variant="outline" className={deal.risk_score > 6 ? "text-red-600" : deal.risk_score > 3 ? "text-yellow-600" : "text-green-600"}>
                      Risk: {deal.risk_score}/10
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-green-600 font-semibold">Strengths:</p>
                    <ul className="list-disc pl-3">{deal.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-red-600 font-semibold">Weaknesses:</p>
                    <ul className="list-disc pl-3">{deal.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-muted/30 p-3 rounded-lg space-y-2">
            <p className="text-xs">{result.overall_analysis}</p>
            <p className="text-xs font-semibold">📋 {result.recommendation}</p>
          </div>

          <Button variant="outline" size="sm" onClick={compare} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Re-compare
          </Button>
        </CardContent>
      )}
    </Card>
  );
};

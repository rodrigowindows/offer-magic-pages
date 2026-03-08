/**
 * AI Valuation Panel - Shows AI analysis of comps for a property
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2, TrendingUp, DollarSign, Target } from 'lucide-react';
import { useAIValuation, type AIValuationResult } from '@/hooks/useAIValuation';
import { formatCurrency } from '@/lib/utils';

interface AIValuationPanelProps {
  property: Record<string, any>;
  comps: Array<{ comp_data?: any; url?: string; notes?: string }>;
}

export const AIValuationPanel = ({ property, comps }: AIValuationPanelProps) => {
  const { analyzeComps, loading, result } = useAIValuation();

  const handleAnalyze = async () => {
    const mappedComps = comps.map(c => ({
      sale_price: c.comp_data?.sale_price,
      square_feet: c.comp_data?.square_feet,
      address: c.comp_data?.address || c.url,
      notes: c.notes,
    }));
    await analyzeComps(property, mappedComps);
  };

  const confidenceColor = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-amber-100 text-amber-800',
    low: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleAnalyze}
        disabled={loading || comps.length === 0}
        className="w-full gap-2 text-xs h-8 border-violet-300 text-violet-700 hover:bg-violet-50"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
        {loading ? 'Analisando comps...' : `Avaliação IA (${comps.length} comps)`}
      </Button>

      {result && (
        <Card className="border-violet-200 bg-violet-50/50">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-violet-800 flex items-center gap-1">
                <Brain className="h-3.5 w-3.5" /> Avaliação IA
              </span>
              <Badge className={`text-[10px] ${confidenceColor[result.confidence]}`}>
                {result.confidence === 'high' ? 'Alta' : result.confidence === 'medium' ? 'Média' : 'Baixa'} confiança
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-1.5 bg-white rounded border">
                <TrendingUp className="h-3 w-3 mx-auto text-green-600 mb-0.5" />
                <p className="text-[10px] text-muted-foreground">ARV Sugerido</p>
                <p className="text-xs font-bold text-green-700">{formatCurrency(result.suggested_arv)}</p>
              </div>
              <div className="text-center p-1.5 bg-white rounded border">
                <DollarSign className="h-3 w-3 mx-auto text-blue-600 mb-0.5" />
                <p className="text-[10px] text-muted-foreground">$/Sqft</p>
                <p className="text-xs font-bold text-blue-700">${result.suggested_price_per_sqft}</p>
              </div>
              <div className="text-center p-1.5 bg-white rounded border">
                <Target className="h-3 w-3 mx-auto text-amber-600 mb-0.5" />
                <p className="text-[10px] text-muted-foreground">Oferta</p>
                <p className="text-[10px] font-bold text-amber-700">
                  {formatCurrency(result.suggested_offer_range_min)} - {formatCurrency(result.suggested_offer_range_max)}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-violet-800 leading-relaxed">{result.analysis}</p>
            {result.adjustments && (
              <p className="text-[10px] text-violet-600 italic">💡 {result.adjustments}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

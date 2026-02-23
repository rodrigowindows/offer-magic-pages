import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, ExternalLink, RefreshCw, DollarSign, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  analyzePropertyWithAI,
  generateZillowUrls,
  savePropertyAnalysis,
  PropertyAnalysisResult,
} from "@/utils/aiPropertyAnalyzer";

interface PropertyComparisonProps {
  propertyId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  estimatedValue: number;
  cashOfferAmount: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  yearBuilt?: number;
  onClose: () => void;
}

export const PropertyComparison = ({
  propertyId,
  address,
  city,
  state,
  zipCode,
  estimatedValue,
  cashOfferAmount,
  propertyType,
  bedrooms,
  bathrooms,
  squareFeet,
  yearBuilt,
  onClose,
}: PropertyComparisonProps) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PropertyAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzePropertyWithAI(
        address,
        city,
        state,
        zipCode,
        estimatedValue,
        cashOfferAmount,
        propertyType,
        bedrooms,
        bathrooms,
        squareFeet,
        yearBuilt
      );

      setAnalysis(result);

      // Save to database
      await savePropertyAnalysis(propertyId, result);

      toast({
        title: "Análise Completa",
        description: "Análise de comparativo gerada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao analisar propriedade",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const zillowUrls = generateZillowUrls(address, city, state, zipCode);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análise Comparativa - AI Powered
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property Info */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Propriedade</h3>
            <p className="text-sm text-muted-foreground">{address}</p>
            <p className="text-sm text-muted-foreground">
              {city}, {state} {zipCode}
            </p>
            {propertyType && (
              <p className="text-sm text-muted-foreground mt-1">
                Tipo: {propertyType} {bedrooms && `• ${bedrooms} quartos`}{" "}
                {bathrooms && `• ${bathrooms} banheiros`}
              </p>
            )}
          </div>

          {/* Current Values */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                Valor Estimado
              </div>
              <div className="text-2xl font-bold">${estimatedValue.toLocaleString()}</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                Oferta em Dinheiro
              </div>
              <div className="text-2xl font-bold text-green-600">
                ${cashOfferAmount.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {((cashOfferAmount / estimatedValue) * 100).toFixed(1)}% do valor estimado
              </div>
            </div>
          </div>

          {/* Analyze Button */}
          {!analysis && (
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analisando com AI...
                </>
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Gerar Análise Comparativa com AI
                </>
              )}
            </Button>
          )}

          {/* Analysis Results */}
          {analysis && (
            <>
              {/* Value Range */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Faixa de Valor Estimada</h3>
                  <Badge
                    variant={
                      analysis.confidence === "high"
                        ? "default"
                        : analysis.confidence === "medium"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    Confiança: {analysis.confidence === "high" ? "Alta" : analysis.confidence === "medium" ? "Média" : "Baixa"}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-red-50 rounded">
                    <div className="text-xs text-muted-foreground">Baixo</div>
                    <div className="text-lg font-bold">
                      ${analysis.estimatedValueRange.low.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-xs text-muted-foreground">Médio</div>
                    <div className="text-lg font-bold">
                      ${analysis.estimatedValueRange.mid.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-xs text-muted-foreground">Alto</div>
                    <div className="text-lg font-bold">
                      ${analysis.estimatedValueRange.high.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Market Condition */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Condição do Mercado</h3>
                <Badge
                  variant={
                    analysis.marketCondition === "hot"
                      ? "destructive"
                      : analysis.marketCondition === "normal"
                      ? "default"
                      : "secondary"
                  }
                  className="text-sm"
                >
                  {analysis.marketCondition === "hot"
                    ? "🔥 MERCADO QUENTE"
                    : analysis.marketCondition === "normal"
                    ? "📊 MERCADO NORMAL"
                    : "❄️ MERCADO FRIO"}
                </Badge>
              </div>

              {/* Recommendation */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold mb-2">Recomendação</h3>
                <p className="text-sm whitespace-pre-wrap">{analysis.recommendation}</p>
              </div>

              {/* AI Analysis */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Análise Detalhada (AI)</h3>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {analysis.aiAnalysis}
                </p>
              </div>

              {/* Comparable Insights */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Insights Comparativos</h3>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {analysis.comparableInsights}
                </p>
              </div>

              {/* Zillow Links */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold mb-2">Links do Zillow</h3>
                <div className="space-y-2">
                  <a
                    href={zillowUrls.searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Buscar no Zillow
                  </a>
                  <a
                    href={zillowUrls.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver Mapa da Região
                  </a>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Dica: Use o Zillow para verificar propriedades comparáveis na mesma região
                </p>
              </div>

              {/* Re-analyze Button */}
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                variant="outline"
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reanalisando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reanalisar
                  </>
                )}
              </Button>
            </>
          )}

          {/* Close Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

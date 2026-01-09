import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, Mail, Phone, CheckCircle, AlertCircle, Trophy, RefreshCw } from "lucide-react";
import type { ABVariant } from "@/utils/abTesting";

interface FunnelMetrics {
  variant: ABVariant;
  page_views: number;
  email_submits: number;
  offer_reveals: number;
  clicked_accept: number;
  clicked_interested: number;
  form_submits: number;
  phone_collected: number;
  email_conversion_rate: number;
  final_conversion_rate: number;
  phone_conversion_rate: number;
}

interface WinnerData {
  variant: ABVariant;
  visitors: number;
  conversions: number;
  conversion_rate: number;
  rank: number;
  confidence_level: 'statistically_significant' | 'trending' | 'insufficient_data';
}

export const ABTestAnalytics = () => {
  const [funnelData, setFunnelData] = useState<FunnelMetrics[]>([]);
  const [winnerData, setWinnerData] = useState<WinnerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load funnel data from ab_test_funnel view
      const { data: funnelData, error: funnelError } = await supabase
        .from('ab_test_funnel')
        .select('*');

      if (funnelError) {
        console.error('Error loading funnel data:', funnelError);
      } else {
        setFunnelData(funnelData || []);
      }

      // Load winner data by computing from funnel data
      if (funnelData && funnelData.length > 0) {
        const computedWinner: WinnerData[] = funnelData
          .map((f) => ({
            variant: f.variant as ABVariant,
            visitors: f.page_views,
            conversions: f.form_submits,
            conversion_rate: f.final_conversion_rate,
            rank: 0,
            confidence_level: (f.page_views >= 100 ? 'statistically_significant' : f.page_views >= 50 ? 'trending' : 'insufficient_data') as WinnerData['confidence_level'],
          }))
          .sort((a, b) => b.conversion_rate - a.conversion_rate)
          .map((w, i) => ({ ...w, rank: i + 1 }));

        setWinnerData(computedWinner);
      } else {
        setWinnerData([]);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading A/B test data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getConfidenceBadge = (level: WinnerData['confidence_level']) => {
    switch (level) {
      case 'statistically_significant':
        return <Badge className="bg-green-500">✓ Statistically Significant</Badge>;
      case 'trending':
        return <Badge className="bg-yellow-500">📈 Trending</Badge>;
      case 'insufficient_data':
        return <Badge variant="secondary">⏳ Insufficient Data</Badge>;
      default:
        return null;
    }
  };

  const getVariantLabel = (variant: ABVariant): string => {
    const labels: Record<ABVariant, string> = {
      'ultra-simple': 'Ultra Simple (No Gate)',
      'email-first': 'Email First (Gated)',
      'progressive': 'Progressive Disclosure',
      'social-proof': 'Social Proof',
      'urgency': 'Urgency/Scarcity',
    };
    return labels[variant] || variant;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading A/B test results...</p>
        </div>
      </div>
    );
  }

  const currentWinner = winnerData[0]; // Sorted by conversion_rate DESC

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">A/B Test Analytics</h2>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated?.toLocaleTimeString() || 'Never'}
          </p>
        </div>
        <Button onClick={loadDashboardData} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Current Winner Card */}
      {currentWinner && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Current Leader
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold">{getVariantLabel(currentWinner.variant)}</h3>
                {getConfidenceBadge(currentWinner.confidence_level)}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Visitors</div>
                  <div className="text-2xl font-bold">{currentWinner.visitors}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Conversions</div>
                  <div className="text-2xl font-bold text-green-600">{currentWinner.conversions}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Conversion Rate</div>
                  <div className="text-2xl font-bold text-primary">{currentWinner.conversion_rate}%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variant Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {winnerData.map((winner) => (
          <Card key={winner.variant} className={winner.rank === 1 ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{getVariantLabel(winner.variant)}</CardTitle>
                {winner.rank === 1 && <Badge variant="default">🏆 Winner</Badge>}
                {winner.rank === 2 && <Badge variant="secondary">🥈 2nd</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getConfidenceBadge(winner.confidence_level)}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-muted-foreground">Visitors:</span>
                    <span className="font-semibold">{winner.visitors}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">Conversions:</span>
                    <span className="font-semibold">{winner.conversions}</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{winner.conversion_rate}%</div>
                    <div className="text-xs text-muted-foreground">Conversion Rate</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funnel Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Funnel Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {funnelData.map((funnel) => (
              <div key={funnel.variant} className="space-y-3">
                <h4 className="font-semibold text-lg border-b pb-2">
                  {getVariantLabel(funnel.variant)}
                </h4>

                {/* Funnel Steps */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Users className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                    <div className="text-2xl font-bold">{funnel.page_views}</div>
                    <div className="text-xs text-muted-foreground">Page Views</div>
                  </div>

                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <Mail className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                    <div className="text-2xl font-bold">{funnel.email_submits}</div>
                    <div className="text-xs text-muted-foreground">Email Submits</div>
                    <div className="text-xs font-semibold text-purple-600 mt-1">
                      {funnel.email_conversion_rate}% rate
                    </div>
                  </div>

                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <Phone className="h-5 w-5 mx-auto mb-1 text-green-600" />
                    <div className="text-2xl font-bold">{funnel.phone_collected}</div>
                    <div className="text-xs text-muted-foreground">Phone Collected</div>
                    <div className="text-xs font-semibold text-green-600 mt-1">
                      {funnel.phone_conversion_rate}% rate
                    </div>
                  </div>

                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
                    <div className="text-2xl font-bold">{funnel.form_submits}</div>
                    <div className="text-xs text-muted-foreground">Form Submits</div>
                    <div className="text-xs font-semibold text-yellow-600 mt-1">
                      {funnel.final_conversion_rate}% rate
                    </div>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-3 gap-3 text-sm pt-2 border-t">
                  <div>
                    <span className="text-muted-foreground">Offers Revealed:</span>
                    <span className="font-semibold ml-2">{funnel.offer_reveals}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Clicked Accept:</span>
                    <span className="font-semibold ml-2">{funnel.clicked_accept}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Clicked Interested:</span>
                    <span className="font-semibold ml-2">{funnel.clicked_interested}</span>
                  </div>
                </div>
              </div>
            ))}

            {funnelData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No A/B test data available yet.</p>
                <p className="text-sm">Data will appear once visitors start interacting with property pages.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insights & Recommendations */}
      {winnerData.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {currentWinner.confidence_level === 'statistically_significant' && (
                <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-green-900">
                      {getVariantLabel(currentWinner.variant)} is the clear winner!
                    </div>
                    <div className="text-green-700">
                      With {currentWinner.visitors}+ visitors and {currentWinner.conversion_rate}% conversion,
                      this variant has statistically significant results. Consider making it the default.
                    </div>
                  </div>
                </div>
              )}

              {currentWinner.confidence_level === 'trending' && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-yellow-900">
                      {getVariantLabel(currentWinner.variant)} is trending positively
                    </div>
                    <div className="text-yellow-700">
                      Continue testing to reach statistical significance.
                      Need {100 - currentWinner.visitors} more visitors for conclusive results.
                    </div>
                  </div>
                </div>
              )}

              {currentWinner.confidence_level === 'insufficient_data' && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-blue-900">More data needed</div>
                    <div className="text-blue-700">
                      Not enough traffic yet to determine a winner.
                      Need at least {50 - currentWinner.visitors} more visitors per variant.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ABTestAnalytics;

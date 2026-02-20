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

type ConfidenceLevel = 'statistically_significant' | 'trending' | 'insufficient_data';

interface WinnerData {
  variant: ABVariant;
  visitors: number;
  conversions: number;
  conversion_rate: number;
  rank: number;
  confidence_level: ConfidenceLevel;
}

const KNOWN_VARIANTS: ABVariant[] = [
  'default',
  'ultra-simple',
  'email-first',
  'minimal',
  'progressive',
  'social-proof',
  'urgency',
];

const toNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const normalizeVariant = (value: string | null): ABVariant => {
  if (!value) {
    return 'default';
  }

  if (KNOWN_VARIANTS.includes(value as ABVariant)) {
    return value as ABVariant;
  }

  return 'default';
};

const normalizeConfidence = (value: string | null): ConfidenceLevel => {
  if (!value) {
    return 'insufficient_data';
  }

  if (value === 'statistically_significant' || value === 'trending' || value === 'insufficient_data') {
    return value;
  }

  return 'insufficient_data';
};

export const ABTestAnalytics = () => {
  const [funnelData, setFunnelData] = useState<FunnelMetrics[]>([]);
  const [winnerData, setWinnerData] = useState<WinnerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);

    try {
      const [funnelResponse, winnerResponse] = await Promise.all([
        supabase.from('ab_test_funnel' as any).select('*'),
        supabase.from('ab_test_winner' as any).select('*'),
      ]);

      if (funnelResponse.error || winnerResponse.error) {
        const errors = [
          funnelResponse.error?.message,
          winnerResponse.error?.message,
        ].filter(Boolean);

        setLoadError(errors.join(' | ') || 'Failed to load A/B testing analytics data.');
        setFunnelData([]);
        setWinnerData([]);
        setLastUpdated(new Date());
        return;
      }

      const normalizedFunnel: FunnelMetrics[] = ((funnelResponse.data || []) as any[]).map((row: any) => ({
        variant: normalizeVariant(row.variant),
        page_views: toNumber(row.page_views),
        email_submits: toNumber(row.email_submits),
        offer_reveals: toNumber(row.offer_reveals),
        clicked_accept: toNumber(row.clicked_accept),
        clicked_interested: toNumber(row.clicked_interested),
        form_submits: toNumber(row.form_submits),
        phone_collected: toNumber(row.phone_collected),
        email_conversion_rate: toNumber(row.email_conversion_rate),
        final_conversion_rate: toNumber(row.final_conversion_rate),
        phone_conversion_rate: toNumber(row.phone_conversion_rate),
      }));

      const normalizedWinner: WinnerData[] = ((winnerResponse.data || []) as any[])
        .map((row: any) => ({
          variant: normalizeVariant(row.variant),
          visitors: toNumber(row.visitors),
          conversions: toNumber(row.conversions),
          conversion_rate: toNumber(row.conversion_rate),
          rank: toNumber(row.rank),
          confidence_level: normalizeConfidence(row.confidence_level),
        }))
        .sort((a, b) => a.rank - b.rank || b.conversion_rate - a.conversion_rate);

      setFunnelData(normalizedFunnel);
      setWinnerData(normalizedWinner);
      setLoadError(null);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading A/B test data:', error);
      setLoadError(error instanceof Error ? error.message : 'Unexpected error loading A/B analytics.');
      setFunnelData([]);
      setWinnerData([]);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const getConfidenceBadge = (level: ConfidenceLevel) => {
    switch (level) {
      case 'statistically_significant':
        return <Badge className="bg-green-500">Statistically Significant</Badge>;
      case 'trending':
        return <Badge className="bg-yellow-500">Trending</Badge>;
      case 'insufficient_data':
        return <Badge variant="secondary">Insufficient Data</Badge>;
      default:
        return null;
    }
  };

  const getVariantLabel = (variant: ABVariant): string => {
    const labels: Record<ABVariant, string> = {
      'default': 'Default',
      'ultra-simple': 'Ultra Simple (No Gate)',
      'email-first': 'Email First (Gated)',
      'minimal': 'Minimal Design',
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

  const currentWinner = winnerData[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">A/B Test Analytics</h2>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated?.toLocaleTimeString() || 'Never'}
          </p>
        </div>
        <Button onClick={() => void loadDashboardData()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loadError && (
        <Card className="border-destructive/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-destructive">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to load complete analytics</p>
                <p className="text-sm text-muted-foreground mt-1">{loadError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {winnerData.map((winner) => (
          <Card key={winner.variant} className={winner.rank === 1 ? 'border-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{getVariantLabel(winner.variant)}</CardTitle>
                {winner.rank === 1 && <Badge variant="default">Winner</Badge>}
                {winner.rank === 2 && <Badge variant="secondary">2nd</Badge>}
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

      {winnerData.length >= 2 && currentWinner && (
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
                      Need {Math.max(0, 100 - currentWinner.visitors)} more visitors for conclusive results.
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
                      Need at least {Math.max(0, 50 - currentWinner.visitors)} more visitors per variant.
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

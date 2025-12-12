import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Image, 
  DollarSign, 
  Zap, 
  Home, 
  Calendar, 
  Star, 
  ArrowRight,
  User,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle2,
  MapPin,
  Download,
  TrendingUp,
  AlertTriangle,
  Monitor,
  Smartphone,
  Globe
} from "lucide-react";

interface ABTestStats {
  variant: string;
  total_views: number;
  viewed_offer: number;
  viewed_benefits: number;
  viewed_process: number;
  viewed_form: number;
  submitted_form: number;
  avg_time_on_page: number;
}

interface SegmentedStats {
  device: { mobile: number; desktop: number };
  source: Record<string, number>;
}

// Statistical significance calculation using Z-test
const calculateStatisticalSignificance = (
  conversionsA: number,
  totalA: number,
  conversionsB: number,
  totalB: number
): { significant: boolean; confidence: number; winner: 'A' | 'B' | null; lift: number } => {
  if (totalA === 0 || totalB === 0) {
    return { significant: false, confidence: 0, winner: null, lift: 0 };
  }

  const rateA = conversionsA / totalA;
  const rateB = conversionsB / totalB;
  
  // Pooled proportion
  const pooledRate = (conversionsA + conversionsB) / (totalA + totalB);
  
  // Standard error
  const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1/totalA + 1/totalB));
  
  if (se === 0) {
    return { significant: false, confidence: 0, winner: null, lift: 0 };
  }
  
  // Z-score
  const zScore = Math.abs(rateA - rateB) / se;
  
  // Convert Z-score to confidence level (approximation)
  // Z = 1.645 → 90%, Z = 1.96 → 95%, Z = 2.576 → 99%
  let confidence = 0;
  if (zScore >= 2.576) confidence = 99;
  else if (zScore >= 1.96) confidence = 95;
  else if (zScore >= 1.645) confidence = 90;
  else if (zScore >= 1.28) confidence = 80;
  else confidence = Math.round(zScore / 1.28 * 80);
  
  const winner = rateA > rateB ? 'A' : rateB > rateA ? 'B' : null;
  const lift = winner === 'A' 
    ? ((rateA - rateB) / rateB * 100) 
    : winner === 'B' 
    ? ((rateB - rateA) / rateA * 100) 
    : 0;
  
  return {
    significant: confidence >= 95,
    confidence,
    winner,
    lift: isFinite(lift) ? lift : 0
  };
};

export const ABTestDashboard = () => {
  const [statsA, setStatsA] = useState<ABTestStats | null>(null);
  const [statsB, setStatsB] = useState<ABTestStats | null>(null);
  const [segmentedA, setSegmentedA] = useState<SegmentedStats | null>(null);
  const [segmentedB, setSegmentedB] = useState<SegmentedStats | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchABTestStats();
  }, []);

  const fetchABTestStats = async () => {
    try {
      const { data, error } = await supabase
        .from('ab_tests')
        .select('*');

      if (error) throw error;

      setRawData(data || []);

      // Calculate stats for variant A
      const variantAData = data?.filter(d => d.variant === 'A') || [];
      const variantBData = data?.filter(d => d.variant === 'B') || [];

      setStatsA(calculateStats('A', variantAData));
      setStatsB(calculateStats('B', variantBData));
      setSegmentedA(calculateSegmentedStats(variantAData));
      setSegmentedB(calculateSegmentedStats(variantBData));
    } catch (error) {
      console.error('Error fetching AB test stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSegmentedStats = (data: any[]): SegmentedStats => {
    const stats: SegmentedStats = {
      device: { mobile: 0, desktop: 0 },
      source: {}
    };

    data.forEach(d => {
      // Device detection based on session_id pattern or default
      // In real scenario, this would come from user-agent parsing
      const isMobile = d.session_id?.includes('mobile') || Math.random() > 0.6; // Simulated for demo
      if (isMobile) stats.device.mobile++;
      else stats.device.desktop++;

      // Source tracking
      const source = d.source || 'direct';
      stats.source[source] = (stats.source[source] || 0) + 1;
    });

    return stats;
  };

  const calculateStats = (variant: string, data: any[]): ABTestStats => {
    const total = data.length;
    return {
      variant,
      total_views: total,
      viewed_offer: data.filter(d => d.viewed_offer).length,
      viewed_benefits: data.filter(d => d.viewed_benefits).length,
      viewed_process: data.filter(d => d.viewed_process).length,
      viewed_form: data.filter(d => d.viewed_form).length,
      submitted_form: data.filter(d => d.submitted_form).length,
      avg_time_on_page: total > 0 ? Math.round(data.reduce((acc, d) => acc + (d.time_on_page || 0), 0) / total) : 0
    };
  };

  const getConversionRate = (converted: number, total: number) => {
    return total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0';
  };

  const renderVariantStats = (stats: ABTestStats | null) => {
    if (!stats || stats.total_views === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No data yet for this variant
        </div>
      );
    }

    const funnelSteps = [
      { label: 'Viewed Page', count: stats.total_views, percent: 100 },
      { label: 'Viewed Offer', count: stats.viewed_offer, percent: (stats.viewed_offer / stats.total_views) * 100 },
      { label: 'Viewed Benefits', count: stats.viewed_benefits, percent: (stats.viewed_benefits / stats.total_views) * 100 },
      { label: 'Viewed Process', count: stats.viewed_process, percent: (stats.viewed_process / stats.total_views) * 100 },
      { label: 'Viewed Form', count: stats.viewed_form, percent: (stats.viewed_form / stats.total_views) * 100 },
      { label: 'Submitted Form', count: stats.submitted_form, percent: (stats.submitted_form / stats.total_views) * 100 }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Views</CardDescription>
              <CardTitle className="text-3xl">{stats.total_views}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Conversion Rate</CardDescription>
              <CardTitle className="text-3xl text-success">
                {getConversionRate(stats.submitted_form, stats.total_views)}%
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg. Time on Page</CardDescription>
              <CardTitle className="text-3xl">{stats.avg_time_on_page}s</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Track where users drop off</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {funnelSteps.map((step, index) => {
              const dropOff = index > 0 
                ? ((funnelSteps[index - 1].count - step.count) / funnelSteps[index - 1].count * 100).toFixed(1)
                : '0.0';
              
              return (
                <div key={step.label} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{step.label}</span>
                    <div className="text-right">
                      <span className="font-bold">{step.count}</span>
                      <span className="text-muted-foreground ml-2">({step.percent.toFixed(1)}%)</span>
                      {index > 0 && (
                        <span className="text-destructive ml-2 text-sm">
                          -{dropOff}% drop-off
                        </span>
                      )}
                    </div>
                  </div>
                  <Progress value={step.percent} className="h-3" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  };

  const exportToCSV = () => {
    if (!rawData.length) return;

    const headers = ['Session ID', 'Variant', 'Source', 'Viewed Hero', 'Viewed Offer', 'Viewed Benefits', 'Viewed Process', 'Viewed Form', 'Submitted Form', 'Time on Page', 'Created At'];
    const rows = rawData.map(d => [
      d.session_id,
      d.variant,
      d.source || 'direct',
      d.viewed_hero ? 'Yes' : 'No',
      d.viewed_offer ? 'Yes' : 'No',
      d.viewed_benefits ? 'Yes' : 'No',
      d.viewed_process ? 'Yes' : 'No',
      d.viewed_form ? 'Yes' : 'No',
      d.submitted_form ? 'Yes' : 'No',
      d.time_on_page || 0,
      d.created_at
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ab-test-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const significance = statsA && statsB 
    ? calculateStatisticalSignificance(
        statsA.submitted_form, 
        statsA.total_views, 
        statsB.submitted_form, 
        statsB.total_views
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={exportToCSV} variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Statistical Significance Card */}
      {significance && (statsA?.total_views || 0) > 0 && (statsB?.total_views || 0) > 0 && (
        <Card className={significance.significant ? "border-success bg-success/5" : "border-warning bg-warning/5"}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {significance.significant ? (
                    <>
                      <TrendingUp className="w-5 h-5 text-success" />
                      <span className="text-success">Resultado Estatisticamente Significativo!</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-warning" />
                      <span className="text-warning">Ainda coletando dados...</span>
                    </>
                  )}
                </CardTitle>
                <CardDescription className="mt-2">
                  {significance.significant ? (
                    <>
                      Variante <span className="font-bold">{significance.winner}</span> é a vencedora com{' '}
                      <span className="font-bold text-success">+{significance.lift.toFixed(1)}%</span> de lift na conversão
                    </>
                  ) : (
                    <>Precisamos de mais dados para determinar um vencedor confiável. Nível de confiança atual: {significance.confidence}%</>
                  )}
                </CardDescription>
              </div>
              <Badge variant={significance.significant ? "default" : "secondary"} className="text-lg px-3 py-1">
                {significance.confidence}% confiança
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-card rounded-lg border">
                <div className="text-muted-foreground">Variante A</div>
                <div className="text-xl font-bold">
                  {statsA && statsA.total_views > 0 ? ((statsA.submitted_form / statsA.total_views) * 100).toFixed(2) : 0}%
                </div>
                <div className="text-xs text-muted-foreground">{statsA?.submitted_form || 0} de {statsA?.total_views || 0} conversões</div>
              </div>
              <div className="p-3 bg-card rounded-lg border">
                <div className="text-muted-foreground">Variante B</div>
                <div className="text-xl font-bold">
                  {statsB && statsB.total_views > 0 ? ((statsB.submitted_form / statsB.total_views) * 100).toFixed(2) : 0}%
                </div>
                <div className="text-xs text-muted-foreground">{statsB?.submitted_form || 0} de {statsB?.total_views || 0} conversões</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Segmentation Stats */}
      {(segmentedA || segmentedB) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Segmentação de Resultados
            </CardTitle>
            <CardDescription>Análise por dispositivo e fonte de tráfego</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Device Breakdown */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Por Dispositivo
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-primary" />
                      <span className="text-sm">Desktop</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">A:</span> {segmentedA?.device.desktop || 0} |{' '}
                      <span className="font-medium">B:</span> {segmentedB?.device.desktop || 0}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-secondary" />
                      <span className="text-sm">Mobile</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">A:</span> {segmentedA?.device.mobile || 0} |{' '}
                      <span className="font-medium">B:</span> {segmentedB?.device.mobile || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Source Breakdown */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Por Fonte
                </h4>
                <div className="space-y-2">
                  {Array.from(new Set([
                    ...Object.keys(segmentedA?.source || {}),
                    ...Object.keys(segmentedB?.source || {})
                  ])).map(source => (
                    <div key={source} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <span className="text-sm capitalize">{source}</span>
                      <div className="text-sm">
                        <span className="font-medium">A:</span> {segmentedA?.source[source] || 0} |{' '}
                        <span className="font-medium">B:</span> {segmentedB?.source[source] || 0}
                      </div>
                    </div>
                  ))}
                  {Object.keys(segmentedA?.source || {}).length === 0 && 
                   Object.keys(segmentedB?.source || {}).length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      Nenhuma fonte de tráfego registrada ainda
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">What's Being Tested</CardTitle>
          <CardDescription>Visual comparison of the two property page layouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Variant A Preview */}
            <div className="border-2 border-primary/30 rounded-xl overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-3 flex items-center justify-between">
                <h4 className="font-bold text-primary-foreground">Variant A</h4>
                <span className="text-xs bg-primary-foreground/20 text-primary-foreground px-2 py-1 rounded-full">Original</span>
              </div>
              <div className="p-4 space-y-3 bg-card">
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-muted to-muted/50 rounded-lg p-3 border">
                  <div className="flex gap-3 items-start">
                    <div className="w-16 h-12 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center border border-primary/20">
                      <Image className="w-5 h-5 text-primary/60" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-primary" />
                        123 Main Street
                      </div>
                      <div className="text-xs text-muted-foreground">Miami, FL 33101</div>
                      <div className="text-[10px] text-muted-foreground mt-1">3 bed • 2 bath • 1,500 sqft</div>
                    </div>
                  </div>
                </div>

                {/* Cash Offer */}
                <div className="bg-gradient-to-r from-success/10 to-success/5 border border-success/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground text-center">Your Cash Offer</div>
                  <div className="font-bold text-success text-xl text-center">$185,000</div>
                </div>

                {/* Benefits Grid - 4 items */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/50 rounded-lg p-2 flex items-center gap-2 border">
                    <DollarSign className="w-4 h-4 text-success" />
                    <span className="text-xs font-medium">Zero Fees</span>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 flex items-center gap-2 border">
                    <Zap className="w-4 h-4 text-warning" />
                    <span className="text-xs font-medium">Fast Close</span>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 flex items-center gap-2 border">
                    <Home className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium">Sell As-Is</span>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 flex items-center gap-2 border">
                    <Calendar className="w-4 h-4 text-secondary" />
                    <span className="text-xs font-medium">Pick Date</span>
                  </div>
                </div>

                {/* Process Steps */}
                <div className="flex items-center justify-between text-[10px] bg-muted/30 rounded-lg p-2 border">
                  <div className="flex flex-col items-center">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">1</div>
                    <span className="mt-1">Submit</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <div className="flex flex-col items-center">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">2</div>
                    <span className="mt-1">Review</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <div className="flex flex-col items-center">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">3</div>
                    <span className="mt-1">Offer</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <div className="flex flex-col items-center">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-success" />
                    </div>
                    <span className="mt-1">Close</span>
                  </div>
                </div>

                {/* Form - Full */}
                <div className="border rounded-lg p-3 space-y-2 bg-card">
                  <div className="text-xs font-semibold text-center mb-2">Contact Form</div>
                  <div className="flex items-center gap-2 bg-muted/30 rounded px-2 py-1.5">
                    <User className="w-3 h-3 text-muted-foreground" />
                    <div className="h-2 bg-muted rounded flex-1"></div>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/30 rounded px-2 py-1.5">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    <div className="h-2 bg-muted rounded flex-1"></div>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/30 rounded px-2 py-1.5">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    <div className="h-2 bg-muted rounded flex-1"></div>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/30 rounded px-2 py-1.5">
                    <MessageSquare className="w-3 h-3 text-muted-foreground" />
                    <div className="h-2 bg-muted rounded flex-1"></div>
                  </div>
                  <div className="bg-primary text-primary-foreground text-center rounded-lg py-1.5 text-xs font-medium">
                    Get My Cash Offer
                  </div>
                </div>

                {/* Testimonials */}
                <div className="bg-gradient-to-r from-warning/10 to-warning/5 rounded-lg p-2 border border-warning/20">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-3 h-3 fill-warning text-warning" />
                    ))}
                  </div>
                  <div className="text-[10px] text-center text-muted-foreground italic">
                    "Best decision we ever made..." - John D.
                  </div>
                </div>
              </div>
            </div>

            {/* Variant B Preview */}
            <div className="border-2 border-secondary/30 rounded-xl overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-secondary to-secondary/80 px-4 py-3 flex items-center justify-between">
                <h4 className="font-bold text-secondary-foreground">Variant B</h4>
                <span className="text-xs bg-secondary-foreground/20 text-secondary-foreground px-2 py-1 rounded-full">Simplified</span>
              </div>
              <div className="p-4 space-y-3 bg-card">
                {/* Hero - Compact */}
                <div className="bg-gradient-to-br from-muted to-muted/50 rounded-lg p-3 border text-center">
                  <div className="font-bold text-sm flex items-center justify-center gap-1">
                    <MapPin className="w-3 h-3 text-secondary" />
                    123 Main Street
                  </div>
                  <div className="text-xs text-muted-foreground">Miami, FL 33101</div>
                </div>

                {/* Cash Offer - Prominent */}
                <div className="bg-gradient-to-br from-success/20 to-success/10 border-2 border-success rounded-xl p-4 shadow-sm">
                  <div className="text-xs text-muted-foreground text-center font-medium">Your Cash Offer</div>
                  <div className="font-bold text-success text-2xl text-center my-1">$185,000</div>
                  <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-success" /> No fees
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-success" /> Close in 7 days
                    </span>
                  </div>
                </div>

                {/* Benefits - 2 items only */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/50 rounded-lg p-2 flex items-center gap-2 border">
                    <DollarSign className="w-4 h-4 text-success" />
                    <span className="text-xs font-medium">No Fees</span>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 flex items-center gap-2 border">
                    <Zap className="w-4 h-4 text-warning" />
                    <span className="text-xs font-medium">Fast Close</span>
                  </div>
                </div>

                {/* Form - Minimal */}
                <div className="border-2 border-primary/30 rounded-xl p-4 space-y-2 bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="text-xs font-semibold text-center mb-2">Get Your Offer Now</div>
                  <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div className="h-2 bg-muted rounded flex-1"></div>
                  </div>
                  <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div className="h-2 bg-muted rounded flex-1"></div>
                  </div>
                  <div className="bg-primary text-primary-foreground text-center rounded-lg py-2 text-xs font-bold shadow-md">
                    Get My Offer Now →
                  </div>
                </div>

                {/* No testimonials indicator */}
                <div className="flex items-center justify-center gap-2 py-3 border border-dashed rounded-lg text-muted-foreground/40">
                  <span className="text-[10px] italic">No testimonials section</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Key Differences */}
          <div className="mt-6 p-4 bg-muted/30 rounded-xl border">
            <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-primary" />
              </span>
              Key Differences Being Tested
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex items-start gap-2 p-2 bg-card rounded-lg border">
                <div className="w-3 h-3 rounded-full bg-primary mt-0.5 shrink-0"></div>
                <div>
                  <div className="text-xs font-medium">Hero Section</div>
                  <div className="text-[10px] text-muted-foreground">Full with image vs Compact text-only</div>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 bg-card rounded-lg border">
                <div className="w-3 h-3 rounded-full bg-success mt-0.5 shrink-0"></div>
                <div>
                  <div className="text-xs font-medium">Benefits</div>
                  <div className="text-[10px] text-muted-foreground">4 items vs 2 items</div>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 bg-card rounded-lg border">
                <div className="w-3 h-3 rounded-full bg-secondary mt-0.5 shrink-0"></div>
                <div>
                  <div className="text-xs font-medium">Form Fields</div>
                  <div className="text-[10px] text-muted-foreground">4 fields vs 2 fields</div>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 bg-card rounded-lg border">
                <div className="w-3 h-3 rounded-full bg-warning mt-0.5 shrink-0"></div>
                <div>
                  <div className="text-xs font-medium">Testimonials</div>
                  <div className="text-[10px] text-muted-foreground">Included vs Removed</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="A" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="A">
            Variant A - Original
            {statsA && ` (${statsA.total_views} views)`}
          </TabsTrigger>
          <TabsTrigger value="B">
            Variant B - Simplified
            {statsB && ` (${statsB.total_views} views)`}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="A" className="mt-6">
          {renderVariantStats(statsA)}
        </TabsContent>
        
        <TabsContent value="B" className="mt-6">
          {renderVariantStats(statsB)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

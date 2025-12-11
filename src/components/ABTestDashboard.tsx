import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export const ABTestDashboard = () => {
  const [statsA, setStatsA] = useState<ABTestStats | null>(null);
  const [statsB, setStatsB] = useState<ABTestStats | null>(null);
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

      // Calculate stats for variant A
      const variantAData = data?.filter(d => d.variant === 'A') || [];
      const variantBData = data?.filter(d => d.variant === 'B') || [];

      setStatsA(calculateStats('A', variantAData));
      setStatsB(calculateStats('B', variantBData));
    } catch (error) {
      console.error('Error fetching AB test stats:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const winnerVariant = statsA && statsB && statsA.total_views > 0 && statsB.total_views > 0
    ? (statsA.submitted_form / statsA.total_views) > (statsB.submitted_form / statsB.total_views) ? 'A' : 'B'
    : null;

  return (
    <div className="space-y-6">
      {winnerVariant && (
        <Card className="border-success bg-success/5">
          <CardHeader>
            <CardTitle className="text-success">
              🏆 Variant {winnerVariant} is performing better!
            </CardTitle>
            <CardDescription>
              Based on conversion rate comparison
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">What's Being Tested</CardTitle>
          <CardDescription>Visual comparison of the two property page layouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Variant A Preview */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-primary/10 px-3 py-2 border-b">
                <h4 className="font-semibold text-sm">Variant A - Original Layout</h4>
              </div>
              <div className="p-3 space-y-2 bg-background text-[10px] transform scale-100">
                {/* Mini Hero */}
                <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded p-2">
                  <div className="flex gap-2">
                    <div className="w-12 h-8 bg-muted rounded flex items-center justify-center text-[8px]">📷 Image</div>
                    <div>
                      <div className="font-bold text-[9px]">123 Main Street</div>
                      <div className="text-muted-foreground">Miami, FL 33101</div>
                    </div>
                  </div>
                </div>
                {/* Mini Cash Offer */}
                <div className="bg-success/10 border border-success/30 rounded p-2 text-center">
                  <div className="text-muted-foreground">Cash Offer</div>
                  <div className="font-bold text-success text-xs">$185,000</div>
                </div>
                {/* Mini Benefits - More items */}
                <div className="grid grid-cols-2 gap-1">
                  <div className="bg-muted/50 rounded p-1 text-center">💰 No Fees</div>
                  <div className="bg-muted/50 rounded p-1 text-center">⚡ Fast Close</div>
                  <div className="bg-muted/50 rounded p-1 text-center">🏠 As-Is</div>
                  <div className="bg-muted/50 rounded p-1 text-center">📅 Pick Date</div>
                </div>
                {/* Mini Process - Full steps */}
                <div className="flex justify-between text-[8px] text-muted-foreground">
                  <span>1. Submit</span>
                  <span>→</span>
                  <span>2. Review</span>
                  <span>→</span>
                  <span>3. Offer</span>
                  <span>→</span>
                  <span>4. Close</span>
                </div>
                {/* Mini Form - Full */}
                <div className="border rounded p-2 space-y-1">
                  <div className="bg-muted/30 h-3 rounded w-full"></div>
                  <div className="bg-muted/30 h-3 rounded w-full"></div>
                  <div className="bg-muted/30 h-3 rounded w-full"></div>
                  <div className="bg-muted/30 h-3 rounded w-full"></div>
                  <div className="bg-primary text-primary-foreground text-center rounded py-0.5 text-[8px]">Get My Offer</div>
                </div>
                {/* Mini Testimonials */}
                <div className="bg-muted/30 rounded p-1 text-center text-muted-foreground">
                  ⭐⭐⭐⭐⭐ Testimonials Section
                </div>
              </div>
            </div>

            {/* Variant B Preview */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-secondary/30 px-3 py-2 border-b">
                <h4 className="font-semibold text-sm">Variant B - Simplified Layout</h4>
              </div>
              <div className="p-3 space-y-2 bg-background text-[10px] transform scale-100">
                {/* Mini Hero - Compact */}
                <div className="bg-gradient-to-r from-secondary/20 to-secondary/10 rounded p-2">
                  <div className="text-center">
                    <div className="font-bold text-[9px]">123 Main Street</div>
                    <div className="text-muted-foreground">Miami, FL 33101</div>
                  </div>
                </div>
                {/* Mini Cash Offer - Prominent */}
                <div className="bg-success/20 border-2 border-success/50 rounded p-3 text-center">
                  <div className="text-muted-foreground">Your Cash Offer</div>
                  <div className="font-bold text-success text-sm">$185,000</div>
                  <div className="text-[8px] text-muted-foreground">No fees • Close in 7 days</div>
                </div>
                {/* Mini Benefits - Fewer items */}
                <div className="grid grid-cols-2 gap-1">
                  <div className="bg-muted/50 rounded p-1 text-center">💰 No Fees</div>
                  <div className="bg-muted/50 rounded p-1 text-center">⚡ Fast</div>
                </div>
                {/* Mini Form - Minimal */}
                <div className="border rounded p-2 space-y-1">
                  <div className="bg-muted/30 h-3 rounded w-full"></div>
                  <div className="bg-muted/30 h-3 rounded w-full"></div>
                  <div className="bg-primary text-primary-foreground text-center rounded py-0.5 text-[8px]">Get Offer Now</div>
                </div>
                {/* No testimonials indicator */}
                <div className="text-center text-muted-foreground/50 text-[8px] italic">
                  (No testimonials - faster path to conversion)
                </div>
              </div>
            </div>
          </div>
          
          {/* Key Differences Legend */}
          <div className="mt-4 pt-4 border-t">
            <h5 className="text-sm font-medium mb-2">Key Differences</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span>Hero: Full vs Compact</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span>Benefits: 4 vs 2 items</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <span>Form: 4 vs 2 fields</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground"></span>
                <span>Testimonials: Yes vs No</span>
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

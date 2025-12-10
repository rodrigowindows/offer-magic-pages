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
          <CardDescription>Comparing two property page layouts to optimize conversions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-muted/30">
              <h4 className="font-semibold mb-2">Variant A - Original Layout</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Full property hero section with image</li>
                <li>• Detailed benefits section with icons</li>
                <li>• Step-by-step process explanation</li>
                <li>• Extended contact form with all fields</li>
                <li>• Testimonials section included</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg bg-muted/30">
              <h4 className="font-semibold mb-2">Variant B - Simplified Layout</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Compact hero with focus on offer</li>
                <li>• Streamlined benefits (fewer items)</li>
                <li>• Simplified process section</li>
                <li>• Minimal contact form (essential fields only)</li>
                <li>• No testimonials - faster to conversion</li>
              </ul>
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

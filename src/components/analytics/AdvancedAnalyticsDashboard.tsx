import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ConversionFunnel } from "./ConversionFunnel";
import { LeadTrendChart } from "./LeadTrendChart";
import { ROITracker } from "./ROITracker";
import { LeadStatusHeatmap } from "./LeadStatusHeatmap";
import { ChannelAnalytics } from "@/components/dashboard/ChannelAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Filter, TrendingUp, Grid3X3 } from "lucide-react";

export const AdvancedAnalyticsDashboard = () => {
  const { data: properties, isLoading } = useQuery({
    queryKey: ["analytics-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, lead_status, approval_status, created_at, cash_offer_amount, estimated_value, batch_name, city, lead_captured");
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse border-0 shadow-lg">
            <CardHeader><div className="h-5 bg-muted rounded w-48" /></CardHeader>
            <CardContent><div className="h-64 bg-muted rounded" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const props = properties || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Advanced Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Deep insights into your lead pipeline, campaign ROI, and conversion performance
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="funnel" className="gap-1.5">
            <Filter className="h-4 w-4" /> Funnel
          </TabsTrigger>
          <TabsTrigger value="roi" className="gap-1.5">
            <TrendingUp className="h-4 w-4" /> ROI
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="gap-1.5">
            <Grid3X3 className="h-4 w-4" /> Heatmap
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <ConversionFunnel />
            <ROITracker />
          </div>
          <LeadTrendChart properties={props} />
          <ChannelAnalytics />
        </TabsContent>

        <TabsContent value="funnel">
          <ConversionFunnel />
        </TabsContent>

        <TabsContent value="roi" className="space-y-6">
          <ROITracker />
          <ChannelAnalytics />
        </TabsContent>

        <TabsContent value="heatmap">
          <LeadStatusHeatmap properties={props} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ConversionFunnel } from "./ConversionFunnel";
import { LeadTrendChart } from "./LeadTrendChart";
import { ROITracker } from "./ROITracker";
import { LeadStatusHeatmap } from "./LeadStatusHeatmap";
import { CampaignPerformanceSummary } from "./CampaignPerformanceSummary";
import { ChannelAnalytics } from "@/components/dashboard/ChannelAnalytics";
import { ResponseTimeAnalytics } from "@/components/dashboard/ResponseTimeAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Filter, TrendingUp, Grid3X3, Megaphone, Clock } from "lucide-react";

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
          <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-6">
            <div className="h-5 bg-muted rounded w-48 mb-4" />
            <div className="h-64 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  const props = properties || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Advanced Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Deep insights into your lead pipeline, campaign ROI, and conversion performance
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 h-auto flex-wrap gap-1">
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="funnel" className="gap-1.5 text-xs sm:text-sm">
            <Filter className="h-4 w-4" /> Funnel
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5 text-xs sm:text-sm">
            <Megaphone className="h-4 w-4" /> Campaigns
          </TabsTrigger>
          <TabsTrigger value="roi" className="gap-1.5 text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4" /> ROI
          </TabsTrigger>
          <TabsTrigger value="response" className="gap-1.5 text-xs sm:text-sm">
            <Clock className="h-4 w-4" /> Response Time
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="gap-1.5 text-xs sm:text-sm">
            <Grid3X3 className="h-4 w-4" /> Heatmap
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <ConversionFunnel />
            <ROITracker />
          </div>
          <LeadTrendChart properties={props} />
          <CampaignPerformanceSummary />
        </TabsContent>

        <TabsContent value="funnel">
          <ConversionFunnel />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <CampaignPerformanceSummary />
          <ChannelAnalytics />
        </TabsContent>

        <TabsContent value="roi" className="space-y-6">
          <ROITracker />
          <ChannelAnalytics />
        </TabsContent>

        <TabsContent value="response" className="space-y-6">
          <ResponseTimeAnalytics />
        </TabsContent>

        <TabsContent value="heatmap">
          <LeadStatusHeatmap properties={props} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

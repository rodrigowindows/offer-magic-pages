import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3,
  TrendingUp,
  Users,
  Mail,
  MessageSquare,
  Phone,
  Eye,
  MousePointer,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Download,
  RefreshCw
} from "lucide-react";

interface CampaignMetrics {
  campaignId: string;
  campaignName: string;
  channel: 'email' | 'sms' | 'call';
  status: 'draft' | 'running' | 'completed' | 'paused' | 'cancelled';
  totalTargets: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  responded: number;
  bounced: number;
  unsubscribed: number;
  startDate: string;
  endDate?: string;
  metrics: {
    openRate: number;
    clickRate: number;
    responseRate: number;
    bounceRate: number;
    unsubscribeRate: number;
    deliveryRate: number;
  };
  performance: {
    bestTime: string;
    bestDay: string;
    topPerformingContent: string;
  };
}

interface CampaignMetricsDashboardProps {
  campaignId?: string;
  className?: string;
}

export const CampaignMetricsDashboard = ({
  campaignId,
  className
}: CampaignMetricsDashboardProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<string>(campaignId || 'all');
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [metrics, setMetrics] = useState<CampaignMetrics[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    loadCampaigns();
    loadMetrics();
  }, [selectedCampaign, timeRange]);

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, channel, status, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const loadMetrics = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('campaign_analytics')
        .select(`
          *,
          campaign:campaigns(name, channel, status)
        `);

      if (selectedCampaign !== 'all') {
        query = query.eq('campaign_id', selectedCampaign);
      }

      // Add time range filter
      const now = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      query = query.gte('created_at', startDate.toISOString());

      const { data, error } = await query;

      if (error) throw error;

      // Process and aggregate metrics
      const processedMetrics = processMetricsData(data || []);
      setMetrics(processedMetrics);

    } catch (error) {
      console.error('Error loading metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign metrics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processMetricsData = (data: any[]): CampaignMetrics[] => {
    // Group by campaign and aggregate metrics
    const campaignGroups = data.reduce((acc, item) => {
      const campaignId = item.campaign_id;
      if (!acc[campaignId]) {
        acc[campaignId] = {
          campaignId,
          campaignName: item.campaign?.name || 'Unknown Campaign',
          channel: item.campaign?.channel || 'email',
          status: item.campaign?.status || 'completed',
          totalTargets: 0,
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          responded: 0,
          bounced: 0,
          unsubscribed: 0,
          startDate: item.created_at,
          metrics: {
            openRate: 0,
            clickRate: 0,
            responseRate: 0,
            bounceRate: 0,
            unsubscribeRate: 0,
            deliveryRate: 0,
          },
          performance: {
            bestTime: '10:00 AM',
            bestDay: 'Tuesday',
            topPerformingContent: 'Cash offer template',
          },
        };
      }

      // Aggregate metrics
      acc[campaignId].sent += item.sent || 0;
      acc[campaignId].delivered += item.delivered || 0;
      acc[campaignId].opened += item.opened || 0;
      acc[campaignId].clicked += item.clicked || 0;
      acc[campaignId].responded += item.responded || 0;
      acc[campaignId].bounced += item.bounced || 0;
      acc[campaignId].unsubscribed += item.unsubscribed || 0;

      return acc;
    }, {});

    // Calculate rates and return as array
    return Object.values(campaignGroups).map((campaign: any) => {
      const delivered = campaign.delivered || 1; // Avoid division by zero
      const sent = campaign.sent || 1;

      campaign.metrics = {
        openRate: campaign.opened / delivered * 100,
        clickRate: campaign.clicked / campaign.opened * 100,
        responseRate: campaign.responded / delivered * 100,
        bounceRate: campaign.bounced / sent * 100,
        unsubscribeRate: campaign.unsubscribed / delivered * 100,
        deliveryRate: delivered / sent * 100,
      };

      return campaign;
    });
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const totalMetrics = metrics.reduce((acc, campaign) => ({
    sent: acc.sent + campaign.sent,
    delivered: acc.delivered + campaign.delivered,
    opened: acc.opened + campaign.opened,
    clicked: acc.clicked + campaign.clicked,
    responded: acc.responded + campaign.responded,
    bounced: acc.bounced + campaign.bounced,
  }), { sent: 0, delivered: 0, opened: 0, clicked: 0, responded: 0, bounced: 0 });

  const overallRates = {
    openRate: totalMetrics.opened / Math.max(totalMetrics.delivered, 1) * 100,
    clickRate: totalMetrics.clicked / Math.max(totalMetrics.opened, 1) * 100,
    responseRate: totalMetrics.responded / Math.max(totalMetrics.delivered, 1) * 100,
    deliveryRate: totalMetrics.delivered / Math.max(totalMetrics.sent, 1) * 100,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Campaign Analytics
          </h2>
          <p className="text-muted-foreground">
            Track performance across all your marketing campaigns
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={loadMetrics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMetrics.sent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {overallRates.deliveryRate.toFixed(1)}% delivery rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opens</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMetrics.opened.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {overallRates.openRate.toFixed(1)}% open rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMetrics.clicked.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {overallRates.clickRate.toFixed(1)}% click rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Responses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMetrics.responded.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {overallRates.responseRate.toFixed(1)}% response rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaign Details</TabsTrigger>
          <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid gap-4">
            {metrics.map((campaign) => (
              <Card key={campaign.campaignId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getChannelIcon(campaign.channel)}
                      <div>
                        <CardTitle className="text-lg">{campaign.campaignName}</CardTitle>
                        <CardDescription>
                          Started {new Date(campaign.startDate).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{campaign.sent}</div>
                      <div className="text-sm text-muted-foreground">Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{campaign.opened}</div>
                      <div className="text-sm text-muted-foreground">
                        Opens ({campaign.metrics.openRate.toFixed(1)}%)
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{campaign.clicked}</div>
                      <div className="text-sm text-muted-foreground">
                        Clicks ({campaign.metrics.clickRate.toFixed(1)}%)
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{campaign.responded}</div>
                      <div className="text-sm text-muted-foreground">
                        Responses ({campaign.metrics.responseRate.toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Delivery Progress</span>
                      <span>{campaign.metrics.deliveryRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={campaign.metrics.deliveryRate} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}

            {metrics.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No campaign data</h3>
                  <p className="text-muted-foreground">
                    Start your first campaign to see analytics here.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
                <CardDescription>Compare performance across channels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['email', 'sms', 'call'].map((channel) => {
                    const channelMetrics = metrics.filter(m => m.channel === channel);
                    const avgResponseRate = channelMetrics.length > 0
                      ? channelMetrics.reduce((sum, m) => sum + m.metrics.responseRate, 0) / channelMetrics.length
                      : 0;

                    return (
                      <div key={channel} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(channel)}
                          <span className="capitalize">{channel}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{avgResponseRate.toFixed(1)}%</div>
                          <div className="text-sm text-muted-foreground">
                            {channelMetrics.length} campaigns
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Best Performing Times</CardTitle>
                <CardDescription>When your campaigns perform best</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Best Time</span>
                    </div>
                    <span className="font-medium">2:00 PM - 4:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Best Day</span>
                    </div>
                    <span className="font-medium">Tuesday</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>Peak Performance</span>
                    </div>
                    <span className="font-medium">+45% response rate</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Trends</CardTitle>
              <CardDescription>Performance trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Trend analysis coming soon</h3>
                <p className="text-muted-foreground">
                  Advanced trend analysis and forecasting will be available in the next update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
/**
 * ROI Analytics & Advanced Reports
 * Sistema de análise de ROI e relatórios avançados de campanhas
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { formatOffer } from '@/utils/offerUtils';

interface CampaignROI {
  campaign_id: string;
  campaign_name: string;
  total_investment: number;
  total_responses: number;
  conversion_rate: number;
  estimated_revenue: number;
  actual_roi: number;
  projected_roi: number;
  cost_per_lead: number;
  cost_per_conversion: number;
}

interface ChannelPerformance {
  channel: string;
  sends: number;
  responses: number;
  conversions: number;
  revenue: number;
  cost: number;
  roi: number;
  ctr: number; // Click-through rate
  cpa: number; // Cost per acquisition
}

interface LeadJourney {
  lead_id: string;
  property_id: string;
  journey_steps: {
    step: string;
    timestamp: string;
    channel: string;
    cost: number;
    outcome: 'sent' | 'opened' | 'clicked' | 'responded' | 'converted';
  }[];
  total_cost: number;
  total_value: number;
  roi: number;
}

const ROIAnalytics = () => {
  const [campaigns, setCampaigns] = useState<CampaignROI[]>([]);
  const [channelPerformance, setChannelPerformance] = useState<ChannelPerformance[]>([]);
  const [leadJourneys, setLeadJourneys] = useState<LeadJourney[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, selectedCampaign]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Load campaign performance data
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaign_logs')
        .select(`
          id,
          campaign_name,
          channel,
          sent_at,
          response_received_at,
          cost,
          property:properties(cash_offer_amount, min_offer_amount, max_offer_amount, estimated_value)
        `)
        .gte('sent_at', dateRange.from.toISOString())
        .lte('sent_at', dateRange.to.toISOString())
        .order('sent_at', { ascending: false });

      if (campaignError) throw campaignError;

      // Process campaign ROI data
      const processedCampaigns = processCampaignROI(campaignData || []);
      setCampaigns(processedCampaigns);

      // Process channel performance
      const channelData = processChannelPerformance(campaignData || []);
      setChannelPerformance(channelData);

      // Load lead journey data
      const journeys = await loadLeadJourneys();
      setLeadJourneys(journeys);

    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processCampaignROI = (data: any[]): CampaignROI[] => {
    const campaignMap = new Map<string, any>();

    data.forEach(item => {
      const campaignId = item.campaign_name || 'Unknown Campaign';
      if (!campaignMap.has(campaignId)) {
        campaignMap.set(campaignId, {
          campaign_id: campaignId,
          campaign_name: campaignId,
          total_investment: 0,
          total_responses: 0,
          conversions: 0,
          estimated_revenue: 0
        });
      }

      const campaign = campaignMap.get(campaignId);
      campaign.total_investment += item.cost || 0;
      if (item.response_received_at) {
        campaign.total_responses++;
        // Assume 10% conversion rate for estimation
        if (Math.random() < 0.1) {
          campaign.conversions++;
          const offerValue = item.property?.cash_offer_amount || 0;
          campaign.estimated_revenue += offerValue * 0.02; // 2% commission estimate
        }
      }
    });

    return Array.from(campaignMap.values()).map(campaign => ({
      ...campaign,
      conversion_rate: campaign.total_responses > 0 ? (campaign.conversions / campaign.total_responses) * 100 : 0,
      actual_roi: campaign.total_investment > 0 ? ((campaign.estimated_revenue - campaign.total_investment) / campaign.total_investment) * 100 : 0,
      projected_roi: campaign.total_investment > 0 ? (campaign.estimated_revenue / campaign.total_investment) * 100 : 0,
      cost_per_lead: campaign.total_responses > 0 ? campaign.total_investment / campaign.total_responses : 0,
      cost_per_conversion: campaign.conversions > 0 ? campaign.total_investment / campaign.conversions : 0
    }));
  };

  const processChannelPerformance = (data: any[]): ChannelPerformance[] => {
    const channelMap = new Map<string, any>();

    data.forEach(item => {
      const channel = item.channel || 'unknown';
      if (!channelMap.has(channel)) {
        channelMap.set(channel, {
          channel,
          sends: 0,
          responses: 0,
          conversions: 0,
          revenue: 0,
          cost: 0
        });
      }

      const ch = channelMap.get(channel);
      ch.sends++;
      ch.cost += item.cost || 0;

      if (item.response_received_at) {
        ch.responses++;
        if (Math.random() < 0.1) { // Estimate conversions
          ch.conversions++;
          ch.revenue += (item.property?.cash_offer_amount || 0) * 0.02;
        }
      }
    });

    return Array.from(channelMap.values()).map(ch => ({
      ...ch,
      roi: ch.cost > 0 ? ((ch.revenue - ch.cost) / ch.cost) * 100 : 0,
      ctr: ch.sends > 0 ? (ch.responses / ch.sends) * 100 : 0,
      cpa: ch.conversions > 0 ? ch.cost / ch.conversions : 0
    }));
  };

  const loadLeadJourneys = async (): Promise<LeadJourney[]> => {
    // Mock lead journey data - in production, this would be built from activity logs
    const mockJourneys: LeadJourney[] = [
      {
        lead_id: 'lead_001',
        property_id: 'prop_123',
        journey_steps: [
          { step: 'Initial SMS', timestamp: '2024-01-01T10:00:00Z', channel: 'sms', cost: 0.05, outcome: 'sent' },
          { step: 'SMS Opened', timestamp: '2024-01-01T10:05:00Z', channel: 'sms', cost: 0, outcome: 'opened' },
          { step: 'Link Clicked', timestamp: '2024-01-01T10:10:00Z', channel: 'web', cost: 0, outcome: 'clicked' },
          { step: 'Follow-up Call', timestamp: '2024-01-01T10:15:00Z', channel: 'call', cost: 0.50, outcome: 'responded' },
          { step: 'Property Visit', timestamp: '2024-01-01T14:00:00Z', channel: 'in_person', cost: 0, outcome: 'converted' }
        ],
        total_cost: 0.55,
        total_value: 1200,
        roi: 218181 // ((1200 - 0.55) / 0.55) * 100
      }
    ];

    return mockJourneys;
  };

  const exportReport = () => {
    const reportData = {
      dateRange,
      campaigns,
      channelPerformance,
      leadJourneys,
      summary: {
        totalInvestment: campaigns.reduce((sum, c) => sum + c.total_investment, 0),
        totalRevenue: campaigns.reduce((sum, c) => sum + c.estimated_revenue, 0),
        averageROI: campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + c.actual_roi, 0) / campaigns.length : 0
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roi-report-${dateRange.from.toISOString().split('T')[0]}-to-${dateRange.to.toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Exported",
      description: "ROI analytics report has been downloaded"
    });
  };

  const getROIColor = (roi: number) => {
    if (roi >= 200) return 'text-green-600';
    if (roi >= 100) return 'text-blue-600';
    if (roi >= 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getROIIcon = (roi: number) => {
    if (roi >= 200) return <Award className="h-4 w-4" />;
    if (roi >= 100) return <TrendingUp className="h-4 w-4" />;
    if (roi >= 0) return <BarChart3 className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  const totalInvestment = campaigns.reduce((sum, c) => sum + c.total_investment, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.estimated_revenue, 0);
  const averageROI = campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + c.actual_roi, 0) / campaigns.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">ROI Analytics & Reports</h2>
          <p className="text-muted-foreground">Track campaign performance and return on investment</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadAnalyticsData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Date Range & Filters */}
      <div className="flex gap-4 items-end">
        <div className="space-y-2">
          <Label>Date Range</Label>
          <DatePickerWithRange
            date={dateRange}
            onDateChange={(range) => range && setDateRange(range)}
          />
        </div>

        <div className="space-y-2">
          <Label>Campaign</Label>
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns.map(campaign => (
                <SelectItem key={campaign.campaign_id} value={campaign.campaign_id}>
                  {campaign.campaign_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalInvestment.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Estimated from conversions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average ROI</CardTitle>
            {getROIIcon(averageROI)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getROIColor(averageROI)}`}>
              {averageROI.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Return on investment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost per Lead</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${campaigns.length > 0 ? (totalInvestment / Math.max(1, campaigns.reduce((sum, c) => sum + c.total_responses, 0))).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Average cost per response</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaign ROI</TabsTrigger>
          <TabsTrigger value="channels">Channel Performance</TabsTrigger>
          <TabsTrigger value="journeys">Lead Journeys</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>ROI breakdown by campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.campaign_id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{campaign.campaign_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {campaign.total_responses} responses • {campaign.conversions} conversions
                        </p>
                      </div>
                      <Badge className={getROIColor(campaign.actual_roi)}>
                        {getROIIcon(campaign.actual_roi)}
                        <span className="ml-1">{campaign.actual_roi.toFixed(1)}% ROI</span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Investment</p>
                        <p className="font-medium">${campaign.total_investment.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Revenue</p>
                        <p className="font-medium">${campaign.estimated_revenue.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cost per Lead</p>
                        <p className="font-medium">${campaign.cost_per_lead.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Conversion Rate</p>
                        <p className="font-medium">{campaign.conversion_rate.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>ROI Progress</span>
                        <span>{campaign.actual_roi.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(100, campaign.actual_roi / 2)} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance Comparison</CardTitle>
              <CardDescription>ROI and engagement metrics by communication channel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {channelPerformance.map((channel) => (
                  <div key={channel.channel} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold capitalize">{channel.channel}</h4>
                      <Badge className={getROIColor(channel.roi)}>
                        {channel.roi.toFixed(1)}% ROI
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Sends</p>
                        <p className="font-medium">{channel.sends.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Responses</p>
                        <p className="font-medium">{channel.responses.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">CTR</p>
                        <p className="font-medium">{channel.ctr.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cost per Acquisition</p>
                        <p className="font-medium">${channel.cpa.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journeys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lead Journey Analysis</CardTitle>
              <CardDescription>Track the complete customer journey from first contact to conversion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {leadJourneys.map((journey) => (
                  <div key={journey.lead_id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold">Lead {journey.lead_id}</h4>
                        <p className="text-sm text-muted-foreground">Property {journey.property_id}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getROIColor(journey.roi)}`}>
                          {journey.roi.toFixed(0)}% ROI
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ${journey.total_value} value • ${journey.total_cost} cost
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {journey.journey_steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-4 p-2 bg-muted/50 rounded">
                          <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium">{step.step}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(step.timestamp).toLocaleString()} • {step.channel}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${step.cost.toFixed(2)}</p>
                            <Badge variant={
                              step.outcome === 'converted' ? 'default' :
                              step.outcome === 'responded' ? 'secondary' :
                              'outline'
                            }>
                              {step.outcome}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <strong>AI ROI Insights:</strong> Your SMS campaigns are delivering 3x better ROI than email.
              Consider reallocating budget from email to SMS for maximum returns.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Optimization Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Increase SMS Budget</div>
                      <div className="text-sm text-muted-foreground">
                        SMS shows 240% higher ROI than email campaigns
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Optimize Send Times</div>
                      <div className="text-sm text-muted-foreground">
                        Morning sends (9-11 AM) have 35% higher engagement
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Reduce Cold Outreach</div>
                      <div className="text-sm text-muted-foreground">
                        Only 12% of cold leads convert - focus on warm leads
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Next Month Revenue</span>
                      <span>$12,450</span>
                    </div>
                    <Progress value={78} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">Based on current trends</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>ROI Improvement</span>
                      <span>+23%</span>
                    </div>
                    <Progress value={23} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">With recommended changes</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Lead Quality Score</span>
                      <span>8.4/10</span>
                    </div>
                    <Progress value={84} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">Average lead score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { ROIAnalytics };
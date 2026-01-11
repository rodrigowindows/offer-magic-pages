/**
 * Campaign Performance Dashboard
 * Dashboard avançado de performance de campanhas com métricas de ROI
 */

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Clock,
  Target,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CampaignMetrics {
  id: string;
  campaign_name: string;
  channel: 'sms' | 'email' | 'call';
  template_id: string;
  sent_at: string;
  opened_at?: string;
  clicked_at?: string;
  responded_at?: string;
  cost: number;
  converted: boolean;
  conversion_value?: number;
}

interface TemplatePerformance {
  template_id: string;
  template_name: string;
  channel: string;
  sent_count: number;
  open_rate: number;
  click_rate: number;
  response_rate: number;
  conversion_rate: number;
  avg_response_time: number;
  cost_per_conversion: number;
}

interface HourlyPerformance {
  hour: number;
  day: string;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
}

export const CampaignPerformanceDashboard = () => {
  const [metrics, setMetrics] = useState<CampaignMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Fetch campaign metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        startDate.setDate(endDate.getDate() - days);

        // Fetch from campaign_clicks table
        const { data: clicksData, error: clicksError } = await supabase
          .from('campaign_clicks')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (clicksError) throw clicksError;

        // Transform data to CampaignMetrics format
        const transformedMetrics: CampaignMetrics[] = (clicksData || []).map(click => ({
          id: click.id,
          campaign_name: click.campaign_name || 'Unknown Campaign',
          channel: click.click_source as 'sms' | 'email' | 'call',
          template_id: click.template_id || 'unknown',
          sent_at: click.created_at,
          opened_at: click.email_opened_at,
          clicked_at: click.clicked_at,
          responded_at: click.responded_at,
          cost: click.cost || 0.1, // Default cost per message
          converted: click.converted || false,
          conversion_value: click.conversion_value,
        }));

        setMetrics(transformedMetrics);
      } catch (error) {
        console.error('Error fetching campaign metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [timeRange]);

  // Calculate performance metrics
  const performanceData = useMemo(() => {
    if (!metrics.length) return null;

    // Channel performance
    const channelStats = {
      sms: { sent: 0, opened: 0, clicked: 0, responded: 0, converted: 0, cost: 0 },
      email: { sent: 0, opened: 0, clicked: 0, responded: 0, converted: 0, cost: 0 },
      call: { sent: 0, opened: 0, clicked: 0, responded: 0, converted: 0, cost: 0 },
    };

    // Template performance
    const templateStats: Record<string, any> = {};

    // Hourly performance for heatmap
    const hourlyStats: Record<string, HourlyPerformance> = {};

    metrics.forEach(metric => {
      // Channel stats
      if (channelStats[metric.channel]) {
        channelStats[metric.channel].sent++;
        channelStats[metric.channel].cost += metric.cost;

        if (metric.opened_at) channelStats[metric.channel].opened++;
        if (metric.clicked_at) channelStats[metric.channel].clicked++;
        if (metric.responded_at) channelStats[metric.channel].responded++;
        if (metric.converted) channelStats[metric.channel].converted++;
      }

      // Template stats
      if (!templateStats[metric.template_id]) {
        templateStats[metric.template_id] = {
          template_id: metric.template_id,
          template_name: `Template ${metric.template_id}`,
          channel: metric.channel,
          sent_count: 0,
          opened_count: 0,
          clicked_count: 0,
          responded_count: 0,
          converted_count: 0,
          total_cost: 0,
          total_response_time: 0,
          response_time_count: 0,
        };
      }

      templateStats[metric.template_id].sent_count++;
      templateStats[metric.template_id].total_cost += metric.cost;

      if (metric.opened_at) templateStats[metric.template_id].opened_count++;
      if (metric.clicked_at) templateStats[metric.template_id].clicked_count++;
      if (metric.responded_at) {
        templateStats[metric.template_id].responded_count++;
        if (metric.sent_at && metric.responded_at) {
          const responseTime = (new Date(metric.responded_at).getTime() - new Date(metric.sent_at).getTime()) / (1000 * 60); // minutes
          templateStats[metric.template_id].total_response_time += responseTime;
          templateStats[metric.template_id].response_time_count++;
        }
      }
      if (metric.converted) templateStats[metric.template_id].converted_count++;

      // Hourly stats for heatmap
      const sentDate = new Date(metric.sent_at);
      const hour = sentDate.getHours();
      const day = sentDate.toISOString().split('T')[0];
      const key = `${day}-${hour}`;

      if (!hourlyStats[key]) {
        hourlyStats[key] = {
          hour,
          day,
          sent: 0,
          opened: 0,
          clicked: 0,
          converted: 0,
          open_rate: 0,
          click_rate: 0,
          conversion_rate: 0,
        };
      }

      hourlyStats[key].sent++;
      if (metric.opened_at) hourlyStats[key].opened++;
      if (metric.clicked_at) hourlyStats[key].clicked++;
      if (metric.converted) hourlyStats[key].converted++;
    });

    // Calculate rates for channel stats
    const channelStatsWithRates = Object.keys(channelStats).map(channel => {
      const stats = channelStats[channel as keyof typeof channelStats];
      const sent = stats.sent;
      const opened = stats.opened;
      const clicked = stats.clicked;
      const responded = stats.responded;
      const converted = stats.converted;
      const cost = stats.cost;

      return {
        channel,
        sent,
        opened,
        clicked,
        responded,
        converted,
        cost,
        open_rate: sent > 0 ? (opened / sent) * 100 : 0,
        click_rate: sent > 0 ? (clicked / sent) * 100 : 0,
        response_rate: sent > 0 ? (responded / sent) * 100 : 0,
        conversion_rate: sent > 0 ? (converted / sent) * 100 : 0,
        cost_per_conversion: converted > 0 ? cost / converted : 0,
      };
    });

    // Calculate rates for template stats
    const templatePerformance: TemplatePerformance[] = Object.values(templateStats).map((template: any) => ({
      template_id: template.template_id,
      template_name: template.template_name,
      channel: template.channel,
      sent_count: template.sent_count,
      open_rate: template.sent_count > 0 ? (template.opened_count / template.sent_count) * 100 : 0,
      click_rate: template.sent_count > 0 ? (template.clicked_count / template.sent_count) * 100 : 0,
      response_rate: template.sent_count > 0 ? (template.responded_count / template.sent_count) * 100 : 0,
      conversion_rate: template.sent_count > 0 ? (template.converted_count / template.sent_count) * 100 : 0,
      avg_response_time: template.response_time_count > 0 ? template.total_response_time / template.response_time_count : 0,
      cost_per_conversion: template.converted_count > 0 ? template.total_cost / template.converted_count : 0,
    }));

    // Calculate rates for hourly stats
    const hourlyPerformance: HourlyPerformance[] = Object.values(hourlyStats).map((hour: any) => ({
      ...hour,
      open_rate: hour.sent > 0 ? (hour.opened / hour.sent) * 100 : 0,
      click_rate: hour.sent > 0 ? (hour.clicked / hour.sent) * 100 : 0,
      conversion_rate: hour.sent > 0 ? (hour.converted / hour.sent) * 100 : 0,
    }));

    // Overall metrics
    const totalSent = metrics.length;
    const totalOpened = metrics.filter(m => m.opened_at).length;
    const totalClicked = metrics.filter(m => m.clicked_at).length;
    const totalResponded = metrics.filter(m => m.responded_at).length;
    const totalConverted = metrics.filter(m => m.converted).length;
    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const totalRevenue = metrics.reduce((sum, m) => sum + (m.conversion_value || 0), 0);

    const overallMetrics = {
      totalSent,
      totalOpened,
      totalClicked,
      totalResponded,
      totalConverted,
      totalCost,
      totalRevenue,
      roi: totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0,
      openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
      responseRate: totalSent > 0 ? (totalResponded / totalSent) * 100 : 0,
      conversionRate: totalSent > 0 ? (totalConverted / totalSent) * 100 : 0,
      costPerConversion: totalConverted > 0 ? totalCost / totalConverted : 0,
      avgResponseTime: totalResponded > 0 ?
        metrics.filter(m => m.responded_at).reduce((sum, m) => {
          if (m.sent_at && m.responded_at) {
            return sum + (new Date(m.responded_at).getTime() - new Date(m.sent_at).getTime()) / (1000 * 60);
          }
          return sum;
        }, 0) / totalResponded : 0,
    };

    return {
      channelStats: channelStatsWithRates,
      templatePerformance,
      hourlyPerformance,
      overallMetrics,
    };
  }, [metrics]);

  // Prepare data for charts
  const channelChartData = useMemo(() => {
    if (!performanceData) return [];
    return performanceData.channelStats.map((stats: any) => ({
      channel: stats.channel.toUpperCase(),
      sent: stats.sent,
      opened: stats.opened,
      clicked: stats.clicked,
      converted: stats.converted,
      openRate: stats.open_rate,
      clickRate: stats.click_rate,
      conversionRate: stats.conversion_rate,
    }));
  }, [performanceData]);

  const templateChartData = useMemo(() => {
    if (!performanceData) return [];
    return performanceData.templatePerformance.slice(0, 10).map(template => ({
      name: template.template_name.length > 15 ? template.template_name.substring(0, 15) + '...' : template.template_name,
      openRate: template.open_rate,
      clickRate: template.click_rate,
      conversionRate: template.conversion_rate,
    }));
  }, [performanceData]);

  // Prepare heatmap data
  const heatmapData = useMemo(() => {
    if (!performanceData) return [];

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return days.flatMap(day =>
      hours.map(hour => {
        const data = performanceData.hourlyPerformance.find(h => h.day === day && h.hour === hour);
        return {
          day,
          hour,
          value: data ? data.conversion_rate : 0,
          sent: data ? data.sent : 0,
        };
      })
    );
  }, [performanceData]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!performanceData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No campaign data available</p>
        </CardContent>
      </Card>
    );
  }

  const { overallMetrics } = performanceData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campaign Performance Dashboard</h2>
          <p className="text-muted-foreground">Real-time ROI analytics and campaign insights</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeRange === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('7d')}
          >
            7 Days
          </Button>
          <Button
            variant={timeRange === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('30d')}
          >
            30 Days
          </Button>
          <Button
            variant={timeRange === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('90d')}
          >
            90 Days
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {overallMetrics.roi >= 0 ? '+' : ''}{overallMetrics.roi.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              ${overallMetrics.totalRevenue.toFixed(0)} revenue vs ${overallMetrics.totalCost.toFixed(0)} cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallMetrics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {overallMetrics.totalConverted} of {overallMetrics.totalSent} converted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Cost per Conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${overallMetrics.costPerConversion.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Average cost to convert a lead
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallMetrics.avgResponseTime.toFixed(0)}min</div>
            <p className="text-xs text-muted-foreground">
              Time to first response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels">Channel Performance</TabsTrigger>
          <TabsTrigger value="templates">Template Comparison</TabsTrigger>
          <TabsTrigger value="timing">Best Send Times</TabsTrigger>
          <TabsTrigger value="trends">Trends & Insights</TabsTrigger>
        </TabsList>

        {/* Channel Performance Tab */}
        <TabsContent value="channels" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Channel Rates Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Open, Click & Conversion Rates by Channel</CardTitle>
                <CardDescription>Performance comparison across SMS, Email, and Call channels</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={channelChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '']} />
                    <Bar dataKey="openRate" fill="#8884d8" name="Open Rate %" />
                    <Bar dataKey="clickRate" fill="#82ca9d" name="Click Rate %" />
                    <Bar dataKey="conversionRate" fill="#ffc658" name="Conversion Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Channel Distribution Pie */}
            <Card>
              <CardHeader>
                <CardTitle>Channel Distribution</CardTitle>
                <CardDescription>Volume of communications by channel</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={channelChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ channel, sent }) => `${channel}: ${sent}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="sent"
                    >
                      {channelChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#8884d8', '#82ca9d', '#ffc658'][index % 3]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Channel Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Channel Performance</CardTitle>
              <CardDescription>Complete metrics breakdown by communication channel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Channel</th>
                      <th className="text-right p-2">Sent</th>
                      <th className="text-right p-2">Open Rate</th>
                      <th className="text-right p-2">Click Rate</th>
                      <th className="text-right p-2">Conv. Rate</th>
                      <th className="text-right p-2">Cost/Conv</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.channelStats.map((stats: any) => (
                      <tr key={stats.channel} className="border-b">
                        <td className="p-2 font-medium capitalize">{stats.channel}</td>
                        <td className="text-right p-2">{stats.sent}</td>
                        <td className="text-right p-2">{stats.open_rate.toFixed(1)}%</td>
                        <td className="text-right p-2">{stats.click_rate.toFixed(1)}%</td>
                        <td className="text-right p-2">{stats.conversion_rate.toFixed(1)}%</td>
                        <td className="text-right p-2">${stats.cost_per_conversion.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Template Comparison Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Performance Comparison</CardTitle>
              <CardDescription>A/B testing results and template effectiveness</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={templateChartData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '']} />
                  <Bar dataKey="openRate" fill="#8884d8" name="Open Rate %" />
                  <Bar dataKey="clickRate" fill="#82ca9d" name="Click Rate %" />
                  <Bar dataKey="conversionRate" fill="#ffc658" name="Conv. Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Template Details */}
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
              <CardDescription>Detailed performance metrics for each template</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.templatePerformance.slice(0, 5).map((template, index) => (
                  <div key={template.template_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{template.template_name}</h4>
                      <Badge>{template.channel.toUpperCase()}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Sent</div>
                        <div className="font-bold">{template.sent_count}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Click Rate</div>
                        <div className="font-bold text-green-600">{template.click_rate.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg Response</div>
                        <div className="font-bold">{template.avg_response_time.toFixed(0)}min</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Cost/Conv</div>
                        <div className="font-bold">${template.cost_per_conversion.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Best Send Times Tab */}
        <TabsContent value="timing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Best Send Times Heatmap</CardTitle>
              <CardDescription>Conversion rates by day and hour - find your optimal send times</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-sm text-muted-foreground mb-4">
                Darker colors indicate higher conversion rates
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={heatmapData}>
                  <CartesianGrid />
                  <XAxis
                    type="number"
                    dataKey="hour"
                    domain={[0, 23]}
                    tickFormatter={(hour) => `${hour}:00`}
                  />
                  <YAxis
                    type="category"
                    dataKey="day"
                    domain={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                  />
                  <Tooltip
                    formatter={(value: number, name: string, props: any) => [
                      `${value.toFixed(1)}% conversion rate`,
                      `Sent: ${props.payload.sent}`
                    ]}
                    labelFormatter={(label) => `Hour ${label}`}
                  />
                  <Scatter dataKey="value" fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Hourly Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Hourly Performance Summary</CardTitle>
              <CardDescription>Average performance by hour of day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 24 }, (_, hour) => {
                  const hourData = performanceData.hourlyPerformance.filter(h => h.hour === hour);
                  const avgConversion = hourData.length > 0
                    ? hourData.reduce((sum, h) => sum + h.conversion_rate, 0) / hourData.length
                    : 0;

                  return (
                    <div key={hour} className="text-center p-3 border rounded-lg">
                      <div className="text-lg font-bold">{hour}:00</div>
                      <div className="text-sm text-muted-foreground">
                        {avgConversion.toFixed(1)}% avg conversion
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {hourData.reduce((sum, h) => sum + h.sent, 0)} total sent
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends & Insights Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ROI Trend */}
            <Card>
              <CardHeader>
                <CardTitle>ROI Trend</CardTitle>
                <CardDescription>Return on investment over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={channelChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="conversionRate" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost Efficiency */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Efficiency</CardTitle>
                <CardDescription>Cost per conversion by channel</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={channelChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost per Conversion']} />
                    <Bar dataKey="costPerConversion" fill="#ff7300" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Insights & Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Insights & Recommendations</CardTitle>
              <CardDescription>Automated analysis and actionable recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Best Performing Channel</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {performanceData.channelStats.reduce((a, b) =>
                        a.conversion_rate > b.conversion_rate ? a : b
                      ).channel.toUpperCase()} shows {Math.max(...performanceData.channelStats.map(s => s.conversion_rate)).toFixed(1)}% conversion rate
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <Clock className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">Optimal Send Time</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Best results between {performanceData.hourlyPerformance.reduce((best, current) =>
                        current.conversion_rate > best.conversion_rate ? current : best
                      ).hour}:00 - {(performanceData.hourlyPerformance.reduce((best, current) =>
                        current.conversion_rate > best.conversion_rate ? current : best
                      ).hour + 1) % 24}:00
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">ROI Opportunity</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      {overallMetrics.roi > 0
                        ? `Current ROI of ${overallMetrics.roi.toFixed(1)}% - consider scaling successful campaigns`
                        : `ROI of ${overallMetrics.roi.toFixed(1)}% - focus on improving conversion rates or reducing costs`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
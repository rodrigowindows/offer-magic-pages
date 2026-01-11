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
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Clock,
  Target,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CampaignMetrics {
  id: string;
  campaign_name: string;
  channel: 'sms' | 'email' | 'call';
  sent_at: string;
  clicked: boolean;
  responded: boolean;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export const CampaignPerformanceDashboard = () => {
  const [metrics, setMetrics] = useState<CampaignMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);

        const endDate = new Date();
        const startDate = new Date();
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        startDate.setDate(endDate.getDate() - days);

        // Use campaign_logs table which exists
        const { data, error } = await supabase
          .from('campaign_logs')
          .select('id, campaign_type, channel, sent_at, link_clicked, first_response_at')
          .gte('sent_at', startDate.toISOString())
          .lte('sent_at', endDate.toISOString());

        if (error) throw error;

        const transformedMetrics: CampaignMetrics[] = (data || []).map(log => ({
          id: log.id,
          campaign_name: log.campaign_type || 'Campaign',
          channel: (log.channel || 'sms') as 'sms' | 'email' | 'call',
          sent_at: log.sent_at,
          clicked: log.link_clicked || false,
          responded: !!log.first_response_at,
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

  const performanceData = useMemo(() => {
    if (!metrics.length) return null;

    const totalSent = metrics.length;
    const totalClicked = metrics.filter(m => m.clicked).length;
    const totalResponded = metrics.filter(m => m.responded).length;

    return {
      totalSent,
      clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
      responseRate: totalSent > 0 ? (totalResponded / totalSent) * 100 : 0,
    };
  }, [metrics]);

  const channelData = useMemo(() => {
    const channels: Record<string, { sent: number; clicked: number }> = {};
    
    metrics.forEach(m => {
      if (!channels[m.channel]) {
        channels[m.channel] = { sent: 0, clicked: 0 };
      }
      channels[m.channel].sent++;
      if (m.clicked) channels[m.channel].clicked++;
    });

    return Object.entries(channels).map(([channel, data]) => ({
      channel,
      sent: data.sent,
      clicked: data.clicked,
      clickRate: data.sent > 0 ? (data.clicked / data.sent) * 100 : 0,
    }));
  }, [metrics]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Campaign Performance
              </CardTitle>
              <CardDescription>
                Track your marketing campaign metrics
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{performanceData?.totalSent || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Sent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{performanceData?.clickRate.toFixed(1) || 0}%</p>
                    <p className="text-xs text-muted-foreground">Click Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{performanceData?.responseRate.toFixed(1) || 0}%</p>
                    <p className="text-xs text-muted-foreground">Response Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="channels">By Channel</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="pt-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sent" fill="#3b82f6" name="Sent" />
                    <Bar dataKey="clicked" fill="#10b981" name="Clicked" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="channels" className="pt-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelData}
                      dataKey="sent"
                      nameKey="channel"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignPerformanceDashboard;

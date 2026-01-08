import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Users, Eye, Mail, MessageSquare, Phone, RefreshCw, Calendar, Target, Zap, Activity, PieChart, LineChart, BarChart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Enhanced Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  description?: string;
  subtitle?: string;
}

const MetricCard = ({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
  iconBgColor,
  iconColor,
  description,
  subtitle
}: MetricCardProps) => {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 bg-green-50 border-green-200';
    if (trend === 'down') return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-gradient-to-br from-white to-gray-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${iconBgColor} group-hover:scale-110 transition-transform duration-300`}>
            <div className={iconColor}>{icon}</div>
          </div>
          {change && (
            <Badge variant="secondary" className={`text-xs font-medium px-2 py-1 ${getTrendColor()} border`}>
              {change}
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-bold text-gray-900 tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {value}
          </div>
          <div className="text-sm font-medium text-gray-600">{title}</div>
          {subtitle && (
            <div className="text-xs text-gray-500">{subtitle}</div>
          )}
          {description && (
            <div className="text-xs text-gray-500 mt-1">{description}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface VisitStats {
  totalVisits: number;
  uniqueProperties: number;
  sourceBreakdown: Record<string, number>;
  campaignBreakdown: Record<string, number>;
  recentVisits: any[];
}

export const CampaignAnalytics = () => {
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Get total visits and unique properties from property_analytics table
      const { data: visits, error: visitsError } = await supabase
        .from('property_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      if (visitsError) throw visitsError;

      // Calculate stats
      const totalVisits = visits?.length || 0;
      const uniqueProperties = new Set(visits?.map(v => v.property_id)).size;

      // Source breakdown - using event_type as source indicator
      const sourceBreakdown: Record<string, number> = {};
      visits?.forEach(visit => {
        sourceBreakdown[visit.event_type || 'unknown'] =
          (sourceBreakdown[visit.event_type || 'unknown'] || 0) + 1;
      });

      // Referrer breakdown as campaign stand-in
      const campaignBreakdown: Record<string, number> = {};
      visits?.forEach(visit => {
        campaignBreakdown[visit.referrer || 'direct'] =
          (campaignBreakdown[visit.referrer || 'direct'] || 0) + 1;
      });

      setStats({
        totalVisits,
        uniqueProperties,
        sourceBreakdown,
        campaignBreakdown,
        recentVisits: visits?.slice(0, 10) || []
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Campaign Analytics</h1>
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaign Analytics</h1>
          <p className="text-muted-foreground">
            Track the performance of your marketing campaigns
          </p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline">
          <BarChart3 className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Enhanced Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Campaign Visits"
          value={stats?.totalVisits || 0}
          change="+12%"
          trend="up"
          icon={<Eye className="h-5 w-5" />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          description="Property page views from all campaigns"
          subtitle="Last 30 days"
        />

        <MetricCard
          title="Unique Properties"
          value={stats?.uniqueProperties || 0}
          change="+8%"
          trend="up"
          icon={<Users className="h-5 w-5" />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          description="Different properties that received traffic"
          subtitle="Active engagement"
        />

        <MetricCard
          title="Conversion Rate"
          value={`${stats?.totalVisits && stats?.uniqueProperties
            ? Math.round((stats.uniqueProperties / stats.totalVisits) * 100)
            : 0}%`}
          change="+5%"
          trend="up"
          icon={<TrendingUp className="h-5 w-5" />}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
          description="Unique visits vs total visits"
          subtitle="Engagement quality"
        />

        <MetricCard
          title="Active Campaigns"
          value="3"
          change="2 running"
          trend="neutral"
          icon={<Target className="h-5 w-5" />}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
          description="Campaigns currently active"
          subtitle="Real-time tracking"
        />
      </div>

      {/* Advanced Analytics Dashboard */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Performance Overview Chart */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <BarChart className="h-5 w-5" />
              Campaign Performance Overview
            </CardTitle>
            <CardDescription>Visits and engagement metrics over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Total Visits</span>
                </div>
                <Badge className="bg-blue-100 text-blue-700">{stats?.totalVisits || 0}</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Unique Properties</span>
                </div>
                <Badge className="bg-green-100 text-green-700">{stats?.uniqueProperties || 0}</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">Conversion Rate</span>
                </div>
                <Badge className="bg-purple-100 text-purple-700">
                  {stats?.totalVisits && stats?.uniqueProperties
                    ? Math.round((stats.uniqueProperties / stats.totalVisits) * 100)
                    : 0}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Channel Distribution */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <PieChart className="h-5 w-5" />
              Traffic Sources Distribution
            </CardTitle>
            <CardDescription>Breakdown by communication channel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.sourceBreakdown && Object.entries(stats.sourceBreakdown)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([source, count]) => {
                  const percentage = stats?.totalVisits ? (count / stats.totalVisits) * 100 : 0;
                  return (
                    <div key={source} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getSourceIcon(source)}
                          <span className="font-medium capitalize text-sm">{source}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">{count}</div>
                          <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="sources" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="sources" className="flex items-center gap-2 text-sm font-medium">
            <Activity className="h-4 w-4" />
            Traffic Sources
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4" />
            Campaign Performance
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            Activity Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traffic by Source</CardTitle>
              <CardDescription>
                Which channels are driving the most visits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.sourceBreakdown && Object.entries(stats.sourceBreakdown)
                  .sort(([,a], [,b]) => b - a)
                  .map(([source, count]) => (
                    <div key={source} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getSourceIcon(source)}
                        <span className="capitalize">{source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${(count / (stats?.totalVisits || 1)) * 100}%`
                            }}
                          />
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>
                Which campaigns are performing best
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.campaignBreakdown && Object.entries(stats.campaignBreakdown)
                  .sort(([,a], [,b]) => b - a)
                  .map(([campaign, count]) => (
                    <div key={campaign} className="flex items-center justify-between">
                      <span className="capitalize">{campaign}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${(count / (stats?.totalVisits || 1)) * 100}%`
                            }}
                          />
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Activity Timeline
              </CardTitle>
              <CardDescription>
                Chronological view of campaign activities and engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stats?.recentVisits && stats.recentVisits.length > 0 ? (
                  stats.recentVisits.slice(0, 10).map((visit, index) => {
                    const isLast = index === stats.recentVisits.slice(0, 10).length - 1;
                    return (
                      <div key={visit.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full ${
                            visit.event_type === 'email' ? 'bg-blue-500' :
                            visit.event_type === 'sms' ? 'bg-green-500' :
                            visit.event_type === 'call' ? 'bg-purple-500' : 'bg-gray-500'
                          }`} />
                          {!isLast && <div className="w-px h-16 bg-gray-300 mt-2" />}
                        </div>

                        <Card className="flex-1 border-0 shadow-sm bg-gradient-to-r from-gray-50 to-white">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {getSourceIcon(visit.event_type)}
                                <div>
                                  <div className="font-semibold text-sm">
                                    Property Visit - {visit.property_id?.slice(0, 8)}...
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {visit.event_type} engagement • {visit.referrer || 'Direct traffic'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  {new Date(visit.created_at).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(visit.created_at).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <div className="text-lg font-medium text-gray-900">No recent activity</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Campaign activity will appear here once visitors start engaging
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignAnalytics;
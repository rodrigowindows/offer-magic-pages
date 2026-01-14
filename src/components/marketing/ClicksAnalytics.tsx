/**
 * Clicks Analytics Dashboard
 * Mostra métricas e análises de cliques nas páginas de propriedades
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart3,
  TrendingUp,
  MousePointerClick,
  Calendar,
  RefreshCw,
  Mail,
  MessageSquare,
  Phone,
  ExternalLink,
} from 'lucide-react';

interface ClickAnalytic {
  id: string;
  property_id: string | null;
  event_type: string;
  source?: string | null;
  campaign_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  contact_name?: string | null;
  property_address?: string | null;
  referrer: string | null;
  user_agent: string | null;
  created_at: string;
  device_type?: string | null;
  ip_address?: string | null;
  city?: string | null;
  country?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
}

interface ClickMetrics {
  total: number;
  bySource: Record<string, number>;
  byCampaign: Record<string, number>;
  byDate: Record<string, number>;
  recentClicks: ClickAnalytic[];
}

export const ClicksAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ClickMetrics>({
    total: 0,
    bySource: {},
    byCampaign: {},
    byDate: {},
    recentClicks: [],
  });
  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'all'>('30');

  useEffect(() => {
    fetchClicksData();
  }, [dateRange]);

  const fetchClicksData = async () => {
    setLoading(true);
    try {
      // Calculate date filter
      let dateFilter: Date | null = null;
      if (dateRange !== 'all') {
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - parseInt(dateRange));
      }

      // Fetch analytics data
      let query = supabase
        .from('property_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      if (dateFilter) {
        query = query.gte('created_at', dateFilter.toISOString());
      }

      const { data, error } = await query.limit(1000);

      if (error) throw error;

      // Process metrics
      const clicks = data || [];
      const bySource: Record<string, number> = {};
      const byCampaign: Record<string, number> = {};
      const byDate: Record<string, number> = {};

      clicks.forEach((click) => {
        // Count by source (use source field, fallback to referrer)
        const source = click.source || click.referrer || 'direct';
        bySource[source] = (bySource[source] || 0) + 1;

        // Count by campaign name
        const campaign = click.campaign_name || click.event_type || 'page_view';
        byCampaign[campaign] = (byCampaign[campaign] || 0) + 1;

        // Count by date (YYYY-MM-DD)
        const date = new Date(click.created_at || '').toISOString().split('T')[0];
        byDate[date] = (byDate[date] || 0) + 1;
      });

      // Map clicks to ClickAnalytic type
      const mappedClicks: ClickAnalytic[] = clicks.map((c) => ({
        id: c.id,
        property_id: c.property_id,
        event_type: c.event_type,
        referrer: c.referrer,
        user_agent: c.user_agent,
        created_at: c.created_at || '',
        device_type: c.device_type,
        ip_address: c.ip_address,
        city: c.city,
        country: c.country,
      }));

      setMetrics({
        total: clicks.length,
        bySource,
        byCampaign,
        byDate,
        recentClicks: mappedClicks.slice(0, 20),
      });
    } catch (error) {
      console.error('Error fetching clicks data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'sms':
        return MessageSquare;
      case 'email':
        return Mail;
      case 'call':
        return Phone;
      default:
        return MousePointerClick;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'sms':
        return 'text-blue-600';
      case 'email':
        return 'text-green-600';
      case 'call':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  // Calculate conversion rates and trends
  const topSource = Object.entries(metrics.bySource).sort((a, b) => b[1] - a[1])[0];
  const topCampaign = Object.entries(metrics.byCampaign).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Clicks Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Track and analyze property page clicks from your campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchClicksData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {dateRange === 'all' ? 'All time' : `Last ${dateRange} days`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Source</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {topSource ? (
              <>
                <div className="text-2xl font-bold capitalize">{topSource[0]}</div>
                <p className="text-xs text-muted-foreground">
                  {topSource[1]} clicks ({((topSource[1] / metrics.total) * 100).toFixed(1)}%)
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Campaign</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {topCampaign ? (
              <>
                <div className="text-2xl font-bold capitalize">{topCampaign[0]}</div>
                <p className="text-xs text-muted-foreground">
                  {topCampaign[1]} clicks ({((topCampaign[1] / metrics.total) * 100).toFixed(1)}%)
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sources</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(metrics.bySource).length}</div>
            <p className="text-xs text-muted-foreground">Active channels</p>
          </CardContent>
        </Card>
      </div>

      {/* Clicks by Source */}
      <Card>
        <CardHeader>
          <CardTitle>Clicks by Source</CardTitle>
          <CardDescription>Distribution of clicks across different channels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(metrics.bySource)
              .sort((a, b) => b[1] - a[1])
              .map(([source, count]) => {
                const Icon = getSourceIcon(source);
                const percentage = (count / metrics.total) * 100;
                return (
                  <div key={source} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-32">
                      <Icon className={`w-4 h-4 ${getSourceColor(source)}`} />
                      <span className="text-sm font-medium capitalize">{source}</span>
                    </div>
                    <div className="flex-1">
                      <div className="h-8 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary flex items-center justify-end px-2"
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-xs font-medium text-primary-foreground">
                            {count}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-sm text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            {Object.keys(metrics.bySource).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No clicks data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clicks by Campaign */}
      <Card>
        <CardHeader>
          <CardTitle>Clicks by Campaign</CardTitle>
          <CardDescription>Performance of each marketing campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(metrics.byCampaign)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([campaign, count]) => {
                const percentage = (count / metrics.total) * 100;
                return (
                  <div key={campaign} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge variant="outline" className="capitalize">
                        {campaign}
                      </Badge>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <span className="text-sm font-medium">{count} clicks</span>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            {Object.keys(metrics.byCampaign).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No campaign data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Clicks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Clicks</CardTitle>
          <CardDescription>Latest property page visits with detailed information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.recentClicks.map((click) => {
              const source = click.source || click.referrer || 'direct';
              const Icon = getSourceIcon(source);
              return (
                <div
                  key={click.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className={`w-5 h-5 mt-0.5 ${getSourceColor(source)}`} />
                      <div className="flex-1 min-w-0">
                        {/* Contact Info */}
                        {(click.contact_name || click.contact_phone || click.contact_email) && (
                          <div className="mb-2">
                            <div className="font-medium text-sm">
                              {click.contact_name || 'Unknown Contact'}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {click.contact_phone && (
                                <Badge variant="secondary" className="text-xs">
                                  📞 {click.contact_phone}
                                </Badge>
                              )}
                              {click.contact_email && (
                                <Badge variant="secondary" className="text-xs">
                                  📧 {click.contact_email}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Property Address */}
                        {click.property_address && (
                          <div className="text-sm text-muted-foreground mb-2">
                            🏠 {click.property_address}
                          </div>
                        )}

                        {/* Badges Row */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant="default" className="capitalize text-xs">
                            {source}
                          </Badge>
                          {click.campaign_name && (
                            <Badge variant="outline" className="text-xs">
                              📋 {click.campaign_name}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="capitalize text-xs">
                            {click.event_type || 'page_view'}
                          </Badge>
                          {click.device_type && (
                            <Badge variant="outline" className="text-xs">
                              {click.device_type === 'mobile' ? '📱' : click.device_type === 'tablet' ? '📱' : '💻'} {click.device_type}
                            </Badge>
                          )}
                        </div>

                        {/* Location & Time Info */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {(click.city || click.country) && (
                            <span>
                              📍 {click.city || 'Unknown'}, {click.country || 'Unknown'}
                            </span>
                          )}
                          {click.ip_address && (
                            <span>
                              🌐 {click.ip_address}
                            </span>
                          )}
                          <span>
                            🕐 {new Date(click.created_at).toLocaleString()}
                          </span>
                        </div>

                        {/* UTM Parameters */}
                        {(click.utm_source || click.utm_medium || click.utm_campaign) && (
                          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                            <span className="font-medium">UTM:</span>{' '}
                            {click.utm_source && <span>Source: {click.utm_source}</span>}
                            {click.utm_medium && <span> • Medium: {click.utm_medium}</span>}
                            {click.utm_campaign && <span> • Campaign: {click.utm_campaign}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {metrics.recentClicks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No recent clicks
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

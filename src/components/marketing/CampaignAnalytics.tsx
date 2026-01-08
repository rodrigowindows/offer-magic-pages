import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Users, Eye, Mail, MessageSquare, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalVisits || 0}</div>
            <p className="text-xs text-muted-foreground">
              Property page views from campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Properties</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.uniqueProperties || 0}</div>
            <p className="text-xs text-muted-foreground">
              Different properties visited
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalVisits && stats?.uniqueProperties
                ? Math.round((stats.uniqueProperties / stats.totalVisits) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Unique visits vs total visits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="sources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sources">Traffic Sources</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
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

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest property visits from your campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.recentVisits.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getSourceIcon(visit.event_type)}
                      <div>
                        <div className="font-medium text-sm">
                          Property {visit.property_id?.slice(0, 8)}...
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {visit.event_type} • {visit.referrer || 'direct'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(visit.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignAnalytics;
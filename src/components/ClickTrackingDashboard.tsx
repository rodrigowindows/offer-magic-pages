import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Cell
} from "recharts";
import {
  MousePointerClick,
  Link,
  Mail,
  MessageSquare,
  Phone,
  TrendingUp,
  Users,
  Clock
} from "lucide-react";

interface ClickStats {
  totalClicks: number;
  linkClicks: number;
  buttonClicks: number;
  emailOpens: number;
  followUpsSent: number;
  clickRate: number;
  openRate: number;
  followUpRate: number;
  channelBreakdown: Record<string, number>;
  followUpBreakdown: Record<string, number>;
  recentClicks: any[];
}

export const ClickTrackingDashboard = () => {
  const [stats, setStats] = useState<ClickStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClickData();
  }, []);

  const fetchClickData = async () => {
    try {
      // Use campaign_logs table with only columns that exist
      const { data, error } = await supabase
        .from("campaign_logs")
        .select(`
          id,
          property_id,
          property_address,
          recipient_name,
          recipient_email,
          recipient_phone,
          channel,
          link_clicked,
          click_count,
          sent_at,
          metadata
        `)
        .order("sent_at", { ascending: false })
        .limit(1000);

      if (error) throw error;

      const clickData = data || [];

      // Calculate stats from available data
      const totalClicks = clickData.reduce((sum, item) => sum + (item.click_count || 0), 0);
      const linkClicks = clickData.filter(item => item.link_clicked).length;
      const totalSent = clickData.length;

      const channelBreakdown = clickData.reduce((acc, item) => {
        const channel = item.channel || 'unknown';
        acc[channel] = (acc[channel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setStats({
        totalClicks,
        linkClicks,
        buttonClicks: 0,
        emailOpens: 0,
        followUpsSent: 0,
        clickRate: totalSent > 0 ? (totalClicks / totalSent) * 100 : 0,
        openRate: 0,
        followUpRate: 0,
        channelBreakdown,
        followUpBreakdown: {},
        recentClicks: clickData.slice(0, 10)
      });

    } catch (error) {
      console.error("Error fetching click data:", error);
      // Set default stats on error
      setStats({
        totalClicks: 0,
        linkClicks: 0,
        buttonClicks: 0,
        emailOpens: 0,
        followUpsSent: 0,
        clickRate: 0,
        openRate: 0,
        followUpRate: 0,
        channelBreakdown: {},
        followUpBreakdown: {},
        recentClicks: []
      });
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const channelData = stats ? Object.entries(stats.channelBreakdown).map(([name, value]) => ({
    name,
    value
  })) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClicks || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Link Clicks</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.linkClicks || 0}</div>
            <p className="text-xs text-muted-foreground">Property links</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.clickRate.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">Of campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-ups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.followUpsSent || 0}</div>
            <p className="text-xs text-muted-foreground">Auto-sent</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Channel Distribution</CardTitle>
                <CardDescription>Clicks by communication channel</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {channelData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key engagement indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Click Rate</span>
                    <Badge variant="secondary">{stats?.clickRate.toFixed(1) || 0}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Open Rate</span>
                    <Badge variant="secondary">{stats?.openRate.toFixed(1) || 0}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Follow-up Rate</span>
                    <Badge variant="secondary">{stats?.followUpRate.toFixed(1) || 0}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>Channel Breakdown</CardTitle>
              <CardDescription>Campaign activity by channel</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Clicks</CardTitle>
              <CardDescription>Latest campaign interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentClicks.map((click, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {click.channel === 'sms' ? (
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                      ) : click.channel === 'email' ? (
                        <Mail className="h-4 w-4 text-green-500" />
                      ) : (
                        <Phone className="h-4 w-4 text-orange-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{click.property_address || 'Unknown Property'}</p>
                        <p className="text-xs text-muted-foreground">{click.recipient_name || click.recipient_email || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={click.link_clicked ? "default" : "secondary"}>
                        {click.link_clicked ? "Clicked" : "Sent"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(click.sent_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                {(!stats?.recentClicks || stats.recentClicks.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent click activity
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

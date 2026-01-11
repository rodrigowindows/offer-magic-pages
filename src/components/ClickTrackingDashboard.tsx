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

interface ClickData {
  id: string;
  property_id: string;
  property_address: string;
  recipient_name: string;
  recipient_email: string;
  recipient_phone: string;
  channel: string;
  link_clicked: boolean;
  link_clicked_at: string;
  click_count: number;
  button_clicked: boolean;
  button_clicked_at: string;
  button_click_count: number;
  button_click_source: string;
  email_opened: boolean;
  email_opened_at: string;
  email_open_count: number;
  sent_at: string;
  follow_up_sent?: boolean;
  follow_up_sent_at?: string;
  follow_up_channel?: string;
  click_source?: string;
  user_agent?: string;
  referrer?: string;
}

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
  recentClicks: ClickData[];
}

export const ClickTrackingDashboard = () => {
  const [stats, setStats] = useState<ClickStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClickData();
  }, []);

  const fetchClickData = async () => {
    try {
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
          link_clicked_at,
          click_count,
          button_clicked,
          button_clicked_at,
          button_click_count,
          button_click_source,
          email_opened,
          email_opened_at,
          email_open_count,
          sent_at,
          follow_up_sent,
          follow_up_sent_at,
          follow_up_channel,
          click_source,
          user_agent,
          referrer
        `)
        .order("sent_at", { ascending: false })
        .limit(1000);

      if (error) throw error;

      const clickData = data || [];

      // Calculate stats
      const totalClicks = clickData.reduce((sum, item) => sum + (item.click_count || 0) + (item.button_click_count || 0), 0);
      const linkClicks = clickData.filter(item => item.link_clicked).length;
      const buttonClicks = clickData.filter(item => item.button_clicked).length;
      const emailOpens = clickData.filter(item => item.email_opened).length;
      const followUpsSent = clickData.filter(item => item.follow_up_sent).length;
      const totalSent = clickData.length;

      const channelBreakdown = clickData.reduce((acc, item) => {
        acc[item.channel] = (acc[item.channel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const followUpBreakdown = clickData
        .filter(item => item.follow_up_channel)
        .reduce((acc, item) => {
          acc[item.follow_up_channel!] = (acc[item.follow_up_channel!] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const recentClicks = clickData
        .filter(item => item.link_clicked || item.button_clicked)
        .slice(0, 10);

      setStats({
        totalClicks,
        linkClicks,
        buttonClicks,
        emailOpens,
        followUpsSent,
        clickRate: totalSent > 0 ? (totalClicks / totalSent) * 100 : 0,
        openRate: totalSent > 0 ? (emailOpens / totalSent) * 100 : 0,
        followUpRate: totalClicks > 0 ? (followUpsSent / totalClicks) * 100 : 0,
        channelBreakdown,
        followUpBreakdown,
        recentClicks
      });

    } catch (error) {
      console.error("Error fetching click data:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Click Tracking Analytics</CardTitle>
          <CardDescription>Loading click data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Click Tracking Analytics</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const channelData = Object.entries(stats.channelBreakdown).map(([channel, count]) => ({
    name: channel.toUpperCase(),
    value: count
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.clickRate.toFixed(1)}% click rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Link Clicks</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.linkClicks}</div>
            <p className="text-xs text-muted-foreground">
              Direct link clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Button Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.buttonClicks}</div>
            <p className="text-xs text-muted-foreground">
              CTA button clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Opens</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emailOpens}</div>
            <p className="text-xs text-muted-foreground">
              {stats.openRate.toFixed(1)}% open rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Follow-up Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Follow-ups</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.followUpsSent}</div>
            <p className="text-xs text-muted-foreground">
              {stats.followUpRate.toFixed(1)}% of clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-up Channels</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              {Object.entries(stats.followUpBreakdown).map(([channel, count]) => (
                <div key={channel} className="flex justify-between">
                  <span className="capitalize">{channel}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
              {Object.keys(stats.followUpBreakdown).length === 0 && (
                <span className="text-muted-foreground">No follow-ups yet</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Sources</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              {stats.recentClicks.slice(0, 3).map((click, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="truncate max-w-[120px]">{click.property_address}</span>
                  <Badge variant="outline" className="text-xs">
                    {click.click_source || click.channel}
                  </Badge>
                </div>
              ))}
              {stats.recentClicks.length === 0 && (
                <span className="text-muted-foreground">No recent clicks</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="channels">By Channel</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Click Performance</CardTitle>
              <CardDescription>
                Overview of link clicks, button clicks, and email opens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Link Clicks', value: stats.linkClicks },
                  { name: 'Button Clicks', value: stats.buttonClicks },
                  { name: 'Email Opens', value: stats.emailOpens }
                ]}>
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

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clicks by Channel</CardTitle>
              <CardDescription>
                Distribution of clicks across different marketing channels
              </CardDescription>
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
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Click Activity</CardTitle>
              <CardDescription>
                Latest clicks and interactions from your campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentClicks.map((click) => (
                  <div key={click.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{click.property_address}</span>
                        <Badge variant="outline">{click.channel}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {click.recipient_name || click.recipient_email || click.recipient_phone}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {click.link_clicked && (
                          <span className="flex items-center gap-1">
                            <Link className="w-3 h-3" />
                            Link clicked
                          </span>
                        )}
                        {click.button_clicked && (
                          <span className="flex items-center gap-1">
                            <MousePointerClick className="w-3 h-3" />
                            Button clicked ({click.button_click_source})
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(click.sent_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {stats.recentClicks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent clicks to display
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
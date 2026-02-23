import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Mail, MessageSquare, Phone, TrendingUp, Clock, MousePointer, Users } from "lucide-react";

export const ChannelAnalytics = () => {
  const { data: campaignLogs } = useQuery({
    queryKey: ["campaign-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_logs")
        .select("*")
        .order("sent_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate channel metrics
  const channelMetrics = campaignLogs?.reduce((acc, log) => {
    const channel = log.channel || log.campaign_type || "email";
    if (!acc[channel]) {
      acc[channel] = { sent: 0, clicked: 0, responded: 0, totalResponseTime: 0, responseCount: 0 };
    }
    acc[channel].sent += 1;
    if (log.link_clicked) acc[channel].clicked += 1;
    if (log.first_response_at) {
      acc[channel].responded += 1;
      if (log.response_time_seconds) {
        acc[channel].totalResponseTime += log.response_time_seconds;
        acc[channel].responseCount += 1;
      }
    }
    return acc;
  }, {} as Record<string, { sent: number; clicked: number; responded: number; totalResponseTime: number; responseCount: number }>);

  const channelData = Object.entries(channelMetrics || {}).map(([channel, metrics]) => ({
    channel: channel.charAt(0).toUpperCase() + channel.slice(1),
    sent: metrics.sent,
    clicked: metrics.clicked,
    responded: metrics.responded,
    clickRate: metrics.sent > 0 ? ((metrics.clicked / metrics.sent) * 100).toFixed(1) : 0,
    responseRate: metrics.sent > 0 ? ((metrics.responded / metrics.sent) * 100).toFixed(1) : 0,
    avgResponseTime: metrics.responseCount > 0 
      ? Math.round(metrics.totalResponseTime / metrics.responseCount / 3600) 
      : 0,
  }));

  // Time-based analytics (last 30 days)
  const last30Days = campaignLogs?.filter(log => {
    const sentDate = new Date(log.sent_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return sentDate >= thirtyDaysAgo;
  });

  const dailyData = last30Days?.reduce((acc, log) => {
    const date = new Date(log.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!acc[date]) {
      acc[date] = { date, sent: 0, clicked: 0, responded: 0 };
    }
    acc[date].sent += 1;
    if (log.link_clicked) acc[date].clicked += 1;
    if (log.first_response_at) acc[date].responded += 1;
    return acc;
  }, {} as Record<string, { date: string; sent: number; clicked: number; responded: number }>);

  const timeSeriesData = Object.values(dailyData || {}).slice(-14);

  // Overall stats
  const totalSent = campaignLogs?.length || 0;
  const totalClicked = campaignLogs?.filter(l => l.link_clicked).length || 0;
  const totalResponded = campaignLogs?.filter(l => l.first_response_at).length || 0;
  const overallClickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : 0;
  const overallResponseRate = totalSent > 0 ? ((totalResponded / totalSent) * 100).toFixed(1) : 0;

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  const pieData = channelData.map(d => ({ name: d.channel, value: d.sent }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSent}</p>
                <p className="text-xs text-muted-foreground">Total Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-2/10 rounded-lg">
                <MousePointer className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallClickRate}%</p>
                <p className="text-xs text-muted-foreground">Click Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-3/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallResponseRate}%</p>
                <p className="text-xs text-muted-foreground">Response Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-4/10 rounded-lg">
                <Clock className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalResponded}</p>
                <p className="text-xs text-muted-foreground">Responses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Channel Performance Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Channel Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={channelData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="channel" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="sent" fill="hsl(var(--primary))" name="Sent" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicked" fill="hsl(var(--chart-2))" name="Clicked" radius={[4, 4, 0, 0]} />
                <Bar dataKey="responded" fill="hsl(var(--chart-3))" name="Responded" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Channel Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Channel Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trend Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campaign Trend (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Line type="monotone" dataKey="sent" stroke="hsl(var(--primary))" strokeWidth={2} name="Sent" />
              <Line type="monotone" dataKey="clicked" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Clicked" />
              <Line type="monotone" dataKey="responded" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Responded" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Channel Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Channel Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium">Channel</th>
                  <th className="text-right py-3 px-2 font-medium">Sent</th>
                  <th className="text-right py-3 px-2 font-medium">Clicked</th>
                  <th className="text-right py-3 px-2 font-medium">Click Rate</th>
                  <th className="text-right py-3 px-2 font-medium">Responded</th>
                  <th className="text-right py-3 px-2 font-medium">Response Rate</th>
                  <th className="text-right py-3 px-2 font-medium">Avg Response (hrs)</th>
                </tr>
              </thead>
              <tbody>
                {channelData.map((row) => (
                  <tr key={row.channel} className="border-b border-border/50">
                    <td className="py-3 px-2 flex items-center gap-2">
                      {row.channel === 'Email' && <Mail className="h-4 w-4 text-primary" />}
                      {row.channel === 'Sms' && <MessageSquare className="h-4 w-4 text-chart-2" />}
                      {row.channel === 'Call' && <Phone className="h-4 w-4 text-chart-3" />}
                      {row.channel}
                    </td>
                    <td className="text-right py-3 px-2">{row.sent}</td>
                    <td className="text-right py-3 px-2">{row.clicked}</td>
                    <td className="text-right py-3 px-2 font-medium text-primary">{row.clickRate}%</td>
                    <td className="text-right py-3 px-2">{row.responded}</td>
                    <td className="text-right py-3 px-2 font-medium text-chart-3">{row.responseRate}%</td>
                    <td className="text-right py-3 px-2">{row.avgResponseTime}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
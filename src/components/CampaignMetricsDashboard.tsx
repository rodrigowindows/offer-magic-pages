import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Phone,
  MousePointer,
  MessageSquare,
  Mail,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface CampaignMetrics {
  totalSent: number;
  callsReceived: number;
  linksClicked: number;
  smsReplies: number;
  emailsOpened: number;
  emailsClicked: number;
  avgResponseTime: number;
  conversionRate: number;
  recentActivity: Array<{
    property_address: string;
    event_type: string;
    timestamp: string;
    message?: string;
  }>;
}

export const CampaignMetricsDashboard = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['campaign-metrics', timeRange],
    queryFn: async () => {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('campaign_logs')
        .select(`
          *,
          properties (
            address,
            city,
            state,
            zip_code
          )
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate metrics
      const totalSent = data?.length || 0;
      const callsReceived = data?.filter(log => log.call_received).length || 0;
      const linksClicked = data?.filter(log => log.link_clicked).length || 0;
      const smsReplies = data?.filter(log => log.sms_reply_received).length || 0;
      const emailsOpened = data?.filter(log => log.email_opened).length || 0;
      const emailsClicked = data?.filter(log => log.email_clicked).length || 0;

      // Calculate average response time for calls
      const responseTimes = data
        ?.filter(log => log.first_response_at && log.created_at)
        .map(log => {
          const sent = new Date(log.created_at);
          const responded = new Date(log.first_response_at);
          return responded.getTime() - sent.getTime();
        }) || [];

      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      const conversionRate = totalSent > 0 ? ((callsReceived + linksClicked) / totalSent) * 100 : 0;

      // Recent activity (last 10 events)
      const recentActivity = data
        ?.filter(log => log.webhook_events && log.webhook_events.length > 0)
        .slice(0, 10)
        .map(log => ({
          property_address: `${log.properties?.address}, ${log.properties?.city}`,
          event_type: log.webhook_events[log.webhook_events.length - 1]?.event_type || 'unknown',
          timestamp: log.webhook_events[log.webhook_events.length - 1]?.timestamp || log.created_at,
          message: log.webhook_events[log.webhook_events.length - 1]?.message
        })) || [];

      return {
        totalSent,
        callsReceived,
        linksClicked,
        smsReplies,
        emailsOpened,
        emailsClicked,
        avgResponseTime,
        conversionRate,
        recentActivity
      } as CampaignMetrics;
    }
  });

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'call_received': return <Phone className="h-4 w-4 text-green-600" />;
      case 'link_clicked': return <MousePointer className="h-4 w-4 text-blue-600" />;
      case 'sms_reply': return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'email_opened': return <Mail className="h-4 w-4 text-orange-600" />;
      case 'email_clicked': return <MousePointer className="h-4 w-4 text-blue-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'call_received': return 'Call Received';
      case 'link_clicked': return 'Link Clicked';
      case 'sms_reply': return 'SMS Reply';
      case 'email_opened': return 'Email Opened';
      case 'email_clicked': return 'Email Clicked';
      default: return 'Unknown Event';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex gap-2">
        {(['7d', '30d', '90d'] as const).map((range) => (
          <Badge
            key={range}
            variant={timeRange === range ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setTimeRange(range)}
          >
            {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}
          </Badge>
        ))}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaigns Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalSent || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total campaigns sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls Received</CardTitle>
            <Phone className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics?.callsReceived || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.totalSent ? ((metrics.callsReceived / metrics.totalSent) * 100).toFixed(1) : 0}% response rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Links Clicked</CardTitle>
            <MousePointer className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics?.linksClicked || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.totalSent ? ((metrics.linksClicked / metrics.totalSent) * 100).toFixed(1) : 0}% click rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatTime(metrics?.avgResponseTime || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average time to first response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Conversion Rate
          </CardTitle>
          <CardDescription>
            Overall campaign effectiveness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Conversion Rate</span>
              <span className="text-sm font-bold">{metrics?.conversionRate.toFixed(1) || 0}%</span>
            </div>
            <Progress value={metrics?.conversionRate || 0} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Based on calls received + links clicked
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Recent Campaign Activity
          </CardTitle>
          <CardDescription>
            Latest responses and interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
              metrics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getEventIcon(activity.event_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activity.property_address}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getEventLabel(activity.event_type)} • {new Date(activity.timestamp).toLocaleString()}
                    </p>
                    {activity.message && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        "{activity.message}"
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent campaign activity</p>
                <p className="text-xs">Webhook events will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
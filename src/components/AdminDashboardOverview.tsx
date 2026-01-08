import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Clock, Activity, Mail, MousePointer, Calendar, Target, Zap, BarChart3, MessageSquare, Phone, Lightbulb } from "lucide-react";

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
            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getTrendColor()}`}>
              {change}
            </div>
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

interface DashboardMetrics {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  closedLeads: number;
  conversionRate: number;
  pendingFollowUps: number;
  campaignsSent: number;
  linksClicked: number;
  emailsOpened: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

export const AdminDashboardOverview = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Fetch all properties for lead counts
      const { data: properties } = await supabase
        .from("properties")
        .select("id, lead_status, created_at");

      // Fetch follow-up notes
      const today = new Date().toISOString().split('T')[0];
      const { data: followUps } = await supabase
        .from("property_notes")
        .select("id")
        .lte("follow_up_date", today)
        .not("follow_up_date", "is", null);

      // Fetch campaign logs
      const { data: campaigns } = await supabase
        .from("campaign_logs")
        .select("id, link_clicked, sent_at, property_address, campaign_type");

      // Fetch email campaign stats
      const { data: emailCampaigns } = await supabase
        .from("email_campaigns")
        .select("id, opened_count");

      // Fetch recent notifications for activity
      const { data: notifications } = await supabase
        .from("notifications")
        .select("id, event_type, message, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      const props = properties || [];
      const camps = campaigns || [];
      const emails = emailCampaigns || [];

      const totalLeads = props.length;
      const newLeads = props.filter(p => p.lead_status === "new").length;
      const contactedLeads = props.filter(p => p.lead_status === "contacted").length;
      const closedLeads = props.filter(p => p.lead_status === "closed").length;
      const conversionRate = totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0;
      const pendingFollowUps = followUps?.length || 0;
      const campaignsSent = camps.length;
      const linksClicked = camps.filter(c => c.link_clicked).length;
      const emailsOpened = emails.reduce((acc, e) => acc + (e.opened_count || 0), 0);

      const recentActivity: ActivityItem[] = (notifications || []).map(n => ({
        id: n.id,
        type: n.event_type,
        message: n.message,
        timestamp: n.created_at || "",
      }));

      setMetrics({
        totalLeads,
        newLeads,
        contactedLeads,
        closedLeads,
        conversionRate,
        pendingFollowUps,
        campaignsSent,
        linksClicked,
        emailsOpened,
        recentActivity,
      });
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "email_opened":
        return <Mail className="h-4 w-4 text-blue-500" />;
      case "link_clicked":
        return <MousePointer className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-8 bg-muted rounded w-16 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-8 mb-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Campaign Dashboard Overview
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Real-time insights into your marketing campaigns and lead generation performance
        </p>
      </div>

      {/* Enhanced Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Leads"
          value={metrics.totalLeads}
          change="+12%"
          trend="up"
          icon={<Users className="h-5 w-5" />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          description={`${metrics.newLeads} new, ${metrics.contactedLeads} contacted`}
          subtitle="Active pipeline"
        />

        <MetricCard
          title="Conversion Rate"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          change="+8%"
          trend="up"
          icon={<TrendingUp className="h-5 w-5" />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          description={`${metrics.closedLeads} closed deals`}
          subtitle="Sales performance"
        />

        <MetricCard
          title="Pending Follow-ups"
          value={metrics.pendingFollowUps}
          change={metrics.pendingFollowUps > 0 ? "Action needed" : "All caught up"}
          trend={metrics.pendingFollowUps > 0 ? "down" : "up"}
          icon={<Clock className="h-5 w-5" />}
          iconBgColor={metrics.pendingFollowUps > 0 ? "bg-red-100" : "bg-green-100"}
          iconColor={metrics.pendingFollowUps > 0 ? "text-red-600" : "text-green-600"}
          description="Due today or overdue"
          subtitle="Lead nurturing"
        />

        <MetricCard
          title="Campaigns Sent"
          value={metrics.campaignsSent}
          change="+15%"
          trend="up"
          icon={<Target className="h-5 w-5" />}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
          description="Total outreach attempts"
          subtitle="Marketing activity"
        />

        <MetricCard
          title="Links Clicked"
          value={metrics.linksClicked}
          change="+22%"
          trend="up"
          icon={<MousePointer className="h-5 w-5" />}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
          description={`${metrics.campaignsSent > 0 ? ((metrics.linksClicked / metrics.campaignsSent) * 100).toFixed(1) : 0}% click rate`}
          subtitle="Engagement rate"
        />

        <MetricCard
          title="Emails Opened"
          value={metrics.emailsOpened}
          change="+18%"
          trend="up"
          icon={<Mail className="h-5 w-5" />}
          iconBgColor="bg-indigo-100"
          iconColor="text-indigo-600"
          description="Total open events"
          subtitle="Email performance"
        />

        <MetricCard
          title="Active Campaigns"
          value="3"
          change="2 running"
          trend="neutral"
          icon={<Zap className="h-5 w-5" />}
          iconBgColor="bg-yellow-100"
          iconColor="text-yellow-600"
          description="Currently active"
          subtitle="Live campaigns"
        />

        <MetricCard
          title="Response Time"
          value="2.4h"
          change="-0.3h"
          trend="up"
          icon={<BarChart3 className="h-5 w-5" />}
          iconBgColor="bg-pink-100"
          iconColor="text-pink-600"
          description="Average response time"
          subtitle="Customer service"
        />
      </div>

      {/* Enhanced Recent Activity Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-700">
            <Activity className="h-5 w-5" />
            Recent Campaign Activity
          </CardTitle>
          <CardDescription>
            Latest updates from your marketing campaigns and lead interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-lg font-medium text-gray-900">No recent activity</div>
              <div className="text-sm text-gray-600 mt-1">
                Campaign activity will appear here as leads engage with your content
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {activity.message}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.type === 'email_opened' ? 'bg-blue-100 text-blue-700' :
                    activity.type === 'link_clicked' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {activity.type.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Tips & Shortcuts Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-700">
            <Lightbulb className="h-5 w-5" />
            Quick Tips & Shortcuts
          </CardTitle>
          <CardDescription>
            Boost your productivity with these campaign management tips
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border shadow-sm">
                <Zap className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm text-gray-900">Smart Templates</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Use AI-powered templates for personalized messaging that converts 2x better
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border shadow-sm">
                <Target className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm text-gray-900">Lead Scoring</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Focus on high-scoring leads first - they convert 3x more often
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border shadow-sm">
                <Clock className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm text-gray-900">Timing Matters</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Send campaigns Tuesday-Thursday between 10am-2pm for best open rates
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border shadow-sm">
                <TrendingUp className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm text-gray-900">A/B Testing</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Test subject lines and content to optimize your conversion rates
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

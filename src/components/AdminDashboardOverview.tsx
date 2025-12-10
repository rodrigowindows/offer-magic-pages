import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Clock, Activity, Mail, MousePointer, Calendar, Target } from "lucide-react";

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
    <div className="space-y-6 mb-8">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Dashboard Overview</h2>
        
        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Total Leads</CardDescription>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.totalLeads}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.newLeads} new, {metrics.contactedLeads} contacted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Conversion Rate</CardDescription>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {metrics.conversionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.closedLeads} closed deals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Pending Follow-ups</CardDescription>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${metrics.pendingFollowUps > 0 ? 'text-orange-500' : ''}`}>
                {metrics.pendingFollowUps}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Due today or overdue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Campaigns Sent</CardDescription>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.campaignsSent}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total outreach attempts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Links Clicked</CardDescription>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{metrics.linksClicked}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.campaignsSent > 0 
                  ? `${((metrics.linksClicked / metrics.campaignsSent) * 100).toFixed(1)}% click rate`
                  : "No campaigns yet"
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Emails Opened</CardDescription>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.emailsOpened}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total open events
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Recent Activity</CardDescription>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metrics.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                <div className="space-y-2">
                  {metrics.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 text-sm">
                      {getActivityIcon(activity.type)}
                      <span className="flex-1 truncate">{activity.message}</span>
                      <span className="text-muted-foreground text-xs whitespace-nowrap">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

/**
 * Campaign Performance Summary
 * Shows top-level campaign metrics with sparkline-style indicators
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Megaphone, Mail, MessageSquare, Phone, FileText, TrendingUp, Target, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMemo } from "react";

export const CampaignPerformanceSummary = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["campaign-perf-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_logs")
        .select("id, campaign_type, channel, status, link_clicked, first_response_at, sent_at, click_count, response_time_seconds")
        .order("sent_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const metrics = useMemo(() => {
    if (!logs || logs.length === 0) return null;

    const total = logs.length;
    const clicked = logs.filter(l => l.link_clicked).length;
    const responded = logs.filter(l => l.first_response_at).length;
    const totalClicks = logs.reduce((s, l) => s + (l.click_count || 0), 0);

    const byChannel: Record<string, { sent: number; clicked: number; responded: number }> = {};
    logs.forEach(l => {
      const ch = l.channel || l.campaign_type || "other";
      if (!byChannel[ch]) byChannel[ch] = { sent: 0, clicked: 0, responded: 0 };
      byChannel[ch].sent++;
      if (l.link_clicked) byChannel[ch].clicked++;
      if (l.first_response_at) byChannel[ch].responded++;
    });

    const channels = Object.entries(byChannel)
      .map(([name, m]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        ...m,
        clickRate: m.sent > 0 ? (m.clicked / m.sent) * 100 : 0,
        responseRate: m.sent > 0 ? (m.responded / m.sent) * 100 : 0,
      }))
      .sort((a, b) => b.sent - a.sent);

    const avgResponseTime = logs
      .filter(l => l.response_time_seconds)
      .reduce((s, l) => s + (l.response_time_seconds || 0), 0);
    const responseCount = logs.filter(l => l.response_time_seconds).length;

    const lastSent = logs[0]?.sent_at;

    return {
      total,
      clicked,
      responded,
      totalClicks,
      clickRate: total > 0 ? (clicked / total) * 100 : 0,
      responseRate: total > 0 ? (responded / total) * 100 : 0,
      avgResponseHours: responseCount > 0 ? Math.round(avgResponseTime / responseCount / 3600) : null,
      channels,
      lastSent,
    };
  }, [logs]);

  const getChannelIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("email")) return <Mail className="h-4 w-4" />;
    if (lower.includes("sms")) return <MessageSquare className="h-4 w-4" />;
    if (lower.includes("call")) return <Phone className="h-4 w-4" />;
    if (lower.includes("letter")) return <FileText className="h-4 w-4" />;
    return <Megaphone className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6"><div className="h-48 bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No campaigns sent yet</p>
          <p className="text-sm mt-1">Start a campaign to see performance metrics here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Megaphone className="h-5 w-5 text-primary" />
          Campaign Performance
          {metrics.lastSent && (
            <Badge variant="secondary" className="text-xs font-normal ml-auto">
              Last: {formatDistanceToNow(new Date(metrics.lastSent), { addSuffix: true })}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-muted/50 rounded-xl text-center">
            <Target className="h-4 w-4 mx-auto text-primary mb-1" />
            <div className="text-2xl font-bold text-foreground">{metrics.total.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Sent</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-xl text-center">
            <TrendingUp className="h-4 w-4 mx-auto text-secondary mb-1" />
            <div className="text-2xl font-bold text-foreground">{metrics.clickRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Click Rate</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-xl text-center">
            <MessageSquare className="h-4 w-4 mx-auto text-accent mb-1" />
            <div className="text-2xl font-bold text-foreground">{metrics.responseRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Response Rate</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-xl text-center">
            <Clock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <div className="text-2xl font-bold text-foreground">
              {metrics.avgResponseHours !== null ? `${metrics.avgResponseHours}h` : "—"}
            </div>
            <div className="text-xs text-muted-foreground">Avg Response</div>
          </div>
        </div>

        {/* Channel Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">By Channel</h4>
          {metrics.channels.map(ch => (
            <div key={ch.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-foreground font-medium">
                  {getChannelIcon(ch.name)} {ch.name}
                </span>
                <span className="text-muted-foreground">
                  {ch.sent} sent · {ch.clickRate.toFixed(0)}% clicks · {ch.responseRate.toFixed(0)}% response
                </span>
              </div>
              <div className="flex gap-1">
                <Progress value={ch.clickRate} className="h-1.5 flex-1" />
                <Progress value={ch.responseRate} className="h-1.5 flex-1 [&>div]:bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

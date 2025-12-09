import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Clock, TrendingUp, Zap } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { differenceInHours, differenceInMinutes } from "date-fns";

interface ResponseTimeData {
  averageHours: number;
  fastestMinutes: number;
  slowestHours: number;
  responsesByTimeRange: { range: string; count: number }[];
}

interface ResponseTimeAnalyticsProps {
  propertyId?: string;
}

export function ResponseTimeAnalytics({ propertyId }: ResponseTimeAnalyticsProps) {
  const [data, setData] = useState<ResponseTimeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateResponseTimes();
  }, [propertyId]);

  const calculateResponseTimes = async () => {
    try {
      let query = supabase
        .from("campaign_logs")
        .select("sent_at, clicked_at, link_clicked")
        .eq("link_clicked", true)
        .not("clicked_at", "is", null);

      if (propertyId) {
        query = query.eq("property_id", propertyId);
      }

      const { data: campaigns, error } = await query;

      if (error) throw error;

      if (!campaigns || campaigns.length === 0) {
        setData(null);
        setLoading(false);
        return;
      }

      // Calculate response times
      const responseTimes = campaigns.map((c) => {
        const sent = new Date(c.sent_at);
        const clicked = new Date(c.clicked_at!);
        return {
          minutes: differenceInMinutes(clicked, sent),
          hours: differenceInHours(clicked, sent),
        };
      });

      const totalMinutes = responseTimes.reduce((sum, r) => sum + r.minutes, 0);
      const averageMinutes = totalMinutes / responseTimes.length;
      const fastestMinutes = Math.min(...responseTimes.map((r) => r.minutes));
      const slowestMinutes = Math.max(...responseTimes.map((r) => r.minutes));

      // Group by time ranges
      const ranges = [
        { label: "< 1 hour", min: 0, max: 60 },
        { label: "1-6 hours", min: 60, max: 360 },
        { label: "6-24 hours", min: 360, max: 1440 },
        { label: "1-3 days", min: 1440, max: 4320 },
        { label: "> 3 days", min: 4320, max: Infinity },
      ];

      const responsesByTimeRange = ranges.map((range) => ({
        range: range.label,
        count: responseTimes.filter(
          (r) => r.minutes >= range.min && r.minutes < range.max
        ).length,
      }));

      setData({
        averageHours: Math.round(averageMinutes / 60 * 10) / 10,
        fastestMinutes,
        slowestHours: Math.round(slowestMinutes / 60),
        responsesByTimeRange,
      });
    } catch (error) {
      console.error("Error calculating response times:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Response Time Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <TrendingUp className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{data.averageHours}h</p>
            <p className="text-xs text-muted-foreground">Avg Response</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Zap className="h-4 w-4 mx-auto text-green-500 mb-1" />
            <p className="text-lg font-bold">{data.fastestMinutes}m</p>
            <p className="text-xs text-muted-foreground">Fastest</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Clock className="h-4 w-4 mx-auto text-orange-500 mb-1" />
            <p className="text-lg font-bold">{data.slowestHours}h</p>
            <p className="text-xs text-muted-foreground">Slowest</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={data.responsesByTimeRange}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="range" className="text-xs" tick={{ fontSize: 10 }} />
            <YAxis className="text-xs" tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

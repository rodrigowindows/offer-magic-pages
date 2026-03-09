import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  properties: Array<{ created_at?: string; lead_status?: string }>;
}

export const LeadTrendChart = ({ properties }: Props) => {
  const data = useMemo(() => {
    const byWeek: Record<string, { total: number; new: number; contacted: number; closed: number }> = {};

    properties.forEach((p) => {
      if (!p.created_at) return;
      const d = new Date(p.created_at);
      // Group by week
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      if (!byWeek[key]) byWeek[key] = { total: 0, new: 0, contacted: 0, closed: 0 };
      byWeek[key].total += 1;
      const s = p.lead_status || "new";
      if (s === "new") byWeek[key].new += 1;
      if (s === "contacted") byWeek[key].contacted += 1;
      if (s === "closed") byWeek[key].closed += 1;
    });

    return Object.entries(byWeek)
      .map(([week, counts]) => ({ week, ...counts }))
      .slice(-12);
  }, [properties]);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Lead Acquisition Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="week" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="hsl(var(--primary))"
              fill="url(#colorTotal)"
              strokeWidth={2}
              name="Total"
            />
            <Area
              type="monotone"
              dataKey="closed"
              stroke="hsl(142 71% 45%)"
              fill="url(#colorClosed)"
              strokeWidth={2}
              name="Closed"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

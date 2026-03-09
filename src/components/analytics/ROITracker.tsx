import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { DollarSign, TrendingUp, ArrowUpRight } from "lucide-react";

export const ROITracker = () => {
  const { data: campaigns } = useQuery({
    queryKey: ["roi-campaign-data"],
    queryFn: async () => {
      const { data } = await supabase
        .from("campaign_logs")
        .select("campaign_type, channel, link_clicked, first_response_at, property_address");
      return data || [];
    },
  });

  const { data: properties } = useQuery({
    queryKey: ["roi-properties"],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, lead_status, cash_offer_amount, estimated_value, lead_captured");
      return data || [];
    },
  });

  const roiData = useMemo(() => {
    if (!campaigns) return [];

    const byChannel: Record<string, { sent: number; clicked: number; responded: number; leads: number }> = {};

    campaigns.forEach((c) => {
      const ch = c.channel || c.campaign_type || "other";
      if (!byChannel[ch]) byChannel[ch] = { sent: 0, clicked: 0, responded: 0, leads: 0 };
      byChannel[ch].sent += 1;
      if (c.link_clicked) byChannel[ch].clicked += 1;
      if (c.first_response_at) byChannel[ch].responded += 1;
    });

    return Object.entries(byChannel).map(([channel, m]) => ({
      channel: channel.charAt(0).toUpperCase() + channel.slice(1),
      sent: m.sent,
      engagement: m.sent > 0 ? Number(((m.clicked / m.sent) * 100).toFixed(1)) : 0,
      response: m.sent > 0 ? Number(((m.responded / m.sent) * 100).toFixed(1)) : 0,
    }));
  }, [campaigns]);

  const totalValue = properties?.filter(p => p.lead_status === "closed")
    .reduce((s, p) => s + (Number(p.cash_offer_amount) || 0), 0) || 0;

  const capturedLeads = properties?.filter(p => p.lead_captured).length || 0;
  const totalCampaigns = campaigns?.length || 0;
  const costPerLead = capturedLeads > 0 ? (totalCampaigns * 0.5 / capturedLeads).toFixed(2) : "N/A";

  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          ROI & Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-xl">
            <DollarSign className="h-5 w-5 mx-auto text-primary mb-1" />
            <div className="text-xl font-bold text-foreground">
              ${(totalValue / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-muted-foreground">Pipeline Value</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-xl">
            <ArrowUpRight className="h-5 w-5 mx-auto text-chart-2 mb-1" />
            <div className="text-xl font-bold text-foreground">{capturedLeads}</div>
            <div className="text-xs text-muted-foreground">Leads Captured</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-xl">
            <DollarSign className="h-5 w-5 mx-auto text-chart-3 mb-1" />
            <div className="text-xl font-bold text-foreground">${costPerLead}</div>
            <div className="text-xs text-muted-foreground">Cost/Lead (est)</div>
          </div>
        </div>

        {/* Engagement by Channel */}
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={roiData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis type="number" fontSize={11} unit="%" />
            <YAxis dataKey="channel" type="category" fontSize={12} width={70} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="engagement" name="Engagement %" radius={[0, 4, 4, 0]}>
              {roiData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

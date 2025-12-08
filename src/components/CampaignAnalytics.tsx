import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Send, 
  MousePointerClick, 
  TrendingUp, 
  Clock,
  Phone,
  Mail,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Json } from "@/integrations/supabase/types";

interface CampaignLog {
  id: string;
  property_id: string | null;
  campaign_type: string;
  recipient_phone: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  property_address: string | null;
  api_response: Json | null;
  api_status: number | null;
  sent_at: string;
  tracking_id: string;
  link_clicked: boolean | null;
  clicked_at: string | null;
  click_count: number | null;
  metadata: Json | null;
}

interface CampaignAnalyticsProps {
  propertyId?: string;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--muted))", "hsl(var(--accent))"];

export function CampaignAnalytics({ propertyId }: CampaignAnalyticsProps) {
  const [campaigns, setCampaigns] = useState<CampaignLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('campaign-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_logs',
        },
        () => {
          fetchCampaigns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [propertyId]);

  const fetchCampaigns = async () => {
    try {
      let query = supabase
        .from("campaign_logs")
        .select("*")
        .order("sent_at", { ascending: false });

      if (propertyId) {
        query = query.eq("property_id", propertyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalSent = campaigns.length;
  const totalClicked = campaigns.filter(c => c.link_clicked).length;
  const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : "0";
  const successfulSent = campaigns.filter(c => c.api_status && c.api_status >= 200 && c.api_status < 300).length;
  const failedSent = campaigns.filter(c => c.api_status && (c.api_status < 200 || c.api_status >= 300)).length;

  // Prepare chart data - campaigns per day
  const campaignsByDay = campaigns.reduce((acc, campaign) => {
    const day = format(new Date(campaign.sent_at), "MMM dd");
    if (!acc[day]) {
      acc[day] = { date: day, sent: 0, clicked: 0 };
    }
    acc[day].sent++;
    if (campaign.link_clicked) {
      acc[day].clicked++;
    }
    return acc;
  }, {} as Record<string, { date: string; sent: number; clicked: number }>);

  const chartData = Object.values(campaignsByDay).reverse().slice(-7);

  const pieData = [
    { name: "Clicked", value: totalClicked },
    { name: "Not Clicked", value: totalSent - totalClicked },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total Sent</span>
            </div>
            <p className="text-2xl font-bold mt-2">{totalSent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Clicked</span>
            </div>
            <p className="text-2xl font-bold mt-2">{totalClicked}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Click Rate</span>
            </div>
            <p className="text-2xl font-bold mt-2">{clickRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Success Rate</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {totalSent > 0 ? ((successfulSent / totalSent) * 100).toFixed(0) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {campaigns.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Campaign Activity (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="sent" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Sent"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clicked" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    name="Clicked"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Click Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-xs">Clicked ({totalClicked})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted"></div>
                  <span className="text-xs">Not Clicked ({totalSent - totalClicked})</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaign List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Campaign History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({totalSent})</TabsTrigger>
              <TabsTrigger value="clicked">Clicked ({totalClicked})</TabsTrigger>
              <TabsTrigger value="failed">Failed ({failedSent})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <CampaignList campaigns={campaigns} />
            </TabsContent>
            <TabsContent value="clicked">
              <CampaignList campaigns={campaigns.filter(c => c.link_clicked)} />
            </TabsContent>
            <TabsContent value="failed">
              <CampaignList campaigns={campaigns.filter(c => c.api_status && (c.api_status < 200 || c.api_status >= 300))} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function CampaignList({ campaigns }: { campaigns: CampaignLog[] }) {
  if (campaigns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No campaigns found
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3 pr-4">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="p-4 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{campaign.recipient_name || "Unknown"}</span>
                  <Badge variant={campaign.api_status && campaign.api_status >= 200 && campaign.api_status < 300 ? "default" : "destructive"}>
                    {campaign.api_status && campaign.api_status >= 200 && campaign.api_status < 300 ? (
                      <><CheckCircle className="h-3 w-3 mr-1" /> Sent</>
                    ) : (
                      <><XCircle className="h-3 w-3 mr-1" /> Failed</>
                    )}
                  </Badge>
                </div>
                
                {campaign.property_address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{campaign.property_address}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {campaign.recipient_phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{campaign.recipient_phone}</span>
                    </div>
                  )}
                  {campaign.recipient_email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>{campaign.recipient_email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="text-xs text-muted-foreground">
                  {format(new Date(campaign.sent_at), "MMM d, yyyy h:mm a")}
                </div>
                {campaign.link_clicked && (
                  <Badge variant="outline" className="text-xs">
                    <MousePointerClick className="h-3 w-3 mr-1" />
                    Clicked {campaign.click_count || 1}x
                    {campaign.clicked_at && (
                      <span className="ml-1">
                        • {format(new Date(campaign.clicked_at), "MMM d")}
                      </span>
                    )}
                  </Badge>
                )}
              </div>
            </div>

            {campaign.api_response && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  View API Response
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                  {JSON.stringify(campaign.api_response, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

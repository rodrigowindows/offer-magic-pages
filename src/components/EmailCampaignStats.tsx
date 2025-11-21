import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Mail, MailOpen, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EmailCampaign {
  id: string;
  property_id: string;
  recipient_email: string;
  subject: string;
  sent_at: string;
  opened_at: string | null;
  opened_count: number;
  tracking_id: string;
}

interface EmailCampaignStatsProps {
  propertyId?: string;
}

export function EmailCampaignStats({ propertyId }: EmailCampaignStatsProps) {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, [propertyId]);

  const fetchCampaigns = async () => {
    try {
      let query = supabase
        .from("email_campaigns")
        .select("*")
        .order("sent_at", { ascending: false });

      if (propertyId) {
        query = query.eq("property_id", propertyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error("Error fetching email campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: campaigns.length,
    opened: campaigns.filter((c) => c.opened_at).length,
    unopened: campaigns.filter((c) => !c.opened_at).length,
    openRate: campaigns.length > 0 
      ? ((campaigns.filter((c) => c.opened_at).length / campaigns.length) * 100).toFixed(1)
      : "0",
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading email stats...</div>;
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Email Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No emails sent yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MailOpen className="h-4 w-4" />
              Opened
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.opened}</div>
            <p className="text-xs text-muted-foreground">{stats.openRate}% open rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Unopened
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unopened}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {campaigns.slice(0, 5).map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-start justify-between border-b pb-2 last:border-0"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {campaign.opened_at ? (
                      <MailOpen className="h-4 w-4 text-green-500" />
                    ) : (
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium text-sm">{campaign.recipient_email}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{campaign.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    Sent {formatDistanceToNow(new Date(campaign.sent_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="text-right">
                  {campaign.opened_at ? (
                    <div className="text-xs">
                      <div className="text-green-600 font-medium">Opened</div>
                      <div className="text-muted-foreground">
                        {formatDistanceToNow(new Date(campaign.opened_at), { addSuffix: true })}
                      </div>
                      {campaign.opened_count > 1 && (
                        <div className="text-muted-foreground">({campaign.opened_count} times)</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">Not opened</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

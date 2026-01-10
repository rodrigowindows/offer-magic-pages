import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
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

interface CommunicationHistoryProps {
  propertyId: string;
}

export const CommunicationHistory = ({ propertyId }: CommunicationHistoryProps) => {
  const [communications, setCommunications] = useState<CampaignLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunications();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`communication-history-${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_logs',
          filter: `property_id=eq.${propertyId}`,
        },
        () => {
          fetchCommunications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [propertyId]);

  const fetchCommunications = async () => {
    try {
      const { data, error } = await supabase
        .from("campaign_logs")
        .select("*")
        .eq("property_id", propertyId)
        .order("sent_at", { ascending: false });

      if (error) throw error;
      setCommunications(data || []);
    } catch (error) {
      console.error("Error fetching communications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (metadata: Json | null) => {
    const channel = (metadata as any)?.channel;
    switch (channel) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      case 'call':
        return <Phone className="w-4 h-4" />;
      default:
        return <Send className="w-4 h-4" />;
    }
  };

  const getChannelColor = (metadata: Json | null) => {
    const channel = (metadata as any)?.channel;
    switch (channel) {
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'sms':
        return 'bg-green-100 text-green-800';
      case 'call':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (apiStatus: number | null) => {
    if (!apiStatus) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (apiStatus >= 200 && apiStatus < 300) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Communication History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          Communication History
          <Badge variant="secondary" className="ml-auto">
            {communications.length} sent
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {communications.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No communications sent yet</p>
            <p className="text-sm">Communications will appear here once sent</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {communications.map((comm) => (
                <div key={comm.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getChannelIcon(comm.metadata)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getChannelColor(comm.metadata)}>
                        {(comm.metadata as any)?.channel || 'unknown'}
                      </Badge>
                      {getStatusIcon(comm.api_status)}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comm.sent_at), "MMM dd, yyyy 'at' HH:mm")}
                      </span>
                    </div>

                    <div className="text-sm">
                      <p className="font-medium">
                        {comm.recipient_name || 'Unknown Recipient'}
                      </p>
                      <p className="text-muted-foreground">
                        {comm.recipient_email || comm.recipient_phone || 'No contact info'}
                      </p>
                    </div>

                    {(comm.metadata as any)?.template_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Template: {(comm.metadata as any).template_name}
                      </p>
                    )}

                    {comm.link_clicked && (
                      <div className="flex items-center gap-1 mt-2">
                        <ExternalLink className="w-3 h-3 text-blue-500" />
                        <span className="text-xs text-blue-600">
                          Link clicked {comm.click_count ? `(${comm.click_count}x)` : ''}
                          {comm.clicked_at && ` on ${format(new Date(comm.clicked_at), "MMM dd, HH:mm")}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-muted-foreground">
                      {comm.campaign_type}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground mt-1">
                      {comm.tracking_id.slice(-8)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
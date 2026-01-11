import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CampaignLog {
  id: string;
  property_id: string;
  channel: string;
  recipient_email?: string | null;
  recipient_phone?: string | null;
  recipient_name?: string | null;
  sent_at: string;
  tracking_id?: string;
  metadata?: any;
  campaign_type: string;
}

export function PropertyCommunicationHistory({ propertyId }: { propertyId: string }) {
  const [history, setHistory] = useState<CampaignLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) return;
    setLoading(true);
    supabase
      .from("campaign_logs")
      .select("*")
      .eq("property_id", propertyId)
      .order("sent_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setHistory(data);
        setLoading(false);
      });
  }, [propertyId]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading communication history...</div>;
  if (!history.length) return <div className="text-sm text-muted-foreground">No communications sent for this property yet.</div>;

  return (
    <div className="my-6 p-4 border rounded-lg bg-muted/20">
      <h3 className="text-lg font-semibold mb-3">Communication History</h3>
      <div className="space-y-3">
        {history.map((item) => (
          <div key={item.id} className="border rounded p-3 text-sm bg-background">
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium capitalize">{item.channel}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(item.sent_at).toLocaleString()}
              </span>
            </div>
            <div className="space-y-1">
              <div><b>Recipient:</b> {item.recipient_name || item.recipient_email || item.recipient_phone || 'Unknown'}</div>
              {item.recipient_email && (
                <div><b>Email:</b> {item.recipient_email}</div>
              )}
              {item.recipient_phone && (
                <div><b>Phone:</b> {item.recipient_phone}</div>
              )}
              {item.metadata?.template_name && (
                <div><b>Template:</b> {item.metadata.template_name}</div>
              )}
              {item.metadata?.subject && (
                <div><b>Subject:</b> {item.metadata.subject}</div>
              )}
              <div><b>Campaign:</b> <span className="capitalize">{item.campaign_type}</span></div>
              {item.tracking_id && (
                <div><b>Tracking ID:</b> <code className="text-xs bg-muted px-1 rounded">{item.tracking_id}</code></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

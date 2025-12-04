import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, MessageSquare, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  cash_offer_amount: number;
  owner_name?: string;
  owner_phone?: string;
}

interface SmsSettings {
  api_endpoint: string;
  api_key: string | null;
  http_method: string;
  headers: Record<string, string> | null;
}

interface SmsCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyIds: string[];
  onSmssSent?: () => void;
  onOpenSettings?: () => void;
}

export const SmsCampaignDialog = ({
  open,
  onOpenChange,
  propertyIds,
  onSmssSent,
  onOpenSettings,
}: SmsCampaignDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [smsSettings, setSmsSettings] = useState<SmsSettings | null>(null);
  const [message, setMessage] = useState(
    `Hi {owner_name}, we have a cash offer of ${"{cash_offer}"} for your property at {address}. Interested? Reply YES or call 786-882-8251. - MyLocalInvest`
  );

  useEffect(() => {
    if (open && propertyIds.length > 0) {
      fetchProperties();
      fetchSmsSettings();
    }
  }, [open, propertyIds]);

  const fetchProperties = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("properties")
      .select("id, address, city, state, zip_code, cash_offer_amount, owner_name, owner_phone")
      .in("id", propertyIds);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      });
    } else {
      setProperties(data || []);
    }
    setIsLoading(false);
  };

  const fetchSmsSettings = async () => {
    const { data, error } = await supabase
      .from("sms_settings")
      .select("*")
      .limit(1)
      .single();

    if (!error && data) {
      setSmsSettings({
        api_endpoint: data.api_endpoint,
        api_key: data.api_key,
        http_method: data.http_method,
        headers: data.headers as Record<string, string> | null,
      });
    }
  };

  const propertiesWithPhone = properties.filter(p => p.owner_phone);

  const generateMessage = (property: Property) => {
    return message
      .replace("{owner_name}", property.owner_name || "there")
      .replace("{address}", property.address)
      .replace("{cash_offer}", `$${property.cash_offer_amount.toLocaleString()}`);
  };

  const handleSendSms = async () => {
    if (!smsSettings) {
      toast({
        title: "SMS Settings Required",
        description: "Please configure SMS settings first",
        variant: "destructive",
      });
      return;
    }

    if (propertiesWithPhone.length === 0) {
      toast({
        title: "No Phone Numbers",
        description: "None of the selected properties have phone numbers",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    let successCount = 0;
    let errorCount = 0;

    for (const property of propertiesWithPhone) {
      try {
        const smsMessage = generateMessage(property);
        
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(smsSettings.headers || {}),
        };

        if (smsSettings.api_key) {
          headers["Authorization"] = `Bearer ${smsSettings.api_key}`;
        }

        const response = await fetch(smsSettings.api_endpoint, {
          method: smsSettings.http_method,
          headers,
          body: JSON.stringify({
            to: property.owner_phone,
            message: smsMessage,
            property_id: property.id,
          }),
        });

        if (response.ok) {
          await supabase
            .from("properties")
            .update({ sms_sent: true })
            .eq("id", property.id);
          successCount++;
        } else {
          console.error(`Failed to send SMS for property ${property.id}:`, await response.text());
          errorCount++;
        }
      } catch (error) {
        console.error(`Error sending SMS for property ${property.id}:`, error);
        errorCount++;
      }
    }

    setIsSending(false);

    if (successCount > 0) {
      toast({
        title: "SMS Sent!",
        description: `Successfully sent ${successCount} SMS${successCount > 1 ? "s" : ""}${errorCount > 0 ? `. ${errorCount} failed.` : ""}`,
      });
      onSmssSent?.();
      onOpenChange(false);
    } else {
      toast({
        title: "Failed to Send",
        description: "All SMS failed to send. Check your settings.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send SMS Campaign
          </DialogTitle>
          <DialogDescription>
            Send SMS messages to {propertiesWithPhone.length} of {properties.length} selected properties with phone numbers
          </DialogDescription>
        </DialogHeader>

        {!smsSettings && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>SMS settings not configured. Please configure your SMS API first.</span>
              {onOpenSettings && (
                <Button variant="outline" size="sm" onClick={onOpenSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message Template</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Use {owner_name}, {address}, {cash_offer} as placeholders"
              />
              <p className="text-sm text-muted-foreground">
                Available placeholders: {"{owner_name}"}, {"{address}"}, {"{cash_offer}"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Preview (first property)</Label>
              {propertiesWithPhone.length > 0 ? (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="text-muted-foreground mb-1">To: {propertiesWithPhone[0].owner_phone}</p>
                  <p>{generateMessage(propertiesWithPhone[0])}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No properties with phone numbers selected</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSendSms}
                disabled={isSending || propertiesWithPhone.length === 0 || !smsSettings}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send {propertiesWithPhone.length} SMS
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
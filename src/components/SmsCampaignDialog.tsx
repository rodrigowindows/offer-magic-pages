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
import { Loader2, MessageSquare } from "lucide-react";
import { sendSMS } from "@/services/marketingService";

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

interface SmsCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyIds: string[];
  onSmssSent?: () => void;
}

export const SmsCampaignDialog = ({
  open,
  onOpenChange,
  propertyIds,
  onSmssSent,
}: SmsCampaignDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [message, setMessage] = useState(
    `Hi {owner_name}, we have a cash offer of ${"{cash_offer}"} for your property at {address}. Interested? Reply YES or call 786-882-8251. - MyLocalInvest`
  );

  useEffect(() => {
    if (open && propertyIds.length > 0) {
      fetchProperties();
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

  const propertiesWithPhone = properties.filter(p => p.owner_phone);

  const generateMessage = (property: Property) => {
    return message
      .replace("{owner_name}", property.owner_name || "there")
      .replace("{address}", property.address)
      .replace("{cash_offer}", `$${property.cash_offer_amount.toLocaleString()}`);
  };

  const handleSendSms = async () => {
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

        // Usar serviço MCP para envio de SMS
        await sendSMS({
          phone_number: property.owner_phone!,
          body: smsMessage,
        });

        // Atualizar status no banco
        await supabase
          .from("properties")
          .update({ sms_sent: true })
          .eq("id", property.id);

        successCount++;
      } catch (error: any) {
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
                disabled={isSending || propertiesWithPhone.length === 0}
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
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2 } from "lucide-react";

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  cash_offer_amount: number;
  owner_name?: string;
  owner_address?: string;
}

interface EmailCampaignDialogProps {
  properties: Property[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EmailCampaignDialog({
  properties,
  open,
  onOpenChange,
  onSuccess,
}: EmailCampaignDialogProps) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    recipientEmail: "",
    recipientName: "",
    subject: "Cash Offer for Your Property",
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "",
    fromName: "Property Investment Team",
  });

  const handleSend = async () => {
    if (!formData.recipientEmail || !formData.smtpPassword || !formData.fromEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const property of properties) {
        try {
          const { data, error } = await supabase.functions.invoke("send-property-email", {
            body: {
              propertyId: property.id,
              recipientEmail: formData.recipientEmail,
              recipientName: formData.recipientName || property.owner_name || "Property Owner",
              subject: formData.subject,
              smtpHost: formData.smtpHost,
              smtpPort: parseInt(formData.smtpPort),
              smtpUser: formData.smtpUser,
              smtpPassword: formData.smtpPassword,
              fromEmail: formData.fromEmail,
              fromName: formData.fromName,
            },
          });

          if (error) {
            console.error("Error sending email for property:", property.id, error);
            failCount++;
          } else {
            console.log("Email sent successfully:", data);
            successCount++;
          }
        } catch (err) {
          console.error("Error sending email:", err);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Emails Sent",
          description: `Successfully sent ${successCount} email${successCount > 1 ? "s" : ""}${
            failCount > 0 ? `, ${failCount} failed` : ""
          }`,
        });
        onSuccess?.();
        onOpenChange(false);
      } else {
        throw new Error("All emails failed to send");
      }
    } catch (error: any) {
      console.error("Email sending error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send emails",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email Campaign ({properties.length} {properties.length === 1 ? "property" : "properties"})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Recipient Email *</Label>
            <Input
              id="recipientEmail"
              type="email"
              placeholder="owner@example.com"
              value={formData.recipientEmail}
              onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientName">Recipient Name</Label>
            <Input
              id="recipientName"
              placeholder="John Doe"
              value={formData.recipientName}
              onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject *</Label>
            <Input
              id="subject"
              placeholder="Cash Offer for Your Property"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">SMTP Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email *</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  placeholder="noreply@yourdomain.com"
                  value={formData.fromEmail}
                  onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  placeholder="Your Company"
                  value={formData.fromName}
                  onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="smtpPassword">SMTP API Key / Password *</Label>
              <Input
                id="smtpPassword"
                type="password"
                placeholder="Your SMTP API key or password"
                value={formData.smtpPassword}
                onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                This uses SMTP2GO API. Get your API key from smtp2go.com
              </p>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Properties to send:</h4>
            <ul className="text-sm space-y-1">
              {properties.map((prop) => (
                <li key={prop.id} className="text-muted-foreground">
                  {prop.address}, {prop.city} - ${prop.cash_offer_amount.toLocaleString()}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email{properties.length > 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

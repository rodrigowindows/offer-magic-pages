import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CashOfferLetter } from "./CashOfferLetter";
import { Copy, Download, MessageSquare, Mail, Send, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/services/marketingService";

interface Property {
  id: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  estimated_value: number;
  cash_offer_amount: number;
  owner_name?: string | null;
  owner_phone?: string | null;
}

interface CashOfferDialogProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CashOfferDialog = ({ property, open, onOpenChange }: CashOfferDialogProps) => {
  const { toast } = useToast();
  const [phone, setPhone] = useState("786 882 8251");
  const [email, setEmail] = useState("info@mylocalinvest.com");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [sendingEmail, setSendingEmail] = useState(false);

  if (!property) return null;

  const offerUrl = `${window.location.origin}/property/${property.slug}`;
  
  const smsText = language === "en"
    ? `Hi${property.owner_name ? ` ${property.owner_name.split(' ')[0]}` : ''}! $${property.cash_offer_amount.toLocaleString()} cash for ${property.address}. No repairs, close in 7 days. Reply YES → ${offerUrl}?src=sms`
    : `¡Hola${property.owner_name ? ` ${property.owner_name.split(' ')[0]}` : ''}! $${property.cash_offer_amount.toLocaleString()} en efectivo por ${property.address}. Sin reparaciones, cierre en 7 días. Responda SÍ → ${offerUrl}?src=sms`;
  
  const whatsappText = encodeURIComponent(smsText);
  const whatsappUrl = property.owner_phone 
    ? `https://wa.me/${property.owner_phone.replace(/\D/g, '')}?text=${whatsappText}`
    : `https://wa.me/?text=${whatsappText}`;

  const handlePrint = () => {
    window.print();
    toast({
      title: "Print ready",
      description: "Opening print dialog...",
    });
  };

  const handleCopySMS = () => {
    navigator.clipboard.writeText(smsText);
    toast({
      title: "SMS copied",
      description: "Message copied to clipboard",
    });
  };

  const handleCopyUrl = (source: string) => {
    const url = `${offerUrl}?src=${source}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: `Tracking URL for ${source} copied`,
    });
  };

  const handleWhatsApp = () => {
    window.open(whatsappUrl, '_blank');
    toast({
      title: "WhatsApp opened",
      description: "Message ready to send",
    });
  };

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      toast({
        title: "Email required",
        description: "Please enter recipient email",
        variant: "destructive",
      });
      return;
    }

    setSendingEmail(true);
    try {
      // Generate the offer letter HTML content
      const offerLetterHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Cash Offer Letter</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .offer-amount { font-size: 24px; font-weight: bold; color: #28a745; }
            .property-details { background: #f8f9fa; padding: 15px; margin: 20px 0; }
            .signature { margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MyLocalInvest - Cash Offer</h1>
            <p>We buy houses in any condition - Cash, fast closing!</p>
          </div>
          <div class="content">
            <p>Dear ${property.owner_name || "Property Owner"},</p>
            <p>We are pleased to present you with a <strong>cash offer</strong> for your property located at:</p>
            <div class="property-details">
              <p><strong>${property.address}</strong></p>
              <p>${property.city}, ${property.state} ${property.zip_code}</p>
            </div>
            <p class="offer-amount">Our cash offer: $${property.cash_offer_amount.toLocaleString()}</p>
            <ul>
              <li>No repairs needed - we buy as-is</li>
              <li>Cash payment - no financing contingencies</li>
              <li>Fast closing - typically within 7 days</li>
              <li>No real estate agent commissions</li>
            </ul>
            <p>This offer is valid for 30 days from the date of this letter. To accept this offer, please contact us at:</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Website:</strong> <a href="${offerUrl}">${offerUrl}</a></p>
            <div class="signature">
              <p>Sincerely,</p>
              <p><strong>MyLocalInvest Team</strong></p>
              <p>${email}</p>
              <p>${phone}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Use MCP service to send email
      await sendEmail({
        receiver_email: recipientEmail,
        subject: language === "en"
          ? `Cash Offer for ${property.address}`
          : `Oferta en Efectivo para ${property.address}`,
        message_body: offerLetterHtml,
      });

      toast({
        title: "Email sent!",
        description: `Offer letter sent to ${recipientEmail}`,
      });
      setRecipientEmail("");
    } catch (error: any) {
      toast({
        title: "Error sending email",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Cash Offer Letter Generator</span>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">EN</span>
              <Switch 
                checked={language === "es"} 
                onCheckedChange={(checked) => setLanguage(checked ? "es" : "en")} 
              />
              <span className="text-sm text-muted-foreground">ES</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            Ultra-simple, conversion-focused offer for {property.address}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="send">Send</TabsTrigger>
            <TabsTrigger value="sms">SMS/WhatsApp</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            <div className="flex gap-2 justify-end print:hidden">
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Print/PDF
              </Button>
              <Button onClick={() => handleCopyUrl("letter")} variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Copy Letter URL
              </Button>
            </div>
            
            <div className="print:p-0">
              <CashOfferLetter
                address={property.address}
                city={property.city}
                state={property.state}
                zipCode={property.zip_code}
                cashOffer={property.cash_offer_amount}
                estimatedValue={property.estimated_value}
                propertySlug={property.slug}
                phone={phone}
                email={email}
                source="letter"
                ownerName={property.owner_name || undefined}
                language={language}
              />
            </div>
          </TabsContent>

          <TabsContent value="send" className="space-y-4">
            <div className="bg-muted p-6 rounded-lg space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-1" />
                <div className="flex-1 space-y-4">
                  <Label className="text-lg font-semibold block">Send via Email</Label>
                  <div className="space-y-2">
                    <Label htmlFor="recipientEmail">Recipient Email</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="owner@email.com"
                    />
                  </div>
                  <Button 
                    onClick={handleSendEmail} 
                    disabled={sendingEmail || !recipientEmail}
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {sendingEmail ? "Sending..." : `Send ${language === "es" ? "Spanish" : "English"} Offer`}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Email includes tracking pixel for open detection
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sms" className="space-y-4">
            <div className="bg-muted p-6 rounded-lg space-y-4">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-primary mt-1" />
                <div className="flex-1">
                  <Label className="text-lg font-semibold mb-2 block">
                    SMS/WhatsApp Template ({language === "es" ? "Spanish" : "English"})
                  </Label>
                  <p className="text-foreground bg-background p-4 rounded-lg border border-border font-mono text-sm whitespace-pre-wrap">
                    {smsText}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCopySMS} className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy SMS
                </Button>
                <Button onClick={handleWhatsApp} variant="secondary" className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send WhatsApp
                </Button>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleCopyUrl("sms")} variant="outline" className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy SMS URL
                </Button>
                <Button onClick={() => handleCopyUrl("whatsapp")} variant="outline" className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy WhatsApp URL
                </Button>
              </div>

              <div className="bg-background p-4 rounded-lg border border-border">
                <h3 className="font-semibold mb-2">Multi-Channel Tracking URLs:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Letter:</span>
                    <code className="flex-1 px-2 py-1 bg-muted rounded text-xs truncate">{offerUrl}?src=letter</code>
                    <Button size="sm" variant="ghost" onClick={() => handleCopyUrl("letter")}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">SMS:</span>
                    <code className="flex-1 px-2 py-1 bg-muted rounded text-xs truncate">{offerUrl}?src=sms</code>
                    <Button size="sm" variant="ghost" onClick={() => handleCopyUrl("sms")}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">WhatsApp:</span>
                    <code className="flex-1 px-2 py-1 bg-muted rounded text-xs truncate">{offerUrl}?src=whatsapp</code>
                    <Button size="sm" variant="ghost" onClick={() => handleCopyUrl("whatsapp")}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Email:</span>
                    <code className="flex-1 px-2 py-1 bg-muted rounded text-xs truncate">{offerUrl}?src=email</code>
                    <Button size="sm" variant="ghost" onClick={() => handleCopyUrl("email")}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Contact Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(305) 555-0123"
                />
              </div>
              <div>
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@mylocalinvest.com"
                />
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Why This Converts 3x Better:</h3>
                <ul className="space-y-1 text-sm">
                  <li>✓ Under 120 words - scannable in 10 seconds</li>
                  <li>✓ "Reply YES" = 1-tap action</li>
                  <li>✓ 7 days + tax relief = emotional urgency</li>
                  <li>✓ Local name + phone + QR = instant trust</li>
                  <li>✓ No form needed - reply direct</li>
                  <li>✓ Spanish option for Miami market</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

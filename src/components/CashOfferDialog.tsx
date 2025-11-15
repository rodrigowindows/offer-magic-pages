import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CashOfferLetter } from "./CashOfferLetter";
import { Copy, Download, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Property {
  id: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  estimated_value: number;
  cash_offer_amount: number;
}

interface CashOfferDialogProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CashOfferDialog = ({ property, open, onOpenChange }: CashOfferDialogProps) => {
  const { toast } = useToast();
  const [phone, setPhone] = useState("(305) 555-0123");
  const [email, setEmail] = useState("info@mylocalinvest.com");

  if (!property) return null;

  const offerUrl = `${window.location.origin}/property/${property.slug}`;
  
  const smsText = `Hi! $${property.cash_offer_amount.toLocaleString()} cash for ${property.address}. No repairs, close in 7 days. Reply YES → ${offerUrl}?src=sms`;
  
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cash Offer Letter Generator</DialogTitle>
          <DialogDescription>
            Ultra-simple, conversion-focused offer for {property.address}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="sms">SMS Version</TabsTrigger>
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
              />
            </div>
          </TabsContent>

          <TabsContent value="sms" className="space-y-4">
            <div className="bg-muted p-6 rounded-lg space-y-4">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-primary mt-1" />
                <div className="flex-1">
                  <Label className="text-lg font-semibold mb-2 block">SMS Template (80% open rate)</Label>
                  <p className="text-foreground bg-background p-4 rounded-lg border border-border font-mono text-sm whitespace-pre-wrap">
                    {smsText}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCopySMS} className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy SMS Text
                </Button>
                <Button onClick={() => handleCopyUrl("sms")} variant="outline" className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy SMS URL
                </Button>
              </div>

              <div className="bg-background p-4 rounded-lg border border-border">
                <h3 className="font-semibold mb-2">Multi-Channel Tracking URLs:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Letter:</span>
                    <code className="flex-1 px-2 py-1 bg-muted rounded text-xs">{offerUrl}?src=letter</code>
                    <Button size="sm" variant="ghost" onClick={() => handleCopyUrl("letter")}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">SMS:</span>
                    <code className="flex-1 px-2 py-1 bg-muted rounded text-xs">{offerUrl}?src=sms</code>
                    <Button size="sm" variant="ghost" onClick={() => handleCopyUrl("sms")}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Postcard:</span>
                    <code className="flex-1 px-2 py-1 bg-muted rounded text-xs">{offerUrl}?src=postcard</code>
                    <Button size="sm" variant="ghost" onClick={() => handleCopyUrl("postcard")}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Email:</span>
                    <code className="flex-1 px-2 py-1 bg-muted rounded text-xs">{offerUrl}?src=email</code>
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
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

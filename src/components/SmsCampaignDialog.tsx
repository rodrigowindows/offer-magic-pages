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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [selectedPhoneColumn, setSelectedPhoneColumn] = useState<string>('owner_phone');
  const [enableFallback, setEnableFallback] = useState<boolean>(true);
  const [rateLimitDelay, setRateLimitDelay] = useState<number>(1000);
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

  const propertiesWithPhone = properties.filter(p => (p as any)[selectedPhoneColumn]);

  // Validate contact data
  const validateContact = (property: Property) => {
    const value = (property as any)[selectedPhoneColumn];
    if (!value) return null;
    const cleanPhone = value.replace(/\D/g, '');
    return cleanPhone.length >= 10 ? cleanPhone : null;
  };

  // Get best available contact with fallback
  const getBestContact = (property: Property) => {
    const primary = validateContact(property);
    if (primary) return primary;
    
    if (!enableFallback) return null;
    
    const fallbackColumns = ['phone1', 'phone2', 'phone3', 'phone4', 'phone5', 'owner_phone'];
    for (const col of fallbackColumns) {
      if (col !== selectedPhoneColumn) {
        const value = (property as any)[col];
        if (value) {
          const cleanPhone = value.replace(/\D/g, '');
          if (cleanPhone.length >= 10) return cleanPhone;
        }
      }
    }
    return null;
  };

  // Remove duplicates based on contact
  const removeDuplicateContacts = (properties: Property[]) => {
    const seen = new Set<string>();
    return properties.filter(property => {
      const contact = getBestContact(property);
      if (!contact || seen.has(contact)) return false;
      seen.add(contact);
      return true;
    });
  };

  const generateMessage = (property: Property) => {
    return message
      .replace("{owner_name}", property.owner_name || "there")
      .replace("{address}", property.address)
      .replace("{cash_offer}", `$${property.cash_offer_amount.toLocaleString()}`);
  };

  const handleSendSms = async () => {
    const validProperties = removeDuplicateContacts(properties);
    
    if (validProperties.length === 0) {
      toast({
        title: "No Phone Numbers",
        description: "None of the selected properties have valid phone numbers",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < validProperties.length; i++) {
      const property = validProperties[i];
      
      try {
        const contact = getBestContact(property);
        if (!contact) {
          errorCount++;
          continue;
        }

        const smsMessage = generateMessage(property);

        // Usar serviço MCP para envio de SMS
        await sendSMS({
          phone_number: contact,
          body: smsMessage,
        });

        // Atualizar status no banco
        await supabase
          .from("properties")
          .update({ sms_sent: true })
          .eq("id", property.id);

        successCount++;
        
        // Rate limiting
        if (i < validProperties.length - 1) {
          await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
        }
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
            Send SMS messages to {removeDuplicateContacts(properties).length} of {properties.length} selected properties with valid phone numbers
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone-column">Coluna de Telefone</Label>
              <Select value={selectedPhoneColumn} onValueChange={setSelectedPhoneColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione coluna de telefone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner_phone">owner_phone</SelectItem>
                  <SelectItem value="phone1">phone1</SelectItem>
                  <SelectItem value="phone2">phone2</SelectItem>
                  <SelectItem value="phone3">phone3</SelectItem>
                  <SelectItem value="phone4">phone4</SelectItem>
                  <SelectItem value="phone5">phone5</SelectItem>
                  <SelectItem value="phone">phone</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="enable-fallback-sms"
                  checked={enableFallback}
                  onChange={(e) => setEnableFallback(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="enable-fallback-sms" className="text-xs">
                  Usar fallback para colunas alternativas
                </Label>
              </div>
              <div className="space-y-1 mt-2">
                <Label htmlFor="rate-limit-sms" className="text-xs">Delay entre envios</Label>
                <Select value={rateLimitDelay.toString()} onValueChange={(value) => setRateLimitDelay(parseInt(value))}>
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="500">500ms</SelectItem>
                    <SelectItem value="1000">1s</SelectItem>
                    <SelectItem value="2000">2s</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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
              {removeDuplicateContacts(properties).length > 0 ? (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="text-muted-foreground mb-1">To: {getBestContact(removeDuplicateContacts(properties)[0])}</p>
                  <p>{generateMessage(removeDuplicateContacts(properties)[0])}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No properties with valid phone numbers selected</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSendSms}
                disabled={isSending || removeDuplicateContacts(properties).length === 0}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send {removeDuplicateContacts(properties).length} SMS
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
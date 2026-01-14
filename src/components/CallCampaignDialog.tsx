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
import { Loader2, AlertCircle, Phone, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatOfferForTemplate } from "@/utils/offerUtils";
import { initiateCall } from "@/services/marketingService";

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  cash_offer_amount?: number;
  cash_offer_min?: number;
  cash_offer_max?: number;
  owner_name?: string;
  owner_phone?: string;
}

interface CallSettings {
  api_endpoint: string;
  api_key: string | null;
  http_method: string;
  headers: Record<string, string> | null;
  agent_id?: string;  // Retell agent ID
  from_number?: string; // Número de origem para chamadas
}

interface CallCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyIds: string[];
  onCallsMade?: () => void;
  onOpenSettings?: () => void;
}

export const CallCampaignDialog = ({
  open,
  onOpenChange,
  propertyIds,
  onCallsMade,
  onOpenSettings,
}: CallCampaignDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [callSettings, setCallSettings] = useState<CallSettings | null>(null);
  const [selectedPhoneColumn, setSelectedPhoneColumn] = useState<string>('owner_phone');
  const [enableFallback, setEnableFallback] = useState<boolean>(true);
  const [rateLimitDelay, setRateLimitDelay] = useState<number>(2000); // Calls need more delay
  const [script, setScript] = useState(
    `Hi {owner_name}, this is calling from MyLocalInvest about your property at {address}. We have a cash offer of {cash_offer} that we'd like to discuss with you. The key advantage is that we can close quickly and handle all repairs ourselves. Would you be open to showing the property this week so we can make you a final offer?`
  );

  useEffect(() => {
    if (open && propertyIds.length > 0) {
      fetchProperties();
      fetchCallSettings();
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

  const fetchCallSettings = async () => {
    const { data, error } = await supabase
      .from("call_settings")
      .select("*")
      .limit(1)
      .single();

    if (!error && data) {
      setCallSettings({
        api_endpoint: data.api_endpoint,
        api_key: data.api_key,
        http_method: data.http_method,
        headers: data.headers as Record<string, string> | null,
      });
    }
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

  const generateScript = (property: Property) => {
    return script
      .replace("{owner_name}", property.owner_name || "there")
      .replace("{address}", property.address)
      .replace("{cash_offer}", formatOfferForTemplate(property));
  };

  const handleMakeCalls = async () => {
    if (!callSettings) {
      toast({
        title: "Call Settings Required",
        description: "Please configure Call settings first",
        variant: "destructive",
      });
      return;
    }

    const validProperties = removeDuplicateContacts(properties);

    if (validProperties.length === 0) {
      toast({
        title: "No Phone Numbers",
        description: "None of the selected properties have valid phone numbers",
        variant: "destructive",
      });
      return;
    }

    setIsCalling(true);
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

        const callScript = generateScript(property);
        const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;

        await initiateCall({
          name: property.owner_name || 'Homeowner',
          address: fullAddress,
          from_number: '7868828251',
          to_number: contact,
          voicemail_drop: callScript,
          seller_name: 'Miami Local Investors',
        });

        await supabase
          .from("properties")
          .update({ phone_call_made: true })
          .eq("id", property.id);
        successCount++;

        // Rate limiting for calls (calls need more delay)
        if (i < validProperties.length - 1) {
          await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
        }
      } catch (error) {
        console.error(`Error initiating call for property ${property.id}:`, error);
        errorCount++;
      }
    }

    setIsCalling(false);

    if (successCount > 0) {
      toast({
        title: "Calls Initiated!",
        description: `Successfully initiated ${successCount} of ${validProperties.length} call${validProperties.length > 1 ? "s" : ""}${errorCount > 0 ? `. ${errorCount} failed.` : ""}`,
      });
      onCallsMade?.();
      onOpenChange(false);
    } else {
      toast({
        title: "Failed to Initiate Calls",
        description: "All calls failed to initiate. Check your settings.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Initiate Call Campaign
          </DialogTitle>
          <DialogDescription>
            Initiate calls to {removeDuplicateContacts(properties).length} of {properties.length} selected properties with valid phone numbers
          </DialogDescription>
        </DialogHeader>

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
        </div>

        {!callSettings && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Call settings not configured. Please configure your Call API first.</span>
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
              <Label htmlFor="script">Call Script Template</Label>
              <Textarea
                id="script"
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={5}
                placeholder="Use {owner_name}, {address}, {cash_offer} as placeholders"
              />
              <p className="text-sm text-muted-foreground">
                Available placeholders: {"{owner_name}"}, {"{address}"}, {"{cash_offer}"}
              </p>
            </div>

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
                  id="enable-fallback-call"
                  checked={enableFallback}
                  onChange={(e) => setEnableFallback(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="enable-fallback-call" className="text-xs">
                  Usar fallback para colunas alternativas
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preview (first property)</Label>
              {removeDuplicateContacts(properties).length > 0 ? (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="text-muted-foreground mb-1">To: {getBestContact(removeDuplicateContacts(properties)[0])}</p>
                  <p>{generateScript(removeDuplicateContacts(properties)[0])}</p>
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
                onClick={handleMakeCalls}
                disabled={isCalling || removeDuplicateContacts(properties).length === 0 || !callSettings}
              >
                {isCalling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Initiating...
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 mr-2" />
                    Make {removeDuplicateContacts(properties).length} Calls
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
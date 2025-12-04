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
import { Loader2, AlertCircle, Phone, Settings } from "lucide-react";
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

interface CallSettings {
  api_endpoint: string;
  api_key: string | null;
  http_method: string;
  headers: Record<string, string> | null;
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
  const [script, setScript] = useState(
    `Hi {owner_name}, this is calling from MyLocalInvest about your property at {address}. We have a cash offer of ${"{cash_offer}"} that we'd like to discuss with you. Would you be interested in hearing more?`
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

  const propertiesWithPhone = properties.filter(p => p.owner_phone);

  const generateScript = (property: Property) => {
    return script
      .replace("{owner_name}", property.owner_name || "there")
      .replace("{address}", property.address)
      .replace("{cash_offer}", `$${property.cash_offer_amount.toLocaleString()}`);
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

    if (propertiesWithPhone.length === 0) {
      toast({
        title: "No Phone Numbers",
        description: "None of the selected properties have phone numbers",
        variant: "destructive",
      });
      return;
    }

    setIsCalling(true);
    let successCount = 0;
    let errorCount = 0;

    for (const property of propertiesWithPhone) {
      try {
        const callScript = generateScript(property);
        
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(callSettings.headers || {}),
        };

        if (callSettings.api_key) {
          headers["Authorization"] = `Bearer ${callSettings.api_key}`;
        }

        const response = await fetch(callSettings.api_endpoint, {
          method: callSettings.http_method,
          headers,
          body: JSON.stringify({
            to: property.owner_phone,
            script: callScript,
            property_id: property.id,
            owner_name: property.owner_name,
            address: property.address,
            cash_offer: property.cash_offer_amount,
          }),
        });

        if (response.ok) {
          await supabase
            .from("properties")
            .update({ phone_call_made: true })
            .eq("id", property.id);
          successCount++;
        } else {
          console.error(`Failed to initiate call for property ${property.id}:`, await response.text());
          errorCount++;
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
        description: `Successfully initiated ${successCount} call${successCount > 1 ? "s" : ""}${errorCount > 0 ? `. ${errorCount} failed.` : ""}`,
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
            Initiate calls to {propertiesWithPhone.length} of {properties.length} selected properties with phone numbers
          </DialogDescription>
        </DialogHeader>

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
              <Label>Preview (first property)</Label>
              {propertiesWithPhone.length > 0 ? (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="text-muted-foreground mb-1">To: {propertiesWithPhone[0].owner_phone}</p>
                  <p>{generateScript(propertiesWithPhone[0])}</p>
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
                onClick={handleMakeCalls}
                disabled={isCalling || propertiesWithPhone.length === 0 || !callSettings}
              >
                {isCalling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Initiating...
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 mr-2" />
                    Make {propertiesWithPhone.length} Calls
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
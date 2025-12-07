import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, CheckCircle, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  owner_name?: string;
  owner_phone?: string;
  cash_offer_amount: number;
}

interface StartCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyIds: string[];
  onCampaignSent: () => void;
  onOpenSettings: () => void;
}

interface CampaignResult {
  propertyId: string;
  address: string;
  success: boolean;
  error?: string;
}

export const StartCampaignDialog = ({
  open,
  onOpenChange,
  propertyIds,
  onCampaignSent,
  onOpenSettings,
}: StartCampaignDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [apiSettings, setApiSettings] = useState<{
    api_endpoint: string;
    seller_name: string;
  } | null>(null);
  const [results, setResults] = useState<CampaignResult[]>([]);

  useEffect(() => {
    if (open && propertyIds.length > 0) {
      fetchProperties();
      fetchSettings();
      setResults([]);
    }
  }, [open, propertyIds]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("id, address, city, state, zip_code, owner_name, owner_phone, cash_offer_amount")
        .in("id", propertyIds);

      if (error) throw error;
      setProperties((data || []) as Property[]);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("email_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setApiSettings({
          api_endpoint: data.api_endpoint,
          seller_name: (data.headers as any)?.seller_name || "Alex",
        });
      } else {
        setApiSettings(null);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setApiSettings(null);
    }
  };

  const handleStartCampaign = async () => {
    if (!apiSettings?.api_endpoint) {
      toast({
        title: "Configuration Required",
        description: "Please configure the Marketing API first",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    const campaignResults: CampaignResult[] = [];

    for (const property of properties) {
      try {
        // Build the full address string
        const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;

        // Prepare the payload matching the user's API format
        const payload = {
          phone_number: property.owner_phone || "",
          name: property.owner_name || "",
          address: fullAddress,
          email: "", // No email field in properties table currently
          seller_name: apiSettings.seller_name,
        };

        console.log(`Sending campaign for ${property.address}:`, payload);

        const response = await fetch(apiSettings.api_endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // Update property to mark all communication as sent
        await supabase
          .from("properties")
          .update({
            sms_sent: true,
            email_sent: true,
            phone_call_made: true,
          })
          .eq("id", property.id);

        campaignResults.push({
          propertyId: property.id,
          address: property.address,
          success: true,
        });
      } catch (error: any) {
        console.error(`Error sending campaign for ${property.address}:`, error);
        campaignResults.push({
          propertyId: property.id,
          address: property.address,
          success: false,
          error: error.message,
        });
      }
    }

    setResults(campaignResults);
    setSending(false);

    const successCount = campaignResults.filter((r) => r.success).length;
    const failCount = campaignResults.filter((r) => !r.success).length;

    if (successCount > 0) {
      toast({
        title: "Campaign Started",
        description: `Successfully sent ${successCount} campaign(s)${failCount > 0 ? `, ${failCount} failed` : ""}`,
      });
      onCampaignSent();
    } else {
      toast({
        title: "Campaign Failed",
        description: "All campaign requests failed",
        variant: "destructive",
      });
    }
  };

  const propertiesWithPhone = properties.filter((p) => p.owner_phone);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Start Marketing Campaign</DialogTitle>
          <DialogDescription>
            Send unified marketing campaign (Call + SMS + Email) to selected properties
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !apiSettings ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Marketing API not configured. Please configure your API settings first.
              </AlertDescription>
            </Alert>
            <Button onClick={onOpenSettings} className="w-full gap-2">
              <Settings className="h-4 w-4" />
              Configure Marketing API
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>API:</strong> {apiSettings.api_endpoint}
              </p>
              <p>
                <strong>Seller:</strong> {apiSettings.seller_name}
              </p>
            </div>

            <div className="border rounded-lg p-3 bg-muted/50">
              <p className="text-sm font-medium mb-2">
                {properties.length} properties selected
              </p>
              <p className="text-xs text-muted-foreground">
                {propertiesWithPhone.length} have phone numbers
              </p>
            </div>

            {results.length > 0 && (
              <ScrollArea className="h-48 border rounded-lg p-2">
                <div className="space-y-2">
                  {results.map((result) => (
                    <div
                      key={result.propertyId}
                      className={`flex items-center gap-2 text-sm p-2 rounded ${
                        result.success
                          ? "bg-green-500/10 text-green-700 dark:text-green-400"
                          : "bg-red-500/10 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      )}
                      <span className="truncate">{result.address}</span>
                      {result.error && (
                        <span className="text-xs">({result.error})</span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {results.length > 0 ? "Close" : "Cancel"}
              </Button>
              {results.length === 0 && (
                <Button
                  onClick={handleStartCampaign}
                  disabled={sending || properties.length === 0}
                  className="gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    `Start Campaign (${properties.length})`
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

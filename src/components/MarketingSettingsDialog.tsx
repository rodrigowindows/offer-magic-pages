import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface MarketingSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MarketingSettingsDialog = ({
  open,
  onOpenChange,
}: MarketingSettingsDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    api_endpoint: "",
    seller_name: "Alex",
  });

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    setFetching(true);
    try {
      // We'll store marketing settings in email_settings table with a specific marker
      const { data, error } = await supabase
        .from("email_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettingsId(data.id);
        setFormData({
          api_endpoint: data.api_endpoint || "",
          seller_name: (data.headers as any)?.seller_name || "Alex",
        });
      }
    } catch (error) {
      console.error("Error fetching marketing settings:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!formData.api_endpoint) {
      toast({
        title: "Error",
        description: "API Endpoint is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const settingsData = {
        api_endpoint: formData.api_endpoint,
        http_method: "POST",
        headers: { seller_name: formData.seller_name },
      };

      if (settingsId) {
        const { error } = await supabase
          .from("email_settings")
          .update(settingsData)
          .eq("id", settingsId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("email_settings")
          .insert(settingsData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Marketing API settings saved",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Marketing API Settings</DialogTitle>
          <DialogDescription>
            Configure your unified marketing API endpoint for calls, SMS, and emails
          </DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api_endpoint">API Endpoint</Label>
              <Input
                id="api_endpoint"
                value={formData.api_endpoint}
                onChange={(e) =>
                  setFormData({ ...formData, api_endpoint: e.target.value })
                }
                placeholder="https://marketing.workfaraway.com/start"
              />
              <p className="text-xs text-muted-foreground">
                The API will receive: phone_number, name, address, email, seller_name
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seller_name">Seller Name</Label>
              <Input
                id="seller_name"
                value={formData.seller_name}
                onChange={(e) =>
                  setFormData({ ...formData, seller_name: e.target.value })
                }
                placeholder="Alex"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SmsSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SmsSettingsDialog({ open, onOpenChange }: SmsSettingsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    provider: "",
    accountSid: "",
    authToken: "",
    fromNumber: "",
  });

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    try {
      setFetching(true);
      const { data, error } = await supabase
        .from("sms_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettingsId(data.id);
        setFormData({
          provider: data.provider,
          accountSid: data.account_sid,
          authToken: data.auth_token,
          fromNumber: data.from_number,
        });
      }
    } catch (error: any) {
      console.error("Error fetching SMS settings:", error);
      toast.error("Failed to load SMS settings");
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!formData.provider || !formData.accountSid || !formData.authToken || !formData.fromNumber) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setLoading(true);

      const smsData = {
        provider: formData.provider,
        account_sid: formData.accountSid,
        auth_token: formData.authToken,
        from_number: formData.fromNumber,
      };

      if (settingsId) {
        const { error } = await supabase
          .from("sms_settings")
          .update(smsData)
          .eq("id", settingsId);

        if (error) throw error;
        toast.success("SMS settings updated successfully!");
      } else {
        const { data, error } = await supabase
          .from("sms_settings")
          .insert(smsData)
          .select()
          .single();

        if (error) throw error;
        setSettingsId(data.id);
        toast.success("SMS settings saved successfully!");
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving SMS settings:", error);
      toast.error("Failed to save SMS settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>SMS Configuration</DialogTitle>
          <DialogDescription>
            Configure your SMS provider settings for sending text messages
          </DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="provider">Provider / Vendor *</Label>
              <Input
                id="provider"
                placeholder="Ex: Twilio, Vonage, MessageBird, etc."
                value={formData.provider}
                onChange={(e) =>
                  setFormData({ ...formData, provider: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="accountSid">Account SID / API ID *</Label>
              <Input
                id="accountSid"
                placeholder="Your account identifier"
                value={formData.accountSid}
                onChange={(e) =>
                  setFormData({ ...formData, accountSid: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="authToken">Auth Token / API Key *</Label>
              <Input
                id="authToken"
                type="password"
                placeholder="Your auth token or API key"
                value={formData.authToken}
                onChange={(e) =>
                  setFormData({ ...formData, authToken: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fromNumber">From Number *</Label>
              <Input
                id="fromNumber"
                placeholder="+1234567890"
                value={formData.fromNumber}
                onChange={(e) =>
                  setFormData({ ...formData, fromNumber: e.target.value })
                }
              />
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Configure as credenciais da API do seu provedor de SMS
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || fetching}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CallSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CallSettingsDialog({ open, onOpenChange }: CallSettingsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    provider: "twilio",
    accountSid: "",
    authToken: "",
    fromNumber: "",
    voiceUrl: "",
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
        .from("call_settings")
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
          voiceUrl: data.voice_url || "",
        });
      }
    } catch (error: any) {
      console.error("Error fetching Call settings:", error);
      toast.error("Failed to load Call settings");
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!formData.accountSid || !formData.authToken || !formData.fromNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      const callData = {
        provider: formData.provider,
        account_sid: formData.accountSid,
        auth_token: formData.authToken,
        from_number: formData.fromNumber,
        voice_url: formData.voiceUrl || null,
      };

      if (settingsId) {
        const { error } = await supabase
          .from("call_settings")
          .update(callData)
          .eq("id", settingsId);

        if (error) throw error;
        toast.success("Call settings updated successfully!");
      } else {
        const { data, error } = await supabase
          .from("call_settings")
          .insert(callData)
          .select()
          .single();

        if (error) throw error;
        setSettingsId(data.id);
        toast.success("Call settings saved successfully!");
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving Call settings:", error);
      toast.error("Failed to save Call settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Call Configuration</DialogTitle>
          <DialogDescription>
            Configure your voice call provider settings for making automated calls
          </DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="provider">Provider *</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) =>
                  setFormData({ ...formData, provider: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twilio">Twilio</SelectItem>
                  <SelectItem value="vonage">Vonage (Nexmo)</SelectItem>
                  <SelectItem value="plivo">Plivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="accountSid">Account SID *</Label>
              <Input
                id="accountSid"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
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
                placeholder="Your auth token"
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

            <div className="grid gap-2">
              <Label htmlFor="voiceUrl">Voice URL (TwiML/XML)</Label>
              <Input
                id="voiceUrl"
                placeholder="https://your-domain.com/voice.xml"
                value={formData.voiceUrl}
                onChange={(e) =>
                  setFormData({ ...formData, voiceUrl: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Optional: URL that returns TwiML/XML for call instructions
              </p>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Need a voice provider? Try{" "}
              <a
                href="https://twilio.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Twilio
              </a>{" "}
              or{" "}
              <a
                href="https://plivo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Plivo
              </a>
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

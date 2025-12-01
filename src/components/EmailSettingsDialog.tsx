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

interface EmailSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailSettingsDialog({ open, onOpenChange }: EmailSettingsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "",
    fromName: "",
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
        .from("email_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettingsId(data.id);
        setFormData({
          smtpHost: data.smtp_host,
          smtpPort: data.smtp_port.toString(),
          smtpUser: data.smtp_user,
          smtpPassword: data.smtp_password,
          fromEmail: data.from_email,
          fromName: data.from_name,
        });
      }
    } catch (error: any) {
      console.error("Error fetching email settings:", error);
      toast.error("Failed to load email settings");
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!formData.smtpHost || !formData.smtpUser || !formData.smtpPassword || 
        !formData.fromEmail || !formData.fromName) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      const emailData = {
        smtp_host: formData.smtpHost,
        smtp_port: parseInt(formData.smtpPort),
        smtp_user: formData.smtpUser,
        smtp_password: formData.smtpPassword,
        from_email: formData.fromEmail,
        from_name: formData.fromName,
      };

      if (settingsId) {
        // Update existing settings
        const { error } = await supabase
          .from("email_settings")
          .update(emailData)
          .eq("id", settingsId);

        if (error) throw error;
        toast.success("Email settings updated successfully!");
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from("email_settings")
          .insert(emailData)
          .select()
          .single();

        if (error) throw error;
        setSettingsId(data.id);
        toast.success("Email settings saved successfully!");
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving email settings:", error);
      toast.error("Failed to save email settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Email Configuration</DialogTitle>
          <DialogDescription>
            Configure your SMTP settings for sending email campaigns
          </DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="smtpHost">SMTP Host *</Label>
              <Input
                id="smtpHost"
                placeholder="mail.smtp2go.com"
                value={formData.smtpHost}
                onChange={(e) =>
                  setFormData({ ...formData, smtpHost: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="smtpPort">SMTP Port *</Label>
              <Input
                id="smtpPort"
                type="number"
                placeholder="587"
                value={formData.smtpPort}
                onChange={(e) =>
                  setFormData({ ...formData, smtpPort: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="smtpUser">SMTP User *</Label>
              <Input
                id="smtpUser"
                placeholder="your-username"
                value={formData.smtpUser}
                onChange={(e) =>
                  setFormData({ ...formData, smtpUser: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="smtpPassword">SMTP Password / API Key *</Label>
              <Input
                id="smtpPassword"
                type="password"
                placeholder="your-api-key"
                value={formData.smtpPassword}
                onChange={(e) =>
                  setFormData({ ...formData, smtpPassword: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fromEmail">From Email *</Label>
              <Input
                id="fromEmail"
                type="email"
                placeholder="noreply@yourdomain.com"
                value={formData.fromEmail}
                onChange={(e) =>
                  setFormData({ ...formData, fromEmail: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fromName">From Name *</Label>
              <Input
                id="fromName"
                placeholder="My Company"
                value={formData.fromName}
                onChange={(e) =>
                  setFormData({ ...formData, fromName: e.target.value })
                }
              />
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Need an SMTP provider? Try{" "}
              <a
                href="https://smtp2go.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                SMTP2GO
              </a>{" "}
              or{" "}
              <a
                href="https://resend.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Resend
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

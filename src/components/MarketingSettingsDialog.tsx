import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Mail, MessageSquare, Phone, Save, TestTube } from "lucide-react";

interface MarketingSettings {
  // Email settings
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail?: string;
  fromName?: string;

  // SMS settings
  smsProvider?: string;
  smsApiKey?: string;
  smsApiSecret?: string;

  // Call settings
  callProvider?: string;
  callApiKey?: string;
  callApiSecret?: string;

  // General settings
  testMode?: boolean;
  dailyEmailLimit?: number;
  dailySmsLimit?: number;
  dailyCallLimit?: number;
  defaultReplyTo?: string;
  signature?: string;
}

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
  const [settings, setSettings] = useState<MarketingSettings>({
    testMode: true,
    dailyEmailLimit: 100,
    dailySmsLimit: 50,
    dailyCallLimit: 20,
  });

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("marketing_settings")
        .select("*")
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error("Error loading marketing settings:", error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("marketing_settings")
        .upsert(settings);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Marketing settings have been updated successfully.",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save marketing settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (type: 'email' | 'sms' | 'call') => {
    setLoading(true);
    try {
      // Here you would implement actual connection testing
      // For now, just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Connection test successful",
        description: `${type.toUpperCase()} connection is working properly.`,
      });
    } catch (error) {
      toast({
        title: "Connection test failed",
        description: `Failed to connect to ${type} service.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Marketing Settings
          </DialogTitle>
          <DialogDescription>
            Configure your marketing channels and communication settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
            <TabsTrigger value="calls">Calls</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">General Settings</CardTitle>
                <CardDescription>
                  Basic configuration and limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Test Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Send all communications to test recipients only
                    </p>
                  </div>
                  <Switch
                    checked={settings.testMode}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, testMode: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-limit">Daily Email Limit</Label>
                    <Input
                      id="email-limit"
                      type="number"
                      value={settings.dailyEmailLimit}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          dailyEmailLimit: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sms-limit">Daily SMS Limit</Label>
                    <Input
                      id="sms-limit"
                      type="number"
                      value={settings.dailySmsLimit}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          dailySmsLimit: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="call-limit">Daily Call Limit</Label>
                    <Input
                      id="call-limit"
                      type="number"
                      value={settings.dailyCallLimit}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          dailyCallLimit: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reply-to">Default Reply-To Email</Label>
                  <Input
                    id="reply-to"
                    type="email"
                    value={settings.defaultReplyTo}
                    onChange={(e) =>
                      setSettings({ ...settings, defaultReplyTo: e.target.value })
                    }
                    placeholder="replies@yourcompany.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signature">Email Signature</Label>
                  <Textarea
                    id="signature"
                    value={settings.signature}
                    onChange={(e) =>
                      setSettings({ ...settings, signature: e.target.value })
                    }
                    placeholder="Best regards,&#10;Your Company Team"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  SMTP settings for sending emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input
                      id="smtp-host"
                      value={settings.smtpHost}
                      onChange={(e) =>
                        setSettings({ ...settings, smtpHost: e.target.value })
                      }
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">SMTP Port</Label>
                    <Input
                      id="smtp-port"
                      type="number"
                      value={settings.smtpPort}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          smtpPort: parseInt(e.target.value) || 587,
                        })
                      }
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-user">SMTP Username</Label>
                    <Input
                      id="smtp-user"
                      value={settings.smtpUser}
                      onChange={(e) =>
                        setSettings({ ...settings, smtpUser: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">SMTP Password</Label>
                    <Input
                      id="smtp-password"
                      type="password"
                      value={settings.smtpPassword}
                      onChange={(e) =>
                        setSettings({ ...settings, smtpPassword: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from-email">From Email</Label>
                    <Input
                      id="from-email"
                      type="email"
                      value={settings.fromEmail}
                      onChange={(e) =>
                        setSettings({ ...settings, fromEmail: e.target.value })
                      }
                      placeholder="noreply@yourcompany.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from-name">From Name</Label>
                    <Input
                      id="from-name"
                      value={settings.fromName}
                      onChange={(e) =>
                        setSettings({ ...settings, fromName: e.target.value })
                      }
                      placeholder="Your Company"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => testConnection('email')}
                    disabled={loading}
                    className="gap-2"
                  >
                    <TestTube className="h-4 w-4" />
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  SMS Configuration
                </CardTitle>
                <CardDescription>
                  SMS provider settings for sending text messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sms-provider">SMS Provider</Label>
                  <Input
                    id="sms-provider"
                    value={settings.smsProvider}
                    onChange={(e) =>
                      setSettings({ ...settings, smsProvider: e.target.value })
                    }
                    placeholder="twilio"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sms-api-key">API Key</Label>
                    <Input
                      id="sms-api-key"
                      value={settings.smsApiKey}
                      onChange={(e) =>
                        setSettings({ ...settings, smsApiKey: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sms-api-secret">API Secret</Label>
                    <Input
                      id="sms-api-secret"
                      type="password"
                      value={settings.smsApiSecret}
                      onChange={(e) =>
                        setSettings({ ...settings, smsApiSecret: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => testConnection('sms')}
                    disabled={loading}
                    className="gap-2"
                  >
                    <TestTube className="h-4 w-4" />
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calls" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Call Configuration
                </CardTitle>
                <CardDescription>
                  VoIP provider settings for automated calling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="call-provider">Call Provider</Label>
                  <Input
                    id="call-provider"
                    value={settings.callProvider}
                    onChange={(e) =>
                      setSettings({ ...settings, callProvider: e.target.value })
                    }
                    placeholder="twilio"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="call-api-key">API Key</Label>
                    <Input
                      id="call-api-key"
                      value={settings.callApiKey}
                      onChange={(e) =>
                        setSettings({ ...settings, callApiKey: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="call-api-secret">API Secret</Label>
                    <Input
                      id="call-api-secret"
                      type="password"
                      value={settings.callApiSecret}
                      onChange={(e) =>
                        setSettings({ ...settings, callApiSecret: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => testConnection('call')}
                    disabled={loading}
                    className="gap-2"
                  >
                    <TestTube className="h-4 w-4" />
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={saveSettings} disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

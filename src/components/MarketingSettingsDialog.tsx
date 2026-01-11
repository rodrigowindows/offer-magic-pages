/**
 * Marketing Settings Dialog
 * Dialog para configurações de marketing usando localStorage
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Mail,
  MessageSquare,
  Phone,
  Clock,
  Save
} from 'lucide-react';

interface MarketingSettings {
  sms_enabled: boolean;
  email_enabled: boolean;
  call_enabled: boolean;
  auto_followup_enabled: boolean;
  followup_delay_minutes: number;
  daily_limit_sms: number;
  daily_limit_email: number;
  daily_limit_call: number;
  company_name: string;
  sender_name: string;
  sender_phone: string;
  sender_email: string;
}

const DEFAULT_SETTINGS: MarketingSettings = {
  sms_enabled: true,
  email_enabled: true,
  call_enabled: true,
  auto_followup_enabled: true,
  followup_delay_minutes: 5,
  daily_limit_sms: 100,
  daily_limit_email: 200,
  daily_limit_call: 50,
  company_name: 'MyLocalInvest',
  sender_name: 'Mike Johnson',
  sender_phone: '+17868828251',
  sender_email: 'contact@mylocalinvest.com'
};

interface MarketingSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MarketingSettingsDialog = ({ open, onOpenChange }: MarketingSettingsDialogProps) => {
  const [settings, setSettings] = useState<MarketingSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('marketing_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading marketing settings:", error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      localStorage.setItem('marketing_settings', JSON.stringify(settings));

      toast({
        title: "Settings saved",
        description: "Marketing settings have been updated successfully.",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Marketing Settings
          </DialogTitle>
          <DialogDescription>
            Configure your marketing campaign settings and preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="channels" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="limits">Limits</TabsTrigger>
            <TabsTrigger value="sender">Sender Info</TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">SMS Campaigns</p>
                    <p className="text-sm text-muted-foreground">Enable SMS marketing</p>
                  </div>
                </div>
                <Switch
                  checked={settings.sms_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, sms_enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Email Campaigns</p>
                    <p className="text-sm text-muted-foreground">Enable email marketing</p>
                  </div>
                </div>
                <Switch
                  checked={settings.email_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, email_enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium">Call Campaigns</p>
                    <p className="text-sm text-muted-foreground">Enable call/voicemail campaigns</p>
                  </div>
                </div>
                <Switch
                  checked={settings.call_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, call_enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium">Auto Follow-up</p>
                    <p className="text-sm text-muted-foreground">Automatic follow-ups after clicks</p>
                  </div>
                </div>
                <Switch
                  checked={settings.auto_followup_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, auto_followup_enabled: checked })}
                />
              </div>

              {settings.auto_followup_enabled && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <Label>Follow-up Delay (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.followup_delay_minutes}
                    onChange={(e) => setSettings({ ...settings, followup_delay_minutes: parseInt(e.target.value) || 5 })}
                    min={1}
                    max={60}
                    className="mt-2"
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="limits" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Daily SMS Limit</Label>
                <Input
                  type="number"
                  value={settings.daily_limit_sms}
                  onChange={(e) => setSettings({ ...settings, daily_limit_sms: parseInt(e.target.value) || 100 })}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>Daily Email Limit</Label>
                <Input
                  type="number"
                  value={settings.daily_limit_email}
                  onChange={(e) => setSettings({ ...settings, daily_limit_email: parseInt(e.target.value) || 200 })}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>Daily Call Limit</Label>
                <Input
                  type="number"
                  value={settings.daily_limit_call}
                  onChange={(e) => setSettings({ ...settings, daily_limit_call: parseInt(e.target.value) || 50 })}
                  min={0}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sender" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={settings.company_name}
                  onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                  placeholder="Your Company"
                />
              </div>
              <div className="space-y-2">
                <Label>Sender Name</Label>
                <Input
                  value={settings.sender_name}
                  onChange={(e) => setSettings({ ...settings, sender_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Sender Phone</Label>
                <Input
                  value={settings.sender_phone}
                  onChange={(e) => setSettings({ ...settings, sender_phone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label>Sender Email</Label>
                <Input
                  type="email"
                  value={settings.sender_email}
                  onChange={(e) => setSettings({ ...settings, sender_email: e.target.value })}
                  placeholder="contact@company.com"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={saveSettings} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

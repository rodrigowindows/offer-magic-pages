import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTemplates } from "@/hooks/useTemplates";
import {
  Rocket,
  Mail,
  MessageSquare,
  Phone,
  Calendar,
  Users,
  Settings,
  Play,
  Clock,
  Target,
  Zap
} from "lucide-react";

interface StartCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProperties: string[];
  onCampaignStarted?: (campaignId: string) => void;
}

interface CampaignConfig {
  name: string;
  description: string;
  channel: 'email' | 'sms' | 'call';
  templateId?: string;
  customMessage?: string;
  scheduleType: 'immediate' | 'scheduled' | 'drip';
  scheduledDate?: string;
  dripConfig?: {
    interval: number;
    totalMessages: number;
  };
  targetSegment: 'selected' | 'all_filtered' | 'smart_segment';
  smartFilters?: any;
  settings: {
    batchSize: number;
    delayBetweenBatches: number;
    respectLimits: boolean;
    trackOpens: boolean;
    trackClicks: boolean;
  };
}

export const StartCampaignDialog = ({
  open,
  onOpenChange,
  selectedProperties,
  onCampaignStarted,
}: StartCampaignDialogProps) => {
  const { toast } = useToast();
  const { templates } = useTemplates();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<CampaignConfig>({
    name: '',
    description: '',
    channel: 'email',
    scheduleType: 'immediate',
    targetSegment: 'selected',
    settings: {
      batchSize: 10,
      delayBetweenBatches: 5,
      respectLimits: true,
      trackOpens: true,
      trackClicks: true,
    },
  });

  const channelTemplates = templates.filter(t => t.channel === config.channel);

  const startCampaign = async () => {
    if (!config.name.trim()) {
      toast({
        title: "Campaign name required",
        description: "Please enter a name for your campaign.",
        variant: "destructive",
      });
      return;
    }

    if (config.targetSegment === 'selected' && selectedProperties.length === 0) {
      toast({
        title: "No properties selected",
        description: "Please select properties to include in this campaign.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Use campaign_logs to track campaigns since 'campaigns' table doesn't exist
      let targetProperties = selectedProperties;

      // Create campaign log entries for each target
      const campaignLogs = targetProperties.map(propertyId => ({
        property_id: propertyId,
        campaign_type: config.name,
        channel: config.channel,
        sent_at: new Date().toISOString(),
        metadata: JSON.parse(JSON.stringify({
          schedule_type: config.scheduleType,
          scheduled_date: config.scheduledDate || null,
          settings: config.settings,
        })),
      }));

      const { error: logsError } = await supabase
        .from('campaign_logs')
        .insert(campaignLogs);

      if (logsError) throw logsError;

      if (config.scheduleType === 'immediate') {
        toast({
          title: "Campaign started!",
          description: `Campaign "${config.name}" is now running with ${targetProperties.length} properties.`,
        });
      } else {
        toast({
          title: "Campaign scheduled",
          description: `Campaign "${config.name}" is scheduled to run on ${config.scheduledDate}.`,
        });
      }

      onCampaignStarted?.(config.name);
      onOpenChange(false);

      // Reset form
      setConfig({
        name: '',
        description: '',
        channel: 'email',
        scheduleType: 'immediate',
        targetSegment: 'selected',
        settings: {
          batchSize: 10,
          delayBetweenBatches: 5,
          respectLimits: true,
          trackOpens: true,
          trackClicks: true,
        },
      });
      setStep(1);

    } catch (error) {
      console.error('Error starting campaign:', error);
      toast({
        title: "Campaign failed",
        description: "Failed to start campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Start New Campaign
          </DialogTitle>
          <DialogDescription>
            Configure and launch your marketing campaign
          </DialogDescription>
        </DialogHeader>

        <Tabs value={`step-${step}`} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="step-1" onClick={() => setStep(1)}>
              <span className="flex items-center gap-2">
                <Badge variant={step >= 1 ? "default" : "secondary"}>1</Badge>
                Basics
              </span>
            </TabsTrigger>
            <TabsTrigger value="step-2" onClick={() => setStep(2)}>
              <span className="flex items-center gap-2">
                <Badge variant={step >= 2 ? "default" : "secondary"}>2</Badge>
                Content
              </span>
            </TabsTrigger>
            <TabsTrigger value="step-3" onClick={() => setStep(3)}>
              <span className="flex items-center gap-2">
                <Badge variant={step >= 3 ? "default" : "secondary"}>3</Badge>
                Schedule
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="step-1" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                placeholder="e.g., Spring Outreach 2024"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-desc">Description (optional)</Label>
              <Textarea
                id="campaign-desc"
                placeholder="Brief description of campaign goals..."
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Channel</Label>
              <RadioGroup
                value={config.channel}
                onValueChange={(value) => setConfig({ ...config, channel: value as any })}
                className="grid grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem value="email" id="email" className="peer sr-only" />
                  <Label
                    htmlFor="email"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Mail className="h-6 w-6 mb-2" />
                    Email
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="sms" id="sms" className="peer sr-only" />
                  <Label
                    htmlFor="sms"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <MessageSquare className="h-6 w-6 mb-2" />
                    SMS
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="call" id="call" className="peer sr-only" />
                  <Label
                    htmlFor="call"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Phone className="h-6 w-6 mb-2" />
                    Call
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>Next</Button>
            </div>
          </TabsContent>

          <TabsContent value="step-2" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Select Template</Label>
              <Select
                value={config.templateId}
                onValueChange={(value) => setConfig({ ...config, templateId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {channelTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="custom-message">Or write custom message</Label>
              <Textarea
                id="custom-message"
                placeholder="Your custom message here..."
                value={config.customMessage}
                onChange={(e) => setConfig({ ...config, customMessage: e.target.value })}
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Available variables: {'{'}name{'}'}, {'{'}address{'}'}, {'{'}offer_amount{'}'}
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Next</Button>
            </div>
          </TabsContent>

          <TabsContent value="step-3" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Schedule Type</Label>
              <RadioGroup
                value={config.scheduleType}
                onValueChange={(value) => setConfig({ ...config, scheduleType: value as any })}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <Label htmlFor="immediate" className="flex items-center gap-2 cursor-pointer">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Send immediately
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <Label htmlFor="scheduled" className="flex items-center gap-2 cursor-pointer">
                    <Calendar className="h-4 w-4" />
                    Schedule for later
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="drip" id="drip" />
                  <Label htmlFor="drip" className="flex items-center gap-2 cursor-pointer">
                    <Clock className="h-4 w-4" />
                    Drip campaign
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {config.scheduleType === 'scheduled' && (
              <div className="space-y-2">
                <Label htmlFor="schedule-date">Scheduled Date & Time</Label>
                <Input
                  id="schedule-date"
                  type="datetime-local"
                  value={config.scheduledDate}
                  onChange={(e) => setConfig({ ...config, scheduledDate: e.target.value })}
                />
              </div>
            )}

            <Separator />

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Campaign Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="track-opens"
                    checked={config.settings.trackOpens}
                    onCheckedChange={(checked) => 
                      setConfig({ 
                        ...config, 
                        settings: { ...config.settings, trackOpens: !!checked } 
                      })
                    }
                  />
                  <Label htmlFor="track-opens">Track opens</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="track-clicks"
                    checked={config.settings.trackClicks}
                    onCheckedChange={(checked) => 
                      setConfig({ 
                        ...config, 
                        settings: { ...config.settings, trackClicks: !!checked } 
                      })
                    }
                  />
                  <Label htmlFor="track-clicks">Track clicks</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="respect-limits"
                    checked={config.settings.respectLimits}
                    onCheckedChange={(checked) => 
                      setConfig({ 
                        ...config, 
                        settings: { ...config.settings, respectLimits: !!checked } 
                      })
                    }
                  />
                  <Label htmlFor="respect-limits">Respect sending limits</Label>
                </div>
              </CardContent>
            </Card>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Target className="h-4 w-4" />
                Campaign Summary
              </h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Channel:</strong> {config.channel.toUpperCase()}</li>
                <li>• <strong>Properties:</strong> {selectedProperties.length} selected</li>
                <li>• <strong>Schedule:</strong> {config.scheduleType === 'immediate' ? 'Immediate' : config.scheduleType}</li>
              </ul>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={startCampaign} disabled={loading}>
                {loading ? 'Starting...' : 'Start Campaign'}
                <Play className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

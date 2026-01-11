import { useState, useEffect } from "react";
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
    interval: number; // days
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
      // Create campaign record
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          name: config.name,
          description: config.description,
          channel: config.channel,
          status: config.scheduleType === 'immediate' ? 'running' : 'scheduled',
          config: config,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          scheduled_at: config.scheduleType === 'scheduled' ? config.scheduledDate : null,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Create campaign targets
      let targetProperties = [];

      if (config.targetSegment === 'selected') {
        targetProperties = selectedProperties;
      } else if (config.targetSegment === 'all_filtered') {
        // This would need to be implemented based on current filters
        // For now, use selected properties
        targetProperties = selectedProperties;
      }

      const campaignTargets = targetProperties.map(propertyId => ({
        campaign_id: campaign.id,
        property_id: propertyId,
        status: 'pending',
      }));

      const { error: targetsError } = await supabase
        .from('campaign_targets')
        .insert(campaignTargets);

      if (targetsError) throw targetsError;

      // If immediate, start processing
      if (config.scheduleType === 'immediate') {
        // Trigger campaign processing (this would be handled by a backend function)
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

      onCampaignStarted?.(campaign.id);
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
        title: "Error",
        description: "Failed to start campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Campaign Basics";
      case 2: return "Content & Targeting";
      case 3: return "Schedule & Settings";
      default: return "Campaign Setup";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1: return "Set up the basic information for your campaign";
      case 2: return "Choose your message and target audience";
      case 3: return "Configure timing and advanced settings";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Start New Campaign
          </DialogTitle>
          <DialogDescription>
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNum
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      step > stepNum ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Campaign Name *</Label>
                <Input
                  id="campaign-name"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="e.g., Miami Properties Q1 2026"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign-description">Description</Label>
                <Textarea
                  id="campaign-description"
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  placeholder="Brief description of this campaign..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Communication Channel</Label>
                <RadioGroup
                  value={config.channel}
                  onValueChange={(value: 'email' | 'sms' | 'call') =>
                    setConfig({ ...config, channel: value })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sms" id="sms" />
                    <Label htmlFor="sms" className="flex items-center gap-2 cursor-pointer">
                      <MessageSquare className="h-4 w-4" />
                      SMS
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="call" id="call" />
                    <Label htmlFor="call" className="flex items-center gap-2 cursor-pointer">
                      <Phone className="h-4 w-4" />
                      Phone Call
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Message Template</Label>
                <Select
                  value={config.templateId}
                  onValueChange={(value) => setConfig({ ...config, templateId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template or create custom message" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Custom Message</SelectItem>
                    {channelTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!config.templateId && (
                <div className="space-y-2">
                  <Label htmlFor="custom-message">Custom Message</Label>
                  <Textarea
                    id="custom-message"
                    value={config.customMessage}
                    onChange={(e) => setConfig({ ...config, customMessage: e.target.value })}
                    placeholder="Enter your message here..."
                    rows={5}
                  />
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label>Target Audience</Label>
                <RadioGroup
                  value={config.targetSegment}
                  onValueChange={(value: 'selected' | 'all_filtered' | 'smart_segment') =>
                    setConfig({ ...config, targetSegment: value })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="selected" id="selected" />
                    <Label htmlFor="selected" className="cursor-pointer">
                      Selected Properties ({selectedProperties.length})
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all_filtered" id="all_filtered" />
                    <Label htmlFor="all_filtered" className="cursor-pointer">
                      All Currently Filtered Properties
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="smart_segment" id="smart_segment" />
                    <Label htmlFor="smart_segment" className="cursor-pointer">
                      Smart Segment (AI-powered targeting)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Schedule Type</Label>
                <RadioGroup
                  value={config.scheduleType}
                  onValueChange={(value: 'immediate' | 'scheduled' | 'drip') =>
                    setConfig({ ...config, scheduleType: value })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="immediate" id="immediate" />
                    <Label htmlFor="immediate" className="flex items-center gap-2 cursor-pointer">
                      <Zap className="h-4 w-4" />
                      Send Immediately
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="scheduled" id="scheduled" />
                    <Label htmlFor="scheduled" className="flex items-center gap-2 cursor-pointer">
                      <Calendar className="h-4 w-4" />
                      Schedule for Later
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="drip" id="drip" />
                    <Label htmlFor="drip" className="flex items-center gap-2 cursor-pointer">
                      <Clock className="h-4 w-4" />
                      Drip Campaign
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {config.scheduleType === 'scheduled' && (
                <div className="space-y-2">
                  <Label htmlFor="scheduled-date">Scheduled Date & Time</Label>
                  <Input
                    id="scheduled-date"
                    type="datetime-local"
                    value={config.scheduledDate}
                    onChange={(e) => setConfig({ ...config, scheduledDate: e.target.value })}
                  />
                </div>
              )}

              {config.scheduleType === 'drip' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="drip-interval">Days Between Messages</Label>
                    <Input
                      id="drip-interval"
                      type="number"
                      value={config.dripConfig?.interval || 3}
                      onChange={(e) => setConfig({
                        ...config,
                        dripConfig: {
                          ...config.dripConfig,
                          interval: parseInt(e.target.value) || 3
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="drip-total">Total Messages</Label>
                    <Input
                      id="drip-total"
                      type="number"
                      value={config.dripConfig?.totalMessages || 3}
                      onChange={(e) => setConfig({
                        ...config,
                        dripConfig: {
                          ...config.dripConfig,
                          totalMessages: parseInt(e.target.value) || 3
                        }
                      })}
                    />
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Advanced Settings
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batch-size">Batch Size</Label>
                    <Input
                      id="batch-size"
                      type="number"
                      value={config.settings.batchSize}
                      onChange={(e) => setConfig({
                        ...config,
                        settings: {
                          ...config.settings,
                          batchSize: parseInt(e.target.value) || 10
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch-delay">Delay Between Batches (min)</Label>
                    <Input
                      id="batch-delay"
                      type="number"
                      value={config.settings.delayBetweenBatches}
                      onChange={(e) => setConfig({
                        ...config,
                        settings: {
                          ...config.settings,
                          delayBetweenBatches: parseInt(e.target.value) || 5
                        }
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="respect-limits"
                      checked={config.settings.respectLimits}
                      onCheckedChange={(checked) => setConfig({
                        ...config,
                        settings: {
                          ...config.settings,
                          respectLimits: checked as boolean
                        }
                      })}
                    />
                    <Label htmlFor="respect-limits">Respect daily sending limits</Label>
                  </div>

                  {config.channel === 'email' && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="track-opens"
                          checked={config.settings.trackOpens}
                          onCheckedChange={(checked) => setConfig({
                            ...config,
                            settings: {
                              ...config.settings,
                              trackOpens: checked as boolean
                            }
                          })}
                        />
                        <Label htmlFor="track-opens">Track email opens</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="track-clicks"
                          checked={config.settings.trackClicks}
                          onCheckedChange={(checked) => setConfig({
                            ...config,
                            settings: {
                              ...config.settings,
                              trackClicks: checked as boolean
                            }
                          })}
                        />
                        <Label htmlFor="track-clicks">Track link clicks</Label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={prevStep}>
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button onClick={startCampaign} disabled={loading} className="gap-2">
                <Play className="h-4 w-4" />
                {config.scheduleType === 'immediate' ? 'Start Campaign' : 'Schedule Campaign'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

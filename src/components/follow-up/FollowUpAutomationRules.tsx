/**
 * Follow-Up Automation Rules
 * UI for configuring automatic follow-up triggers based on lead behavior
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Zap, Clock, Mail, MessageSquare, Phone, Plus, Trash2, 
  ArrowRight, Settings2, Bell, Target 
} from "lucide-react";

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  delayHours: number;
  action: string;
  channel: string;
  enabled: boolean;
}

const DEFAULT_RULES: AutomationRule[] = [
  {
    id: "rule-1",
    name: "No Response After SMS",
    trigger: "no_response",
    delayHours: 72,
    action: "send_followup",
    channel: "email",
    enabled: true,
  },
  {
    id: "rule-2",
    name: "Link Clicked - Hot Lead",
    trigger: "link_clicked",
    delayHours: 1,
    action: "create_reminder",
    channel: "call",
    enabled: true,
  },
  {
    id: "rule-3",
    name: "Page Viewed - Nurture",
    trigger: "page_viewed",
    delayHours: 24,
    action: "send_followup",
    channel: "sms",
    enabled: false,
  },
  {
    id: "rule-4",
    name: "Form Submitted - Priority",
    trigger: "form_submitted",
    delayHours: 0.5,
    action: "create_reminder",
    channel: "call",
    enabled: true,
  },
];

const TRIGGERS = [
  { value: "no_response", label: "No Response", icon: Clock },
  { value: "link_clicked", label: "Link Clicked", icon: Target },
  { value: "page_viewed", label: "Page Viewed", icon: Bell },
  { value: "form_submitted", label: "Form Submitted", icon: Zap },
];

const ACTIONS = [
  { value: "send_followup", label: "Send Follow-up" },
  { value: "create_reminder", label: "Create Reminder" },
  { value: "update_status", label: "Update Lead Status" },
];

const CHANNELS = [
  { value: "email", label: "Email", icon: Mail },
  { value: "sms", label: "SMS", icon: MessageSquare },
  { value: "call", label: "Call", icon: Phone },
];

export const FollowUpAutomationRules = () => {
  const { toast } = useToast();
  const [rules, setRules] = useState<AutomationRule[]>(DEFAULT_RULES);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    trigger: "no_response",
    delayHours: 24,
    action: "send_followup",
    channel: "email",
  });

  const toggleRule = (id: string) => {
    setRules(prev =>
      prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    );
    toast({ title: "Rule updated" });
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    toast({ title: "Rule deleted" });
  };

  const addRule = () => {
    if (!newRule.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setRules(prev => [
      ...prev,
      { ...newRule, id: `rule-${Date.now()}`, enabled: true },
    ]);
    setNewRule({ name: "", trigger: "no_response", delayHours: 24, action: "send_followup", channel: "email" });
    setIsAddingRule(false);
    toast({ title: "Automation rule added" });
  };

  const getChannelIcon = (channel: string) => {
    if (channel === "email") return <Mail className="h-3.5 w-3.5" />;
    if (channel === "sms") return <MessageSquare className="h-3.5 w-3.5" />;
    return <Phone className="h-3.5 w-3.5" />;
  };

  const getTriggerLabel = (trigger: string) =>
    TRIGGERS.find(t => t.value === trigger)?.label || trigger;

  const getActionLabel = (action: string) =>
    ACTIONS.find(a => a.value === action)?.label || action;

  const formatDelay = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const activeCount = rules.filter(r => r.enabled).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings2 className="h-5 w-5 text-primary" />
          Automation Rules
          <Badge variant="secondary" className="ml-auto">{activeCount} active</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rule List */}
        <div className="space-y-2">
          {rules.map(rule => (
            <div
              key={rule.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                rule.enabled
                  ? "border-primary/20 bg-primary/5"
                  : "border-border bg-muted/30 opacity-60"
              }`}
            >
              <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{rule.name}</p>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {getTriggerLabel(rule.trigger)}
                  </Badge>
                  <ArrowRight className="h-3 w-3" />
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    <Clock className="h-2.5 w-2.5 mr-0.5" />
                    {formatDelay(rule.delayHours)}
                  </Badge>
                  <ArrowRight className="h-3 w-3" />
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex items-center gap-0.5">
                    {getChannelIcon(rule.channel)}
                    {getActionLabel(rule.action)}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => deleteRule(rule.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Separator />

        {/* Add Rule */}
        {isAddingRule ? (
          <div className="space-y-3 p-4 border border-dashed border-primary/30 rounded-lg bg-primary/5">
            <div>
              <Label className="text-xs">Rule Name</Label>
              <Input
                value={newRule.name}
                onChange={e => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Hot lead follow-up"
                className="h-8 text-sm mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Trigger</Label>
                <Select value={newRule.trigger} onValueChange={v => setNewRule(prev => ({ ...prev, trigger: v }))}>
                  <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGERS.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Delay (hours)</Label>
                <Input
                  type="number"
                  value={newRule.delayHours}
                  onChange={e => setNewRule(prev => ({ ...prev, delayHours: parseFloat(e.target.value) || 0 }))}
                  className="h-8 text-sm mt-1"
                  min={0}
                  step={0.5}
                />
              </div>
              <div>
                <Label className="text-xs">Action</Label>
                <Select value={newRule.action} onValueChange={v => setNewRule(prev => ({ ...prev, action: v }))}>
                  <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTIONS.map(a => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Channel</Label>
                <Select value={newRule.channel} onValueChange={v => setNewRule(prev => ({ ...prev, channel: v }))}>
                  <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addRule}>Add Rule</Button>
              <Button size="sm" variant="outline" onClick={() => setIsAddingRule(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed"
            onClick={() => setIsAddingRule(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Automation Rule
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Follow-Up Automation Rules
 * UI for configuring automatic follow-up triggers based on lead behavior
 * Now persisted to database
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
import { Skeleton } from "@/components/ui/skeleton";
import { useFollowUpRules, NewFollowUpRule } from "@/hooks/useFollowUpRules";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, Clock, Mail, MessageSquare, Phone, Plus, Trash2, 
  ArrowRight, Settings2, Bell, Target, Loader2 
} from "lucide-react";

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
  const { rules, isLoading, addRule, toggleRule, deleteRule, isAdding } = useFollowUpRules();
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRule, setNewRule] = useState<Omit<NewFollowUpRule, "enabled">>({
    name: "",
    trigger_type: "no_response",
    delay_hours: 24,
    action: "send_followup",
    channel: "email",
  });

  const handleAddRule = () => {
    if (!newRule.name.trim()) return;
    addRule({ ...newRule, enabled: true });
    setNewRule({ name: "", trigger_type: "no_response", delay_hours: 24, action: "send_followup", channel: "email" });
    setIsAddingRule(false);
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

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
          <AnimatePresence mode="popLayout">
            {rules.map(rule => (
              <motion.div
                key={rule.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  rule.enabled
                    ? "border-primary/20 bg-primary/5"
                    : "border-border bg-muted/30 opacity-60"
                }`}
              >
                <Switch 
                  checked={rule.enabled} 
                  onCheckedChange={(checked) => toggleRule(rule.id, checked)} 
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{rule.name}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {getTriggerLabel(rule.trigger_type)}
                    </Badge>
                    <ArrowRight className="h-3 w-3" />
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      <Clock className="h-2.5 w-2.5 mr-0.5" />
                      {formatDelay(rule.delay_hours)}
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
              </motion.div>
            ))}
          </AnimatePresence>
          
          {rules.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted-foreground"
            >
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma regra de automação configurada</p>
            </motion.div>
          )}
        </div>

        <Separator />

        {/* Add Rule */}
        <AnimatePresence mode="wait">
          {isAddingRule ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 p-4 border border-dashed border-primary/30 rounded-lg bg-primary/5"
            >
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
                  <Select value={newRule.trigger_type} onValueChange={v => setNewRule(prev => ({ ...prev, trigger_type: v }))}>
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
                    value={newRule.delay_hours}
                    onChange={e => setNewRule(prev => ({ ...prev, delay_hours: parseFloat(e.target.value) || 0 }))}
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
                <Button size="sm" onClick={handleAddRule} disabled={isAdding || !newRule.name.trim()}>
                  {isAdding && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  Add Rule
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsAddingRule(false)}>Cancel</Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={() => setIsAddingRule(true)}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Automation Rule
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

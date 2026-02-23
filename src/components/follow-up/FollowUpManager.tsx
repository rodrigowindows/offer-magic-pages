import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Bell, Clock, CheckCircle2, AlertTriangle, Calendar, Phone, Mail, MessageSquare } from "lucide-react";
import { format, formatDistanceToNow, isToday, isTomorrow, isPast, addDays } from "date-fns";

interface Reminder {
  id: string;
  property_id: string;
  reminder_type: string;
  due_date: string;
  is_completed: boolean;
  notes: string | null;
  properties?: {
    address: string;
    city: string;
    owner_name: string | null;
    owner_phone: string | null;
  };
}

export const FollowUpManager = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "today" | "overdue" | "upcoming">("all");

  const { data: reminders, isLoading } = useQuery({
    queryKey: ["follow-up-reminders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follow_up_reminders")
        .select("*, properties(address, city, owner_name, owner_phone)")
        .eq("is_completed", false)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data as Reminder[];
    },
  });

  const { data: campaignLogs } = useQuery({
    queryKey: ["campaign-logs-for-reminders"],
    queryFn: async () => {
      const threeDaysAgo = addDays(new Date(), -3).toISOString();
      const { data, error } = await supabase
        .from("campaign_logs")
        .select("*, properties:property_id(address, city, owner_name, owner_phone)")
        .gte("sent_at", threeDaysAgo)
        .is("first_response_at", null)
        .order("sent_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const completeReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("follow_up_reminders")
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-up-reminders"] });
      toast({ title: "Reminder marked as complete" });
    },
  });

  const createReminderFromLog = useMutation({
    mutationFn: async (log: any) => {
      const dueDate = addDays(new Date(log.sent_at), 3);
      const { error } = await supabase
        .from("follow_up_reminders")
        .insert({
          property_id: log.property_id,
          reminder_type: "no_response",
          due_date: dueDate.toISOString(),
          notes: `No response after ${log.channel || log.campaign_type} sent on ${format(new Date(log.sent_at), "MMM d")}`,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-up-reminders"] });
      toast({ title: "Follow-up reminder created" });
    },
  });

  const filteredReminders = reminders?.filter((r) => {
    const dueDate = new Date(r.due_date);
    switch (filter) {
      case "today": return isToday(dueDate);
      case "overdue": return isPast(dueDate) && !isToday(dueDate);
      case "upcoming": return !isPast(dueDate) && !isToday(dueDate);
      default: return true;
    }
  });

  const overdueCount = reminders?.filter(r => isPast(new Date(r.due_date)) && !isToday(new Date(r.due_date))).length || 0;
  const todayCount = reminders?.filter(r => isToday(new Date(r.due_date))).length || 0;
  const upcomingCount = reminders?.filter(r => !isPast(new Date(r.due_date)) && !isToday(new Date(r.due_date))).length || 0;
  const noResponseCount = campaignLogs?.length || 0;

  const getPriorityColor = (dueDate: string) => {
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) return "destructive";
    if (isToday(date)) return "default";
    if (isTomorrow(date)) return "secondary";
    return "outline";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "no_response": return <Bell className="h-4 w-4" />;
      case "sequence_step": return <Clock className="h-4 w-4" />;
      case "manual": return <Calendar className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-colors ${filter === "overdue" ? "ring-2 ring-destructive" : ""}`}
          onClick={() => setFilter("overdue")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueCount}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-colors ${filter === "today" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setFilter("today")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayCount}</p>
                <p className="text-xs text-muted-foreground">Due Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-colors ${filter === "upcoming" ? "ring-2 ring-chart-2" : ""}`}
          onClick={() => setFilter("upcoming")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-2/10 rounded-lg">
                <Calendar className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingCount}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-colors ${filter === "all" ? "ring-2 ring-border" : ""}`}
          onClick={() => setFilter("all")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{noResponseCount}</p>
                <p className="text-xs text-muted-foreground">No Response (3d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* No Response Alerts */}
      {noResponseCount > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              No Response Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              These leads were contacted but haven't responded in 3+ days. Create follow-up reminders or take action.
            </p>
            <div className="space-y-2">
              {campaignLogs?.slice(0, 5).map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    {log.channel === "email" || log.campaign_type === "email" ? (
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    ) : log.channel === "sms" ? (
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{log.property_address || log.properties?.address}</p>
                      <p className="text-xs text-muted-foreground">
                        Sent {formatDistanceToNow(new Date(log.sent_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => createReminderFromLog.mutate(log)}
                  >
                    Create Reminder
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Follow-up Reminders List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Follow-up Reminders
            <Badge variant="secondary" className="ml-2">{filteredReminders?.length || 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filteredReminders?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No reminders in this category</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReminders?.map((reminder) => (
                <div 
                  key={reminder.id} 
                  className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={reminder.is_completed}
                    onCheckedChange={() => completeReminderMutation.mutate(reminder.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeIcon(reminder.reminder_type)}
                      <p className="font-medium truncate">
                        {reminder.properties?.address}, {reminder.properties?.city}
                      </p>
                    </div>
                    {reminder.properties?.owner_name && (
                      <p className="text-sm text-muted-foreground">
                        {reminder.properties.owner_name}
                        {reminder.properties.owner_phone && ` • ${reminder.properties.owner_phone}`}
                      </p>
                    )}
                    {reminder.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{reminder.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant={getPriorityColor(reminder.due_date)}>
                      {isPast(new Date(reminder.due_date)) && !isToday(new Date(reminder.due_date))
                        ? "Overdue"
                        : isToday(new Date(reminder.due_date))
                        ? "Today"
                        : formatDistanceToNow(new Date(reminder.due_date), { addSuffix: true })}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(reminder.due_date), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
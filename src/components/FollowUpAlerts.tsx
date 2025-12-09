import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Calendar, Phone, User, MapPin, Check, X } from "lucide-react";
import { format, isToday, isTomorrow, isPast, addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface FollowUpAlert {
  id: string;
  property_id: string;
  note_text: string;
  follow_up_date: string;
  created_at: string;
  property?: {
    address: string;
    owner_name?: string;
    owner_phone?: string;
  };
}

export function FollowUpAlerts() {
  const [alerts, setAlerts] = useState<FollowUpAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      // Get follow-ups for the next 7 days and overdue ones
      const startDate = addDays(new Date(), -30).toISOString().split('T')[0];
      const endDate = addDays(new Date(), 7).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from("property_notes")
        .select(`
          id,
          property_id,
          note_text,
          follow_up_date,
          created_at
        `)
        .not("follow_up_date", "is", null)
        .gte("follow_up_date", startDate)
        .lte("follow_up_date", endDate)
        .order("follow_up_date", { ascending: true });

      if (error) throw error;

      // Fetch property details for each alert
      const alertsWithProperties: FollowUpAlert[] = [];
      for (const alert of data || []) {
        const { data: property } = await supabase
          .from("properties")
          .select("address, owner_name, owner_phone")
          .eq("id", alert.property_id)
          .maybeSingle();

        alertsWithProperties.push({
          ...alert,
          property: property || undefined,
        });
      }

      setAlerts(alertsWithProperties);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("property_notes")
        .update({ follow_up_date: null })
        .eq("id", alertId);

      if (error) throw error;

      setAlerts(alerts.filter(a => a.id !== alertId));
      toast({
        title: "Dismissed",
        description: "Follow-up alert dismissed",
      });
    } catch (error) {
      console.error("Error dismissing alert:", error);
    }
  };

  const snoozeAlert = async (alertId: string, days: number) => {
    try {
      const newDate = addDays(new Date(), days).toISOString().split('T')[0];
      
      const { error } = await supabase
        .from("property_notes")
        .update({ follow_up_date: newDate })
        .eq("id", alertId);

      if (error) throw error;

      fetchAlerts();
      toast({
        title: "Snoozed",
        description: `Follow-up snoozed for ${days} day(s)`,
      });
    } catch (error) {
      console.error("Error snoozing alert:", error);
    }
  };

  const getAlertStatus = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isPast(date) && !isToday(date)) return { label: "Overdue", variant: "destructive" as const };
    if (isToday(date)) return { label: "Today", variant: "default" as const };
    if (isTomorrow(date)) return { label: "Tomorrow", variant: "secondary" as const };
    return { label: format(date, "MMM d"), variant: "outline" as const };
  };

  const overdueCount = alerts.filter(a => isPast(new Date(a.follow_up_date)) && !isToday(new Date(a.follow_up_date))).length;
  const todayCount = alerts.filter(a => isToday(new Date(a.follow_up_date))).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          Follow-Up Alerts
          {overdueCount > 0 && (
            <Badge variant="destructive" className="text-xs">{overdueCount} overdue</Badge>
          )}
          {todayCount > 0 && (
            <Badge variant="default" className="text-xs">{todayCount} today</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2 pr-4">
            {alerts.map((alert) => {
              const status = getAlertStatus(alert.follow_up_date);
              return (
                <div
                  key={alert.id}
                  className="p-3 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                      </div>
                      
                      {alert.property && (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate">{alert.property.address}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {alert.property?.owner_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {alert.property.owner_name}
                          </span>
                        )}
                        {alert.property?.owner_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {alert.property.owner_phone}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {alert.note_text}
                      </p>
                    </div>
                    
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => snoozeAlert(alert.id, 1)}
                        title="Snooze 1 day"
                      >
                        <Calendar className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => dismissAlert(alert.id)}
                        title="Dismiss"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

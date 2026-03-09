import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { handleAIResponseError, withAILoading } from "@/lib/aiErrorHandler";
import { Clock, Phone, Mail, MessageSquare, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface TimingResult {
  best_call_time: { day: string; time: string; reason: string };
  best_sms_time: { day: string; time: string; reason: string };
  best_email_time: { day: string; time: string; reason: string };
  urgency: "immediate" | "this_week" | "next_week" | "low";
  urgency_reason: string;
  contact_frequency: string;
  avoid_times: string[];
  personalization_tip: string;
}

interface Props {
  property: Record<string, any>;
  campaignHistory?: any[];
}

export const AITimingDetector = ({ property, campaignHistory = [] }: Props) => {
  const [result, setResult] = useState<TimingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const analyze = async () => {
    const data = await withAILoading(setLoading, "AI Timing", toast, async () => {
      const { data, error } = await supabase.functions.invoke("ai-timing-detector", {
        body: { property, campaignHistory },
      });
      if (error) throw error;
      if (handleAIResponseError(data?.error, { toast, context: "AI Timing" })) return null;
      return data as TimingResult;
    });
    if (data) {
      setResult(data);
      setExpanded(true);
    }
  };

  const urgencyColor: Record<string, string> = {
    immediate: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    this_week: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    next_week: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    low: "bg-muted text-muted-foreground",
  };

  if (!result) {
    return (
      <Button variant="outline" size="sm" onClick={analyze} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
        AI Timing
      </Button>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            AI Timing Detector
          </span>
          <div className="flex items-center gap-2">
            <Badge className={urgencyColor[result.urgency]}>{result.urgency.replace("_", " ")}</Badge>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardTitle>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Phone className="h-4 w-4" />, label: "Call", data: result.best_call_time },
              { icon: <MessageSquare className="h-4 w-4" />, label: "SMS", data: result.best_sms_time },
              { icon: <Mail className="h-4 w-4" />, label: "Email", data: result.best_email_time },
            ].map((ch) => (
              <div key={ch.label} className="bg-muted/50 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center gap-1 mb-1">{ch.icon}<span className="font-semibold">{ch.label}</span></div>
                <p className="text-primary font-bold">{ch.data.day}</p>
                <p className="text-xs">{ch.data.time}</p>
                <p className="text-xs text-muted-foreground mt-1">{ch.data.reason}</p>
              </div>
            ))}
          </div>

          <div className="bg-muted/30 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">Urgency: <span className="font-semibold text-foreground">{result.urgency_reason}</span></p>
            <p className="text-xs text-muted-foreground mt-1">Frequency: <span className="font-semibold text-foreground">{result.contact_frequency}</span></p>
          </div>

          {result.avoid_times.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-destructive">⚠️ Avoid:</p>
              <p className="text-xs">{result.avoid_times.join(" • ")}</p>
            </div>
          )}

          <div className="bg-primary/5 p-3 rounded-lg">
            <p className="text-xs">💡 {result.personalization_tip}</p>
          </div>

          <Button variant="outline" size="sm" onClick={analyze} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Refresh Timing
          </Button>
        </CardContent>
      )}
    </Card>
  );
};

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Mail } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface LeadSuggestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyIds: string[];
  onRefresh?: () => void;
}

interface Suggestion {
  property_id: string;
  address: string;
  current_status: string;
  suggestion: string;
  email_stats?: {
    sent_count: number;
    opened_count: number;
    last_sent?: string;
    last_opened?: string;
  };
  error?: string;
}

export function LeadSuggestionsDialog({
  open,
  onOpenChange,
  propertyIds,
  onRefresh,
}: LeadSuggestionsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const { toast } = useToast();

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "ai-lead-suggestions",
        {
          body: { propertyIds },
        }
      );

      if (error) throw error;

      setSuggestions(data.suggestions);
      
      toast({
        title: "AI Analysis Complete",
        description: `Generated suggestions for ${data.suggestions.length} leads`,
      });
    } catch (error: any) {
      console.error("Error generating suggestions:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI suggestions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && suggestions.length === 0) {
      generateSuggestions();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Lead Suggestions
          </DialogTitle>
          <DialogDescription>
            AI-powered analysis and recommendations for {propertyIds.length} selected{" "}
            {propertyIds.length === 1 ? "lead" : "leads"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                Analyzing leads and generating suggestions...
              </p>
            </div>
          </div>
        ) : suggestions.length > 0 ? (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.property_id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{suggestion.address}</h3>
                      <Badge variant="outline" className="mt-1">
                        {suggestion.current_status}
                      </Badge>
                    </div>
                    {suggestion.email_stats && (
                      <div className="text-right text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span>
                          {suggestion.email_stats.sent_count} sent, {suggestion.email_stats.opened_count} opened
                        </span>
                      </div>
                    )}
                  </div>

                  {suggestion.error ? (
                    <p className="text-sm text-destructive">{suggestion.error}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <div className="text-sm whitespace-pre-wrap">
                        {suggestion.suggestion}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click "Analyze Leads" to get AI-powered suggestions</p>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => generateSuggestions()}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {suggestions.length > 0 ? "Refresh Analysis" : "Analyze Leads"}
              </>
            )}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

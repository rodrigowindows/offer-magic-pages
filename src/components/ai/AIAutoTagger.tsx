import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { handleAIResponseError, withAILoading } from "@/lib/aiErrorHandler";
import { Tags, Loader2, ChevronDown, ChevronUp, Check, X } from "lucide-react";

interface AutoTagResult {
  suggested_tags: string[];
  confidence: Record<string, number>;
  reasoning: Record<string, string>;
  priority_score: number;
  lead_category: "hot" | "warm" | "cold";
  summary: string;
}

interface Props {
  property: Record<string, any>;
  onApplyTags?: (tags: string[]) => void;
}

export const AIAutoTagger = ({ property, onApplyTags }: Props) => {
  const [result, setResult] = useState<AutoTagResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const analyze = async () => {
    const data = await withAILoading(setLoading, "AI Tagger", toast, async () => {
      const { data, error } = await supabase.functions.invoke("ai-auto-tagger", {
        body: { property },
      });
      if (error) throw error;
      if (handleAIResponseError(data?.error, { toast, context: "AI Tagger" })) return null;
      return data as AutoTagResult;
    });
    if (data) {
      setResult(data);
      setSelectedTags(new Set(data.suggested_tags));
      setExpanded(true);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const categoryColor: Record<string, string> = {
    hot: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    warm: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    cold: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };

  const confidenceColor = (c: number) => c >= 80 ? "text-green-600" : c >= 50 ? "text-yellow-600" : "text-muted-foreground";

  if (!result) {
    return (
      <Button variant="outline" size="sm" onClick={analyze} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tags className="h-4 w-4" />}
        AI Auto-Tag
      </Button>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Tags className="h-4 w-4 text-primary" />
            AI Auto-Tagger
          </span>
          <div className="flex items-center gap-2">
            <Badge className={categoryColor[result.lead_category]}>
              {result.lead_category} lead
            </Badge>
            <Badge variant="outline">Score: {result.priority_score}</Badge>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardTitle>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">{result.summary}</p>

          <div className="space-y-2">
            <p className="font-semibold">Suggested Tags (click to toggle):</p>
            <div className="flex flex-wrap gap-2">
              {result.suggested_tags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.has(tag) ? "default" : "outline"}
                  className="cursor-pointer gap-1"
                  onClick={() => toggleTag(tag)}
                >
                  {selectedTags.has(tag) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {tag}
                  <span className={`text-[10px] ${confidenceColor(result.confidence[tag] || 0)}`}>
                    {result.confidence[tag] || 0}%
                  </span>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-xs">Reasoning:</p>
            {result.suggested_tags.map((tag) => (
              <p key={tag} className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{tag}:</span> {result.reasoning[tag] || ""}
              </p>
            ))}
          </div>

          <div className="flex gap-2">
            {onApplyTags && (
              <Button
                size="sm"
                onClick={() => onApplyTags(Array.from(selectedTags))}
                className="flex-1"
              >
                Apply {selectedTags.size} Tags
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Re-analyze"}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

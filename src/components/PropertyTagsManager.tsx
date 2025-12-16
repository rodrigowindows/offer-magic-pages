import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tag, X, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PropertyTagsManagerProps {
  propertyId: string;
  currentTags?: string[] | null;
  onTagsUpdated?: (tags: string[]) => void;
}

// Suggested tags
const SUGGESTED_TAGS = [
  "tier-1",
  "tier-2",
  "tier-3",
  "hot-lead",
  "deed-certified",
  "vacant",
  "pool-distress",
  "high-equity",
  "out-of-state",
  "estate-trust",
  "follow-up",
  "contacted",
  "interested",
  "not-interested",
];

export const PropertyTagsManager = ({
  propertyId,
  currentTags = [],
  onTagsUpdated,
}: PropertyTagsManagerProps) => {
  const [tags, setTags] = useState<string[]>(currentTags || []);
  const [newTag, setNewTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (!normalizedTag) return;

    if (tags.includes(normalizedTag)) {
      toast({
        title: "Tag already exists",
        description: `"${normalizedTag}" is already added`,
        variant: "destructive",
      });
      return;
    }

    setTags([...tags, normalizedTag]);
    setNewTag("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("properties")
        .update({ tags: tags })
        .eq("id", propertyId);

      if (error) throw error;

      toast({
        title: "✅ Tags updated",
        description: `${tags.length} tags saved successfully`,
      });

      if (onTagsUpdated) {
        onTagsUpdated(tags);
      }
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Save failed",
        description: error.message || "Could not save tags",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Tag className="h-4 w-4 mr-2" />
          Tags ({tags.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Property Tags</DialogTitle>
          <DialogDescription>
            Add tags to categorize and filter properties
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Tags */}
          <div>
            <label className="text-sm font-medium">Current Tags:</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tags yet</p>
              ) : (
                tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Add New Tag */}
          <div>
            <label className="text-sm font-medium">Add New Tag:</label>
            <div className="mt-2 flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Enter tag name..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(newTag);
                  }
                }}
              />
              <Button
                onClick={() => addTag(newTag)}
                disabled={!newTag.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Suggested Tags */}
          <div>
            <label className="text-sm font-medium">Quick Add:</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUGGESTED_TAGS.filter((tag) => !tags.includes(tag)).map(
                (tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-secondary"
                    onClick={() => addTag(tag)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                )
              )}
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? "Saving..." : "Save Tags"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

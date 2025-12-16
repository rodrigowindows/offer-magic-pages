import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Filter } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface PropertyTagsFilterProps {
  onFilterChange: (selectedTags: string[]) => void;
  selectedTags?: string[];
}

export const PropertyTagsFilter = ({
  onFilterChange,
  selectedTags = [],
}: PropertyTagsFilterProps) => {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [localSelectedTags, setLocalSelectedTags] = useState<string[]>(selectedTags);

  // Fetch all unique tags from database
  useEffect(() => {
    fetchAvailableTags();
  }, []);

  const fetchAvailableTags = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("tags")
        .not("tags", "is", null);

      if (error) throw error;

      // Extract unique tags
      const allTags = new Set<string>();
      data.forEach((property: any) => {
        if (property.tags && Array.isArray(property.tags)) {
          property.tags.forEach((tag: string) => allTags.add(tag));
        }
      });

      setAvailableTags(Array.from(allTags).sort());
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const toggleTag = (tag: string) => {
    const newTags = localSelectedTags.includes(tag)
      ? localSelectedTags.filter((t) => t !== tag)
      : [...localSelectedTags, tag];

    setLocalSelectedTags(newTags);
    onFilterChange(newTags);
  };

  const clearAllTags = () => {
    setLocalSelectedTags([]);
    onFilterChange([]);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Selected Tags Display */}
      {localSelectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {localSelectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {tag}
              <button
                onClick={() => toggleTag(tag)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllTags}
            className="h-6 px-2"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Filter Dropdown */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter by Tags
            {localSelectedTags.length > 0 && (
              <Badge variant="default" className="ml-2">
                {localSelectedTags.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Filter by Tags</h4>
              <p className="text-xs text-muted-foreground">
                Select tags to filter properties
              </p>
            </div>

            {availableTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tags found. Add tags to properties to use filters.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {availableTags.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag}`}
                      checked={localSelectedTags.includes(tag)}
                      onCheckedChange={() => toggleTag(tag)}
                    />
                    <Label
                      htmlFor={`tag-${tag}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {tag}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {localSelectedTags.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllTags}
                className="w-full"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

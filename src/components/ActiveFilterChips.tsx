import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ActiveFilter {
  id: string;
  label: string;
  value: string;
  onRemove: () => void;
}

interface ActiveFilterChipsProps {
  filters: ActiveFilter[];
  onClearAll: () => void;
}

export const ActiveFilterChips = ({ filters, onClearAll }: ActiveFilterChipsProps) => {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-3 px-1">
      <span className="text-sm font-medium text-gray-600">Active filters:</span>
      {filters.map((filter) => (
        <Badge
          key={filter.id}
          variant="secondary"
          className="gap-1.5 pl-3 pr-2 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
        >
          <span className="text-xs font-medium">
            {filter.label}: <span className="font-semibold">{filter.value}</span>
          </span>
          <button
            onClick={filter.onRemove}
            className="ml-1 rounded-full hover:bg-blue-200 p-0.5 transition-colors"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {filters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 text-xs text-gray-600 hover:text-gray-900"
        >
          Clear all ({filters.length})
        </Button>
      )}
    </div>
  );
};

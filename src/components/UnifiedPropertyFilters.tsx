import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, X, ChevronDown, User, Tag, Settings } from "lucide-react";
import { PropertyTagsFilter } from "./PropertyTagsFilter";
import { AdvancedPropertyFilters, PropertyFilters as AdvancedFilters } from "./AdvancedPropertyFilters";

interface UnifiedPropertyFiltersProps {
  // Status filters
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  statusCounts?: {
    all: number;
    new: number;
    contacted: number;
    interested: number;
    not_interested: number;
    appointment_set: number;
    offer_made: number;
    sold: number;
  };

  // Approval filters
  approvalStatus?: string;
  onApprovalStatusChange?: (status: string) => void;
  approvalCounts?: {
    pending: number;
    approved: number;
    rejected: number;
  };

  // User filter
  onUserFilter?: (userId: string | null, userName: string | null) => void;
  currentUserId?: string | null;
  currentUserName?: string | null;

  // Tags filter
  selectedTags?: string[];
  onTagsChange?: (tags: string[]) => void;

  // Advanced filters
  advancedFilters?: AdvancedFilters;
  onAdvancedFiltersChange?: (filters: AdvancedFilters) => void;

  // Clear all
  onClearAll?: () => void;
}

export const UnifiedPropertyFilters = ({
  selectedStatus = "all",
  onStatusChange,
  statusCounts,
  approvalStatus = "all",
  onApprovalStatusChange,
  approvalCounts,
  onUserFilter,
  currentUserId,
  currentUserName,
  selectedTags = [],
  onTagsChange,
  advancedFilters,
  onAdvancedFiltersChange,
  onClearAll,
}: UnifiedPropertyFiltersProps) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const activeFiltersCount =
    (selectedStatus !== "all" ? 1 : 0) +
    (approvalStatus !== "all" ? 1 : 0) +
    (currentUserId ? 1 : 0) +
    selectedTags.length +
    (advancedFilters
      ? Object.values(advancedFilters).filter((v) => v !== null && v !== "" && v !== undefined).length
      : 0);

  const handleClearAll = () => {
    onStatusChange?.("all");
    onApprovalStatusChange?.("all");
    onUserFilter?.(null, null);
    onTagsChange?.([]);
    onAdvancedFiltersChange?.({
      minValue: null,
      maxValue: null,
      minTax: null,
      maxTax: null,
      hasImage: null,
      city: null,
      zipCode: null,
    });
    onClearAll?.();
  };

  return (
    <div className="space-y-3">
      {/* Main Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-muted/50 rounded-lg p-3 border">
        <Filter className="h-4 w-4 text-muted-foreground" />

        {/* Lead Status */}
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[180px] h-9 bg-background">
            <SelectValue placeholder="Lead Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              All Leads {statusCounts?.all ? `(${statusCounts.all})` : ""}
            </SelectItem>
            <SelectItem value="new">
              New {statusCounts?.new ? `(${statusCounts.new})` : ""}
            </SelectItem>
            <SelectItem value="contacted">
              Contacted {statusCounts?.contacted ? `(${statusCounts.contacted})` : ""}
            </SelectItem>
            <SelectItem value="interested">
              Interested {statusCounts?.interested ? `(${statusCounts.interested})` : ""}
            </SelectItem>
            <SelectItem value="not_interested">
              Not Interested {statusCounts?.not_interested ? `(${statusCounts.not_interested})` : ""}
            </SelectItem>
            <SelectItem value="appointment_set">
              Appointment Set {statusCounts?.appointment_set ? `(${statusCounts.appointment_set})` : ""}
            </SelectItem>
            <SelectItem value="offer_made">
              Offer Made {statusCounts?.offer_made ? `(${statusCounts.offer_made})` : ""}
            </SelectItem>
            <SelectItem value="sold">
              Sold {statusCounts?.sold ? `(${statusCounts.sold})` : ""}
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Approval Status */}
        <Select value={approvalStatus} onValueChange={onApprovalStatusChange}>
          <SelectTrigger className="w-[180px] h-9 bg-background">
            <SelectValue placeholder="Approval Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">
              Pending {approvalCounts?.pending ? `(${approvalCounts.pending})` : ""}
            </SelectItem>
            <SelectItem value="approved">
              Approved {approvalCounts?.approved ? `(${approvalCounts.approved})` : ""}
            </SelectItem>
            <SelectItem value="rejected">
              Rejected {approvalCounts?.rejected ? `(${approvalCounts.rejected})` : ""}
            </SelectItem>
          </SelectContent>
        </Select>

        {/* User Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <User className="h-4 w-4 mr-2" />
              {currentUserName || "Filter by User"}
              {currentUserId && <X className="h-3 w-3 ml-2" onClick={(e) => {
                e.stopPropagation();
                onUserFilter?.(null, null);
              }} />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Filter by User</h4>
              <p className="text-xs text-muted-foreground">
                Show properties approved/rejected by specific user
              </p>
              {/* User list would be populated here */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onUserFilter?.(null, null)}
              >
                Clear User Filter
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Tags Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Tag className="h-4 w-4 mr-2" />
              Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <PropertyTagsFilter
              selectedTags={selectedTags}
              onFilterChange={onTagsChange || (() => {})}
            />
          </PopoverContent>
        </Popover>

        {/* Advanced Filters */}
        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Settings className="h-4 w-4 mr-2" />
              Advanced
              <ChevronDown className="h-3 w-3 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="end">
            <AdvancedPropertyFilters
              filters={advancedFilters || {}}
              onFiltersChange={onAdvancedFiltersChange || (() => {})}
            />
          </PopoverContent>
        </Popover>

        {/* Clear All */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 ml-auto"
            onClick={handleClearAll}
          >
            <X className="h-4 w-4 mr-2" />
            Clear All ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedStatus !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status: {selectedStatus}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onStatusChange?.("all")}
              />
            </Badge>
          )}
          {approvalStatus !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Approval: {approvalStatus}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onApprovalStatusChange?.("all")}
              />
            </Badge>
          )}
          {currentUserId && (
            <Badge variant="secondary" className="gap-1">
              User: {currentUserName}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onUserFilter?.(null, null)}
              />
            </Badge>
          )}
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              Tag: {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onTagsChange?.(selectedTags.filter((t) => t !== tag))}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

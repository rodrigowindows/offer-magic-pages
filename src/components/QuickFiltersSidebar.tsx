import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { X, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { PropertyUserFilter } from "./PropertyUserFilter";
import { AdvancedPropertyFilters, PropertyFilters as AdvancedFilters } from "./AdvancedPropertyFilters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface QuickFiltersSidebarProps {
  approvalStatus: string;
  onApprovalStatusChange: (status: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  selectedCities: string[];
  onCitiesChange: (cities: string[]) => void;
  dateFilter: string;
  onDateFilterChange: (filter: string) => void;
  statusCounts: { pending: number; approved: number; rejected: number };
  onUserFilter: (userId: string | null, userName: string | null) => void;
  currentUserId?: string | null;
  currentUserName?: string | null;
  advancedFilters: AdvancedFilters;
  onAdvancedFiltersChange: (filters: AdvancedFilters) => void;
  onClearAll: () => void;
}

export const QuickFiltersSidebar = ({
  approvalStatus,
  onApprovalStatusChange,
  selectedTags,
  onTagsChange,
  priceRange,
  onPriceRangeChange,
  selectedCities,
  onCitiesChange,
  dateFilter,
  onDateFilterChange,
  statusCounts,
  onUserFilter,
  currentUserId,
  currentUserName,
  advancedFilters,
  onAdvancedFiltersChange,
  onClearAll,
}: QuickFiltersSidebarProps) => {
  const [availableTags, setAvailableTags] = useState<{ tag: string; count: number }[]>([]);
  const [availableCities, setAvailableCities] = useState<{ city: string; count: number }[]>([]);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    tags: true,
    location: true,
    price: true,
    date: true,
  });

  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      const { data } = await supabase
        .from("properties")
        .select("tags")
        .not("tags", "is", null);

      if (data) {
        const tagCounts: Record<string, number> = {};
        data.forEach((prop: any) => {
          prop.tags?.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });

        const tagsList = Object.entries(tagCounts)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count);

        setAvailableTags(tagsList);
      }
    };

    fetchTags();
  }, []);

  // Fetch available cities
  useEffect(() => {
    const fetchCities = async () => {
      const { data } = await supabase
        .from("properties")
        .select("city")
        .not("city", "is", null);

      if (data) {
        const cityCounts: Record<string, number> = {};
        data.forEach((prop: any) => {
          if (prop.city) {
            cityCounts[prop.city] = (cityCounts[prop.city] || 0) + 1;
          }
        });

        const citiesList = Object.entries(cityCounts)
          .map(([city, count]) => ({ city, count }))
          .sort((a, b) => b.count - a.count);

        setAvailableCities(citiesList);
      }
    };

    fetchCities();
  }, []);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const toggleCity = (city: string) => {
    if (selectedCities.includes(city)) {
      onCitiesChange(selectedCities.filter((c) => c !== city));
    } else {
      onCitiesChange([...selectedCities, city]);
    }
  };

  const clearAllFilters = () => {
    onClearAll();
  };

  // Count advanced filters
  const advancedFiltersCount = Object.keys(advancedFilters).filter(key => {
    const value = advancedFilters[key as keyof AdvancedFilters];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return true;
    if (value instanceof Date) return true;
    if (typeof value === 'number') return true;
    return false;
  }).length;

  const activeFiltersCount =
    (approvalStatus !== "all" ? 1 : 0) +
    selectedTags.length +
    selectedCities.length +
    (priceRange[0] !== 0 || priceRange[1] !== 1000000 ? 1 : 0) +
    (dateFilter !== "all" ? 1 : 0) +
    advancedFiltersCount;

  return (
    <div className="w-64 border-r bg-card p-4 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Filters</h3>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-7 text-xs"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Count */}
      {activeFiltersCount > 0 && (
        <Badge variant="secondary" className="w-full justify-center">
          {activeFiltersCount} active filter{activeFiltersCount !== 1 ? "s" : ""}
        </Badge>
      )}

      {/* Advanced Filters Button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setIsAdvancedFiltersOpen(true)}
      >
        <SlidersHorizontal className="h-4 w-4 mr-2" />
        Advanced Filters
        {advancedFiltersCount > 0 && (
          <Badge variant="secondary" className="ml-2">
            {advancedFiltersCount}
          </Badge>
        )}
      </Button>

      {/* Approval Status */}
      <div className="space-y-2">
        <button
          className="flex justify-between items-center w-full text-sm font-semibold"
          onClick={() => toggleSection("status")}
        >
          <span>📊 Status</span>
          {expandedSections.status ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {expandedSections.status && (
          <div className="space-y-2 pl-2">
            <button
              className={`flex justify-between items-center w-full p-2 rounded text-sm ${
                approvalStatus === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
              onClick={() => onApprovalStatusChange("all")}
            >
              <span>All</span>
              <Badge variant="outline">{statusCounts.pending + statusCounts.approved + statusCounts.rejected}</Badge>
            </button>

            <button
              className={`flex justify-between items-center w-full p-2 rounded text-sm ${
                approvalStatus === "pending" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900" : "hover:bg-muted"
              }`}
              onClick={() => onApprovalStatusChange("pending")}
            >
              <span>🟡 Pending</span>
              <Badge variant="outline">{statusCounts.pending}</Badge>
            </button>

            <button
              className={`flex justify-between items-center w-full p-2 rounded text-sm ${
                approvalStatus === "approved" ? "bg-green-100 text-green-800 dark:bg-green-900" : "hover:bg-muted"
              }`}
              onClick={() => onApprovalStatusChange("approved")}
            >
              <span>🟢 Approved</span>
              <Badge variant="outline">{statusCounts.approved}</Badge>
            </button>

            <button
              className={`flex justify-between items-center w-full p-2 rounded text-sm ${
                approvalStatus === "rejected" ? "bg-red-100 text-red-800 dark:bg-red-900" : "hover:bg-muted"
              }`}
              onClick={() => onApprovalStatusChange("rejected")}
            >
              <span>🔴 Rejected</span>
              <Badge variant="outline">{statusCounts.rejected}</Badge>
            </button>
          </div>
        )}
      </div>

      {/* User Filter */}
      <div className="space-y-2">
        <div className="text-sm font-semibold mb-2">👤 Aprovado por</div>
        <PropertyUserFilter onUserFilter={onUserFilter} />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <button
          className="flex justify-between items-center w-full text-sm font-semibold"
          onClick={() => toggleSection("tags")}
        >
          <span>🏷️ Tags</span>
          {expandedSections.tags ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {expandedSections.tags && (
          <div className="space-y-1 pl-2 max-h-48 overflow-y-auto">
            {availableTags.slice(0, 10).map(({ tag, count }) => (
              <div key={tag} className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag}`}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={() => toggleTag(tag)}
                  />
                  <Label htmlFor={`tag-${tag}`} className="text-xs cursor-pointer">
                    {tag}
                  </Label>
                </div>
                <Badge variant="outline" className="text-xs">
                  {count}
                </Badge>
              </div>
            ))}
            {availableTags.length > 10 && (
              <p className="text-xs text-muted-foreground pt-2">
                +{availableTags.length - 10} more tags
              </p>
            )}
          </div>
        )}
      </div>

      {/* Location */}
      <div className="space-y-2">
        <button
          className="flex justify-between items-center w-full text-sm font-semibold"
          onClick={() => toggleSection("location")}
        >
          <span>🏙️ Location</span>
          {expandedSections.location ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {expandedSections.location && (
          <div className="space-y-1 pl-2 max-h-48 overflow-y-auto">
            {availableCities.slice(0, 10).map(({ city, count }) => (
              <div key={city} className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`city-${city}`}
                    checked={selectedCities.includes(city)}
                    onCheckedChange={() => toggleCity(city)}
                  />
                  <Label htmlFor={`city-${city}`} className="text-xs cursor-pointer">
                    {city}
                  </Label>
                </div>
                <Badge variant="outline" className="text-xs">
                  {count}
                </Badge>
              </div>
            ))}
            {availableCities.length > 10 && (
              <p className="text-xs text-muted-foreground pt-2">
                +{availableCities.length - 10} more cities
              </p>
            )}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <button
          className="flex justify-between items-center w-full text-sm font-semibold"
          onClick={() => toggleSection("price")}
        >
          <span>💰 Price Range</span>
          {expandedSections.price ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {expandedSections.price && (
          <div className="space-y-3 pl-2">
            <div>
              <Slider
                value={priceRange}
                onValueChange={(value) => onPriceRangeChange(value as [number, number])}
                min={0}
                max={1000000}
                step={10000}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>${(priceRange[0] / 1000).toFixed(0)}k</span>
              <span>${(priceRange[1] / 1000).toFixed(0)}k</span>
            </div>
          </div>
        )}
      </div>

      {/* Import Date */}
      <div className="space-y-2">
        <button
          className="flex justify-between items-center w-full text-sm font-semibold"
          onClick={() => toggleSection("date")}
        >
          <span>📅 Import Date</span>
          {expandedSections.date ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {expandedSections.date && (
          <RadioGroup value={dateFilter} onValueChange={onDateFilterChange} className="pl-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="date-all" />
              <Label htmlFor="date-all" className="text-xs cursor-pointer">
                All time
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="7days" id="date-7" />
              <Label htmlFor="date-7" className="text-xs cursor-pointer">
                Last 7 days
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="30days" id="date-30" />
              <Label htmlFor="date-30" className="text-xs cursor-pointer">
                Last 30 days
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="90days" id="date-90" />
              <Label htmlFor="date-90" className="text-xs cursor-pointer">
                Last 90 days
              </Label>
            </div>
          </RadioGroup>
        )}
      </div>

      {/* Active Filters Summary */}
      {(selectedTags.length > 0 || selectedCities.length > 0) && (
        <div className="pt-4 border-t space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Active Filters:</p>
          <div className="flex flex-wrap gap-1">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
                <button
                  onClick={() => toggleTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selectedCities.map((city) => (
              <Badge key={city} variant="secondary" className="text-xs">
                {city}
                <button
                  onClick={() => toggleCity(city)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Filters Dialog */}
      <Dialog open={isAdvancedFiltersOpen} onOpenChange={setIsAdvancedFiltersOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
            <DialogDescription>
              Configure advanced property filters for more precise results
            </DialogDescription>
          </DialogHeader>
          <AdvancedPropertyFilters
            filters={advancedFilters}
            onFiltersChange={onAdvancedFiltersChange}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

/**
 * CompsFilters Component
 * Filtering controls for comparable properties
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';
import { useState } from 'react';

export interface CompsFiltersConfig {
  maxDistance?: number;
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  maxBaths?: number;
  minSqft?: number;
  maxSqft?: number;
  minPrice?: number;
  maxPrice?: number;
  saleWithin?: number; // months
  propertyType?: string;
  condition?: string;
}

export interface CompsFiltersProps {
  filters: CompsFiltersConfig;
  onFiltersChange: (filters: CompsFiltersConfig) => void;
  onClearFilters: () => void;
  totalComps: number;
  filteredComps: number;
  className?: string;
}

export const CompsFilters = ({
  filters,
  onFiltersChange,
  onClearFilters,
  totalComps,
  filteredComps,
  className = '',
}: CompsFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof CompsFiltersConfig, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== null);

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        {/* Filter Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Filter Comparables</h3>
            <span className="text-xs text-muted-foreground">
              ({filteredComps} of {totalComps})
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Less' : 'More'} Filters
            </Button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Distance */}
          <div className="space-y-2">
            <Label className="text-xs">Max Distance (miles)</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[filters.maxDistance || 3]}
                onValueChange={([value]) => handleFilterChange('maxDistance', value)}
                min={0.5}
                max={10}
                step={0.5}
                className="flex-1"
              />
              <span className="text-xs w-12 text-right">{filters.maxDistance || 3}mi</span>
            </div>
          </div>

          {/* Sale Within */}
          <div className="space-y-2">
            <Label className="text-xs">Sold Within (months)</Label>
            <Select
              value={String(filters.saleWithin || 12)}
              onValueChange={(value) => handleFilterChange('saleWithin', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Last 3 months</SelectItem>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
                <SelectItem value="24">Last 24 months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Property Type */}
          <div className="space-y-2">
            <Label className="text-xs">Property Type</Label>
            <Select
              value={filters.propertyType || 'all'}
              onValueChange={(value) => handleFilterChange('propertyType', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Single Family">Single Family</SelectItem>
                <SelectItem value="Townhouse">Townhouse</SelectItem>
                <SelectItem value="Condo">Condo</SelectItem>
                <SelectItem value="Multi-Family">Multi-Family</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t animate-in fade-in duration-200">
            {/* Bedrooms Range */}
            <div className="space-y-2">
              <Label className="text-xs">Bedrooms</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minBeds || ''}
                  onChange={(e) => handleFilterChange('minBeds', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="h-9"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxBeds || ''}
                  onChange={(e) => handleFilterChange('maxBeds', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Bathrooms Range */}
            <div className="space-y-2">
              <Label className="text-xs">Bathrooms</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minBaths || ''}
                  onChange={(e) => handleFilterChange('minBaths', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="h-9"
                  step="0.5"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxBaths || ''}
                  onChange={(e) => handleFilterChange('maxBaths', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="h-9"
                  step="0.5"
                />
              </div>
            </div>

            {/* Square Feet Range */}
            <div className="space-y-2">
              <Label className="text-xs">Square Feet</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minSqft || ''}
                  onChange={(e) => handleFilterChange('minSqft', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="h-9"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxSqft || ''}
                  onChange={(e) => handleFilterChange('maxSqft', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <Label className="text-xs">Sale Price</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ''}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="h-9"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice || ''}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="h-9"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

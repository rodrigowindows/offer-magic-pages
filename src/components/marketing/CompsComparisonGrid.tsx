/**
 * Comps Comparison Grid - Side-by-Side Property Comparison
 * Inspired by CloudCMA and RPR
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Star,
  Home,
  Calendar,
  Ruler,
  Bed,
  Bath,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PropertyComp {
  id: string;
  address: string;
  salePrice: number;
  saleDate: string;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  lotSize?: number;
  isBest?: boolean;
  distance?: number;
}

interface SubjectProperty {
  address: string;
  estimatedValue: number;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  lotSize?: number;
}

interface CompsComparisonGridProps {
  subjectProperty: SubjectProperty;
  comparables: PropertyComp[];
  onAdjustmentChange?: (compId: string, adjustments: CompAdjustments) => void;
}

interface CompAdjustments {
  condition: number;
  location: number;
  size: number;
  updates: number;
  features: number;
  total: number;
}

export const CompsComparisonGrid = ({
  subjectProperty,
  comparables,
  onAdjustmentChange,
}: CompsComparisonGridProps) => {
  const [adjustments, setAdjustments] = useState<Record<string, CompAdjustments>>({});
  const [expandedComps, setExpandedComps] = useState<Set<string>>(new Set());

  // Get top 3-5 comps for grid display
  const displayComps = comparables.slice(0, 5);

  const calculateAdjustment = (comp: PropertyComp): CompAdjustments => {
    const saved = adjustments[comp.id];
    if (saved) return saved;

    // Default adjustments
    return {
      condition: 0,
      location: 0,
      size: 0,
      updates: 0,
      features: 0,
      total: 0,
    };
  };

  const updateAdjustment = (
    compId: string,
    field: keyof Omit<CompAdjustments, 'total'>,
    value: number
  ) => {
    const current = adjustments[compId] || {
      condition: 0,
      location: 0,
      size: 0,
      updates: 0,
      features: 0,
      total: 0,
    };

    const updated = {
      ...current,
      [field]: value,
      total: 0, // Will be recalculated
    };

    updated.total =
      updated.condition + updated.location + updated.size + updated.updates + updated.features;

    setAdjustments({ ...adjustments, [compId]: updated });
    onAdjustmentChange?.(compId, updated);
  };

  const getAdjustedValue = (comp: PropertyComp): number => {
    const adj = calculateAdjustment(comp);
    return comp.salePrice + adj.total;
  };

  const getPricePerSqft = (price: number, sqft: number): number => {
    return Math.round(price / sqft);
  };

  const toggleExpanded = (compId: string) => {
    const newExpanded = new Set(expandedComps);
    if (newExpanded.has(compId)) {
      newExpanded.delete(compId);
    } else {
      newExpanded.add(compId);
    }
    setExpandedComps(newExpanded);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="w-5 h-5" />
          Side-by-Side Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Header Row */}
            <div className="grid grid-cols-[200px_repeat(5,180px)] gap-3 mb-4">
              <div className="font-semibold text-sm text-muted-foreground">Feature</div>
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">
                  Subject Property
                </Badge>
                <div className="text-xs text-muted-foreground truncate">
                  {subjectProperty.address}
                </div>
              </div>
              {displayComps.map((comp, idx) => (
                <div key={comp.id} className="text-center">
                  <Badge
                    variant={comp.isBest ? 'default' : 'outline'}
                    className={`mb-2 ${comp.isBest ? 'bg-green-600' : ''}`}
                  >
                    {comp.isBest && <Star className="w-3 h-3 mr-1" />}
                    Comp {idx + 1}
                  </Badge>
                  <div className="text-xs text-muted-foreground truncate">{comp.address}</div>
                </div>
              ))}
            </div>

            {/* Price Row */}
            <div className="grid grid-cols-[200px_repeat(5,180px)] gap-3 py-3 border-t">
              <div className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="w-4 h-4" />
                Sale Price
              </div>
              <div className="text-center font-bold text-lg">
                {formatCurrency(subjectProperty.estimatedValue)}
                <div className="text-xs text-muted-foreground">(Estimated)</div>
              </div>
              {displayComps.map((comp) => {
                const adjusted = getAdjustedValue(comp);
                const hasAdjustment = adjusted !== comp.salePrice;
                return (
                  <div key={comp.id} className="text-center">
                    <div className="font-bold text-lg">{formatCurrency(comp.salePrice)}</div>
                    {hasAdjustment && (
                      <div className="text-xs text-green-600 font-medium">
                        → {formatCurrency(adjusted)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Price/Sqft Row */}
            <div className="grid grid-cols-[200px_repeat(5,180px)] gap-3 py-3 border-t bg-muted/30">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4" />
                Price per Sqft
              </div>
              <div className="text-center font-semibold">
                {formatCurrency(getPricePerSqft(subjectProperty.estimatedValue, subjectProperty.sqft))}
              </div>
              {displayComps.map((comp) => {
                const adjusted = getAdjustedValue(comp);
                return (
                  <div key={comp.id} className="text-center font-semibold">
                    {formatCurrency(getPricePerSqft(adjusted, comp.sqft))}
                  </div>
                );
              })}
            </div>

            {/* Bedrooms Row */}
            <div className="grid grid-cols-[200px_repeat(5,180px)] gap-3 py-3 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Bed className="w-4 h-4" />
                Bedrooms
              </div>
              <div className="text-center">{subjectProperty.beds}</div>
              {displayComps.map((comp) => (
                <div
                  key={comp.id}
                  className={`text-center ${
                    comp.beds !== subjectProperty.beds ? 'text-orange-600 font-medium' : ''
                  }`}
                >
                  {comp.beds}
                  {comp.beds !== subjectProperty.beds && (
                    <span className="text-xs ml-1">
                      {comp.beds > subjectProperty.beds ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Bathrooms Row */}
            <div className="grid grid-cols-[200px_repeat(5,180px)] gap-3 py-3 border-t bg-muted/30">
              <div className="flex items-center gap-2 text-sm">
                <Bath className="w-4 h-4" />
                Bathrooms
              </div>
              <div className="text-center">{subjectProperty.baths}</div>
              {displayComps.map((comp) => (
                <div
                  key={comp.id}
                  className={`text-center ${
                    comp.baths !== subjectProperty.baths ? 'text-orange-600 font-medium' : ''
                  }`}
                >
                  {comp.baths}
                  {comp.baths !== subjectProperty.baths && (
                    <span className="text-xs ml-1">
                      {comp.baths > subjectProperty.baths ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Square Feet Row */}
            <div className="grid grid-cols-[200px_repeat(5,180px)] gap-3 py-3 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Ruler className="w-4 h-4" />
                Square Feet
              </div>
              <div className="text-center">{subjectProperty.sqft.toLocaleString()}</div>
              {displayComps.map((comp) => {
                const diff = ((comp.sqft - subjectProperty.sqft) / subjectProperty.sqft) * 100;
                return (
                  <div key={comp.id} className="text-center">
                    {comp.sqft.toLocaleString()}
                    {Math.abs(diff) > 10 && (
                      <div className="text-xs text-orange-600">
                        ({diff > 0 ? '+' : ''}
                        {diff.toFixed(0)}%)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Year Built Row */}
            <div className="grid grid-cols-[200px_repeat(5,180px)] gap-3 py-3 border-t bg-muted/30">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                Year Built
              </div>
              <div className="text-center">{subjectProperty.yearBuilt}</div>
              {displayComps.map((comp) => (
                <div
                  key={comp.id}
                  className={`text-center ${
                    Math.abs(comp.yearBuilt - subjectProperty.yearBuilt) > 5
                      ? 'text-orange-600'
                      : ''
                  }`}
                >
                  {comp.yearBuilt}
                </div>
              ))}
            </div>

            {/* Sale Date Row */}
            <div className="grid grid-cols-[200px_repeat(5,180px)] gap-3 py-3 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                Sale Date
              </div>
              <div className="text-center text-muted-foreground">-</div>
              {displayComps.map((comp) => (
                <div key={comp.id} className="text-center text-sm">
                  {formatDate(comp.saleDate)}
                </div>
              ))}
            </div>

            {/* Adjustments Section */}
            <div className="mt-6 pt-6 border-t-2">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Adjustments (Optional)
              </h3>

              {displayComps.map((comp) => {
                const adj = calculateAdjustment(comp);
                const isExpanded = expandedComps.has(comp.id);

                return (
                  <div key={comp.id} className="mb-4 border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{comp.address}</span>
                        {comp.isBest && (
                          <Badge variant="default" className="bg-green-600">
                            <Star className="w-3 h-3 mr-1" />
                            Best
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {adj.total !== 0 && (
                          <Badge variant={adj.total > 0 ? 'default' : 'destructive'}>
                            {adj.total > 0 ? '+' : ''}
                            {formatCurrency(adj.total)}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(comp.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-4">
                        {/* Condition Slider */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm">Condition</label>
                            <span className="text-sm font-medium">
                              {adj.condition > 0 ? '+' : ''}
                              {formatCurrency(adj.condition)}
                            </span>
                          </div>
                          <Slider
                            value={[adj.condition]}
                            onValueChange={([val]) => updateAdjustment(comp.id, 'condition', val)}
                            min={-10000}
                            max={10000}
                            step={500}
                            className="w-full"
                          />
                        </div>

                        {/* Location Slider */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm">Location</label>
                            <span className="text-sm font-medium">
                              {adj.location > 0 ? '+' : ''}
                              {formatCurrency(adj.location)}
                            </span>
                          </div>
                          <Slider
                            value={[adj.location]}
                            onValueChange={([val]) => updateAdjustment(comp.id, 'location', val)}
                            min={-10000}
                            max={10000}
                            step={500}
                            className="w-full"
                          />
                        </div>

                        {/* Updates Slider */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm">Updates/Renovations</label>
                            <span className="text-sm font-medium">
                              {adj.updates > 0 ? '+' : ''}
                              {formatCurrency(adj.updates)}
                            </span>
                          </div>
                          <Slider
                            value={[adj.updates]}
                            onValueChange={([val]) => updateAdjustment(comp.id, 'updates', val)}
                            min={-10000}
                            max={10000}
                            step={500}
                            className="w-full"
                          />
                        </div>

                        {/* Features Slider */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm">Features (Pool, Garage, etc)</label>
                            <span className="text-sm font-medium">
                              {adj.features > 0 ? '+' : ''}
                              {formatCurrency(adj.features)}
                            </span>
                          </div>
                          <Slider
                            value={[adj.features]}
                            onValueChange={([val]) => updateAdjustment(comp.id, 'features', val)}
                            min={-10000}
                            max={10000}
                            step={500}
                            className="w-full"
                          />
                        </div>

                        <div className="pt-3 border-t flex items-center justify-between">
                          <span className="font-semibold">Adjusted Value:</span>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(getAdjustedValue(comp))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg">
              <h3 className="text-sm font-semibold mb-3">Valuation Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Average Adjusted Value</div>
                  <div className="text-xl font-bold">
                    {formatCurrency(
                      displayComps.reduce((sum, comp) => sum + getAdjustedValue(comp), 0) /
                        displayComps.length
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Price Range</div>
                  <div className="text-sm font-semibold">
                    {formatCurrency(Math.min(...displayComps.map(getAdjustedValue)))} -{' '}
                    {formatCurrency(Math.max(...displayComps.map(getAdjustedValue)))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Subject Property</div>
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(subjectProperty.estimatedValue)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

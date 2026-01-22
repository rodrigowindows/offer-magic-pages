/**
 * CompareDialog Component
 * Side-by-side comparison of multiple comparable properties
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, MapPin, Calendar, Home, Ruler, DollarSign } from 'lucide-react';
import type { ComparableProperty } from './types';

export interface CompareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comparables: ComparableProperty[];
  onRemoveComparable: (compId: string) => void;
  maxComparables?: number;
}

export const CompareDialog = ({
  open,
  onOpenChange,
  comparables,
  onRemoveComparable,
  maxComparables = 4,
}: CompareDialogProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Calculate averages
  const avgPrice = comparables.reduce((sum, c) => sum + (c.sale_price || 0), 0) / comparables.length;
  const avgPricePerSqft = comparables.reduce((sum, c) => sum + (c.price_per_sqft || 0), 0) / comparables.length;
  const avgSqft = comparables.reduce((sum, c) => sum + (c.square_feet || 0), 0) / comparables.length;

  const ComparisonRow = ({
    icon: Icon,
    label,
    getValue,
  }: {
    icon: any;
    label: string;
    getValue: (comp: ComparableProperty) => React.ReactNode;
  }) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-3 border-b last:border-b-0">
      <div className="flex items-center gap-2 font-semibold text-sm">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </div>
      {comparables.slice(0, maxComparables).map((comp) => (
        <div key={comp.id} className="text-sm">
          {getValue(comp)}
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Compare Properties
            <Badge variant="outline">
              {comparables.length} of {maxComparables}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Side-by-side comparison of comparable properties
          </DialogDescription>
        </DialogHeader>

        {comparables.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Home className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No properties selected for comparison</p>
            <p className="text-xs mt-1">Click the compare button on properties to add them here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Property Headers */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="hidden md:block" /> {/* Spacer for label column */}
              {comparables.slice(0, maxComparables).map((comp) => (
                <div key={comp.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{comp.address}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {comp.city}, {comp.state}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveComparable(comp.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {comp.similarity_score && (
                    <Badge
                      className={
                        comp.similarity_score >= 0.8
                          ? 'bg-green-100 text-green-800'
                          : comp.similarity_score >= 0.6
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {(comp.similarity_score * 100).toFixed(0)}% Match
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {/* Comparison Rows */}
            <div className="border rounded-lg overflow-hidden">
              <ComparisonRow
                icon={DollarSign}
                label="Sale Price"
                getValue={(comp) => (
                  <span className="font-semibold text-green-700">
                    {formatCurrency(comp.sale_price || 0)}
                  </span>
                )}
              />

              <ComparisonRow
                icon={DollarSign}
                label="Price/Sqft"
                getValue={(comp) => (
                  <span>
                    {comp.price_per_sqft ? `$${comp.price_per_sqft.toFixed(0)}` : '-'}
                  </span>
                )}
              />

              <ComparisonRow
                icon={Home}
                label="Beds / Baths"
                getValue={(comp) => (
                  <span>
                    {comp.bedrooms}bd / {comp.bathrooms}ba
                  </span>
                )}
              />

              <ComparisonRow
                icon={Ruler}
                label="Square Feet"
                getValue={(comp) => (
                  <span>{comp.square_feet?.toLocaleString() || '-'}</span>
                )}
              />

              <ComparisonRow
                icon={Calendar}
                label="Sale Date"
                getValue={(comp) => (
                  <span className="text-xs">
                    {comp.sale_date ? formatDate(comp.sale_date) : '-'}
                  </span>
                )}
              />

              <ComparisonRow
                icon={MapPin}
                label="Distance"
                getValue={(comp) => (
                  <span className="text-xs">
                    {comp.distance ? `${comp.distance.toFixed(2)} miles` : '-'}
                  </span>
                )}
              />

              <ComparisonRow
                icon={Home}
                label="Property Type"
                getValue={(comp) => (
                  <span className="text-xs">{comp.property_type || '-'}</span>
                )}
              />
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-accent/50 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Average Price</p>
                <p className="text-lg font-bold text-green-700">{formatCurrency(avgPrice)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Average $/Sqft</p>
                <p className="text-lg font-bold">${avgPricePerSqft.toFixed(0)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Average Size</p>
                <p className="text-lg font-bold">{avgSqft.toLocaleString()} sqft</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

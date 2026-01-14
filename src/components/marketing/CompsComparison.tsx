/**
 * Side-by-Side Comps Comparison Component
 * Compare 2-3 selected properties with the subject property
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, TrendingDown, Minus, Home, MapPin, Calendar, DollarSign, Ruler, Building2, Star } from 'lucide-react';

interface Property {
  id: string;
  address: string;
  salePrice?: number;
  estimatedValue?: number;
  saleDate?: Date;
  sqft: number;
  beds: number;
  baths: number;
  yearBuilt?: number;
  units?: number;
  totalRent?: number;
  rentPerUnit?: number;
  noi?: number;
  capRate?: number;
  condition?: 'reformed' | 'good' | 'needs_work' | 'as-is';
  distanceMiles?: number;
  pricePerSqft?: number;
}

interface CompsComparisonProps {
  subjectProperty: Property;
  selectedComps: Property[];
  onRemoveComp: (compId: string) => void;
  onClear: () => void;
}

export const CompsComparison = ({
  subjectProperty,
  selectedComps,
  onRemoveComp,
  onClear,
}: CompsComparisonProps) => {
  if (selectedComps.length === 0) {
    return null;
  }

  const renderDifference = (subjectValue: number | undefined, compValue: number | undefined, format: 'currency' | 'percent' | 'number' = 'number') => {
    if (subjectValue === undefined || compValue === undefined) return null;

    const diff = compValue - subjectValue;
    const percentDiff = subjectValue !== 0 ? (diff / subjectValue) * 100 : 0;
    const isPositive = diff > 0;
    const isNeutral = Math.abs(percentDiff) < 1;

    let formattedDiff = '';
    if (format === 'currency') {
      formattedDiff = `$${Math.abs(diff).toLocaleString()}`;
    } else if (format === 'percent') {
      formattedDiff = `${Math.abs(diff).toFixed(1)}%`;
    } else {
      formattedDiff = Math.abs(diff).toLocaleString();
    }

    if (isNeutral) {
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Minus className="w-3 h-3" />
          <span>Similar</span>
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>
          {isPositive ? '+' : '-'}{formattedDiff}
        </span>
        <span className="text-muted-foreground">({percentDiff > 0 ? '+' : ''}{percentDiff.toFixed(1)}%)</span>
      </div>
    );
  };

  const renderConditionBadge = (condition?: string) => {
    if (!condition) return '-';

    const variants: Record<string, any> = {
      reformed: 'default',
      good: 'secondary',
      needs_work: 'outline',
      'as-is': 'destructive',
    };

    const labels: Record<string, string> = {
      reformed: 'Reformada',
      good: 'Boa',
      needs_work: 'Precisa Reforma',
      'as-is': 'As-is',
    };

    return <Badge variant={variants[condition]}>{labels[condition]}</Badge>;
  };

  const renderPropertyColumn = (property: Property, isSubject: boolean = false) => (
    <div className={`flex-1 min-w-[250px] ${!isSubject && 'border-l'}`}>
      <div className={`p-4 ${isSubject ? 'bg-red-50 dark:bg-red-950/20' : 'bg-blue-50 dark:bg-blue-950/20'} border-b`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {isSubject ? (
                <Home className="w-4 h-4 text-red-600" />
              ) : (
                <MapPin className="w-4 h-4 text-blue-600" />
              )}
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                {isSubject ? 'Subject Property' : 'Comparable'}
              </span>
            </div>
            <h3 className="font-semibold text-sm">{property.address}</h3>
            {property.distanceMiles && (
              <p className="text-xs text-muted-foreground mt-1">
                {property.distanceMiles.toFixed(2)} miles away
              </p>
            )}
          </div>
          {!isSubject && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemoveComp(property.id)}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Price */}
        <div>
          <div className="text-xs text-muted-foreground mb-1">
            {isSubject ? 'Estimated Value' : 'Sale Price'}
          </div>
          <div className="font-bold text-lg">
            ${(isSubject ? property.estimatedValue : property.salePrice)?.toLocaleString() || 'N/A'}
          </div>
          {!isSubject && renderDifference(subjectProperty.estimatedValue, property.salePrice, 'currency')}
        </div>

        {/* Sale Date */}
        {property.saleDate && (
          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Sale Date
            </div>
            <div className="text-sm">
              {property.saleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        )}

        {/* Square Footage */}
        <div>
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Ruler className="w-3 h-3" />
            Square Footage
          </div>
          <div className="text-sm font-medium">{property.sqft.toLocaleString()} sqft</div>
          {!isSubject && renderDifference(subjectProperty.sqft, property.sqft)}
        </div>

        {/* Price per Sqft */}
        {property.pricePerSqft && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Price/Sqft</div>
            <div className="text-sm font-medium">${property.pricePerSqft}</div>
            {!isSubject && renderDifference(subjectProperty.pricePerSqft, property.pricePerSqft, 'currency')}
          </div>
        )}

        {/* Beds/Baths */}
        <div>
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            Beds/Baths
          </div>
          <div className="text-sm font-medium">
            {property.beds} bd / {property.baths} ba
          </div>
        </div>

        {/* Units */}
        {property.units && property.units > 1 && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Units</div>
            <div className="text-sm font-medium">{property.units} units</div>
          </div>
        )}

        {/* Rent/Unit */}
        {property.rentPerUnit && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Rent per Unit</div>
            <div className="text-sm font-medium text-green-700">
              ${property.rentPerUnit.toLocaleString()}/mo
            </div>
            {!isSubject && renderDifference(subjectProperty.rentPerUnit, property.rentPerUnit, 'currency')}
          </div>
        )}

        {/* NOI */}
        {property.noi && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">NOI (Annual)</div>
            <div className="text-sm font-medium">${property.noi.toLocaleString()}</div>
            {!isSubject && renderDifference(subjectProperty.noi, property.noi, 'currency')}
          </div>
        )}

        {/* Cap Rate */}
        {property.capRate && (
          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Star className="w-3 h-3" />
              Cap Rate
            </div>
            <div className="text-sm font-bold text-blue-600">{property.capRate.toFixed(2)}%</div>
            {!isSubject && renderDifference(subjectProperty.capRate, property.capRate, 'percent')}
          </div>
        )}

        {/* Condition */}
        {property.condition && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Condition</div>
            <div>{renderConditionBadge(property.condition)}</div>
          </div>
        )}

        {/* Year Built */}
        {property.yearBuilt && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Year Built</div>
            <div className="text-sm">{property.yearBuilt}</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Side-by-Side Comparison
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="flex min-w-max">
            {/* Subject Property */}
            {renderPropertyColumn(subjectProperty, true)}

            {/* Selected Comparables */}
            {selectedComps.map(comp => (
              <div key={comp.id}>
                {renderPropertyColumn(comp)}
              </div>
            ))}
          </div>
        </div>

        {selectedComps.length < 3 && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground text-center">
            Select up to 3 comparables from the table below to compare side-by-side
          </div>
        )}
      </CardContent>
    </Card>
  );
};

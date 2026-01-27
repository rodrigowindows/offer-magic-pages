/**
 * CompsTable Component
 * Table displaying comparable properties with sorting and actions
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, TrendingDown, Star, ExternalLink, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ComparableProperty } from './types';
import { useState } from 'react';

export interface CompsTableProps {
  comparables: ComparableProperty[];
  onViewDetails?: (comp: ComparableProperty) => void;
  onOpenMap?: (comp: ComparableProperty) => void;
  onToggleFavorite?: (compId: string) => void;
  favorites?: Set<string>;
  highlightedCompId?: string;
  className?: string;
}

type SortField = 'distance' | 'price' | 'pricePerSqft' | 'saleDate' | 'similarity';
type SortOrder = 'asc' | 'desc';

export const CompsTable = ({
  comparables,
  onViewDetails,
  onOpenMap,
  onToggleFavorite,
  favorites = new Set(),
  highlightedCompId,
  className = '',
}: CompsTableProps) => {
  const [sortField, setSortField] = useState<SortField>('similarity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedComparables = [...comparables].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'distance':
        aValue = a.distance || 0;
        bValue = b.distance || 0;
        break;
      case 'price':
        aValue = a.sale_price || 0;
        bValue = b.sale_price || 0;
        break;
      case 'pricePerSqft':
        aValue = a.price_per_sqft || 0;
        bValue = b.price_per_sqft || 0;
        break;
      case 'saleDate':
        aValue = new Date(a.sale_date || 0).getTime();
        bValue = new Date(b.sale_date || 0).getTime();
        break;
      case 'similarity':
        aValue = a.similarity_score || 0;
        bValue = b.similarity_score || 0;
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getQualityBadge = (score?: number) => {
    if (!score) return null;

    if (score >= 0.8) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>;
    } else if (score >= 0.6) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Good</Badge>;
    } else if (score >= 0.4) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Fair</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Low</Badge>;
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      onClick={() => handleSort(field)}
      className="cursor-pointer hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortOrder === 'asc' ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )
        )}
      </div>
    </TableHead>
  );

  return (
    <div className={`overflow-x-auto ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>Address</TableHead>
            <SortableHeader field="distance">Distance</SortableHeader>
            <TableHead>Beds/Baths</TableHead>
            <TableHead>Sqft</TableHead>
            <SortableHeader field="price">Sale Price</SortableHeader>
            <SortableHeader field="pricePerSqft">$/Sqft</SortableHeader>
            <SortableHeader field="saleDate">Sale Date</SortableHeader>
            <SortableHeader field="similarity">Quality</SortableHeader>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedComparables.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                No comparable properties found
              </TableCell>
            </TableRow>
          ) : (
            sortedComparables.map((comp) => {
              const isManual = comp.source === 'manual';
              return (
                <TableRow
                  key={comp.id}
                  className={`
                    hover:bg-accent/50 transition-colors
                    ${highlightedCompId === comp.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
                    ${isManual ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : ''}
                  `}
                >
                {/* Star */}
                <TableCell>
                  {onToggleFavorite && (
                    <button
                      onClick={() => onToggleFavorite(comp.id)}
                      className="hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          favorites.has(comp.id)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-400'
                        }`}
                      />
                    </button>
                  )}
                </TableCell>

                {/* Address */}
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="text-sm">{comp.address}</span>
                    <span className="text-xs text-muted-foreground">
                      {comp.city}, {comp.state}
                    </span>
                  </div>
                </TableCell>

                {/* Distance */}
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {comp.distance?.toFixed(2)} mi
                  </div>
                </TableCell>

                {/* Beds/Baths */}
                <TableCell className="text-sm">
                  {comp.bedrooms}bd / {comp.bathrooms}ba
                </TableCell>

                {/* Square Feet */}
                <TableCell className="text-sm">
                  {comp.square_feet?.toLocaleString()}
                </TableCell>

                {/* Sale Price */}
                <TableCell className="font-semibold">
                  {formatCurrency(comp.sale_price || 0)}
                </TableCell>

                {/* Price per Sqft */}
                <TableCell>
                  {comp.price_per_sqft ? `$${comp.price_per_sqft.toFixed(0)}` : '-'}
                </TableCell>

                {/* Sale Date */}
                <TableCell className="text-sm text-muted-foreground">
                  {comp.sale_date ? (
                    <>
                      {new Date(comp.sale_date).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                      <br />
                      <span className="text-xs">
                        ({formatDistanceToNow(new Date(comp.sale_date), { addSuffix: true })})
                      </span>
                    </>
                  ) : (
                    '-'
                  )}
                </TableCell>


                {/* Quality Score */}
                <TableCell>
                  {getQualityBadge(comp.similarity_score)}
                  {comp.similarity_score && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {(comp.similarity_score * 100).toFixed(0)}%
                    </div>
                  )}
                </TableCell>

                {/* Source */}
                <TableCell>
                  {isManual ? (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 mr-1">Manual</Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 mr-1">Auto</Badge>
                  )}
                  {isManual && comp.url && (
                    <a href={comp.url} target="_blank" rel="noopener noreferrer" title="Open manual comp link">
                      <ExternalLink className="h-4 w-4 inline ml-1 text-yellow-700" />
                    </a>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    {onViewDetails && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(comp)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onOpenMap && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenMap(comp)}
                        title="View on Map"
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                    )}
                    {comp.listing_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        title="View Listing"
                      >
                        <a href={comp.listing_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

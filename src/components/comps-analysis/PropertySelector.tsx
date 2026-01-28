/**
 * PropertySelector Component
 * Dropdown for selecting properties with filters and favorites
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type { Property } from './types';

export interface PropertySelectorProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (propertyId: string) => void;
  favorites: Set<string>;
  onToggleFavorite: (propertyId: string) => void;
  filter?: 'all' | 'approved' | 'manual' | 'none' | 'favorites';
  className?: string;
}

export const PropertySelector = ({
  properties,
  selectedProperty,
  onSelectProperty,
  favorites,
  onToggleFavorite,
  filter = 'all',
  className = '',
}: PropertySelectorProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();
  // Filter properties based on current filter
  const filteredProperties = properties.filter((property) => {
    if (filter === 'favorites') {
      return favorites.has(property.id);
    }
    if (filter === 'approved') {
      return property.comps_status === 'approved' || property.approval_status === 'approved';
    }
    if (filter === 'manual') {
      return property.comps_source === 'manual';
    }
    if (filter === 'none') {
      return !property.comps_status || property.comps_status === 'none';
    }
    return true; // 'all'
  });

  const formatPropertyLabel = (property: Property) => {
    const parts = [property.full_address || property.address];

    if (property.bedrooms || property.bathrooms || property.square_feet) {
      const details = [];
      if (property.bedrooms) details.push(`${property.bedrooms} bd`);
      if (property.bathrooms) details.push(`${property.bathrooms} ba`);
      if (property.square_feet) details.push(`${property.square_feet.toLocaleString()} sqft`);
      parts.push(`(${details.join(', ')})`);
    }

    return parts.join(' ');
  };

  const handleStarClick = (e: React.MouseEvent, propertyId: string) => {
    e.stopPropagation();
    e.preventDefault();
    onToggleFavorite(propertyId);
  };

  const handleCopyAddress = async (e: React.MouseEvent, property: Property) => {
    e.stopPropagation();
    e.preventDefault();

    const address = property.full_address || property.address || '';

    try {
      await navigator.clipboard.writeText(address);
      setCopiedId(property.id);
      toast({
        title: '📋 Endereço copiado!',
        description: address,
        duration: 2000,
      });

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast({
        title: '❌ Erro ao copiar',
        description: 'Não foi possível copiar o endereço',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <Select
        value={selectedProperty?.id || ''}
        onValueChange={onSelectProperty}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a property to analyze..." />
        </SelectTrigger>
        <SelectContent className="max-h-[400px]">
          {filteredProperties.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              {filter === 'favorites' ? (
                <>No favorite properties yet. Star properties to add them here.</>
              ) : filter === 'approved' ? (
                <>No approved comps yet.</>
              ) : filter === 'manual' ? (
                <>No manual comps yet.</>
              ) : filter === 'none' ? (
                <>No properties without comps.</>
              ) : (
                <>No properties found.</>
              )}
            </div>
          ) : (
            filteredProperties.map((property) => (
              <SelectItem
                key={property.id}
                value={property.id}
                className="flex items-center justify-between gap-2 cursor-pointer hover:bg-accent group"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <button
                    onClick={(e) => handleStarClick(e, property.id)}
                    className="flex-shrink-0 hover:scale-110 transition-transform"
                    type="button"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        favorites.has(property.id)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    />
                  </button>
                  <span className="truncate flex-1">
                    {formatPropertyLabel(property)}
                  </span>

                  {/* Copy Address Button - Shows on hover */}
                  <button
                    onClick={(e) => handleCopyAddress(e, property)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                    type="button"
                    title="Copiar endereço"
                  >
                    {copiedId === property.id ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-gray-600" />
                    )}
                  </button>

                  {(property.comps_status === 'approved' || property.approval_status === 'approved') && (
                    <span className="flex-shrink-0 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      ✓ Approved
                    </span>
                  )}
                  {property.comps_source === 'manual' && (
                    <span className="flex-shrink-0 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      Manual
                    </span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Filter summary */}
      {filter !== 'all' && filteredProperties.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Showing {filteredProperties.length} of {properties.length} properties
          {filter === 'favorites' && ' (favorites)'}
          {filter === 'approved' && ' (approved)'}
          {filter === 'manual' && ' (manual)'}
          {filter === 'none' && ' (no comps)'}
        </p>
      )}
    </div>
  );
};

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, List, Maximize2, Minimize2 } from "lucide-react";

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  estimated_value: number;
  cash_offer_amount: number;
  approval_status?: string;
  property_image_url?: string | null;
}

interface PropertyMapViewProps {
  properties: Property[];
  onPropertyClick?: (property: Property) => void;
}

// Simple clustered map visualization
export const PropertyMapView = ({ properties, onPropertyClick }: PropertyMapViewProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Group properties by city
  const cityClusters = properties.reduce((acc, property) => {
    const city = property.city;
    if (!acc[city]) {
      acc[city] = [];
    }
    acc[city].push(property);
    return acc;
  }, {} as Record<string, Property[]>);

  const cities = Object.entries(cityClusters).map(([city, props]) => ({
    city,
    count: props.length,
    properties: props,
    avgValue: props.reduce((sum, p) => sum + p.estimated_value, 0) / props.length,
    approved: props.filter((p) => p.approval_status === 'approved').length,
    pending: props.filter((p) => !p.approval_status || p.approval_status === 'pending').length,
  }));

  const maxCount = Math.max(...cities.map((c) => c.count));

  const getClusterSize = (count: number) => {
    const ratio = count / maxCount;
    return 40 + ratio * 80; // Min 40px, max 120px
  };

  const getClusterColor = (approved: number, total: number) => {
    const approvalRate = approved / total;
    if (approvalRate > 0.7) return 'bg-green-500 border-green-600';
    if (approvalRate > 0.4) return 'bg-yellow-500 border-yellow-600';
    return 'bg-red-500 border-red-600';
  };

  const formatCurrency = (value: number) => {
    return `$${(value / 1000).toFixed(0)}k`;
  };

  return (
    <Card className={isFullscreen ? 'fixed inset-4 z-50' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Property Map
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Map Visualization (Simple Cluster View) */}
          <div className="relative bg-gray-100 rounded-lg p-8 min-h-[400px] overflow-hidden">
            {/* Grid background */}
            <div className="absolute inset-0 opacity-10">
              <div className="grid grid-cols-10 grid-rows-10 h-full">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div key={i} className="border border-gray-300" />
                ))}
              </div>
            </div>

            {/* City Clusters */}
            <div className="relative h-full flex flex-wrap gap-8 items-center justify-center">
              {cities.map((cityData, index) => {
                const size = getClusterSize(cityData.count);
                const color = getClusterColor(cityData.approved, cityData.count);

                return (
                  <div
                    key={cityData.city}
                    className="relative cursor-pointer group"
                    onClick={() => setSelectedCity(selectedCity === cityData.city ? null : cityData.city)}
                  >
                    {/* Cluster Circle */}
                    <div
                      className={`rounded-full border-4 ${color} shadow-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110`}
                      style={{ width: size, height: size }}
                    >
                      <div className="text-center text-white">
                        <div className="font-bold text-lg">{cityData.count}</div>
                        <div className="text-xs opacity-90">properties</div>
                      </div>
                    </div>

                    {/* City Label */}
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                      <Badge variant="secondary" className="font-medium">
                        {cityData.city}
                      </Badge>
                    </div>

                    {/* Hover Details */}
                    <div className="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-white border-2 border-gray-200 rounded-lg shadow-xl p-3 min-w-[200px]">
                        <div className="font-semibold mb-2">{cityData.city}</div>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium">{cityData.count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Approved:</span>
                            <span className="font-medium text-green-600">{cityData.approved}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Pending:</span>
                            <span className="font-medium text-yellow-600">{cityData.pending}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t">
                            <span className="text-gray-600">Avg Value:</span>
                            <span className="font-medium">{formatCurrency(cityData.avgValue)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected City Details */}
          {selectedCity && cityClusters[selectedCity] && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Properties in {selectedCity}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCity(null)}
                >
                  Close
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {cityClusters[selectedCity].map((property) => (
                  <button
                    key={property.id}
                    onClick={() => onPropertyClick?.(property)}
                    className="text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-sm truncate">{property.address}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">{formatCurrency(property.estimated_value)}</span>
                      <Badge
                        variant={property.approval_status === 'approved' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {property.approval_status || 'pending'}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 text-sm pt-2 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-600" />
              <span className="text-gray-600">High Approval (&gt;70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-yellow-600" />
              <span className="text-gray-600">Medium (40-70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-600" />
              <span className="text-gray-600">Low (&lt;40%)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

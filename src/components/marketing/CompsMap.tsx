/**
 * Comps Map Component
 * Shows subject property and comparable properties on a map
 */

import { useMemo } from 'react';
import { MapPin, Home, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ComparableProperty {
  id: string;
  address: string;
  salePrice: number;
  latitude?: number;
  longitude?: number;
  capRate?: number;
  isBest?: boolean;
}

interface CompsMapProps {
  subjectProperty: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  comparables: ComparableProperty[];
  onCompClick?: (comp: ComparableProperty) => void;
}

export const CompsMap = ({ subjectProperty, comparables, onCompClick }: CompsMapProps) => {
  // Calculate map center and bounds
  const mapData = useMemo(() => {
    const allPoints = [
      { lat: subjectProperty.latitude, lng: subjectProperty.longitude },
      ...comparables.map(c => ({ lat: c.latitude, lng: c.longitude })),
    ].filter(p => p.lat && p.lng);

    if (allPoints.length === 0) {
      return { center: { lat: 28.5383, lng: -81.3792 }, zoom: 12 }; // Orlando default
    }

    const lats = allPoints.map(p => p.lat!);
    const lngs = allPoints.map(p => p.lng!);

    const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
    const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;

    // Calculate zoom based on distance
    const latDiff = Math.max(...lats) - Math.min(...lats);
    const lngDiff = Math.max(...lngs) - Math.min(...lngs);
    const maxDiff = Math.max(latDiff, lngDiff);

    let zoom = 14;
    if (maxDiff > 0.1) zoom = 12;
    if (maxDiff > 0.2) zoom = 11;
    if (maxDiff > 0.5) zoom = 10;

    return { center: { lat: centerLat, lng: centerLng }, zoom };
  }, [subjectProperty, comparables]);

  // Static map using Google Maps Static API (no API key needed for basic use)
  // Alternative: Use Mapbox, OpenStreetMap, or Leaflet for interactive maps
  const getStaticMapUrl = () => {
    const { center, zoom } = mapData;
    const size = '600x400';

    // Build markers for Google Static Maps
    let markers = `markers=color:red%7Clabel:S%7C${subjectProperty.latitude},${subjectProperty.longitude}`;

    comparables.forEach((comp, idx) => {
      if (comp.latitude && comp.longitude) {
        const label = comp.isBest ? 'B' : (idx + 1);
        const color = comp.isBest ? 'green' : 'blue';
        markers += `&markers=color:${color}%7Clabel:${label}%7C${comp.latitude},${comp.longitude}`;
      }
    });

    return `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=${zoom}&size=${size}&${markers}&key=YOUR_API_KEY`;
  };

  // Simple SVG-based visualization (no external dependencies)
  const renderSimpleMap = () => {
    const width = 600;
    const height = 400;
    const padding = 40;

    const allPoints = [
      { lat: subjectProperty.latitude, lng: subjectProperty.longitude, type: 'subject' },
      ...comparables.map(c => ({
        lat: c.latitude,
        lng: c.longitude,
        type: 'comp' as const,
        comp: c,
      })),
    ].filter(p => p.lat && p.lng);

    if (allPoints.length === 0) {
      return (
        <div className="flex items-center justify-center h-[400px] bg-muted/30 rounded-lg">
          <div className="text-center">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No location data available for mapping
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add latitude/longitude to properties to view map
            </p>
          </div>
        </div>
      );
    }

    // Calculate scale
    const lats = allPoints.map(p => p.lat!);
    const lngs = allPoints.map(p => p.lng!);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const scaleX = (lng: number) =>
      padding + ((lng - minLng) / (maxLng - minLng || 1)) * (width - 2 * padding);
    const scaleY = (lat: number) =>
      height - padding - ((lat - minLat) / (maxLat - minLat || 1)) * (height - 2 * padding);

    return (
      <svg width="100%" height="400" viewBox={`0 0 ${width} ${height}`} className="bg-muted/10 rounded-lg border">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--muted))" strokeWidth="0.5" opacity="0.3" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        {/* Connection lines from subject to comps */}
        {allPoints.filter(p => p.type === 'comp').map((point, idx) => (
          <line
            key={`line-${idx}`}
            x1={scaleX(subjectProperty.longitude!)}
            y1={scaleY(subjectProperty.latitude!)}
            x2={scaleX(point.lng!)}
            y2={scaleY(point.lat!)}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.3"
          />
        ))}

        {/* Comparable markers */}
        {allPoints.filter(p => p.type === 'comp').map((point, idx) => {
          const comp = point.comp!;
          const x = scaleX(point.lng!);
          const y = scaleY(point.lat!);
          const isBest = comp.isBest;

          return (
            <g
              key={`comp-${idx}`}
              onClick={() => onCompClick?.(comp)}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <circle
                cx={x}
                cy={y}
                r="12"
                fill={isBest ? 'hsl(142, 76%, 36%)' : 'hsl(221, 83%, 53%)'}
                stroke="white"
                strokeWidth="2"
              />
              {isBest && (
                <text x={x} y={y + 1} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                  ★
                </text>
              )}
              <text x={x} y={y + 25} textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))" fontWeight="500">
                {idx + 1}
              </text>
            </g>
          );
        })}

        {/* Subject property marker */}
        {subjectProperty.latitude && subjectProperty.longitude && (
          <g>
            <circle
              cx={scaleX(subjectProperty.longitude)}
              cy={scaleY(subjectProperty.latitude)}
              r="16"
              fill="hsl(0, 84%, 60%)"
              stroke="white"
              strokeWidth="3"
            />
            <text
              x={scaleX(subjectProperty.longitude)}
              y={scaleY(subjectProperty.latitude) + 1}
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="bold"
            >
              S
            </text>
            <text
              x={scaleX(subjectProperty.longitude)}
              y={scaleY(subjectProperty.latitude) + 30}
              textAnchor="middle"
              fontSize="11"
              fill="hsl(var(--foreground))"
              fontWeight="600"
            >
              Subject
            </text>
          </g>
        )}
      </svg>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Comparable Properties Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderSimpleMap()}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white" />
            <span>Subject Property</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
            <span>Comparable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-600 border-2 border-white flex items-center justify-center">
              <Star className="w-2 h-2 text-white fill-white" />
            </div>
            <span>Best Comp</span>
          </div>
        </div>

        {/* Comp list */}
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold">Comparables:</p>
          {comparables.map((comp, idx) => (
            <div
              key={comp.id}
              onClick={() => onCompClick?.(comp)}
              className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <Badge variant={comp.isBest ? "default" : "outline"} className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                  {idx + 1}
                </Badge>
                <span className="text-sm">{comp.address}</span>
                {comp.isBest && <Star className="w-4 h-4 text-green-600 fill-green-600" />}
              </div>
              <div className="text-sm font-medium">
                ${comp.salePrice.toLocaleString()}
                {comp.capRate && <span className="text-xs text-muted-foreground ml-2">({comp.capRate}%)</span>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

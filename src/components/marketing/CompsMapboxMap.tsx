/**
 * Comps Mapbox Map Component
 * Interactive map for comparable properties using Mapbox GL
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Home, Loader2 } from 'lucide-react';

interface ComparableProperty {
  id: string;
  address: string;
  salePrice: number;
  latitude?: number;
  longitude?: number;
  capRate?: number;
  isBest?: boolean;
}

interface CompsMapboxMapProps {
  subjectProperty: {
    address: string;
    city: string;
    state: string;
    zip_code: string;
  };
  comparables: ComparableProperty[];
  onCompClick?: (comp: ComparableProperty) => void;
}

export const CompsMapboxMap = ({ subjectProperty, comparables, onCompClick }: CompsMapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0 });
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Initialize token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('mapbox_token');
    if (storedToken && storedToken.trim()) {
      setMapboxToken(storedToken.trim());
      setShowTokenInput(false);
    } else {
      setShowTokenInput(true);
    }
  }, []);

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      localStorage.setItem('mapbox_token', mapboxToken.trim());
      setShowTokenInput(false);
    }
  };

  const handleTokenChange = () => {
    setShowTokenInput(true);
  };

  // Geocode address using Mapbox
  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          address
        )}.json?access_token=${mapboxToken}&limit=1`
      );

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return [lng, lat];
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || showTokenInput) return;

    // Clean up existing map
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    mapboxgl.accessToken = mapboxToken;

    // Create map
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-81.3792, 28.5383], // Orlando, FL default
      zoom: 12,
    });

    // Add controls
    newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current = newMap;

    // Geocode and add markers
    const initializeMap = async () => {
      setIsLoading(true);
      const subjectFullAddress = `${subjectProperty.address}, ${subjectProperty.city}, ${subjectProperty.state} ${subjectProperty.zip_code}`;

      setGeocodingProgress({ current: 0, total: 1 + comparables.length });

      // Geocode subject property
      const subjectCoords = await geocodeAddress(subjectFullAddress);
      setGeocodingProgress(prev => ({ ...prev, current: 1 }));

      if (subjectCoords) {
        // Add subject property marker (red)
        const el = document.createElement('div');
        el.className = 'w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center cursor-pointer';
        el.innerHTML = '<span class="text-white font-bold text-sm">S</span>';

        new mapboxgl.Marker(el)
          .setLngLat(subjectCoords)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div class="p-2">
                <p class="font-semibold">Subject Property</p>
                <p class="text-sm">${subjectProperty.address}</p>
              </div>`
            )
          )
          .addTo(newMap);

        // Center map on subject
        newMap.setCenter(subjectCoords);
      }

      // Geocode and add comparable markers
      const bounds = new mapboxgl.LngLatBounds();
      if (subjectCoords) bounds.extend(subjectCoords);

      for (let i = 0; i < comparables.length; i++) {
        const comp = comparables[i];
        const coords = await geocodeAddress(comp.address);
        setGeocodingProgress(prev => ({ ...prev, current: prev.current + 1 }));

        if (coords) {
          bounds.extend(coords);

          // Create marker element
          const el = document.createElement('div');
          const isBest = comp.isBest;
          el.className = `w-7 h-7 ${isBest ? 'bg-green-600' : 'bg-blue-500'} rounded-full border-3 border-white shadow-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform`;
          el.innerHTML = isBest
            ? '<span class="text-white text-xs">★</span>'
            : `<span class="text-white font-semibold text-xs">${i + 1}</span>`;

          el.addEventListener('click', () => {
            onCompClick?.(comp);
          });

          new mapboxgl.Marker(el)
            .setLngLat(coords)
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<div class="p-2">
                  <p class="font-semibold">${comp.address}</p>
                  <p class="text-sm">Sale Price: $${comp.salePrice.toLocaleString()}</p>
                  ${comp.capRate ? `<p class="text-sm">Cap Rate: ${comp.capRate}%</p>` : ''}
                  ${isBest ? '<p class="text-xs text-green-600 font-semibold">Best Comp</p>' : ''}
                </div>`
              )
            )
            .addTo(newMap);
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Fit map to show all markers
      if (!bounds.isEmpty()) {
        newMap.fitBounds(bounds, { padding: 50, maxZoom: 15 });
      }

      setIsLoading(false);
    };

    newMap.on('load', () => {
      initializeMap();
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, showTokenInput, subjectProperty, comparables]);

  if (showTokenInput) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Comparable Properties Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para visualizar o mapa interativo, você precisa configurar um token do Mapbox.
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Cole seu Mapbox Access Token aqui"
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
              />
              <Button onClick={handleTokenSubmit}>
                Configurar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Obtenha um token gratuito em{' '}
              <a
                href="https://account.mapbox.com/access-tokens/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                mapbox.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Comparable Properties Map
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Geocoding {geocodingProgress.current}/{geocodingProgress.total}...
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTokenChange}
              className="text-xs"
            >
              Alterar Token
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={mapContainer} className="w-full h-[400px] rounded-lg" />

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span>Subject Property</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white" />
            <span>Comparable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-green-600 border-2 border-white flex items-center justify-center">
              <Star className="w-3 h-3 text-white fill-white" />
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
                <Badge variant={comp.isBest ? "default" : "outline"} className={`w-6 h-6 rounded-full p-0 flex items-center justify-center ${comp.isBest ? 'bg-green-600' : ''}`}>
                  {comp.isBest ? '★' : idx + 1}
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

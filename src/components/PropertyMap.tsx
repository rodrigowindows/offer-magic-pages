import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ExternalLink, MapPin } from 'lucide-react';

interface PropertyMapProps {
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

const PropertyMap = ({ address, city, state, zipCode }: PropertyMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
  const [mapboxToken, setMapboxToken] = useState<string>(
    localStorage.getItem('mapbox_token') || ''
  );
  const [showTokenInput, setShowTokenInput] = useState(!mapboxToken);

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      localStorage.setItem('mapbox_token', mapboxToken.trim());
      setShowTokenInput(false);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || showTokenInput) return;

    const token = mapboxToken;

    mapboxgl.accessToken = token;

    // Geocode the address
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${token}`)
      .then(response => response.json())
      .then(data => {
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;

          // Initialize map
          map.current = new mapboxgl.Map({
            container: mapContainer.current!,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [lng, lat],
            zoom: 16,
            pitch: 45,
          });

          // Add navigation controls
          map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

          // Add marker
          new mapboxgl.Marker({ color: '#0ea5e9' })
            .setLngLat([lng, lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<strong>${address}</strong><br>${city}, ${state} ${zipCode}`)
            )
            .addTo(map.current);

          // Add street view layer after map loads
          map.current.on('load', () => {
            // Add 3D buildings
            map.current?.addLayer({
              id: '3d-buildings',
              source: 'composite',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 15,
              paint: {
                'fill-extrusion-color': '#aaa',
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'height']
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.6
              }
            });
          });
        }
      })
      .catch(error => {
        console.error('Error geocoding address:', error);
      });

    return () => {
      map.current?.remove();
    };
  }, [fullAddress, mapboxToken, showTokenInput]);

  if (showTokenInput) {
    return (
      <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-strong border border-border bg-muted/30 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-card rounded-lg shadow-lg space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Enter Mapbox Token</h3>
            <p className="text-sm text-muted-foreground">
              Get your free public token at{' '}
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
          <Input
            type="text"
            placeholder="pk.eyJ1..."
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            className="w-full"
          />
          <Button onClick={handleTokenSubmit} className="w-full">
            Load Map
          </Button>
        </div>
      </div>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${encodeURIComponent(fullAddress)}`;

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-strong border border-border">
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Address Info */}
      <div className="absolute top-4 left-4 bg-card px-4 py-2 rounded-lg shadow-md border border-border z-10">
        <p className="text-sm font-semibold text-foreground">{address}</p>
        <p className="text-xs text-muted-foreground">{city}, {state} {zipCode}</p>
      </div>

      {/* Quick Links to Google Maps */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <Button
          size="sm"
          variant="secondary"
          className="bg-card hover:bg-accent shadow-md"
          onClick={() => window.open(googleMapsUrl, '_blank')}
        >
          <MapPin className="h-4 w-4 mr-1" />
          Google Maps
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="bg-card hover:bg-accent shadow-md"
          onClick={() => window.open(streetViewUrl, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          Street View
        </Button>
      </div>
    </div>
  );
};

export default PropertyMap;

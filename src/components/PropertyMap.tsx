import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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

  useEffect(() => {
    if (!mapContainer.current) return;

    // Get Mapbox token from environment or use a placeholder
    const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    
    if (!token) {
      console.error('Mapbox token not found. Please add MAPBOX_PUBLIC_TOKEN to secrets.');
      return;
    }

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
  }, [fullAddress]);

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-strong border border-border">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md border border-border">
        <p className="text-sm font-semibold text-foreground">{address}</p>
        <p className="text-xs text-muted-foreground">{city}, {state} {zipCode}</p>
      </div>
    </div>
  );
};

export default PropertyMap;

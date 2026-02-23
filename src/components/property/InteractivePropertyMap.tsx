import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Maximize2, Minimize2, Loader2, ExternalLink } from "lucide-react";

interface Property {
  id: string;
  slug?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  estimated_value: number;
  cash_offer_amount: number;
  approval_status?: string;
  property_image_url?: string | null;
}

interface InteractivePropertyMapProps {
  properties: Property[];
  onPropertyClick?: (property: Property) => void;
  onApprove?: (property: Property) => void;
  onReject?: (property: Property) => void;
}

export const InteractivePropertyMap = ({
  properties,
  onPropertyClick,
  onApprove,
  onReject,
}: InteractivePropertyMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0 });
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

  // Geocode address
  const geocodeAddress = async (property: Property): Promise<[number, number] | null> => {
    const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          fullAddress
        )}.json?access_token=${mapboxToken}&limit=1`
      );

      const data = await response.json();

      if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return [lng, lat];
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  // Initialize and update map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || showTokenInput) return;
    if (properties.length === 0) return;

    // Clean up existing map
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    mapboxgl.accessToken = mapboxToken;

    // Create map
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-81.3792, 28.5383], // Orlando, FL
      zoom: 11,
    });

    // Add controls
    newMap.addControl(new mapboxgl.NavigationControl(), "top-right");
    newMap.addControl(new mapboxgl.FullscreenControl(), "top-right");

    // Wait for map to load
    newMap.on("load", async () => {
      setIsLoading(true);
      setGeocodingProgress({ current: 0, total: properties.length });

      const bounds = new mapboxgl.LngLatBounds();
      let addedCount = 0;

      // Add markers
      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        setGeocodingProgress({ current: i + 1, total: properties.length });

        const coordinates = await geocodeAddress(property);

        if (coordinates) {
          const [lng, lat] = coordinates;

          // Validate
          if (isNaN(lng) || isNaN(lat)) {
            continue;
          }

          // Color based on status
          const color =
            property.approval_status === "approved"
              ? "#10b981"
              : property.approval_status === "rejected"
              ? "#ef4444"
              : "#f59e0b";

          // Create popup HTML with approve/reject buttons
          const isPending = property.approval_status !== "approved" && property.approval_status !== "rejected";
          const popupHTML = `
            <div style="padding: 8px; min-width: 220px;">
              <h3 style="font-weight: bold; margin-bottom: 8px; color: #1f2937;">${property.address}</h3>
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">
                ${property.city}, ${property.state} ${property.zip_code}
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                <div>
                  <div style="font-size: 12px; color: #6b7280;">Valor</div>
                  <div style="font-weight: 600; color: #1f2937;">$${property.estimated_value.toLocaleString()}</div>
                </div>
                <div>
                  <div style="font-size: 12px; color: #6b7280;">Oferta</div>
                  <div style="font-weight: 600; color: #059669;">$${property.cash_offer_amount.toLocaleString()}</div>
                </div>
              </div>
              <div style="margin-top: 8px;">
                <span style="
                  display: inline-block;
                  padding: 2px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  font-weight: 500;
                  background-color: ${color}20;
                  color: ${color};
                ">
                  ${property.approval_status || "pending"}
                </span>
              </div>
              ${isPending ? `
              <div style="display: flex; gap: 8px; margin-top: 12px;">
                <button
                  onclick="window.propertyMapApproveHandler('${property.id}')"
                  style="
                    flex: 1;
                    padding: 8px 12px;
                    background-color: #10b981;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 600;
                  "
                  onmouseover="this.style.backgroundColor='#059669'"
                  onmouseout="this.style.backgroundColor='#10b981'"
                >
                  ✓ Aprovar
                </button>
                <button
                  onclick="window.propertyMapRejectHandler('${property.id}')"
                  style="
                    flex: 1;
                    padding: 8px 12px;
                    background-color: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 600;
                  "
                  onmouseover="this.style.backgroundColor='#dc2626'"
                  onmouseout="this.style.backgroundColor='#ef4444'"
                >
                  ✗ Recusar
                </button>
              </div>
              ` : ''}
              <div style="display: flex; gap: 8px; margin-top: 8px;">
                <button
                  onclick="window.propertyMapClickHandler('${property.id}')"
                  style="
                    flex: 1;
                    padding: 6px 12px;
                    background-color: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                  "
                  onmouseover="this.style.backgroundColor='#2563eb'"
                  onmouseout="this.style.backgroundColor='#3b82f6'"
                >
                  Ver Detalhes
                </button>
                ${property.slug ? `
                <button
                  onclick="window.open('/property/${property.slug}', '_blank')"
                  style="
                    flex: 1;
                    padding: 6px 12px;
                    background-color: #8b5cf6;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                  "
                  onmouseover="this.style.backgroundColor='#7c3aed'"
                  onmouseout="this.style.backgroundColor='#8b5cf6'"
                >
                  🔗 Página Cliente
                </button>
                ` : ''}
              </div>
            </div>
          `;

          // Create popup
          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: true,
            closeOnClick: false,
          }).setHTML(popupHTML);

          // Use default Mapbox marker (simpler, more reliable)
          const marker = new mapboxgl.Marker({ color })
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(newMap);

          bounds.extend([lng, lat]);
          addedCount++;
        }
      }

      // Fit to bounds
      if (addedCount > 0) {
        newMap.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15,
        });
      }

      setIsLoading(false);
      setGeocodingProgress({ current: 0, total: 0 });
    });

    map.current = newMap;

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [properties, mapboxToken, showTokenInput]);

  // Handler for property clicks, approve, and reject
  useEffect(() => {
    (window as any).propertyMapClickHandler = (propertyId: string) => {
      const property = properties.find((p) => p.id === propertyId);
      if (property && onPropertyClick) {
        onPropertyClick(property);
      }
    };

    (window as any).propertyMapApproveHandler = (propertyId: string) => {
      const property = properties.find((p) => p.id === propertyId);
      if (property && onApprove) {
        onApprove(property);
      }
    };

    (window as any).propertyMapRejectHandler = (propertyId: string) => {
      const property = properties.find((p) => p.id === propertyId);
      if (property && onReject) {
        onReject(property);
      }
    };

    return () => {
      delete (window as any).propertyMapClickHandler;
      delete (window as any).propertyMapApproveHandler;
      delete (window as any).propertyMapRejectHandler;
    };
  }, [properties, onPropertyClick, onApprove, onReject]);

  // Go to my location
  const goToMyLocation = () => {
    if (navigator.geolocation && map.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.current?.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 13,
            essential: true,
          });
        },
        (error) => {
          // Location access denied or unavailable
        }
      );
    }
  };

  return (
    <Card className={isFullscreen ? "fixed inset-4 z-50" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Mapa Interativo de Propriedades
            {properties.length > 0 && (
              <Badge variant="secondary">{properties.length} propriedades</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goToMyLocation} title="Minha Localização">
              <Navigation className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Token Input */}
        {showTokenInput && (
          <div className="mb-6 p-6 border-2 border-dashed rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold text-foreground mb-2">Configurar Token Mapbox</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Insira seu token de acesso do Mapbox para visualizar o mapa.{' '}
              <a
                href="https://account.mapbox.com/access-tokens/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Obter token gratuito <ExternalLink className="h-3 w-3" />
              </a>
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="pk.eyJ1Ijoi..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTokenSubmit()}
                className="font-mono text-sm"
              />
              <Button onClick={handleTokenSubmit} disabled={!mapboxToken.trim()}>
                Salvar
              </Button>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && !showTokenInput && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <div>
                <div className="font-medium">Carregando mapa...</div>
                {geocodingProgress.total > 0 && (
                  <div className="text-sm text-gray-500">
                    Geocodificando: {geocodingProgress.current}/{geocodingProgress.total}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div
          ref={mapContainer}
          className="w-full rounded-lg overflow-hidden"
          style={{ height: isFullscreen ? "calc(100vh - 200px)" : "600px" }}
        />

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm pt-4 border-t mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow" />
            <span className="text-gray-600">Aprovado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow" />
            <span className="text-gray-600">Pendente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow" />
            <span className="text-gray-600">Rejeitado</span>
          </div>
        </div>

        {/* Instructions */}
        {properties.length === 0 && !showTokenInput && (
          <div className="text-center py-8 text-gray-500">
            Nenhuma propriedade para exibir. Adicione propriedades para vê-las no mapa.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractivePropertyMap;

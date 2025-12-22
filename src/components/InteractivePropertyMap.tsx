import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Maximize2, Minimize2, Loader2 } from "lucide-react";

// IMPORTANTE: Adicione sua chave Mapbox aqui ou use variável de ambiente
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example'; // Substitua com sua chave real

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

interface InteractivePropertyMapProps {
  properties: Property[];
  onPropertyClick?: (property: Property) => void;
}

export const InteractivePropertyMap = ({
  properties,
  onPropertyClick,
}: InteractivePropertyMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0 });

  // Geocodificar endereço usando Mapbox Geocoding API
  const geocodeAddress = async (property: Property): Promise<[number, number] | null> => {
    const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          fullAddress
        )}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      );

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return [lng, lat];
      }

      // Fallback: tentar apenas com cidade e estado
      const cityStateResponse = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          `${property.city}, ${property.state}`
        )}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      );

      const cityStateData = await cityStateResponse.json();

      if (cityStateData.features && cityStateData.features.length > 0) {
        const [lng, lat] = cityStateData.features[0].center;
        // Adicionar pequeno offset aleatório para evitar sobreposição
        const offsetLng = lng + (Math.random() - 0.5) * 0.01;
        const offsetLat = lat + (Math.random() - 0.5) * 0.01;
        return [offsetLng, offsetLat];
      }

      return null;
    } catch (error) {
      console.error(`Erro ao geocodificar ${fullAddress}:`, error);
      return null;
    }
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Criar mapa centrado em Orlando, FL
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-81.3792, 28.5383], // Orlando, FL
      zoom: 11,
    });

    // Adicionar controles de navegação
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Adicionar controle de fullscreen
    map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

    map.current.on("load", () => {
      setIsLoading(false);
    });

    return () => {
      markers.current.forEach((marker) => marker.remove());
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Adicionar marcadores para propriedades
  useEffect(() => {
    if (!map.current || properties.length === 0) return;

    const addMarkers = async () => {
      setIsLoading(true);
      setGeocodingProgress({ current: 0, total: properties.length });

      // Limpar marcadores existentes
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];

      const bounds = new mapboxgl.LngLatBounds();
      let addedMarkers = 0;

      // Adicionar marcadores para cada propriedade
      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        setGeocodingProgress({ current: i + 1, total: properties.length });

        const coordinates = await geocodeAddress(property);

        if (coordinates) {
          const [lng, lat] = coordinates;

          // Cor do marcador baseado no status
          const markerColor =
            property.approval_status === "approved"
              ? "#10b981" // verde
              : property.approval_status === "rejected"
              ? "#ef4444" // vermelho
              : "#f59e0b"; // amarelo (pending)

          // Criar elemento customizado do marcador
          const el = document.createElement("div");
          el.className = "custom-marker";
          el.style.width = "30px";
          el.style.height = "30px";
          el.style.borderRadius = "50%";
          el.style.backgroundColor = markerColor;
          el.style.border = "3px solid white";
          el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
          el.style.cursor = "pointer";
          el.style.transition = "transform 0.2s";

          el.addEventListener("mouseenter", () => {
            el.style.transform = "scale(1.2)";
          });

          el.addEventListener("mouseleave", () => {
            el.style.transform = "scale(1)";
          });

          // Criar popup
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="font-weight: bold; margin-bottom: 8px; color: #1f2937;">${property.address}</h3>
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">
                ${property.city}, ${property.state} ${property.zip_code}
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                <div>
                  <div style="font-size: 12px; color: #6b7280;">Valor Estimado</div>
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
                  background-color: ${markerColor}20;
                  color: ${markerColor};
                ">
                  ${property.approval_status || "pending"}
                </span>
              </div>
              <button
                onclick="window.propertyMapClickHandler('${property.id}')"
                style="
                  margin-top: 8px;
                  width: 100%;
                  padding: 6px 12px;
                  background-color: #3b82f6;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 500;
                "
                onmouseover="this.style.backgroundColor='#2563eb'"
                onmouseout="this.style.backgroundColor='#3b82f6'"
              >
                Ver Detalhes
              </button>
            </div>
          `);

          // Criar marcador
          const marker = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map.current!);

          markers.current.push(marker);
          bounds.extend([lng, lat]);
          addedMarkers++;
        }
      }

      // Ajustar o mapa para mostrar todos os marcadores
      if (addedMarkers > 0) {
        map.current?.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 15,
        });
      }

      setIsLoading(false);
      setGeocodingProgress({ current: 0, total: 0 });
    };

    addMarkers();
  }, [properties]);

  // Handler global para clique em propriedade
  useEffect(() => {
    (window as any).propertyMapClickHandler = (propertyId: string) => {
      const property = properties.find((p) => p.id === propertyId);
      if (property && onPropertyClick) {
        onPropertyClick(property);
      }
    };

    return () => {
      delete (window as any).propertyMapClickHandler;
    };
  }, [properties, onPropertyClick]);

  // Centralizar mapa na localização do usuário
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
          console.error("Erro ao obter localização:", error);
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
        {/* Loading Indicator */}
        {isLoading && (
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
        {properties.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhuma propriedade para exibir. Adicione propriedades para vê-las no mapa.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractivePropertyMap;

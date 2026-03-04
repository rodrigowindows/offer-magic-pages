import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, ZoomIn, Loader2 } from "lucide-react";
import { getStreetViewUrl } from "@/utils/streetView";

interface PropertyImageDisplayProps {
  imageUrl?: string | null;
  address: string;
  className?: string;
  showZoom?: boolean;
}

export const PropertyImageDisplay = ({
  imageUrl,
  address,
  className = "",
  showZoom = true,
}: PropertyImageDisplayProps) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [fallbackToStreetView, setFallbackToStreetView] = useState(false);

  // Reset loading/error state when imageUrl changes
  useEffect(() => {
    setHasError(false);
    setIsImageLoading(true);
    setFallbackToStreetView(false);
  }, [imageUrl]);

  const streetViewUrl = getStreetViewUrl(address);
  // Use uploaded image first, fallback to Street View, then show placeholder
  const effectiveUrl = fallbackToStreetView
    ? streetViewUrl
    : (imageUrl || streetViewUrl);

  if (!effectiveUrl || hasError) {
    return (
      <div className={`bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-muted-foreground p-4">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{hasError ? "Erro ao carregar" : "Sem foto"}</p>
        </div>
      </div>
    );
  }

  const handleImageError = () => {
    // If uploaded image failed and we have Street View, try that
    if (!fallbackToStreetView && streetViewUrl && imageUrl) {
      setFallbackToStreetView(true);
      setIsImageLoading(true);
    } else {
      setHasError(true);
      setIsImageLoading(false);
    }
  };

  return (
    <>
      <div className={`relative overflow-hidden group ${className}`}>
        {/* Loading spinner */}
        {isImageLoading && (
          <div className="absolute inset-0 bg-muted rounded-lg flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {/* Image with scale animation on hover */}
        <img
          key={effectiveUrl}
          src={effectiveUrl}
          alt={address}
          className={`w-full h-full object-cover rounded-lg transition-all duration-300 group-hover:scale-105 ${isImageLoading ? "opacity-0" : "opacity-100"}`}
          onLoad={() => setIsImageLoading(false)}
          onError={handleImageError}
        />

        {/* Street View badge */}
        {(fallbackToStreetView || !imageUrl) && !isImageLoading && (
          <div className="absolute bottom-2 left-2 z-10">
            <Badge variant="secondary" className="bg-black/60 text-white text-[10px] border-0">
              Google Street View
            </Badge>
          </div>
        )}

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

        {showZoom && (
          <div
            className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 rounded-lg flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100"
            onClick={() => setIsZoomed(true)}
          >
            <Badge className="bg-white text-gray-900 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
              <ZoomIn className="h-4 w-4 mr-1" />
              Ver Ampliado
            </Badge>
          </div>
        )}
      </div>

      {/* Zoom Dialog */}
      {showZoom && (
        <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
          <DialogContent className="max-w-4xl">
            <div className="space-y-2">
              <h3 className="font-semibold">{address}</h3>
              <img
                src={effectiveUrl}
                alt={address}
                loading="lazy"
                className="w-full h-auto rounded-lg"
                onError={() => setHasError(true)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

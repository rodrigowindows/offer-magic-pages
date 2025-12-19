import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, ZoomIn } from "lucide-react";

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

  if (!imageUrl) {
    return (
      <div className={`bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-muted-foreground p-4">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Sem foto</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`relative group ${className}`}>
        <img
          src={imageUrl}
          alt={address}
          loading="lazy"
          className="w-full h-full object-cover rounded-lg"
          onError={(e) => {
            // If image fails to load, show placeholder
            e.currentTarget.style.display = "none";
            e.currentTarget.parentElement!.innerHTML = `
              <div class="bg-muted rounded-lg flex items-center justify-center h-full">
                <div class="text-center text-muted-foreground p-4">
                  <svg class="h-8 w-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p class="text-sm">Erro ao carregar</p>
                </div>
              </div>
            `;
          }}
        />

        {showZoom && (
          <div
            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100"
            onClick={() => setIsZoomed(true)}
          >
            <Badge className="bg-white text-black">
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
                src={imageUrl}
                alt={address}
                loading="lazy"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

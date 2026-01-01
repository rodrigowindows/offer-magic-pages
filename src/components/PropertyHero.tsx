import { MapPin, Home } from "lucide-react";
import { useEffect, useState } from "react";

interface PropertyHeroProps {
  address?: string;
  imageUrl?: string;
  qrCodeUrl?: string;
}

const PropertyHero = ({ 
  address = "123 Main Street, Miami, FL 33101",
  imageUrl = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
  qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://mylocalinvest.com"
}: PropertyHeroProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset states when imageUrl changes
  useEffect(() => {
    console.log("🖼️ PropertyHero - Image URL received:", imageUrl);
    console.log("🏠 PropertyHero - Address:", address);
    setImageError(false);
    setImageLoaded(false);
  }, [imageUrl, address]);

  const handleImageLoad = () => {
    console.log("✅ Image loaded successfully:", imageUrl);
    setImageLoaded(true);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error("❌ Image failed to load:", imageUrl);
    console.error("❌ Error event:", e);
    setImageError(true);
  };
  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
              <Home className="w-4 h-4" />
              <span>Personalized Cash Offer</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Your Fair Cash Offer for
            </h1>
            
            <div className="flex items-start gap-3 p-4 bg-card rounded-lg shadow-sm border border-border">
              <MapPin className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <p className="text-2xl md:text-3xl font-bold text-primary">{address}</p>
            </div>
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              We know tax issues can be overwhelming. That's why we're making a straightforward, 
              <span className="text-foreground font-semibold"> no-obligation cash offer</span> to help you move forward with confidence.
            </p>

            {/* QR Code */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-6 bg-card rounded-xl shadow-md border border-border">
              <img 
                src={qrCodeUrl} 
                alt="Scan for property details" 
                className="w-32 h-32 rounded-lg"
              />
              <div className="text-center sm:text-left">
                <p className="font-semibold text-foreground mb-1">Scan to Save This Offer</p>
                <p className="text-sm text-muted-foreground">Access your personalized proposal anytime</p>
              </div>
            </div>
          </div>

          {/* Right Column - Property Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-strong">
              {imageError ? (
                <div className="w-full h-[400px] md:h-[500px] bg-muted flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p className="text-lg font-medium">Imagem não disponível</p>
                    <p className="text-sm mt-2">URL: {imageUrl?.substring(0, 50)}...</p>
                  </div>
                </div>
              ) : (
                <img 
                  src={imageUrl} 
                  alt={`Property at ${address}`}
                  className="w-full h-[400px] md:h-[500px] object-cover"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PropertyHero;

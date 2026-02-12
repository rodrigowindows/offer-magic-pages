import { MapPin, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { generateTrackedPropertyUrlBySlug } from "@/utils/urlUtils";

interface PropertyHeroProps {
  address?: string;
  propertySlug?: string;
  imageUrl?: string;
  qrCodeUrl?: string;
  offerValue?: number | string;
}

const PropertyHero = ({ 
  address = "123 Main Street, Miami, FL 33101",
  propertySlug,
  imageUrl = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
  qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://mylocalinvest.com",
  offerValue = "$70,000"
}: PropertyHeroProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset states when imageUrl changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [imageUrl, address]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageError(true);
  };

  const fallbackSlug = address?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const trackedOfferUrl = generateTrackedPropertyUrlBySlug(propertySlug || fallbackSlug, 'sms');

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
            
            {/* Offer Section - Moved outside the image */}
            <div className="mt-6 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Your Fair Cash Offer</h2>
                <div className="text-5xl md:text-6xl font-bold text-green-600 mb-4">{typeof offerValue === 'number' ? `$${offerValue.toLocaleString()}` : offerValue}</div>
                <p className="text-lg text-gray-600 mb-6">For {address}</p>
                
                {/* Details List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left max-w-md mx-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm">Close in 7-14 Days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm">Fast closing guaranteed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm">No Repairs Needed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm">We buy as-is</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm">No Realtor Fees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm">Save thousands</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow">Accept This Offer</button>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow">I Have Questions</button>
                  <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg shadow border">Download PDF</button>
                </div>
                
                {/* Property Link */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <a
                    href={trackedOfferUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow text-sm"
                  >
                    View Full Offer Details
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PropertyHero;

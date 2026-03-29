import { MapPin, Home, ZoomIn } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { generateTrackedPropertyUrlBySlug } from "@/utils/urlUtils";
import { formatCurrency } from "@/lib/utils";

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
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [imageUrl, address]);

  const fallbackSlug = address?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const trackedOfferUrl = generateTrackedPropertyUrlBySlug(propertySlug || fallbackSlug, 'sms');

  return (
    <section className="bg-white">
      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-10 items-start">

          {/* Left Column - Product Image (Amazon-style) */}
          <div className="space-y-3">
            {/* Main Image */}
            <div
              className="relative bg-gray-50 rounded-xl overflow-hidden border border-gray-200 cursor-zoom-in group"
              onClick={() => !imageError && setIsZoomed(true)}
            >
              {imageError ? (
                <div className="w-full aspect-[4/3] flex items-center justify-center bg-gray-100">
                  <div className="text-center text-gray-400">
                    <Home className="h-16 w-16 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Photo not available</p>
                  </div>
                </div>
              ) : (
                <>
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                  )}
                  <img
                    src={imageUrl}
                    alt={`Property at ${address}`}
                    className={`w-full aspect-[4/3] object-cover transition-all duration-300 group-hover:scale-[1.02] ${
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                  />
                  {/* Zoom hint */}
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="h-3.5 w-3.5" />
                    Click to zoom
                  </div>
                </>
              )}
            </div>

            {/* QR Code - Small below image */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-14 h-14 rounded"
              />
              <div>
                <p className="text-xs font-semibold text-gray-700">Scan to save this offer</p>
                <p className="text-[10px] text-gray-400">Access your personalized proposal anytime</p>
              </div>
            </div>
          </div>

          {/* Right Column - Product Info (Amazon-style) */}
          <div className="space-y-5">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold border border-green-200">
              <Home className="w-3.5 h-3.5" />
              PERSONALIZED CASH OFFER
            </div>

            {/* Title/Address */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-2">
                Your Fair Cash Offer
              </h1>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-base text-gray-600">{address}</p>
              </div>
            </div>

            {/* Price - Amazon style big green price */}
            <div className="border-t border-b border-gray-200 py-4">
              <p className="text-xs text-gray-500 mb-1">Cash Offer Amount</p>
              <p className="text-4xl md:text-5xl font-bold text-green-600">
                {typeof offerValue === 'number' ? formatCurrency(offerValue) : offerValue}
              </p>
            </div>

            {/* Benefits List - Amazon-style checkmarks */}
            <ul className="space-y-2.5">
              {[
                { text: "Close in 7-14 Days", sub: "Fast closing guaranteed" },
                { text: "No Repairs Needed", sub: "We buy as-is, any condition" },
                { text: "No Realtor Fees", sub: "Save thousands in commissions" },
                { text: "No Hidden Costs", sub: "What we offer is what you get" },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-2.5">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">{item.text}</span>
                    <span className="text-xs text-gray-500 block">{item.sub}</span>
                  </div>
                </li>
              ))}
            </ul>

            {/* CTA Buttons - Amazon-style stacked buttons */}
            <div className="space-y-3 pt-2">
              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-6 rounded-lg shadow-sm transition-colors text-base">
                Schedule a Call
              </button>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-sm transition-colors text-sm">
                I Have Questions
              </button>
              <button className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg border border-gray-300 transition-colors text-sm">
                Download PDF
              </button>
            </div>

            {/* External Property Links */}
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { label: "Google Maps", href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, color: "text-blue-700 bg-blue-50 hover:bg-blue-100" },
                { label: "Zillow", href: `https://www.zillow.com/homes/${encodeURIComponent(address)}_rb/`, color: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
                { label: "Trulia", href: `https://www.trulia.com/homes/${encodeURIComponent(address)}`, color: "text-green-700 bg-green-50 hover:bg-green-100" },
                { label: "Redfin", href: `https://www.redfin.com/search#query=${encodeURIComponent(address)}`, color: "text-red-600 bg-red-50 hover:bg-red-100" },
                { label: "Realtor", href: `https://www.realtor.com/realestateandhomes-search/${encodeURIComponent(address.replace(/\s+/g, '-'))}`, color: "text-orange-600 bg-orange-50 hover:bg-orange-100" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${link.color}`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Tracked link */}
            <div className="pt-2">
              <a
                href={trackedOfferUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-600 hover:text-purple-700 underline"
              >
                View Full Offer Details
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Dialog */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-5xl p-2">
          <img
            src={imageUrl}
            alt={`Property at ${address}`}
            className="w-full h-auto rounded-lg"
          />
          <p className="text-center text-sm text-gray-500 mt-2">{address}</p>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default PropertyHero;

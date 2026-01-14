import PropertyHero from "@/components/PropertyHero";
import CashOfferSectionB from "@/components/CashOfferSectionB";
import TrustCredentials from "@/components/TrustCredentials";

interface PropertyData {
  id: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_image_url: string | null;
  estimated_value: number;
  cash_offer_amount: number;
  status: string;
  owner_name: string | null;
  neighborhood: string | null;
}

interface PropertyPageMinimalProps {
  property: PropertyData;
  onFormSubmit: () => void;
  trackEvent: (event: string) => void;
}

const PropertyPageMinimal = ({ property, onFormSubmit, trackEvent }: PropertyPageMinimalProps) => {
  const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;
  const propertyUrl = `${window.location.origin}/property/${property.slug}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(propertyUrl)}`;
  
  const imageUrl = property.property_image_url || 
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80";

  const ownerFirstName = property.owner_name?.split(' ')[0] || '';

  return (
    <main className="min-h-screen">
      {/* Personalized Greeting - Simplified */}
      {ownerFirstName && (
        <div className="bg-secondary/10 py-3">
          <div className="container mx-auto px-4 text-center">
            <p className="text-lg font-medium text-foreground">
              Hi <span className="font-bold text-secondary">{ownerFirstName}</span>! 
              We have a cash offer for your property.
            </p>
          </div>
        </div>
      )}

      <PropertyHero 
        address={fullAddress}
        imageUrl={imageUrl}
        qrCodeUrl={qrCodeUrl}
        offerValue={property.cash_offer_amount}
      />

      <CashOfferSectionB
        offerAmount={`$${property.cash_offer_amount.toLocaleString()}`}
        onViewOffer={() => {
          trackEvent('viewed_offer');
          onFormSubmit();
        }}
        propertyAddress={fullAddress}
        propertyId={property.id}
      />

      {/* Trust Credentials - Compact */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <TrustCredentials />
        </div>
      </section>
      
      <footer className="bg-foreground text-background py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-3">
            <h3 className="text-xl font-bold">MyLocalInvest</h3>
            <p className="text-background/80 text-sm">
              Helping Miami homeowners since 2015
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-background/70">
              <a href="tel:786-882-8251" className="hover:text-background transition-colors">
                786 882 8251
              </a>
              <span>|</span>
              <a href="mailto:offers@mylocalinvest.com" className="hover:text-background transition-colors">
                offers@mylocalinvest.com
              </a>
            </div>
            <p className="text-xs text-background/60 pt-2">
              © {new Date().getFullYear()} MyLocalInvest
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default PropertyPageMinimal;

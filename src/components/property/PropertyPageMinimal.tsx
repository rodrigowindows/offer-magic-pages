import PropertyHero from "@/components/property/PropertyHero";
import { PropertyDetails } from "@/components/property/PropertyDetails";
import CashOfferSectionB from "@/components/offer/CashOfferSectionB";
import TrustCredentials from "@/components/shared/TrustCredentials";
import { formatCurrency } from "@/lib/utils";
import { useFeature } from "@/contexts/FeatureToggleContext";

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
  // Extra details for richer display
  bedrooms?: number | null;
  bathrooms?: number | null;
  sqft?: number | null;
  square_feet?: number | null;
  year_built?: number | null;
  lot_size?: number | null;
  property_type?: string | null;
  pool?: boolean | null;
}

interface PropertyPageMinimalProps {
  property: PropertyData;
  onFormSubmit: () => void;
  trackEvent: (event: string) => void;
}

const PropertyPageMinimal = ({ property, onFormSubmit, trackEvent }: PropertyPageMinimalProps) => {
  const showValues = useFeature('showPublicPropertyValues');
  const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;
  const propertyUrl = `${window.location.origin}/property/${property.slug}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(propertyUrl)}`;

  const imageUrl = property.property_image_url ||
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80";

  const ownerFirstName = property.owner_name?.split(' ')[0] || '';

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Personalized Greeting */}
      {ownerFirstName && (
        <div className="bg-green-50 border-b border-green-100 py-3">
          <div className="container mx-auto px-4 text-center">
            <p className="text-base font-medium text-gray-800">
              Hi <span className="font-bold text-green-700">{ownerFirstName}</span>!
              We have a cash offer for your property.
            </p>
          </div>
        </div>
      )}

      <PropertyHero
        address={fullAddress}
        propertySlug={property.slug}
        imageUrl={imageUrl}
        qrCodeUrl={qrCodeUrl}
        offerValue={showValues ? property.cash_offer_amount : undefined}
      />

      {/* Property Details Section — estimated_value hidden in Phase 1 */}
      <PropertyDetails
        bedrooms={property.bedrooms}
        bathrooms={property.bathrooms}
        sqft={property.sqft}
        square_feet={property.square_feet}
        year_built={property.year_built}
        lot_size={property.lot_size}
        property_type={property.property_type}
        pool={property.pool}
        address={fullAddress}
        city={property.city}
        state={property.state}
        neighborhood={property.neighborhood}
        estimated_value={showValues ? property.estimated_value : undefined}
      />

      <CashOfferSectionB
        offerAmount={showValues ? formatCurrency(property.cash_offer_amount) : 'Personalized Cash Offer'}
        currentOfferAmount={property.cash_offer_amount}
        onViewOffer={() => {
          trackEvent('viewed_offer');
          onFormSubmit();
        }}
        propertyAddress={fullAddress}
        propertyId={property.id}
      />

      {/* Trust Credentials */}
      <section className="py-10 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <TrustCredentials />
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-3">
            <h3 className="text-xl font-bold">MyLocalInvest</h3>
            <p className="text-gray-400 text-sm">
              Helping Miami homeowners since 2015
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
              <a href="tel:786-882-8251" className="hover:text-white transition-colors">
                786 882 8251
              </a>
              <span>|</span>
              <a href="mailto:offers@mylocalinvest.com" className="hover:text-white transition-colors">
                offers@mylocalinvest.com
              </a>
            </div>
            <p className="text-xs text-gray-500 pt-2">
              &copy; {new Date().getFullYear()} MyLocalInvest
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default PropertyPageMinimal;

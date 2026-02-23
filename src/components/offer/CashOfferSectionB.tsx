import { Check } from "lucide-react";
import ContactFormModal from "./ContactFormModal";

interface CashOfferSectionBProps {
  offerAmount?: string;
  onViewOffer?: () => void;
  propertyAddress?: string;
  propertyId?: string;
}

// Variant B: Ultra-simplified version (50% less content)
const CashOfferSectionB = ({
  offerAmount = "$285,000",
  onViewOffer,
  propertyAddress = "",
  propertyId
}: CashOfferSectionBProps) => {

  return (
    <section className="py-16 bg-gradient-to-br from-secondary/10 to-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            CASH OFFER FOR Your Home!
          </h2>
          
          <div className="text-7xl md:text-8xl font-black text-secondary">
            {offerAmount}
          </div>

          <p className="text-xl text-foreground font-semibold">
            No repairs • No fees • Close in 7 days
          </p>

          <ContactFormModal
            propertyAddress={propertyAddress}
            propertyId={propertyId}
            onSubmit={onViewOffer}
            buttonText="I'm Interested"
            buttonClassName="bg-green-600 hover:bg-green-700 text-white text-xl px-12 py-8 h-auto font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 animate-pulse"
          />
          
          <p className="text-sm text-muted-foreground">
            Call: 786 882 8251
          </p>
        </div>
      </div>
    </section>
  );
};

export default CashOfferSectionB;

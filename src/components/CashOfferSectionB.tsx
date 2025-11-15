import { Button } from "./ui/button";

interface CashOfferSectionBProps {
  offerAmount?: string;
  onViewOffer?: () => void;
}

// Variant B: Ultra-simplified version (50% less content)
const CashOfferSectionB = ({ 
  offerAmount = "$285,000",
  onViewOffer
}: CashOfferSectionBProps) => {
  const scrollToForm = () => {
    onViewOffer?.();
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  };

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

          <Button 
            size="lg" 
            onClick={scrollToForm}
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground text-xl px-12 py-8 h-auto font-bold shadow-lg hover:shadow-xl transition-all"
          >
            Reply "YES" to Get Started
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Text or call: (305) 555-0123
          </p>
        </div>
      </div>
    </section>
  );
};

export default CashOfferSectionB;

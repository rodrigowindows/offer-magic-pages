import { DollarSign, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";

interface CashOfferSectionProps {
  offerAmount?: string;
  estimatedValue?: string;
}

const CashOfferSection = ({ 
  offerAmount = "$285,000",
  estimatedValue = "$320,000"
}: CashOfferSectionProps) => {
  const scrollToForm = () => {
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-16 bg-gradient-to-br from-secondary/10 to-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl shadow-strong p-8 md:p-12 border-2 border-secondary">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full text-sm font-semibold">
                <DollarSign className="w-4 h-4" />
                <span>Your Cash Offer</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                We're Offering You
              </h2>
              
              <div className="relative">
                <div className="text-6xl md:text-7xl font-black text-secondary mb-4">
                  {offerAmount}
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-lg">Est. Market Value: {estimatedValue}</span>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-6 space-y-4">
                <p className="text-lg text-foreground leading-relaxed">
                  This is a <span className="font-bold text-secondary">fair, as-is cash offer</span> designed 
                  to help you solve your tax debt quickly and move forward with peace of mind.
                </p>
                
                <ul className="grid md:grid-cols-2 gap-3 text-left">
                  {[
                    "No repairs needed",
                    "Zero commissions or fees",
                    "Close in as little as 7 days",
                    "Pay off your tax debt"
                  ].map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-secondary rounded-full flex-shrink-0"></div>
                      <span className="text-foreground font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button 
                size="lg" 
                onClick={scrollToForm}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground text-lg px-8 py-6 h-auto font-bold shadow-md hover:shadow-lg transition-all"
              >
                Get Your Fair Cash Offer
              </Button>
              
              <p className="text-sm text-muted-foreground">
                No obligation • Free consultation • Confidential
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CashOfferSection;

import { useEffect } from "react";
import PropertyHero from "@/components/PropertyHero";
import CashOfferSection from "@/components/CashOfferSection";
import BenefitsSection from "@/components/BenefitsSection";
import ProcessSection from "@/components/ProcessSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import TrustSection from "@/components/TrustSection";
import ContactForm from "@/components/ContactForm";

const Index = () => {
  // Track page view on mount
  useEffect(() => {
    // Fire GA4 event when page loads
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'offer_viewed', {
        property_address: '123 Main Street, Miami, FL 33101'
      });
    }
  }, []);

  // These values would be dynamically inserted for each property
  const propertyData = {
    address: "123 Main Street, Miami, FL 33101",
    imageUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://mylocalinvest.com",
    offerAmount: "$285,000",
    estimatedValue: "$320,000"
  };

  return (
    <main className="min-h-screen">
      <PropertyHero 
        address={propertyData.address}
        imageUrl={propertyData.imageUrl}
        qrCodeUrl={propertyData.qrCodeUrl}
      />
      
      <CashOfferSection 
        offerAmount={propertyData.offerAmount}
        estimatedValue={propertyData.estimatedValue}
      />
      
      <BenefitsSection />
      
      <ProcessSection />
      
      <TrustSection />
      
      <TestimonialsSection />
      
      <ContactForm propertyAddress={propertyData.address} />
      
      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h3 className="text-2xl font-bold">MyLocalInvest</h3>
            <p className="text-background/80">
              Helping Miami homeowners find fair solutions to tax deed challenges since 2015
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-background/70">
              <a href="tel:305-555-0123" className="hover:text-background transition-colors">
                (305) 555-0123
              </a>
              <a href="mailto:info@mylocalinvest.com" className="hover:text-background transition-colors">
                info@mylocalinvest.com
              </a>
              <span>Miami, FL</span>
            </div>
            <p className="text-xs text-background/60 pt-4 border-t border-background/20">
              © 2024 MyLocalInvest. All rights reserved. | Privacy Policy | Terms of Service
            </p>
          </div>
        </div>
      </footer>
      
      {/* INSERT GOOGLE TAG MANAGER BODY CODE HERE */}
    </main>
  );
};

export default Index;

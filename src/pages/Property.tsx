import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useABTest } from "@/hooks/useABTest";
import PropertyHero from "@/components/PropertyHero";
import PropertyMap from "@/components/PropertyMap";
import CashOfferSection from "@/components/CashOfferSection";
import ContactForm from "@/components/ContactForm";
import OfferCountdown from "@/components/OfferCountdown";
import SocialProofBanner from "@/components/SocialProofBanner";
import SavingsCalculator from "@/components/SavingsCalculator";
import TrustCredentials from "@/components/TrustCredentials";
import NeighborhoodComparables from "@/components/NeighborhoodComparables";
import OfferProgressIndicator from "@/components/OfferProgressIndicator";
import OfferChatBot from "@/components/OfferChatBot";
import LanguageToggle from "@/components/LanguageToggle";
import PropertyPageMinimal from "@/components/PropertyPageMinimal";
import { OfferEditPanel } from "@/components/OfferEditPanel";
import { Badge } from "@/components/ui/badge";
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
  zillow_url: string | null;
}

const translations = {
  en: {
    loading: "Loading property details...",
    notFound: "Property Not Found",
    notFoundDesc: "The property you're looking for doesn't exist or is no longer available.",
    returnHome: "Return to Home",
    helpingSellers: "Helping Miami homeowners find fair solutions to tax deed challenges since 2015",
    greeting: "Hi",
    personalOffer: "We have a personalized cash offer ready for you!",
    seeWhatYouSave: "See What You Save",
    nearbyComparables: "Recent Sales Near You",
    yourProgress: "Your Path to a Quick Sale"
  },
  es: {
    loading: "Cargando detalles de la propiedad...",
    notFound: "Propiedad No Encontrada",
    notFoundDesc: "La propiedad que busca no existe o ya no está disponible.",
    returnHome: "Volver al Inicio",
    helpingSellers: "Ayudando a propietarios de Miami a encontrar soluciones justas desde 2015",
    greeting: "Hola",
    personalOffer: "¡Tenemos una oferta en efectivo personalizada lista para usted!",
    seeWhatYouSave: "Vea Lo Que Ahorra",
    nearbyComparables: "Ventas Recientes Cerca de Usted",
    yourProgress: "Su Camino a una Venta Rápida"
  }
};

const Property = () => {
  const { slug } = useParams();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [currentStep, setCurrentStep] = useState(1);
  const [startTime] = useState(Date.now());

  // A/B Test hook - only initialize after property is loaded
  const { variant, trackEvent, trackFormSubmit, trackTimeOnPage } = useABTest(property?.id || '');

  const t = translations[language];

  useEffect(() => {
    if (slug) {
      fetchProperty(slug);
      trackPageView(slug);
    }
  }, [slug]);

  // Track time on page when user leaves
  useEffect(() => {
    const handleUnload = () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      trackTimeOnPage(timeSpent);
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      handleUnload();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [startTime, trackTimeOnPage]);

  const trackAnalytics = async (propertyId: string, eventType: string) => {
    try {
      await supabase.functions.invoke('track-analytics', {
        body: {
          propertyId,
          eventType,
          referrer: document.referrer || 'direct',
          userAgent: navigator.userAgent,
        },
      });
    } catch (error) {
      console.error('Error tracking analytics:', error);
    }
  };

  const fetchProperty = async (propertySlug: string) => {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("slug", propertySlug)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.error("Error fetching property:", error);
    } else {
      setProperty(data);
      if (data) {
        trackAnalytics(data.id, 'page_view');
      }
    }
    setLoading(false);
  };

  const trackPageView = (propertySlug: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'offer_viewed', {
        property_slug: propertySlug
      });
    }
  };

  const handleFormSubmit = () => {
    setCurrentStep(2);
    trackFormSubmit();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-foreground mb-4">{t.notFound}</h1>
          <p className="text-muted-foreground mb-6">{t.notFoundDesc}</p>
          <a href="/" className="text-primary hover:underline">{t.returnHome}</a>
        </div>
      </div>
    );
  }

  // VARIANT B: Minimal/Clean version
  if (variant === 'B') {
    return (
      <>
        {/* Variant indicator for debugging - remove in production */}
        <div className="fixed bottom-4 left-4 z-50">
          <Badge variant="secondary" className="text-xs opacity-50">
            Variant B
          </Badge>
        </div>
        <PropertyPageMinimal 
          property={property} 
          onFormSubmit={handleFormSubmit}
          trackEvent={trackEvent}
        />
      </>
    );
  }

  // VARIANT A: Full version (original)
  const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;
  const propertyUrl = `${window.location.origin}/property/${property.slug}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(propertyUrl)}`;
  
  const imageUrl = property.property_image_url || 
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80";

  const ownerFirstName = property.owner_name?.split(' ')[0] || '';

  const handleOfferUpdate = (newEstimatedValue: number, newCashOffer: number) => {
    setProperty(prev => prev ? {
      ...prev,
      estimated_value: newEstimatedValue,
      cash_offer_amount: newCashOffer,
    } : null);
  };

  return (
    <main className="min-h-screen">
      {/* Variant indicator for debugging - remove in production */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
        <Badge variant="outline" className="text-xs opacity-50">
          Variant A
        </Badge>
        <OfferEditPanel
          propertyId={property.id}
          currentEstimatedValue={property.estimated_value}
          currentCashOffer={property.cash_offer_amount}
          zillowUrl={property.zillow_url}
          onUpdate={handleOfferUpdate}
        />
      </div>

      {/* Language Toggle */}
      <LanguageToggle language={language} onChange={setLanguage} />
      {/* Personalized Greeting */}
      {ownerFirstName && (
        <div className="bg-gradient-to-r from-secondary/20 to-primary/20 py-4">
          <div className="container mx-auto px-4 text-center">
            <p className="text-lg font-medium text-foreground">
              {t.greeting} <span className="font-bold text-secondary">{ownerFirstName}</span>! {t.personalOffer}
            </p>
          </div>
        </div>
      )}

      <PropertyHero 
        address={fullAddress}
        imageUrl={imageUrl}
        qrCodeUrl={qrCodeUrl}
      />

      {/* Social Proof Banner */}
      <section className="py-4 bg-background">
        <div className="container mx-auto px-4">
          <SocialProofBanner propertyId={property.id} />
        </div>
      </section>

      {/* Progress Indicator */}
      <section className="py-6 bg-background">
        <div className="container mx-auto px-4">
          <OfferProgressIndicator currentStep={currentStep} />
        </div>
      </section>

      {/* Countdown Timer */}
      <section className="py-6 bg-background">
        <div className="container mx-auto px-4 max-w-md">
          <OfferCountdown expirationDays={7} />
        </div>
      </section>
      
      <section className="py-8 md:py-12 bg-background">
        <div className="container mx-auto px-4">
          <PropertyMap 
            address={property.address}
            city={property.city}
            state={property.state}
            zipCode={property.zip_code}
          />
        </div>
      </section>

      <CashOfferSection 
        offerAmount={`$${property.cash_offer_amount.toLocaleString()}`}
        estimatedValue={`$${property.estimated_value.toLocaleString()}`}
      />

      {/* Savings Calculator */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <SavingsCalculator 
            cashOffer={property.cash_offer_amount} 
            estimatedValue={property.estimated_value} 
          />
        </div>
      </section>

      {/* Neighborhood Comparables */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <NeighborhoodComparables 
            propertyValue={property.estimated_value}
            neighborhood={property.neighborhood || undefined}
            city={property.city}
          />
        </div>
      </section>

      {/* Trust Credentials */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <TrustCredentials />
        </div>
      </section>
      
      <ContactForm 
        propertyAddress={fullAddress} 
        propertyId={property.id} 
        onSubmit={handleFormSubmit}
      />

      {/* Chatbot */}
      <OfferChatBot 
        propertyAddress={fullAddress}
        cashOffer={property.cash_offer_amount}
      />
      
      <footer className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h3 className="text-2xl font-bold">MyLocalInvest</h3>
            <p className="text-background/80">{t.helpingSellers}</p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-background/70">
              <a href="tel:305-555-0123" className="hover:text-background transition-colors">
                (305) 555-0123
              </a>
              <span>|</span>
              <a href="mailto:offers@mylocalinvest.com" className="hover:text-background transition-colors">
                offers@mylocalinvest.com
              </a>
            </div>
            <p className="text-xs text-background/60 pt-4">
              © {new Date().getFullYear()} MyLocalInvest. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Property;

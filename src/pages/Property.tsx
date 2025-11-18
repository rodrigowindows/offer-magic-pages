import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PropertyHero from "@/components/PropertyHero";
import CashOfferSection from "@/components/CashOfferSection";
import CashOfferSectionB from "@/components/CashOfferSectionB";
import BenefitsSection from "@/components/BenefitsSection";
import ProcessSection from "@/components/ProcessSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import TrustSection from "@/components/TrustSection";
import ContactForm from "@/components/ContactForm";
import { ChatBot } from "@/components/ChatBot";

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
}

const Property = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [variant, setVariant] = useState<'A' | 'B'>('A');
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [abTestId, setAbTestId] = useState<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // A/B test: randomly select 2 middle sections once (stable across renders)
  const selectedSectionIdsRef = useRef<string[] | null>(null);
  if (!selectedSectionIdsRef.current) {
    const ids = ['benefits', 'process', 'trust', 'testimonials'] as const;
    const shuffled = [...ids].sort(() => Math.random() - 0.5);
    selectedSectionIdsRef.current = shuffled.slice(0, 2);
  }
  const selectedSectionIds = selectedSectionIdsRef.current!;

  useEffect(() => {
    if (slug) {
      // Randomly assign variant (50/50 split)
      const assignedVariant = Math.random() < 0.5 ? 'A' : 'B';
      setVariant(assignedVariant);
      
      fetchProperty(slug);
      trackPageView(slug);
    }
  }, [slug]);

  useEffect(() => {
    if (property) {
      initializeABTest();
      setupIntersectionObserver();
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      // Track time on page when leaving
      if (abTestId) {
        const timeOnPage = Math.round((Date.now() - startTimeRef.current) / 1000);
        updateABTest({ time_on_page: timeOnPage });
      }
    };
  }, [property]);

  const initializeABTest = async () => {
    if (!property) return;
    
    const source = searchParams.get('src') || 'direct';
    
    try {
      const { data, error } = await supabase
        .from('ab_tests')
        .insert({
          property_id: property.id,
          variant,
          session_id: sessionId,
          source,
          viewed_hero: true
        })
        .select()
        .single();
      
      if (error) throw error;
      setAbTestId(data.id);
    } catch (error) {
      console.error('Error initializing AB test:', error);
    }
  };

  const updateABTest = async (updates: any) => {
    if (!abTestId) return;
    
    try {
      await supabase
        .from('ab_tests')
        .update(updates)
        .eq('id', abTestId);
    } catch (error) {
      console.error('Error updating AB test:', error);
    }
  };

  const setupIntersectionObserver = () => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elementId = entry.target.id;
            
            switch(elementId) {
              case 'offer-section':
                updateABTest({ viewed_offer: true });
                break;
              case 'benefits-section':
                updateABTest({ viewed_benefits: true });
                break;
              case 'process-section':
                updateABTest({ viewed_process: true });
                break;
              case 'contact-form':
                updateABTest({ viewed_form: true });
                break;
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    // Observe sections
    ['offer-section', 'benefits-section', 'process-section', 'contact-form'].forEach(id => {
      const element = document.getElementById(id);
      if (element && observerRef.current) {
        observerRef.current.observe(element);
      }
    });
  };

  const handleFormSubmit = () => {
    updateABTest({ submitted_form: true });
  };

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
      // Track page view after property is loaded
      if (data) {
        trackAnalytics(data.id, 'page_view');
      }
    }
    setLoading(false);
  };

  const trackPageView = (propertySlug: string) => {
    // Track page view with GA4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'offer_viewed', {
        property_slug: propertySlug
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-foreground mb-4">Property Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The property you're looking for doesn't exist or is no longer available.
          </p>
          <a href="/" className="text-primary hover:underline">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;
  const propertyUrl = `${window.location.origin}/property/${property.slug}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(propertyUrl)}`;
  
  const imageUrl = property.property_image_url || 
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80";

  return (
    <main className="min-h-screen">
      <PropertyHero 
        address={fullAddress}
        imageUrl={imageUrl}
        qrCodeUrl={qrCodeUrl}
      />
      
        <div id="offer-section">
          {variant === 'A' ? (
            <CashOfferSection 
              offerAmount={`$${property.cash_offer_amount.toLocaleString()}`}
              estimatedValue={`$${property.estimated_value.toLocaleString()}`}
            />
          ) : (
            <CashOfferSectionB 
              offerAmount={`$${property.cash_offer_amount.toLocaleString()}`}
            />
          )}
        </div>
      
      {selectedSectionIds.includes('benefits') && (
        <div id="benefits-section">
          <BenefitsSection />
        </div>
      )}
      
      {selectedSectionIds.includes('process') && (
        <div id="process-section">
          <ProcessSection />
        </div>
      )}
      
      {selectedSectionIds.includes('trust') && (
        <div id="trust-section">
          <TrustSection />
        </div>
      )}
      
      {selectedSectionIds.includes('testimonials') && (
        <div id="testimonials-section">
          <TestimonialsSection />
        </div>
      )}
      
      <ContactForm propertyAddress={fullAddress} propertyId={property.id} />
      
      <ChatBot propertyId={property.id} propertyAddress={fullAddress} />
      
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
    </main>
  );
};

export default Property;

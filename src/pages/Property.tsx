import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ABTestWrapper } from "@/components/ABTestWrapper";
import { PropertyCommunicationHistory } from "@/components/PropertyCommunicationHistory";
import { PropertyPageFollowUp } from "@/components/PropertyPageFollowUp";
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
  min_offer_amount?: number;
  max_offer_amount?: number;
  status: string;
  owner_name: string | null;
  neighborhood: string | null;
  zillow_url: string | null;
}

const Property = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchProperty(slug);
    }
  }, [slug]);

  const trackAnalytics = async (propertyId: string, eventType: string) => {
    try {
      // Get tracking parameters from URL
      const source = searchParams.get('src') || searchParams.get('source') || 'direct';
      const campaign = searchParams.get('campaign') || 'default';
      const utmSource = searchParams.get('utm_source');
      const utmMedium = searchParams.get('utm_medium');
      const utmCampaign = searchParams.get('utm_campaign');

      // Track in analytics function
      await supabase.functions.invoke('track-analytics', {
        body: {
          propertyId,
          eventType,
          source,
          campaign,
          utmSource,
          utmMedium,
          utmCampaign,
          referrer: document.referrer || 'direct',
          userAgent: navigator.userAgent,
        },
      });

      // Save to property_analytics table
      await supabase.from('property_analytics').insert({
        property_id: propertyId,
        event_type: eventType,
        referrer: document.referrer || 'direct',
        user_agent: navigator.userAgent,
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
          <p className="text-muted-foreground mb-6">The property you're looking for doesn't exist or is no longer available.</p>
          <a href="/" className="text-primary hover:underline">Return to Home</a>
        </div>
      </div>
    );
  }

  return (
    <>
      <PropertyPageFollowUp
        propertyId={property.id}
        propertyAddress={property.address}
        ownerName={property.owner_name}
        ownerEmail={property.owner_email}
        ownerPhone={property.owner_phone}
      />
      <ABTestWrapper property={property} />
      <PropertyCommunicationHistory propertyId={property.id} />
    </>
  );
};

export default Property;

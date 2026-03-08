import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ABTestWrapper } from "@/components/ab-testing/ABTestWrapper";
import { PropertyPageFollowUp } from "@/components/property/PropertyPageFollowUp";

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
  neighborhood: string | null;
  zillow_url: string | null;
  owner_name?: string | null;
}

const Property = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const analyticsTracked = useRef(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const fetchProperty = async (propertySlug: string) => {
      const { data, error } = await supabase
        .from("properties_public")
        .select("*")
        .eq("slug", propertySlug)
        .maybeSingle();

      if (error) {
        console.error("Error fetching property:", error);
      } else {
        setProperty(data);
      }

      setLoading(false);
    };

    void fetchProperty(slug);
  }, [slug]);

  // Track page view via server-side edge function (bypasses RLS)
  useEffect(() => {
    if (!property || analyticsTracked.current) return;
    analyticsTracked.current = true;

    const source = searchParams.get("src") || searchParams.get("source") || "direct";

    supabase.functions.invoke("track-analytics", {
      body: {
        propertyId: property.id,
        eventType: "page_view",
        source,
        referrer: document.referrer || window.location.href,
        userAgent: navigator.userAgent,
      },
    }).catch((err) => {
      console.error("Error tracking page view:", err);
    });
  }, [property, searchParams]);

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
      />
      <ABTestWrapper property={property} />
    </>
  );
};

export default Property;


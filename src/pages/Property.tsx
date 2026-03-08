import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
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
  bedrooms?: number | null;
  bathrooms?: number | null;
  square_feet?: number | null;
  property_type?: string | null;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

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

  const seoTitle = property
    ? `Cash Offer: ${formatCurrency(property.cash_offer_amount)} for ${property.address}, ${property.city} ${property.state}`
    : "Property Cash Offer | MyLocalInvest";

  const seoDescription = property
    ? `Get a fair cash offer of ${formatCurrency(property.cash_offer_amount)} for ${property.address}, ${property.city}, ${property.state} ${property.zip_code}. ${property.bedrooms ? `${property.bedrooms} bed` : ""}${property.bathrooms ? ` / ${property.bathrooms} bath` : ""}${property.square_feet ? ` / ${property.square_feet} sqft` : ""}. No repairs, no fees, close in 7 days.`
    : "Get a fair, no-obligation cash offer for your home. No repairs, no fees, close in as little as 7 days.";

  const ogImage = property?.property_image_url || "https://offer.mylocalinvest.com/og-default.jpg";
  const canonicalUrl = property ? `https://offer.mylocalinvest.com/property/${property.slug}` : undefined;

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
        <Helmet>
          <title>Property Not Found | MyLocalInvest</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-foreground mb-4">Property Not Found</h1>
          <p className="text-muted-foreground mb-6">The property you're looking for doesn't exist or is no longer available.</p>
          <a href="/" className="text-primary hover:underline">Return to Home</a>
        </div>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: `Cash Offer for ${property.address}`,
    description: seoDescription,
    url: canonicalUrl,
    image: ogImage,
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address,
      addressLocality: property.city,
      addressRegion: property.state,
      postalCode: property.zip_code,
      addressCountry: "US",
    },
    offers: {
      "@type": "Offer",
      price: property.cash_offer_amount,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={ogImage} />
        {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={ogImage} />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

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

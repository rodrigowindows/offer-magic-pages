import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ABTestWrapper } from "@/components/ABTestWrapper";
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
      const campaign = searchParams.get('campaign') || searchParams.get('c') || null;
      const contactPhone = searchParams.get('phone') || searchParams.get('p') || null;
      const contactEmail = searchParams.get('email') || searchParams.get('e') || null;
      const contactName = searchParams.get('name') || searchParams.get('n') || null;
      const utmSource = searchParams.get('utm_source');
      const utmMedium = searchParams.get('utm_medium');
      const utmCampaign = searchParams.get('utm_campaign');

      console.log('📊 [Property] Track Analytics Called:', {
        propertyId,
        eventType,
        source,
        campaign,
        hasContact: !!(contactPhone || contactEmail || contactName)
      });

      // Get IP and location from ipapi.co (free tier: 1000 requests/day)
      let ipData = null;
      try {
        const ipResponse = await fetch('https://ipapi.co/json/');
        if (ipResponse.ok) {
          ipData = await ipResponse.json();
        }
      } catch (ipError) {
        console.log('Could not fetch IP data:', ipError);
      }

      // Detect device type
      const userAgent = navigator.userAgent.toLowerCase();
      let deviceType = 'desktop';
      if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
        deviceType = 'mobile';
      } else if (/tablet|ipad/i.test(userAgent)) {
        deviceType = 'tablet';
      }

      // Track in analytics function
      await supabase.functions.invoke('track-analytics', {
        body: {
          propertyId,
          eventType,
          source,
          campaign,
          contactPhone,
          contactEmail,
          contactName,
          utmSource,
          utmMedium,
          utmCampaign,
          referrer: document.referrer || 'direct',
          userAgent: navigator.userAgent,
          ipAddress: ipData?.ip,
          city: ipData?.city,
          country: ipData?.country_name,
          deviceType,
        },
      });

      // Determine source type - accept all valid sources including variants like email-qr
      const validSources = ['email', 'sms', 'carta', 'call', 'email-qr', 'sms-qr', 'carta-qr', 'qr'];
      const sourceType = validSources.includes(source) ? source : (source.startsWith('email') || source.startsWith('sms') || source.startsWith('carta') || source.startsWith('call')) ? source : 'direct';

      // Save to property_analytics table with source column
      const { data: analyticsData, error: analyticsError } = await supabase.from('property_analytics').insert({
        property_id: propertyId,
        event_type: eventType,
        referrer: document.referrer || 'direct',
        user_agent: navigator.userAgent,
        ip_address: ipData?.ip || null,
        city: ipData?.city || null,
        country: ipData?.country_name || null,
        device_type: deviceType,
        source: sourceType,
      }).select();

      if (analyticsError) {
        console.error('❌ [Property] Error saving to property_analytics:', analyticsError);
      } else {
        console.log('✅ [Property] Analytics saved:', analyticsData);
      }

      // 🔥 UPDATE campaign_logs when someone clicks the link from email/sms
      if (eventType === 'page_view' && (source === 'email' || source === 'sms' || source === 'call')) {
        console.log('🔍 Looking for campaign log...', { propertyId, source });

        // Find the most recent campaign log for this property and channel
        const { data: campaignLog, error: fetchError } = await supabase
          .from('campaign_logs')
          .select('id, click_count')
          .eq('property_id', propertyId)
          .eq('channel', source)
          .order('sent_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) {
          console.error('❌ Error fetching campaign_logs:', fetchError);
        } else if (campaignLog) {
          console.log('📧 Found campaign log:', campaignLog);

          // Update the campaign log to mark link as clicked
          const { error: updateError } = await supabase
            .from('campaign_logs')
            .update({
              link_clicked: true,
              click_count: (campaignLog.click_count || 0) + 1,
              first_response_at: campaignLog.click_count ? undefined : new Date().toISOString(),
            })
            .eq('id', campaignLog.id);

          if (updateError) {
            console.error('❌ Error updating campaign_logs:', updateError);
          } else {
            console.log('✅ Campaign click tracked successfully!', {
              campaignLogId: campaignLog.id,
              clickCount: (campaignLog.click_count || 0) + 1,
            });
          }
        } else {
          console.warn('⚠️ No campaign log found for this property and source');
        }
      }
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
      />
      <ABTestWrapper property={property} />
    </>
  );
};

export default Property;

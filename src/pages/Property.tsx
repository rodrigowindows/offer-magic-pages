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

// Capture query params IMMEDIATELY on script load (before React hydration can lose them)
const INITIAL_SEARCH = window.location.search;
const INITIAL_HREF = window.location.href;

// Also persist to sessionStorage so they survive any SPA navigation
if (INITIAL_SEARCH && INITIAL_SEARCH.length > 1) {
  try {
    sessionStorage.setItem('landing_params', INITIAL_SEARCH);
    sessionStorage.setItem('landing_href', INITIAL_HREF);
  } catch (e) { /* ignore */ }
}

const Property = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      // Check if already tracked server-side via track-link-click edge function
      const urlParams = new URLSearchParams(INITIAL_SEARCH || window.location.search);
      const isServerTracked = urlParams.get('tracked') === '1' || 
        document.referrer.includes('functions/v1/track-link-click') ||
        sessionStorage.getItem('server_tracked_' + slug) === 'true';
      
      if (isServerTracked) {
        try { sessionStorage.setItem('server_tracked_' + slug, 'true'); } catch(e) {}
      }
      
      fetchProperty(slug, isServerTracked);
    }
  }, [slug]);

  const trackAnalytics = async (propertyId: string, eventType: string) => {
    try {
      // Use multiple fallback sources for query params (mobile browsers often lose them)
      // Priority: 1) Captured at script load, 2) sessionStorage, 3) current window, 4) React Router
      const savedSearch = sessionStorage.getItem('landing_params') || '';
      const initialParams = new URLSearchParams(INITIAL_SEARCH);
      const savedParams = new URLSearchParams(savedSearch);
      const currentParams = new URLSearchParams(window.location.search);
      
      const getParam = (key: string): string | null => {
        return initialParams.get(key) || savedParams.get(key) || currentParams.get(key) || searchParams.get(key);
      };

      const source = getParam('src') || getParam('source') || 'direct';
      const campaign = getParam('campaign') || getParam('c') || null;
      const contactPhone = getParam('phone') || getParam('p') || null;
      const contactEmail = getParam('email') || getParam('e') || null;
      const contactName = getParam('name') || getParam('n') || null;
      const utmSource = getParam('utm_source');
      const utmMedium = getParam('utm_medium');
      const utmCampaign = getParam('utm_campaign');

      console.log('📊 [Property] Track Analytics Called:', {
        propertyId,
        eventType,
        source,
        campaign,
        initialSearch: INITIAL_SEARCH,
        savedSearch: sessionStorage.getItem('landing_params'),
        currentSearch: window.location.search,
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
      const validSources = ['email', 'sms', 'carta', 'letter', 'call', 'email-qr', 'sms-qr', 'carta-qr', 'letter-qr', 'qr'];
      const sourceType = validSources.includes(source) ? source : (source.startsWith('email') || source.startsWith('sms') || source.startsWith('carta') || source.startsWith('letter') || source.startsWith('call')) ? source : 'direct';

      const landingHref = sessionStorage.getItem('landing_href') || INITIAL_HREF || window.location.href;

      // 🔍 DEBUG: Capture complete URL for debugging mobile tracking
      const currentUrl = window.location.href;
      const queryParams = window.location.search;

      console.log('🔍 [Property] Client-side tracking - Full URL:', currentUrl);
      console.log('🔍 [Property] Query string:', queryParams);

      // Save to property_analytics table with source column
      const { data: analyticsData, error: analyticsError } = await supabase.from('property_analytics').insert({
        property_id: propertyId,
        event_type: eventType,
        referrer: landingHref, // Save full landing URL with query params
        user_agent: navigator.userAgent,
        ip_address: ipData?.ip || null,
        city: ipData?.city || null,
        country: ipData?.country_name || null,
        device_type: deviceType,
        source: sourceType,
        click_url: currentUrl,      // 🔍 Save complete current URL
        query_params: queryParams,  // 🔍 Save query string separately
      }).select();

      if (analyticsError) {
        console.error('❌ [Property] Error saving to property_analytics:', analyticsError);
      } else {
        console.log('✅ [Property] Analytics saved:', analyticsData);
      }

      // 🔥 UPDATE campaign_logs when someone clicks the link from email/sms/letter
      if (eventType === 'page_view' && (source === 'email' || source === 'sms' || source === 'call' || source === 'letter' || source === 'carta')) {
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

  const fetchProperty = async (propertySlug: string, skipTracking = false) => {
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
      if (data && !skipTracking) {
        trackAnalytics(data.id, 'page_view');
      } else if (data && skipTracking) {
        console.log('📊 [Property] Skipping client-side tracking (already tracked server-side)');
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

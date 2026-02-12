import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsRequest {
  propertyId: string;
  eventType: string;
  referrer?: string;
  userAgent?: string;
  source?: string;
  ipAddress?: string;
  city?: string;
  country?: string;
  deviceType?: string;
}

const getDeviceType = (userAgent: string): string => {
  if (/Mobile|Android|iPhone/i.test(userAgent)) return 'mobile';
  if (/Tablet|iPad/i.test(userAgent)) return 'tablet';
  return 'desktop';
};

const getLocationFromIP = async (ip: string) => {
  try {
    // Using ip-api.com for geolocation (free, no key required)
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country,
        city: data.city,
      };
    }
  } catch (error) {
    console.error('Error getting location:', error);
  }
  return { country: null, city: null };
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { propertyId, eventType, referrer, userAgent, source, ipAddress, city, country, deviceType: clientDeviceType }: AnalyticsRequest = await req.json();

    // Get IP address - prefer client-provided, fallback to headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const finalIp = ipAddress || forwardedFor?.split(',')[0] || realIp || 'unknown';

    console.log('Tracking analytics:', {
      propertyId,
      eventType,
      source,
      ipAddress: finalIp,
      userAgent,
    });

    // Use client-provided location if available, otherwise lookup
    let locationCity = city;
    let locationCountry = country;
    if (!locationCity && !locationCountry) {
      const location = await getLocationFromIP(finalIp);
      locationCity = location.city;
      locationCountry = location.country;
    }
    const deviceType = clientDeviceType || (userAgent ? getDeviceType(userAgent) : 'unknown');

    // Determine source - use provided source, default to 'direct'
    const finalSource = source || 'direct';

    // Insert analytics data
    const { error } = await supabase
      .from('property_analytics')
      .insert({
        property_id: propertyId,
        event_type: eventType,
        ip_address: finalIp,
        country: locationCountry,
        city: locationCity,
        user_agent: userAgent,
        referrer: referrer,
        device_type: deviceType,
        source: finalSource,
      });

    if (error) {
      console.error('Error inserting analytics:', error);
      throw error;
    }

    // Create notification for important events
    if (eventType === 'inquiry_submitted' || eventType === 'page_view') {
      const cityText = location.city || 'Unknown';
      const countryText = location.country || 'Unknown';
      
      let message = '';
      if (eventType === 'page_view') {
        message = `New visitor from ${cityText}, ${countryText} viewed the property`;
      } else if (eventType === 'inquiry_submitted') {
        message = `New inquiry from ${cityText}, ${countryText}`;
      }

      await supabase
        .from('notifications')
        .insert({
          property_id: propertyId,
          event_type: eventType,
          message,
          metadata: {
            city: location.city,
            country: location.country,
            device_type: deviceType,
            ip_address: ipAddress,
          },
        });
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in track-analytics function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

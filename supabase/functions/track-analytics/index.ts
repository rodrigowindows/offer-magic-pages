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

    const { propertyId, eventType, referrer, userAgent }: AnalyticsRequest = await req.json();

    // Get IP address from request headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';

    console.log('Tracking analytics:', {
      propertyId,
      eventType,
      ipAddress,
      userAgent,
    });

    // Get location from IP
    const location = await getLocationFromIP(ipAddress);
    const deviceType = userAgent ? getDeviceType(userAgent) : 'unknown';

    // Insert analytics data
    const { error } = await supabase
      .from('property_analytics')
      .insert({
        property_id: propertyId,
        event_type: eventType,
        ip_address: ipAddress,
        country: location.country,
        city: location.city,
        user_agent: userAgent,
        referrer: referrer,
        device_type: deviceType,
      });

    if (error) {
      console.error('Error inserting analytics:', error);
      throw error;
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

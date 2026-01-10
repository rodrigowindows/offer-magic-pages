import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SkipTraceRequest {
  propertyId?: string;
  limit?: number;
  offset?: number;
  hasSkipTraceData?: boolean;
  search?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get request parameters
    const url = new URL(req.url);
    const propertyId = url.searchParams.get('propertyId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const hasSkipTraceData = url.searchParams.get('hasSkipTraceData') === 'true';
    const search = url.searchParams.get('search');

    let query = supabaseClient
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by specific property ID if provided
    if (propertyId) {
      query = query.eq('id', propertyId);
    }

    // Filter properties that have skip trace data
    if (hasSkipTraceData) {
      query = query.or('phone1.neq.null,phone2.neq.null,phone3.neq.null,phone4.neq.null,phone5.neq.null,owner_phone.neq.null,email1.neq.null,email2.neq.null,email3.neq.null,email4.neq.null,email5.neq.null,owner_email.neq.null');
    }

    // Search functionality
    if (search) {
      query = query.or(`address.ilike.%${search}%,city.ilike.%${search}%,owner_name.ilike.%${search}%,zip_code.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: properties, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch properties', details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Process and format the skip trace data
    const processedProperties = properties?.map(property => {
      // Extract all phone numbers from skip tracing
      const phones = [];
      for (let i = 1; i <= 5; i++) {
        const phone = property[`phone${i}`];
        const type = property[`phone${i}_type`];
        if (phone) {
          phones.push({
            number: phone,
            type: type || 'Unknown',
            formatted: formatPhoneNumber(phone)
          });
        }
      }

      // Add owner phone if not already included
      if (property.owner_phone && !phones.find(p => p.number === property.owner_phone)) {
        phones.push({
          number: property.owner_phone,
          type: 'Owner',
          formatted: formatPhoneNumber(property.owner_phone)
        });
      }

      // Extract all emails from skip tracing
      const emails = [];
      for (let i = 1; i <= 5; i++) {
        const email = property[`email${i}`];
        if (email && isValidEmail(email)) {
          emails.push({
            email: email,
            type: `Email ${i}`
          });
        }
      }

      // Add owner email if not already included
      if (property.owner_email && isValidEmail(property.owner_email) && !emails.find(e => e.email === property.owner_email)) {
        emails.push({
          email: property.owner_email,
          type: 'Owner'
        });
      }

      // Extract preferred and manual contacts from tags
      const tags = Array.isArray(property.tags) ? property.tags : [];

      const preferredPhones = tags
        .filter((t: string) => typeof t === 'string' && t.startsWith('pref_phone:'))
        .map((t: string) => t.replace('pref_phone:', ''));

      const preferredEmails = tags
        .filter((t: string) => typeof t === 'string' && t.startsWith('pref_email:'))
        .map((t: string) => t.replace('pref_email:', ''));

      const manualPhones = tags
        .filter((t: string) => typeof t === 'string' && t.startsWith('manual_phone:'))
        .map((t: string) => t.replace('manual_phone:', ''));

      const manualEmails = tags
        .filter((t: string) => typeof t === 'string' && t.startsWith('manual_email:'))
        .map((t: string) => t.replace('manual_email:', ''));

      return {
        ...property,
        skip_trace_summary: {
          total_phones: phones.length,
          total_emails: emails.length,
          total_manual_phones: manualPhones.length,
          total_manual_emails: manualEmails.length,
          has_owner_info: !!(property.owner_name || property.owner_phone || property.owner_email),
          phones: phones,
          emails: emails,
          preferred_phones: preferredPhones,
          preferred_emails: preferredEmails,
          manual_phones: manualPhones,
          manual_emails: manualEmails,
          all_available_phones: [...preferredPhones, ...manualPhones],
          all_available_emails: [...preferredEmails, ...manualEmails],
          dnc_status: property.dnc_litigator ? 'DNC' : 'Clear',
          deceased_status: property.owner_deceased ? 'Deceased' : 'Active'
        }
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: processedProperties,
        pagination: {
          limit,
          offset,
          total: count,
          has_more: count ? (offset + limit) < count : false
        },
        summary: {
          total_properties: count || 0,
          properties_with_phones: processedProperties?.filter(p => p.skip_trace_summary.total_phones > 0).length || 0,
          properties_with_emails: processedProperties?.filter(p => p.skip_trace_summary.total_emails > 0).length || 0,
          properties_with_owner_info: processedProperties?.filter(p => p.skip_trace_summary.has_owner_info).length || 0
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper function to format phone numbers
function formatPhoneNumber(phone: string): string {
  if (!phone) return '';

  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX if 10 digits
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Format as +X (XXX) XXX-XXXX if 11 digits (with country code)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // Return as-is if doesn't match expected formats
  return phone;
}

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
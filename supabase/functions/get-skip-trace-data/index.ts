import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Format phone number to (XXX) XXX-XXXX
function formatPhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

// Validate email format
function isValidEmail(email: string | null): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Extract phones from property
function extractPhones(property: any): Array<{ number: string; type: string; formatted: string }> {
  const phones: Array<{ number: string; type: string; formatted: string }> = [];
  
  // Main person phones (phone1-phone7)
  for (let i = 1; i <= 7; i++) {
    const phone = property[`phone${i}`];
    const type = property[`phone${i}_type`] || 'Unknown';
    if (phone) {
      phones.push({
        number: phone.replace(/\D/g, ''),
        type,
        formatted: formatPhone(phone) || phone
      });
    }
  }
  
  // Person 2 phones
  for (let i = 1; i <= 7; i++) {
    const phone = property[`person2_phone${i}`];
    const type = property[`person2_phone${i}_type`] || 'Person2';
    if (phone) {
      phones.push({
        number: phone.replace(/\D/g, ''),
        type: `Person2-${type}`,
        formatted: formatPhone(phone) || phone
      });
    }
  }
  
  // Person 3 phones
  for (let i = 1; i <= 7; i++) {
    const phone = property[`person3_phone${i}`];
    const type = property[`person3_phone${i}_type`] || 'Person3';
    if (phone) {
      phones.push({
        number: phone.replace(/\D/g, ''),
        type: `Person3-${type}`,
        formatted: formatPhone(phone) || phone
      });
    }
  }
  
  // Relative phones (5 relatives, 5 phones each)
  for (let r = 1; r <= 5; r++) {
    const relativeName = property[`relative${r}_name`];
    for (let p = 1; p <= 5; p++) {
      const phone = property[`relative${r}_phone${p}`];
      const type = property[`relative${r}_phone${p}_type`] || 'Relative';
      if (phone) {
        phones.push({
          number: phone.replace(/\D/g, ''),
          type: `Relative${r}-${type}${relativeName ? ` (${relativeName})` : ''}`,
          formatted: formatPhone(phone) || phone
        });
      }
    }
  }
  
  // Owner phone
  if (property.owner_phone) {
    phones.push({
      number: property.owner_phone.replace(/\D/g, ''),
      type: 'Owner',
      formatted: formatPhone(property.owner_phone) || property.owner_phone
    });
  }
  
  return phones;
}

// Extract emails from property
function extractEmails(property: any): Array<{ email: string; type: string }> {
  const emails: Array<{ email: string; type: string }> = [];
  
  // Main emails
  if (property.email1 && isValidEmail(property.email1)) {
    emails.push({ email: property.email1, type: 'Primary' });
  }
  if (property.email2 && isValidEmail(property.email2)) {
    emails.push({ email: property.email2, type: 'Secondary' });
  }
  
  // Person 2 emails
  if (property.person2_email1 && isValidEmail(property.person2_email1)) {
    emails.push({ email: property.person2_email1, type: 'Person2-Primary' });
  }
  if (property.person2_email2 && isValidEmail(property.person2_email2)) {
    emails.push({ email: property.person2_email2, type: 'Person2-Secondary' });
  }
  
  // Person 3 emails
  if (property.person3_email1 && isValidEmail(property.person3_email1)) {
    emails.push({ email: property.person3_email1, type: 'Person3-Primary' });
  }
  if (property.person3_email2 && isValidEmail(property.person3_email2)) {
    emails.push({ email: property.person3_email2, type: 'Person3-Secondary' });
  }
  
  return emails;
}

// Extract preferred contacts from tags
function extractPreferredFromTags(tags: string[] | null, prefix: string): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((t): t is string => typeof t === 'string' && t.startsWith(prefix))
    .map(t => t.replace(prefix, ''));
}

// Build skip trace summary
function buildSkipTraceSummary(property: any) {
  const phones = extractPhones(property);
  const emails = extractEmails(property);
  const tags = Array.isArray(property.tags) ? property.tags : [];
  
  const preferredPhones = [
    ...extractPreferredFromTags(tags, 'pref_phone:'),
    ...extractPreferredFromTags(tags, 'manual_phone:')
  ];
  
  const preferredEmails = [
    ...extractPreferredFromTags(tags, 'pref_email:'),
    ...extractPreferredFromTags(tags, 'manual_email:')
  ];
  
  const dncStatus = property.dnc_flag || 
    (property.dnc_litigator_scrub && property.dnc_litigator_scrub.toLowerCase().includes('dnc')) 
    ? 'DNC' : 'Clear';
  
  const deceasedStatus = property.deceased ? 'Deceased' : 'Active';
  
  return {
    total_phones: phones.length,
    total_emails: emails.length,
    has_owner_info: !!(property.owner_name || property.matched_first_name || property.matched_last_name),
    phones,
    emails,
    preferred_phones: preferredPhones,
    preferred_emails: preferredEmails,
    dnc_status: dncStatus,
    deceased_status: deceasedStatus
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse query parameters
    const url = new URL(req.url);
    const propertyId = url.searchParams.get('propertyId');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const hasSkipTraceData = url.searchParams.get('hasSkipTraceData') === 'true';
    const search = url.searchParams.get('search');

    console.log('Skip Trace API called with params:', { propertyId, limit, offset, hasSkipTraceData, search });

    // Build query
    let query = supabase.from('properties').select('*', { count: 'exact' });

    // Filter by specific property ID
    if (propertyId) {
      query = query.eq('id', propertyId);
    }

    // Filter by having skip trace data (at least one phone or email)
    if (hasSkipTraceData) {
      query = query.or('phone1.not.is.null,phone2.not.is.null,phone3.not.is.null,email1.not.is.null,email2.not.is.null');
    }

    // Search filter
    if (search) {
      const searchPattern = `%${search}%`;
      query = query.or(`address.ilike.${searchPattern},city.ilike.${searchPattern},owner_name.ilike.${searchPattern},zip_code.ilike.${searchPattern}`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data: properties, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log(`Found ${properties?.length || 0} properties (total: ${count})`);

    // Transform properties with skip trace summary
    const transformedData = (properties || []).map(property => ({
      ...property,
      skip_trace_summary: buildSkipTraceSummary(property)
    }));

    // Calculate summary statistics
    const summary = {
      total_properties: count || 0,
      properties_with_phones: transformedData.filter(p => p.skip_trace_summary.total_phones > 0).length,
      properties_with_emails: transformedData.filter(p => p.skip_trace_summary.total_emails > 0).length,
      properties_with_owner_info: transformedData.filter(p => p.skip_trace_summary.has_owner_info).length
    };

    const response = {
      success: true,
      data: transformedData,
      pagination: {
        limit,
        offset,
        total: count || 0,
        has_more: (offset + limit) < (count || 0)
      },
      summary
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error in get-skip-trace-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

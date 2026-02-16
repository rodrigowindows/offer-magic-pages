import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SkipTraceProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  // ... outros campos da propriedade
  skip_trace_summary: {
    total_phones: number;
    total_emails: number;
    total_manual_phones?: number;
    total_manual_emails?: number;
    has_owner_info: boolean;
    phones: Array<{
      number: string;
      type: string;
      formatted: string;
    }>;
    emails: Array<{
      email: string;
      type: string;
    }>;
    preferred_phones: string[];
    preferred_emails: string[];
    manual_phones?: string[];
    manual_emails?: string[];
    all_available_phones?: string[];
    all_available_emails?: string[];
    dnc_status: 'DNC' | 'Clear';
    deceased_status: 'Deceased' | 'Active';
  };
}

export interface SkipTraceResponse {
  success: boolean;
  data: SkipTraceProperty[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
  };
  summary: {
    total_properties: number;
    properties_with_phones: number;
    properties_with_emails: number;
    properties_with_owner_info: number;
  };
  error?: string;
}

export interface UseSkipTraceDataOptions {
  propertyId?: string;
  limit?: number;
  offset?: number;
  hasSkipTraceData?: boolean;
  search?: string;
  autoLoad?: boolean;
}

export const useSkipTraceData = (options: UseSkipTraceDataOptions = {}) => {
  const [data, setData] = useState<SkipTraceProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<SkipTraceResponse['pagination'] | null>(null);
  const [summary, setSummary] = useState<SkipTraceResponse['summary'] | null>(null);

  const fetchSkipTraceData = async (fetchOptions?: Partial<UseSkipTraceDataOptions>) => {
    const opts = { ...options, ...fetchOptions };

    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (opts.propertyId) params.append('propertyId', opts.propertyId);
      if (opts.limit) params.append('limit', opts.limit.toString());
      if (opts.offset !== undefined) params.append('offset', opts.offset.toString());
      if (opts.hasSkipTraceData) params.append('hasSkipTraceData', 'true');
      if (opts.search) params.append('search', opts.search);

      const queryString = params.toString();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase environment variables are not configured');
      }

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('User session required to access Skip Trace data');
      }

      const functionUrl = `${supabaseUrl}/functions/v1/get-skip-trace-data${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: SkipTraceResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch skip trace data');
      }

      setData(result.data);
      setPagination(result.pagination);
      setSummary(result.summary);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching skip trace data:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Auto-load if specified
  useEffect(() => {
    if (options.autoLoad) {
      fetchSkipTraceData();
    }
  }, [
    options.autoLoad,
    options.propertyId,
    options.limit,
    options.offset,
    options.hasSkipTraceData,
    options.search,
  ]);

  return {
    data,
    loading,
    error,
    pagination,
    summary,
    refetch: fetchSkipTraceData,
  };
};

// Hook específico para buscar uma propriedade por ID
export const useSkipTraceProperty = (propertyId: string) => {
  return useSkipTraceData({
    propertyId,
    autoLoad: !!propertyId,
  });
};

// Hook para buscar propriedades com skip trace data
export const useSkipTraceProperties = (options: Omit<UseSkipTraceDataOptions, 'propertyId'> = {}) => {
  return useSkipTraceData({
    ...options,
    hasSkipTraceData: true,
    autoLoad: true,
  });
};

-- Create api_request_logs table to store detailed API request/response data
-- This helps verify API responses and debug issues with Attom V2 API

CREATE TABLE IF NOT EXISTS public.api_request_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_source TEXT NOT NULL DEFAULT 'attom-v2', -- attom-v2, attom-v1, zillow, county-csv
  request_address TEXT NOT NULL,
  normalized_address TEXT,
  city TEXT,
  county TEXT,
  state TEXT,
  zip_code TEXT,
  request_url TEXT NOT NULL,
  http_status INTEGER,
  http_status_text TEXT,
  response_headers JSONB,
  request_headers JSONB,
  response_body JSONB, -- Full API response stored as JSON
  error_response TEXT, -- Error message if request failed
  parsed_comps_count INTEGER DEFAULT 0,
  parsing_path_used TEXT, -- Which parsing path succeeded (v2, legacy, alternative)
  response_structure_keys TEXT[], -- Top-level keys from response for debugging
  execution_time_ms INTEGER,
  api_key_configured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB -- Additional metadata for debugging
);

-- Enable RLS
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

-- Create policies - allow service role to insert, anyone to read
DROP POLICY IF EXISTS "Service role can insert api request logs" ON public.api_request_logs;
CREATE POLICY "Service role can insert api request logs"
ON public.api_request_logs
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view api request logs" ON public.api_request_logs;
CREATE POLICY "Anyone can view api request logs"
ON public.api_request_logs
FOR SELECT
USING (true);

-- Create indexes for faster queries (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_api_request_logs_api_source ON public.api_request_logs(api_source);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_created_at ON public.api_request_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_request_address ON public.api_request_logs(request_address);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_http_status ON public.api_request_logs(http_status);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_parsed_comps_count ON public.api_request_logs(parsed_comps_count);

-- Add comments for documentation
COMMENT ON TABLE public.api_request_logs IS 'Stores detailed logs of all API requests to external services (Attom, Zillow, etc.) for debugging and verification';
COMMENT ON COLUMN public.api_request_logs.response_body IS 'Full JSON response from API - stored for verification that API returns production data';
COMMENT ON COLUMN public.api_request_logs.parsing_path_used IS 'Which parsing path succeeded: v2, legacy, or alternative';
COMMENT ON COLUMN public.api_request_logs.response_structure_keys IS 'Top-level keys from response JSON for quick structure inspection';
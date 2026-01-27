-- ========================================
-- MIGRATION: Add expires_at to cache tables
-- ========================================
-- Adds TTL (Time To Live) for cache entries to automatically expire old data

-- Add expires_at to comps_analysis_history
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comps_analysis_history' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE public.comps_analysis_history 
    ADD COLUMN expires_at TIMESTAMPTZ;
    
    -- Set expires_at to 30 days from created_at for existing records
    UPDATE public.comps_analysis_history 
    SET expires_at = created_at + INTERVAL '30 days'
    WHERE expires_at IS NULL;
    
    -- Create index for efficient cleanup queries
    CREATE INDEX IF NOT EXISTS idx_comps_history_expires_at 
    ON public.comps_analysis_history(expires_at);
    
    COMMENT ON COLUMN public.comps_analysis_history.expires_at IS 'Cache expiration timestamp. Records older than this should be considered stale.';
  END IF;
END $$;

-- Add expires_at to comparables_cache
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comparables_cache' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE comparables_cache 
    ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    
    -- Set expires_at to 7 days from created_at for existing records
    UPDATE comparables_cache 
    SET expires_at = created_at + INTERVAL '7 days'
    WHERE expires_at IS NULL;
    
    -- Create index for efficient cleanup queries
    CREATE INDEX IF NOT EXISTS idx_comparables_cache_expires_at 
    ON comparables_cache(expires_at);
    
    COMMENT ON COLUMN comparables_cache.expires_at IS 'Cache expiration timestamp. Records older than this should be considered stale.';
  END IF;
END $$;

-- Function to clean up expired cache entries (optional - can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS TABLE(deleted_comps_history BIGINT, deleted_comparables_cache BIGINT) AS $$
DECLARE
  deleted_history BIGINT;
  deleted_cache BIGINT;
BEGIN
  -- Delete expired comps_analysis_history entries
  DELETE FROM public.comps_analysis_history 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  GET DIAGNOSTICS deleted_history = ROW_COUNT;
  
  -- Delete expired comparables_cache entries
  DELETE FROM comparables_cache 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  GET DIAGNOSTICS deleted_cache = ROW_COUNT;
  
  RETURN QUERY SELECT deleted_history, deleted_cache;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_cache() IS 'Cleans up expired cache entries from both comps_analysis_history and comparables_cache tables';

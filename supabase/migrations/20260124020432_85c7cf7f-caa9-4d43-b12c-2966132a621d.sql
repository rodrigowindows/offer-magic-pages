-- 1. Adicionar colunas de coordenadas na tabela properties (se não existirem)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE properties ADD COLUMN latitude NUMERIC(10, 6);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE properties ADD COLUMN longitude NUMERIC(10, 6);
  END IF;
END $$;

-- 2. Criar tabela de cache de comparables (se não existir)
CREATE TABLE IF NOT EXISTS comparables_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS on comparables_cache
ALTER TABLE comparables_cache ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for comparables_cache
CREATE POLICY "Authenticated users can view cache" 
ON comparables_cache FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert cache" 
ON comparables_cache FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update cache" 
ON comparables_cache FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete cache" 
ON comparables_cache FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- 5. Criar índice para busca rápida por cache_key
CREATE INDEX IF NOT EXISTS idx_comparables_cache_key ON comparables_cache(cache_key);

-- 6. Criar índice para limpeza por data
CREATE INDEX IF NOT EXISTS idx_comparables_cache_created_at ON comparables_cache(created_at);

-- 7. Criar índices na tabela properties para busca por coordenadas
CREATE INDEX IF NOT EXISTS idx_properties_latitude ON properties(latitude);
CREATE INDEX IF NOT EXISTS idx_properties_longitude ON properties(longitude);
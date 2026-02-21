-- Execute este SQL no Supabase Dashboard > SQL Editor
-- Isso adiciona as colunas de latitude/longitude e a tabela de cache

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

-- 3. Criar índice para busca rápida por cache_key
CREATE INDEX IF NOT EXISTS idx_comparables_cache_key ON comparables_cache(cache_key);

-- 4. Criar índice para limpeza por data
CREATE INDEX IF NOT EXISTS idx_comparables_cache_created_at ON comparables_cache(created_at);

-- 5. Atualizar property "1025 S WASHINGTON AVE" com coordenadas de Orlando centro
UPDATE properties 
SET 
  latitude = 28.5383,
  longitude = -81.3792
WHERE address ILIKE '%1025 S WASHINGTON%'
  OR address ILIKE '%WASHINGTON AVE%';

-- 6. Verificar se foi atualizado
SELECT id, address, city, latitude, longitude 
FROM properties 
WHERE latitude IS NOT NULL
LIMIT 10;

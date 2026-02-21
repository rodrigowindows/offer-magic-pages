-- ========================================
-- TESTES DE VALIDAÇÃO DO SUPABASE COMPS
-- ========================================

-- 1. Verificar estrutura da tabela properties
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'properties'
  AND column_name IN ('id', 'address', 'city', 'state', 'latitude', 'longitude', 'estimated_value')
ORDER BY ordinal_position;

-- 2. Verificar properties que TÊM coordenadas
SELECT
  id,
  address,
  city,
  state,
  zip_code,
  latitude,
  longitude,
  estimated_value,
  created_at
FROM properties
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar properties SEM coordenadas (precisam ser preenchidas)
SELECT
  id,
  address,
  city,
  state,
  zip_code,
  estimated_value,
  created_at
FROM properties
WHERE latitude IS NULL
  OR longitude IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar estrutura da tabela comparables_cache
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'comparables_cache'
ORDER BY ordinal_position;

-- 5. Verificar comps salvos no cache
SELECT
  id,
  property_id,
  address,
  city,
  state,
  sale_price,
  sale_date,
  latitude,
  longitude,
  distance,
  data_source,
  quality_score,
  created_at
FROM comparables_cache
ORDER BY created_at DESC
LIMIT 20;

-- 6. Estatísticas de comps por property
SELECT
  p.address AS property_address,
  p.city AS property_city,
  COUNT(c.id) AS total_comps,
  AVG(c.distance) AS avg_distance,
  MIN(c.distance) AS min_distance,
  MAX(c.distance) AS max_distance,
  c.data_source,
  MAX(c.created_at) AS last_cached
FROM properties p
LEFT JOIN comparables_cache c ON p.id = c.property_id
WHERE c.id IS NOT NULL
GROUP BY p.address, p.city, c.data_source
ORDER BY last_cached DESC
LIMIT 10;

-- 7. Validar coordenadas dos comps (devem estar perto do subject)
SELECT
  p.address AS property_address,
  p.latitude AS property_lat,
  p.longitude AS property_lng,
  c.address AS comp_address,
  c.latitude AS comp_lat,
  c.longitude AS comp_lng,
  c.distance AS stored_distance,
  -- Calcular distância em graus (aproximada)
  ABS(c.latitude - p.latitude) AS lat_diff,
  ABS(c.longitude - p.longitude) AS lng_diff,
  -- Validar se está dentro de ~50 miles (0.7 graus)
  CASE
    WHEN ABS(c.latitude - p.latitude) < 0.7
     AND ABS(c.longitude - p.longitude) < 0.7
    THEN '✅ VÁLIDO'
    ELSE '❌ MUITO LONGE'
  END AS validation
FROM properties p
INNER JOIN comparables_cache c ON p.id = c.property_id
WHERE p.latitude IS NOT NULL
  AND p.longitude IS NOT NULL
  AND c.latitude IS NOT NULL
  AND c.longitude IS NOT NULL
ORDER BY p.created_at DESC, c.distance ASC
LIMIT 30;

-- 8. Verificar comps sem coordenadas (problema!)
SELECT
  p.address AS property_address,
  c.address AS comp_address,
  c.city,
  c.state,
  c.sale_price,
  c.latitude,
  c.longitude,
  c.data_source,
  c.created_at
FROM properties p
INNER JOIN comparables_cache c ON p.id = c.property_id
WHERE c.latitude IS NULL
  OR c.longitude IS NULL
ORDER BY c.created_at DESC
LIMIT 10;

-- 9. Análise por data source
SELECT
  data_source,
  COUNT(*) AS total_comps,
  AVG(distance) AS avg_distance,
  MIN(distance) AS min_distance,
  MAX(distance) AS max_distance,
  COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) AS with_coords,
  COUNT(CASE WHEN latitude IS NULL THEN 1 END) AS without_coords
FROM comparables_cache
GROUP BY data_source
ORDER BY total_comps DESC;

-- 10. Properties mais recentes com seus comps
SELECT
  p.id,
  p.address,
  p.city,
  p.state,
  p.latitude AS prop_lat,
  p.longitude AS prop_lng,
  COUNT(c.id) AS total_comps,
  MIN(c.created_at) AS first_comp_cached,
  MAX(c.created_at) AS last_comp_cached
FROM properties p
LEFT JOIN comparables_cache c ON p.id = c.property_id
GROUP BY p.id, p.address, p.city, p.state, p.latitude, p.longitude
ORDER BY p.created_at DESC
LIMIT 20;

-- 11. Verificar índices criados
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('properties', 'comparables_cache')
  AND (indexdef LIKE '%latitude%' OR indexdef LIKE '%longitude%' OR indexdef LIKE '%property_id%')
ORDER BY tablename, indexname;

-- 12. Validação de integridade - Comps órfãos (sem property)
SELECT
  c.id,
  c.property_id,
  c.address,
  c.city,
  c.created_at
FROM comparables_cache c
LEFT JOIN properties p ON c.property_id = p.id
WHERE p.id IS NULL
LIMIT 10;

-- 13. Top 5 properties com mais comps
SELECT
  p.address,
  p.city,
  p.state,
  COUNT(c.id) AS total_comps,
  STRING_AGG(DISTINCT c.data_source, ', ') AS data_sources,
  AVG(c.distance)::DECIMAL(5,2) AS avg_distance_miles
FROM properties p
INNER JOIN comparables_cache c ON p.id = c.property_id
GROUP BY p.address, p.city, p.state
ORDER BY total_comps DESC
LIMIT 5;

-- 14. Verificar se há coordenadas duplicadas (possível problema)
SELECT
  latitude,
  longitude,
  COUNT(*) AS duplicates,
  STRING_AGG(address, ' | ') AS addresses
FROM comparables_cache
WHERE latitude IS NOT NULL
GROUP BY latitude, longitude
HAVING COUNT(*) > 5
ORDER BY duplicates DESC
LIMIT 10;

-- 15. Análise temporal - Quando os comps foram gerados
SELECT
  DATE(created_at) AS date,
  COUNT(*) AS total_comps,
  COUNT(DISTINCT property_id) AS unique_properties,
  STRING_AGG(DISTINCT data_source, ', ') AS sources
FROM comparables_cache
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 10;

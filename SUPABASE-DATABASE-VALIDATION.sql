-- 🔍 SUPABASE DATABASE VALIDATION QUERIES
-- Run these queries in Supabase SQL Editor to validate comps data quality
-- Date: January 25, 2026

-- ============================================================================
-- 1. ESTIMATED_VALUE DISTRIBUTION CHECK
-- ============================================================================
-- Expected: Should have VARIETY of values (not all $100,000)
-- If all identical → BUG: Hardcoded placeholder

SELECT
  estimated_value,
  COUNT(*) as property_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM properties
WHERE estimated_value IS NOT NULL
GROUP BY estimated_value
ORDER BY property_count DESC
LIMIT 20;

-- Expected Result:
-- ✅ Multiple different values
-- ❌ One value (100000) with 100% → PROBLEM!


-- ============================================================================
-- 2. FIND PROBLEM PROPERTY #1 (25217 MATHEW ST)
-- ============================================================================
-- This property has ALL comps with distance = 0.0

SELECT
  id,
  address,
  city,
  state,
  zip_code,
  estimated_value,
  cash_offer_amount,
  latitude,
  longitude,
  created_at
FROM properties
WHERE address LIKE '%25217 MATHEW%'
   OR address LIKE '%MATHEW ST%';

-- Action: DELETE this property and re-add to regenerate with correct distances


-- ============================================================================
-- 3. CHECK COMPARABLES_CACHE - DISTANCE = 0 PROBLEM
-- ============================================================================
-- Find properties where ALL comps have distance = 0

SELECT
  property_id,
  COUNT(*) as total_comps,
  SUM(CASE WHEN distance = 0 OR distance IS NULL THEN 1 ELSE 0 END) as zero_distance_count,
  AVG(distance) as avg_distance,
  MIN(distance) as min_distance,
  MAX(distance) as max_distance
FROM comparables_cache
GROUP BY property_id
HAVING AVG(distance) = 0 OR AVG(distance) IS NULL
ORDER BY total_comps DESC;

-- Expected Result:
-- ❌ Properties with avg_distance = 0 need regeneration


-- ============================================================================
-- 4. VERIFY COORDINATES ARE PRESENT BUT DISTANCE = 0
-- ============================================================================
-- This shows comps that HAVE coordinates but distance wasn't calculated

SELECT
  c.property_id,
  c.address,
  c.distance,
  c.latitude,
  c.longitude,
  c.source,
  p.address as property_address,
  p.latitude as property_lat,
  p.longitude as property_lng
FROM comparables_cache c
JOIN properties p ON c.property_id = p.id
WHERE c.distance = 0
  AND c.latitude IS NOT NULL
  AND c.longitude IS NOT NULL
  AND p.latitude IS NOT NULL
  AND p.longitude IS NOT NULL
LIMIT 30;

-- Expected Result:
-- ❌ These comps SHOULD have distance calculated (they have coords!)
-- Root Cause: Edge function didn't calculate distance


-- ============================================================================
-- 5. CHECK DATA SOURCE DISTRIBUTION
-- ============================================================================
-- Verify if using real API data or demo/fallback data

SELECT
  source,
  COUNT(*) as comp_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM comparables_cache
GROUP BY source
ORDER BY comp_count DESC;

-- Expected Result:
-- ✅ attom, zillow, county-csv = Real data
-- ⚠️  demo = Fallback data (should be minority)
-- ❌ demo > 50% = API keys not configured or failing


-- ============================================================================
-- 6. PROPERTIES WITH VALID DISTANCES (WORKING CORRECTLY)
-- ============================================================================
-- Show properties where distance calculation IS working

SELECT
  property_id,
  COUNT(*) as total_comps,
  AVG(distance) as avg_distance,
  MIN(distance) as min_distance,
  MAX(distance) as max_distance
FROM comparables_cache
WHERE distance > 0
GROUP BY property_id
HAVING AVG(distance) > 0
ORDER BY avg_distance ASC
LIMIT 20;

-- Expected Result:
-- ✅ avg_distance: 0.5 - 1.5 miles (good clustering)
-- ✅ max_distance: < 3.0 miles (within search radius)


-- ============================================================================
-- 7. RECENT COMPS ANALYSIS
-- ============================================================================
-- Check if recent comps are being saved with distances

SELECT
  c.property_id,
  c.address,
  c.sale_price,
  c.sale_date,
  c.distance,
  c.source,
  c.created_at
FROM comparables_cache c
WHERE c.created_at > NOW() - INTERVAL '7 days'
ORDER BY c.created_at DESC
LIMIT 50;

-- Expected Result:
-- ✅ Recent comps (last 7 days) should have distance > 0
-- ❌ Recent comps with distance = 0 → Fix not deployed yet


-- ============================================================================
-- 8. PRICE ANALYSIS - DETECT OUTLIERS
-- ============================================================================
-- Find comps with unusual price/sqft (possible bad data)

SELECT
  address,
  sale_price,
  sqft,
  ROUND(sale_price::numeric / NULLIF(sqft, 0), 2) as price_per_sqft,
  distance,
  source
FROM comparables_cache
WHERE sqft > 0
  AND (
    (sale_price::numeric / NULLIF(sqft, 0)) < 30 OR  -- Too cheap
    (sale_price::numeric / NULLIF(sqft, 0)) > 150    -- Too expensive
  )
ORDER BY price_per_sqft DESC
LIMIT 30;

-- Expected Result:
-- ⚠️  Few outliers are normal (foreclosures, luxury, etc.)
-- ❌ Many outliers = Bad data quality


-- ============================================================================
-- 9. GENERIC STREET NAME DETECTION (DEMO DATA)
-- ============================================================================
-- Find comps with generic street names (indicates demo/fallback data)

SELECT
  address,
  COUNT(*) as count
FROM comparables_cache
WHERE
  address LIKE '%Park Ave%' OR
  address LIKE '%Main St%' OR
  address LIKE '%Oak St%' OR
  address LIKE '%Pine Ave%' OR
  address LIKE '%Colonial Dr%' OR
  address LIKE '%Maple Dr%' OR
  address LIKE '%Cedar Ln%' OR
  address LIKE '%Palm Way%' OR
  address LIKE '%Sunset Blvd%' OR
  address LIKE '%Lake View Dr%'
GROUP BY address
ORDER BY count DESC
LIMIT 50;

-- Expected Result:
-- 🟡 Some generic names are OK (real streets exist)
-- ❌ HIGH count of generic names = Using demo data


-- ============================================================================
-- 10. PROPERTIES NEEDING REGENERATION
-- ============================================================================
-- Final query: Which properties need to be deleted and re-added?

SELECT
  p.id,
  p.address,
  p.city,
  p.zip_code,
  p.estimated_value,
  COUNT(c.id) as comp_count,
  SUM(CASE WHEN c.distance = 0 THEN 1 ELSE 0 END) as zero_dist_count,
  AVG(c.distance) as avg_distance
FROM properties p
LEFT JOIN comparables_cache c ON p.id = c.property_id
GROUP BY p.id, p.address, p.city, p.zip_code, p.estimated_value
HAVING
  AVG(c.distance) = 0 OR  -- All comps have 0 distance
  SUM(CASE WHEN c.distance = 0 THEN 1 ELSE 0 END) >= 4  -- Most comps have 0 distance
ORDER BY zero_dist_count DESC;

-- Expected Result:
-- ❌ Properties in this list → DELETE and regenerate
-- Action: Delete from UI, then re-add with same address


-- ============================================================================
-- 11. CHECK IF SCHEMA HAS DEFAULT VALUE FOR ESTIMATED_VALUE
-- ============================================================================
-- Verify if estimated_value column has a default of 100000

SELECT
  column_name,
  column_default,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'properties'
  AND column_name = 'estimated_value';

-- Expected Result:
-- ✅ column_default = NULL (no hardcoded default)
-- ❌ column_default = 100000 → REMOVE DEFAULT!


-- ============================================================================
-- 12. FINAL HEALTH CHECK SUMMARY
-- ============================================================================
-- Overall database health metrics

SELECT
  'Total Properties' as metric,
  COUNT(*) as value
FROM properties

UNION ALL

SELECT
  'Properties with $100K estimated_value',
  COUNT(*)
FROM properties
WHERE estimated_value = 100000

UNION ALL

SELECT
  'Total Comps',
  COUNT(*)
FROM comparables_cache

UNION ALL

SELECT
  'Comps with distance = 0',
  COUNT(*)
FROM comparables_cache
WHERE distance = 0 OR distance IS NULL

UNION ALL

SELECT
  'Comps with distance > 0',
  COUNT(*)
FROM comparables_cache
WHERE distance > 0

UNION ALL

SELECT
  'Demo comps',
  COUNT(*)
FROM comparables_cache
WHERE source = 'demo'

UNION ALL

SELECT
  'Real API comps',
  COUNT(*)
FROM comparables_cache
WHERE source IN ('attom', 'zillow', 'county-csv', 'county');

-- Expected Result:
-- Use this summary to calculate Data Health Score


-- ============================================================================
-- CLEANUP QUERIES (RUN AFTER VALIDATION)
-- ============================================================================

-- DELETE property #1 that has all zero distances
-- (Uncomment to execute - BE CAREFUL!)
-- DELETE FROM properties WHERE address LIKE '%25217 MATHEW%';

-- Clear comparables cache for specific property
-- (Uncomment to execute)
-- DELETE FROM comparables_cache WHERE property_id = ?;

-- Remove ALL comps with distance = 0 (DRASTIC - use with caution)
-- (Uncomment to execute)
-- DELETE FROM comparables_cache WHERE distance = 0 OR distance IS NULL;


-- ============================================================================
-- END OF VALIDATION QUERIES
-- ============================================================================

-- Next Steps:
-- 1. Run queries above in Supabase SQL Editor
-- 2. Identify properties with bad data
-- 3. Delete problematic properties
-- 4. Deploy edge function fixes
-- 5. Re-add properties to regenerate with correct data
-- 6. Verify estimated_value calculation is implemented

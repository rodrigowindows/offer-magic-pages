#!/bin/bash

# 🔍 Supabase API Validation Script
# Validates comps data quality directly from Supabase database

SUPABASE_URL="https://atwdkhlyrffbaugkaker.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WJzxLQKNl-R0QGy68F6wgtXs"

echo "🔍 SUPABASE DATABASE VALIDATION"
echo "================================"
echo ""

# Test 1: Check estimated_value distribution
echo "📊 Test 1: Estimated Value Distribution"
echo "----------------------------------------"
curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -d '{
    "query": "SELECT estimated_value, COUNT(*) as count FROM properties WHERE estimated_value IS NOT NULL GROUP BY estimated_value ORDER BY count DESC LIMIT 10"
  }' | jq '.'

echo ""
echo ""

# Test 2: Get properties with comps
echo "🏠 Test 2: Properties Sample"
echo "----------------------------"
curl -s -G "${SUPABASE_URL}/rest/v1/properties" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "apikey: ${SUPABASE_KEY}" \
  --data-urlencode "select=id,address,city,zip_code,estimated_value,latitude,longitude" \
  --data-urlencode "limit=5" | jq '.'

echo ""
echo ""

# Test 3: Check comparables_cache
echo "📍 Test 3: Comparables Cache Analysis"
echo "--------------------------------------"
curl -s -G "${SUPABASE_URL}/rest/v1/comparables_cache" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "apikey: ${SUPABASE_KEY}" \
  --data-urlencode "select=address,distance,source,sale_price,latitude,longitude" \
  --data-urlencode "limit=10" | jq '.'

echo ""
echo ""

# Test 4: Count by source
echo "🔍 Test 4: Data Source Distribution"
echo "------------------------------------"
echo "Getting sample of sources..."
curl -s -G "${SUPABASE_URL}/rest/v1/comparables_cache" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "apikey: ${SUPABASE_KEY}" \
  --data-urlencode "select=source" \
  --data-urlencode "limit=100" | jq '[.[].source] | group_by(.) | map({source: .[0], count: length}) | sort_by(.count) | reverse'

echo ""
echo ""

# Test 5: Find properties with distance = 0
echo "❌ Test 5: Comps with Distance = 0"
echo "-----------------------------------"
curl -s -G "${SUPABASE_URL}/rest/v1/comparables_cache" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "apikey: ${SUPABASE_KEY}" \
  --data-urlencode "select=property_id,address,distance,latitude,longitude" \
  --data-urlencode "distance=eq.0" \
  --data-urlencode "limit=10" | jq '.'

echo ""
echo ""

# Test 6: Properties created recently
echo "🆕 Test 6: Recent Properties"
echo "----------------------------"
curl -s -G "${SUPABASE_URL}/rest/v1/properties" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "apikey: ${SUPABASE_KEY}" \
  --data-urlencode "select=id,address,estimated_value,created_at" \
  --data-urlencode "order=created_at.desc" \
  --data-urlencode "limit=5" | jq '.'

echo ""
echo ""

echo "✅ Validation Complete"
echo "======================"
echo ""
echo "Check results above for:"
echo "1. Are all estimated_value = 100000? → PROBLEM"
echo "2. Do comps have valid distances? → Check distance field"
echo "3. What is the source? → Should be 'attom', 'zillow', not 'demo'"
echo "4. Are coordinates present? → latitude/longitude should exist"

#!/bin/bash

# Test Comps API - Production Data Validation
# Verifica se os dados retornados são de PRODUÇÃO (não demo)
# Usage: ./test-comps-production.sh

SUPABASE_URL="https://atwdkhlyrffbaugkaker.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyODUzODcsImV4cCI6MjA0OTg2MTM4N30.yMSiS4bnkjKQe9_YXAuAOLaZcHs8xpBmS2-qhkBw-Aw"

echo "🏠 Testing Comps API - Production Data Validation"
echo "⚠️  IMPORTANTE: Este teste verifica se os dados são REAIS (não demo)"
echo ""

# Test 1: Endereço Real Testado (25217 Mathew St)
echo "============================================================"
echo "📍 Test 1: Endereço Real (25217 Mathew St, Orlando, FL)"
echo "============================================================"
echo ""

RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/fetch-comps" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d '{
    "address": "25217 Mathew St",
    "city": "Orlando",
    "state": "FL",
    "basePrice": 250000,
    "radius": 3,
    "zipCode": "32833"
  }')

echo "📥 Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Extrair valores importantes
IS_DEMO=$(echo "$RESPONSE" | jq -r '.isDemo // "unknown"' 2>/dev/null)
SOURCE=$(echo "$RESPONSE" | jq -r '.source // "unknown"' 2>/dev/null)
ATTOM_CONFIGURED=$(echo "$RESPONSE" | jq -r '.apiKeysConfigured.attom // false' 2>/dev/null)
COMP_COUNT=$(echo "$RESPONSE" | jq -r '.count // 0' 2>/dev/null)

echo "============================================================"
echo "🔍 VALIDAÇÃO DE DADOS DE PRODUÇÃO"
echo "============================================================"
echo ""

# Validar isDemo
if [ "$IS_DEMO" = "true" ]; then
  echo "❌ isDemo: true - Usando dados DEMO (não produção)"
  DEMO_ISSUE=true
elif [ "$IS_DEMO" = "false" ]; then
  echo "✅ isDemo: false - Dados de produção"
else
  echo "⚠️  isDemo: $IS_DEMO - Valor desconhecido"
fi

# Validar source
if [ "$SOURCE" = "demo" ]; then
  echo "❌ source: \"demo\" - Dados simulados"
  DEMO_ISSUE=true
elif [[ "$SOURCE" =~ ^(attom-v2|attom-v1|attom|zillow-api|county-csv)$ ]]; then
  echo "✅ source: \"$SOURCE\" - Fonte de dados real"
else
  echo "⚠️  source: \"$SOURCE\" - Fonte desconhecida"
fi

# Validar API key
if [ "$ATTOM_CONFIGURED" = "true" ]; then
  echo "✅ ATTOM_API_KEY configurada"
else
  echo "❌ ATTOM_API_KEY não configurada no Supabase"
  DEMO_ISSUE=true
fi

echo ""
echo "📊 Resumo:"
echo "   Comparables encontrados: $COMP_COUNT"
echo "   Source: $SOURCE"
echo "   isDemo: $IS_DEMO"
echo "   ATTOM Key: $ATTOM_CONFIGURED"
echo ""

if [ "$DEMO_ISSUE" = "true" ]; then
  echo "⚠️  ATENÇÃO: Dados NÃO são de produção!"
  echo "   Configure ATTOM_API_KEY no Supabase para obter dados reais."
  echo "   Comando: npx supabase secrets set ATTOM_API_KEY=SUA_KEY --project-ref atwdkhlyrffbaugkaker"
  echo ""
  exit 1
else
  echo "✅ DADOS DE PRODUÇÃO CONFIRMADOS!"
  echo ""
  exit 0
fi

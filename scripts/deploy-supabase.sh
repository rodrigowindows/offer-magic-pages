#!/bin/bash

# ============================================
# 🚀 Deploy Supabase Edge Functions
# Script para fazer deploy de todas as edge functions
# ============================================

set -e  # Exit on error

echo "============================================"
echo "🚀 Supabase Edge Functions Deployment"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found!${NC}"
    echo "Install it: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# List of edge functions to deploy
FUNCTIONS=(
    "track-link-click"
    "track-button-click"
    "track-email-open"
    "get-skip-trace-data"
)

# Deploy each function
echo -e "${BLUE}📦 Deploying Edge Functions...${NC}"
echo ""

for func in "${FUNCTIONS[@]}"; do
    echo -e "${YELLOW}Deploying: $func${NC}"

    if supabase functions deploy "$func"; then
        echo -e "${GREEN}✅ $func deployed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to deploy $func${NC}"
        exit 1
    fi

    echo ""
done

echo ""
echo "============================================"
echo -e "${GREEN}✅ All Edge Functions Deployed!${NC}"
echo "============================================"
echo ""

# Show deployed functions
echo -e "${BLUE}📋 Deployed Functions:${NC}"
supabase functions list

echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "  - View logs: supabase functions logs <function-name> --follow"
echo "  - Test function: supabase functions serve <function-name>"
echo ""

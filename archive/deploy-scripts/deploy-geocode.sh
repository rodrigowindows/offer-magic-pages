#!/bin/bash

echo "========================================"
echo "  Deploy Geocode Edge Function"
echo "========================================"
echo ""

cd "$(dirname "$0")"

echo "[1/3] Verificando login no Supabase..."
npx supabase login
if [ $? -ne 0 ]; then
    echo ""
    echo "ERRO: Não foi possível fazer login no Supabase"
    echo "Por favor, execute: npx supabase login"
    exit 1
fi

echo ""
echo "[2/3] Deploy da edge function 'geocode'..."
npx supabase functions deploy geocode
if [ $? -ne 0 ]; then
    echo ""
    echo "ERRO: Falha ao fazer deploy da função"
    exit 1
fi

echo ""
echo "[3/3] Configurando Google Maps API Key..."
echo ""
echo "IMPORTANTE: A API key precisa ter:"
echo "  - Geocoding API habilitada"
echo "  - Billing ativado no Google Cloud"
echo ""
read -p "Deseja configurar a API key agora? (s/n): " CONTINUE
if [[ "$CONTINUE" == "s" ]] || [[ "$CONTINUE" == "S" ]]; then
    npx supabase secrets set GOOGLE_MAPS_API_KEY=AIzaSyDWr6TkYH9wh46YXzmoMjQVJ8_pVtqYytQ
    echo ""
    echo "Secrets configurado!"
else
    echo ""
    echo "OK. Você pode configurar depois com:"
    echo "npx supabase secrets set GOOGLE_MAPS_API_KEY=sua_key_aqui"
fi

echo ""
echo "========================================"
echo "  Deploy Concluído!"
echo "========================================"
echo ""
echo "Próximos passos:"
echo "1. Verifique os logs: npx supabase functions logs geocode"
echo "2. Teste no Comps Analysis"
echo "3. Verifique que não há mais erros 503 ou REQUEST_DENIED"
echo ""

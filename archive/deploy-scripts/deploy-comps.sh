#!/bin/bash
# Script de deploy da funcao fetch-comps para Supabase
# Projeto: atwdkhlyrffbaugkaker

echo "============================================"
echo " Deploy da Edge Function fetch-comps"
echo "============================================"
echo ""

# Passo 1: Login (se necessario)
echo "[1/3] Verificando autenticacao..."
if ! npx supabase projects list &>/dev/null; then
    echo "Nao autenticado. Fazendo login..."
    npx supabase login
    if [ $? -ne 0 ]; then
        echo "ERRO: Falha no login"
        exit 1
    fi
else
    echo "Login OK!"
fi

echo ""
echo "[2/3] Configurando secret ATTOM_API_KEY..."
if [ -z "$ATTOM_API_KEY" ]; then
    echo "ERRO: ATTOM_API_KEY nao definido no ambiente."
    echo "Exemplo: export ATTOM_API_KEY=sua_chave"
    exit 1
fi

npx supabase secrets set ATTOM_API_KEY="$ATTOM_API_KEY" --project-ref atwdkhlyrffbaugkaker
if [ $? -ne 0 ]; then
    echo "AVISO: Falha ao configurar secret. Configure manualmente em:"
    echo "https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/settings/functions"
    echo ""
fi

echo ""
echo "[3/3] Fazendo deploy da funcao fetch-comps..."
npx supabase functions deploy fetch-comps --project-ref atwdkhlyrffbaugkaker
if [ $? -ne 0 ]; then
    echo "ERRO: Falha no deploy"
    exit 1
fi

echo ""
echo "============================================"
echo " Deploy concluido com sucesso!"
echo "============================================"
echo ""
echo "Proximos passos:"
echo "1. Teste a funcao no app"
echo "2. Verifique os logs em:"
echo "   https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/logs/edge-functions"
echo ""

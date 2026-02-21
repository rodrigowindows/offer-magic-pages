@echo off
echo ========================================
echo   Deploy Geocode Edge Function
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando login no Supabase...
npx supabase login
if %errorlevel% neq 0 (
    echo.
    echo ERRO: Nao foi possivel fazer login no Supabase
    echo Por favor, execute: npx supabase login
    pause
    exit /b 1
)

echo.
echo [2/3] Deploy da edge function 'geocode'...
npx supabase functions deploy geocode
if %errorlevel% neq 0 (
    echo.
    echo ERRO: Falha ao fazer deploy da funcao
    pause
    exit /b 1
)

echo.
echo [3/3] Configurando Google Maps API Key...
echo.
echo IMPORTANTE: A API key precisa ter:
echo   - Geocoding API habilitada
echo   - Billing ativado no Google Cloud
echo.
set /p CONTINUE="Deseja configurar a API key agora? (s/n): "
if /i "%CONTINUE%"=="s" (
    npx supabase secrets set GOOGLE_MAPS_API_KEY=AIzaSyDWr6TkYH9wh46YXzmoMjQVJ8_pVtqYytQ
    echo.
    echo Secrets configurado!
) else (
    echo.
    echo OK. Voce pode configurar depois com:
    echo npx supabase secrets set GOOGLE_MAPS_API_KEY=sua_key_aqui
)

echo.
echo ========================================
echo   Deploy Concluido!
echo ========================================
echo.
echo Proximos passos:
echo 1. Verifique os logs: npx supabase functions logs geocode
echo 2. Teste no Comps Analysis
echo 3. Verifique que nao ha mais erros 503 ou REQUEST_DENIED
echo.

pause

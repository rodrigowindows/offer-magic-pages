@echo off
REM Script de deploy da funcao fetch-comps para Supabase
REM Projeto: atwdkhlyrffbaugkaker

echo ============================================
echo  Deploy da Edge Function fetch-comps
echo ============================================
echo.

REM Passo 1: Login (se necessario)
echo [1/3] Verificando autenticacao...
npx supabase projects list >nul 2>&1
if errorlevel 1 (
    echo Nao autenticado. Fazendo login...
    npx supabase login
    if errorlevel 1 (
        echo ERRO: Falha no login
        pause
        exit /b 1
    )
) else (
    echo Login OK!
)

echo.
echo [2/3] Configurando secret ATTOM_API_KEY...
if "%ATTOM_API_KEY%"=="" (
    echo ERRO: ATTOM_API_KEY nao definido no ambiente.
    echo Exemplo: set ATTOM_API_KEY=sua_chave
    pause
    exit /b 1
)

npx supabase secrets set ATTOM_API_KEY=%ATTOM_API_KEY% --project-ref atwdkhlyrffbaugkaker
if errorlevel 1 (
    echo AVISO: Falha ao configurar secret. Configure manualmente em:
    echo https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/settings/functions
    echo.
)

echo.
echo [3/3] Fazendo deploy da funcao fetch-comps...
npx supabase functions deploy fetch-comps --project-ref atwdkhlyrffbaugkaker
if errorlevel 1 (
    echo ERRO: Falha no deploy
    pause
    exit /b 1
)

echo.
echo ============================================
echo  Deploy concluido com sucesso!
echo ============================================
echo.
echo Proximos passos:
echo 1. Teste a funcao no app
echo 2. Verifique os logs em:
echo    https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/logs/edge-functions
echo.
pause

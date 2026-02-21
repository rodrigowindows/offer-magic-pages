@echo off
REM ============================================
REM  Script Completo: Remover Lock + Commit + Push
REM ============================================
REM
REM IMPORTANTE: Feche o Cursor/IDE antes de executar!
REM

echo ============================================
echo  EXECUTAR TUDO: Lock + Commit + Push
echo ============================================
echo.
echo ⚠️  IMPORTANTE: Feche o Cursor/IDE antes de continuar!
echo.
pause

echo.
echo [1/5] Parando processos Git...
taskkill /F /IM git.exe /T >nul 2>&1
taskkill /F /IM git-credential-manager.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/5] Removendo lock files...
if exist .git\index.lock (
    del /F /Q .git\index.lock >nul 2>&1
    timeout /t 1 /nobreak >nul
)
if exist .git\config.lock (
    del /F /Q .git\config.lock >nul 2>&1
    timeout /t 1 /nobreak >nul
)

echo [3/5] Adicionando todos os arquivos...
git add -A
if errorlevel 1 (
    echo.
    echo ❌ ERRO: Falha ao adicionar arquivos
    echo.
    echo 💡 Solucao:
    echo    1. Feche o Cursor/IDE completamente
    echo    2. Execute este script novamente
    echo.
    pause
    exit /b 1
)

echo [4/5] Fazendo commit...
git commit -m "feat: Add hardcoded ATTOM API key and production testing scripts

- Add ATTOM_API_KEY hardcoded fallback in fetch-comps edge function
- Create comprehensive test scripts (Node.js, Bash, PowerShell)
- Add production data validation in test-comps-api.js
- Create documentation: VERIFICAR_PRODUCAO.md, RELATORIO_TESTES_COMPLETA.md
- Test scripts verify isDemo flag and source validation
- All scripts ready for production testing"
if errorlevel 1 (
    echo.
    echo ❌ ERRO: Falha no commit
    echo.
    echo 💡 Solucao:
    echo    1. Feche o Cursor/IDE completamente
    echo    2. Execute este script novamente
    echo.
    pause
    exit /b 1
)

echo [5/5] Fazendo push para GitHub...
git push origin main
if errorlevel 1 (
    echo.
    echo ⚠️  AVISO: Falha no push
    echo.
    echo Possiveis causas:
    echo    - Problema de conexao com GitHub
    echo    - Credenciais nao configuradas
    echo.
    echo Tente novamente mais tarde ou configure credenciais:
    echo   git config --global user.name "Seu Nome"
    echo   git config --global user.email "seu@email.com"
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo  ✅ SUCESSO! Commit e Push concluidos!
echo ============================================
echo.
echo Proximos passos:
echo   1. Fazer deploy da edge function no Supabase
echo   2. Testar: node test-comps-api.js
echo   3. Verificar logs no Supabase Dashboard
echo.
pause

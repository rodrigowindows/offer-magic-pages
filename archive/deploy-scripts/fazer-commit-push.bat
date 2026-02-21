@echo off
echo ============================================
echo  Commit e Push Automatico
echo ============================================
echo.

echo [1/4] Removendo lock file...
if exist .git\index.lock (
    del /F /Q .git\index.lock 2>nul
    timeout /t 1 /nobreak >nul
)

echo [2/4] Adicionando arquivos...
git add -A
if errorlevel 1 (
    echo ERRO: Falha ao adicionar arquivos
    echo Feche o Cursor/IDE e tente novamente
    pause
    exit /b 1
)

echo [3/4] Fazendo commit...
git commit -m "feat: Add hardcoded ATTOM API key and production testing scripts

- Add ATTOM_API_KEY hardcoded fallback in fetch-comps edge function
- Create comprehensive test scripts (Node.js, Bash, PowerShell)
- Add production data validation in test-comps-api.js
- Create documentation: VERIFICAR_PRODUCAO.md, RELATORIO_TESTES_COMPLETA.md
- Test scripts verify isDemo flag and source validation
- All scripts ready for production testing"
if errorlevel 1 (
    echo ERRO: Falha no commit
    echo Feche o Cursor/IDE e tente novamente
    pause
    exit /b 1
)

echo [4/4] Fazendo push...
git push origin main
if errorlevel 1 (
    echo AVISO: Falha no push (pode ser problema de conexao)
    echo Tente novamente mais tarde ou verifique sua conexao
    pause
    exit /b 1
)

echo.
echo ============================================
echo  ✅ Commit e Push concluidos com sucesso!
echo ============================================
echo.
pause

@echo off
echo ================================
echo   Deploy para Lovable/GitHub
echo ================================
echo.

REM Verificar se está em um repositório git
git rev-parse --git-dir > nul 2>&1
if errorlevel 1 (
    echo ERRO: Este diretorio nao e um repositorio Git!
    echo Execute primeiro: git init
    pause
    exit /b 1
)

echo [1/5] Verificando status do Git...
git status
echo.

echo [2/5] Adicionando arquivos novos...
git add .
echo.

echo [3/5] Criando commit...
set /p COMMIT_MSG="Digite a mensagem do commit (ou Enter para mensagem padrao): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=chore: Update files for deployment

git commit -m "%COMMIT_MSG%"
echo.

echo [4/5] Verificando branch...
git branch -M master
echo.

echo [5/5] Fazendo push para GitHub...
git push -u origin master
echo.

if errorlevel 1 (
    echo.
    echo ========================================
    echo   ERRO ao fazer push!
    echo ========================================
    echo.
    echo Possiveis causas:
    echo 1. Remote 'origin' nao configurado
    echo 2. Sem permissao para push
    echo 3. Conflitos no repositorio
    echo.
    echo Para configurar remote:
    echo   git remote add origin https://github.com/SEU-USER/SEU-REPO.git
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Deploy completo!
echo ========================================
echo.
echo Codigo foi enviado para GitHub.
echo Lovable ira detectar e fazer deploy automaticamente.
echo.
echo Proximos passos:
echo 1. Acessar https://lovable.dev
echo 2. Verificar status do build
echo 3. Configurar env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
echo 4. Testar deploy em https://seu-projeto.lovable.app
echo.
pause

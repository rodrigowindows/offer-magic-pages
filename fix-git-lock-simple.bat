@echo off
echo ============================================
echo  Removendo Git Lock File
echo ============================================
echo.

echo [1/3] Fechando processos Git...
taskkill /F /IM git.exe /T >nul 2>&1
taskkill /F /IM git-credential-manager.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Removendo lock file...
if exist .git\index.lock (
    del /F /Q .git\index.lock
    if errorlevel 1 (
        echo ERRO: Nao foi possivel remover o lock file
        echo Tente fechar o Cursor/IDE e executar novamente
        pause
        exit /b 1
    ) else (
        echo OK: Lock file removido!
    )
) else (
    echo OK: Lock file nao existe
)

echo [3/3] Verificando...
if exist .git\index.lock (
    echo ERRO: Lock file ainda existe!
    pause
    exit /b 1
) else (
    echo OK: Lock file removido com sucesso!
)

echo.
echo ============================================
echo  Pronto! Agora voce pode fazer:
echo  git add .
echo  git commit -m "sua mensagem"
echo  git push
echo ============================================
echo.
pause

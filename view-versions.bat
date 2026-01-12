@echo off
:: Script BAT para Visualizar Versões do CampaignWizard.tsx
:: Execute: view-versions.bat

cd "Step 5 - Outreach & Campaigns"

:menu
cls
echo =========================================
echo   VISUALIZADOR DE VERSOES
echo   CampaignWizard.tsx
echo =========================================
echo.
echo Versoes disponiveis:
echo.
echo 1. Versao ATUAL (2026-01-11)
echo    Commit: fedd9ef
echo    - Usa tags para preferred contacts
echo    - Preview lateral de propriedades
echo.
echo 2. Versao 08/Jan - RECOMENDADA (Sistema de Garantias)
echo    Commit: 435bb94
echo    - Codigo mais limpo
echo    - Sistema de garantias de envio
echo.
echo 3. Versao 08/Jan - UI Moderna
echo    Commit: 45f168a
echo    - Interface aprimorada
echo.
echo 4. Versao 08/Jan - QR Codes ^& Tracking
echo    Commit: 98875d1
echo    - QR codes nos templates
echo    - Sistema de tracking
echo.
echo 5. Ver TODAS as versoes (ultimos 30 dias)
echo.
echo 6. Ver DIFERENCAS entre duas versoes
echo.
echo 0. Sair
echo.
echo =========================================
echo.

set /p choice="Escolha uma opcao (0-6): "

if "%choice%"=="1" goto atual
if "%choice%"=="2" goto garantias
if "%choice%"=="3" goto ui-moderna
if "%choice%"=="4" goto qr-codes
if "%choice%"=="5" goto todas
if "%choice%"=="6" goto diff
if "%choice%"=="0" goto exit
goto menu

:atual
echo.
echo Versao ATUAL (fedd9ef):
echo Salvando em: version-atual.txt
git show HEAD:src/components/marketing/CampaignWizard.tsx > ..\version-atual.txt
start notepad ..\version-atual.txt
goto restore

:garantias
echo.
echo Versao 08/Jan - Sistema de Garantias (435bb94):
echo Salvando em: version-garantias.txt
git show 435bb94:src/components/marketing/CampaignWizard.tsx > ..\version-garantias.txt
start notepad ..\version-garantias.txt
goto restore

:ui-moderna
echo.
echo Versao 08/Jan - UI Moderna (45f168a):
echo Salvando em: version-ui-moderna.txt
git show 45f168a:src/components/marketing/CampaignWizard.tsx > ..\version-ui-moderna.txt
start notepad ..\version-ui-moderna.txt
goto restore

:qr-codes
echo.
echo Versao 08/Jan - QR Codes (98875d1):
echo Salvando em: version-qr-codes.txt
git show 98875d1:src/components/marketing/CampaignWizard.tsx > ..\version-qr-codes.txt
start notepad ..\version-qr-codes.txt
goto restore

:todas
echo.
echo Todas as versoes dos ultimos 30 dias:
echo.
git log --since="30 days ago" --pretty=format:"%%h | %%ad | %%s" --date=short -- src/components/marketing/CampaignWizard.tsx
echo.
echo.
set /p commit="Digite o hash do commit para visualizar (ex: fedd9ef): "
if "%commit%"=="" goto menu
echo.
echo Visualizando commit %commit%...
git show %commit%:src/components/marketing/CampaignWizard.tsx > ..\version-%commit%.txt
start notepad ..\version-%commit%.txt
goto restore

:diff
echo.
echo Comparar versoes
echo.
echo Versoes disponiveis:
echo   atual    - Versao atual
echo   435bb94  - Sistema de Garantias
echo   45f168a  - UI Moderna
echo   98875d1  - QR Codes
echo.
set /p v1="Primeira versao (ex: 435bb94): "
set /p v2="Segunda versao (ex: atual ou HEAD): "

if "%v2%"=="atual" set v2=HEAD

echo.
echo Diferencas entre %v1% e %v2%:
echo Salvando em: diff-%v1%-vs-%v2%.txt
git diff %v1% %v2% -- src/components/marketing/CampaignWizard.tsx > ..\diff-%v1%-vs-%v2%.txt
start notepad ..\diff-%v1%-vs-%v2%.txt
goto restore

:restore
echo.
echo =========================================
echo.
set /p restore="Deseja RESTAURAR alguma versao? Digite o commit (ou Enter para cancelar): "

if "%restore%"=="" goto menu

echo.
echo CONFIRMACAO:
echo Voce vai RESTAURAR o arquivo para a versao: %restore%
set /p confirm="Tem certeza? (S/N): "

if /i "%confirm%"=="S" (
    git checkout %restore% -- src/components/marketing/CampaignWizard.tsx
    echo.
    echo Arquivo restaurado para versao %restore%!
    echo Nao esqueca de fazer commit das mudancas!
    echo.
    pause
) else (
    echo.
    echo Restauracao cancelada.
    echo.
    pause
)
goto menu

:exit
echo.
echo Saindo...
echo.
cd ..
exit /b

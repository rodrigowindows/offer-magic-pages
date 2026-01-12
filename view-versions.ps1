# Script PowerShell para Visualizar Versões do CampaignWizard.tsx
# Execute: .\view-versions.ps1

$repo = "Step 5 - Outreach & Campaigns"
$file = "src/components/marketing/CampaignWizard.tsx"

Write-Host "`n=================================" -ForegroundColor Cyan
Write-Host "  VISUALIZADOR DE VERSÕES" -ForegroundColor Cyan
Write-Host "  CampaignWizard.tsx" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

Write-Host "`nVersões disponíveis:" -ForegroundColor Yellow

Write-Host "`n1. Versão ATUAL (2026-01-11)" -ForegroundColor Green
Write-Host "   Commit: fedd9ef"
Write-Host "   - Usa tags para preferred contacts"
Write-Host "   - Preview lateral de propriedades"

Write-Host "`n2. Versão 08/Jan - RECOMENDADA (Sistema de Garantias)" -ForegroundColor Green
Write-Host "   Commit: 435bb94"
Write-Host "   - Código mais limpo"
Write-Host "   - Sistema de garantias de envio"

Write-Host "`n3. Versão 08/Jan - UI Moderna" -ForegroundColor Green
Write-Host "   Commit: 45f168a"
Write-Host "   - Interface aprimorada"

Write-Host "`n4. Versão 08/Jan - QR Codes & Tracking" -ForegroundColor Green
Write-Host "   Commit: 98875d1"
Write-Host "   - QR codes nos templates"
Write-Host "   - Sistema de tracking"

Write-Host "`n5. Ver TODAS as versões (últimos 30 dias)" -ForegroundColor Green

Write-Host "`n6. Ver DIFERENÇAS entre duas versões" -ForegroundColor Green

Write-Host "`n0. Sair" -ForegroundColor Red

Write-Host "`n=================================" -ForegroundColor Cyan

$choice = Read-Host "`nEscolha uma opção (0-6)"

switch ($choice) {
    "1" {
        Write-Host "`n📄 Versão ATUAL (fedd9ef):" -ForegroundColor Yellow
        Write-Host "Salvando em: version-atual.txt" -ForegroundColor Gray
        git -C $repo show HEAD:$file > version-atual.txt
        code version-atual.txt
    }
    "2" {
        Write-Host "`n📄 Versão 08/Jan - Sistema de Garantias (435bb94):" -ForegroundColor Yellow
        Write-Host "Salvando em: version-garantias.txt" -ForegroundColor Gray
        git -C $repo show 435bb94:$file > version-garantias.txt
        code version-garantias.txt
    }
    "3" {
        Write-Host "`n📄 Versão 08/Jan - UI Moderna (45f168a):" -ForegroundColor Yellow
        Write-Host "Salvando em: version-ui-moderna.txt" -ForegroundColor Gray
        git -C $repo show 45f168a:$file > version-ui-moderna.txt
        code version-ui-moderna.txt
    }
    "4" {
        Write-Host "`n📄 Versão 08/Jan - QR Codes (98875d1):" -ForegroundColor Yellow
        Write-Host "Salvando em: version-qr-codes.txt" -ForegroundColor Gray
        git -C $repo show 98875d1:$file > version-qr-codes.txt
        code version-qr-codes.txt
    }
    "5" {
        Write-Host "`n📋 Todas as versões dos últimos 30 dias:" -ForegroundColor Yellow
        git -C $repo log --since="30 days ago" --pretty=format:"%C(yellow)%h%Creset | %C(green)%ad%Creset | %s" --date=short -- $file
        Write-Host "`n"
        $commit = Read-Host "Digite o hash do commit para visualizar (ex: fedd9ef)"
        if ($commit) {
            Write-Host "`n📄 Visualizando commit $commit..." -ForegroundColor Yellow
            git -C $repo show "${commit}:$file" > "version-$commit.txt"
            code "version-$commit.txt"
        }
    }
    "6" {
        Write-Host "`n🔍 Comparar versões" -ForegroundColor Yellow
        Write-Host "Versões disponíveis:"
        Write-Host "  atual    - Versão atual"
        Write-Host "  435bb94  - Sistema de Garantias"
        Write-Host "  45f168a  - UI Moderna"
        Write-Host "  98875d1  - QR Codes"

        $v1 = Read-Host "`nPrimeira versão (ex: 435bb94)"
        $v2 = Read-Host "Segunda versão (ex: atual ou HEAD)"

        if ($v2 -eq "atual") { $v2 = "HEAD" }

        Write-Host "`n📊 Diferenças entre $v1 e $v2:" -ForegroundColor Yellow
        Write-Host "Salvando em: diff-$v1-vs-$v2.txt" -ForegroundColor Gray
        git -C $repo diff "$v1" "$v2" -- $file > "diff-$v1-vs-$v2.txt"
        code "diff-$v1-vs-$v2.txt"
    }
    "0" {
        Write-Host "`nSaindo..." -ForegroundColor Gray
        exit
    }
    default {
        Write-Host "`nOpção inválida!" -ForegroundColor Red
    }
}

Write-Host "`n=================================" -ForegroundColor Cyan
Write-Host "Deseja RESTAURAR alguma versão?" -ForegroundColor Yellow
$restore = Read-Host "Digite o commit para restaurar (ou Enter para cancelar)"

if ($restore) {
    Write-Host "`n⚠️  CONFIRMAÇÃO:" -ForegroundColor Red
    Write-Host "Você vai RESTAURAR o arquivo para a versão: $restore" -ForegroundColor Yellow
    $confirm = Read-Host "Tem certeza? (S/N)"

    if ($confirm -eq "S" -or $confirm -eq "s") {
        git -C $repo checkout $restore -- $file
        Write-Host "`n✅ Arquivo restaurado para versão $restore!" -ForegroundColor Green
        Write-Host "Não esqueça de fazer commit das mudanças!" -ForegroundColor Yellow
    } else {
        Write-Host "`nRestauração cancelada." -ForegroundColor Gray
    }
}

Write-Host "`n=================================" -ForegroundColor Cyan
Write-Host "Concluído!" -ForegroundColor Green
Write-Host "`n"

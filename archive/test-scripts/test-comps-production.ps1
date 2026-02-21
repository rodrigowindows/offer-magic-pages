# Test Comps API - Production Data Validation (PowerShell)
# Verifica se os dados retornados são de PRODUÇÃO (não demo)
# Usage: .\test-comps-production.ps1

$SUPABASE_URL = "https://atwdkhlyrffbaugkaker.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyODUzODcsImV4cCI6MjA0OTg2MTM4N30.yMSiS4bnkjKQe9_YXAuAOLaZcHs8xpBmS2-qhkBw-Aw"

Write-Host "🏠 Testing Comps API - Production Data Validation" -ForegroundColor Cyan
Write-Host "⚠️  IMPORTANTE: Este teste verifica se os dados são REAIS (não demo)" -ForegroundColor Yellow
Write-Host ""

# Test 1: Endereço Real Testado (25217 Mathew St)
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "📍 Test 1: Endereço Real (25217 Mathew St, Orlando, FL)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$body = @{
    address = "25217 Mathew St"
    city = "Orlando"
    state = "FL"
    basePrice = 250000
    radius = 3
    zipCode = "32833"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $SUPABASE_ANON_KEY"
}

try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/fetch-comps" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop

    Write-Host "📥 Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10 | Write-Host

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "🔍 VALIDAÇÃO DE DADOS DE PRODUÇÃO" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""

    $demoIssue = $false

    # Validar isDemo
    if ($response.isDemo -eq $true) {
        Write-Host "❌ isDemo: true - Usando dados DEMO (não produção)" -ForegroundColor Red
        $demoIssue = $true
    } elseif ($response.isDemo -eq $false) {
        Write-Host "✅ isDemo: false - Dados de produção" -ForegroundColor Green
    } else {
        Write-Host "⚠️  isDemo: $($response.isDemo) - Valor desconhecido" -ForegroundColor Yellow
    }

    # Validar source
    $realSources = @("attom-v2", "attom-v1", "attom", "zillow-api", "county-csv")
    if ($response.source -eq "demo") {
        Write-Host "❌ source: `"demo`" - Dados simulados" -ForegroundColor Red
        $demoIssue = $true
    } elseif ($realSources -contains $response.source) {
        Write-Host "✅ source: `"$($response.source)`" - Fonte de dados real" -ForegroundColor Green
    } else {
        Write-Host "⚠️  source: `"$($response.source)`" - Fonte desconhecida" -ForegroundColor Yellow
    }

    # Validar API key
    if ($response.apiKeysConfigured.attom -eq $true) {
        Write-Host "✅ ATTOM_API_KEY configurada" -ForegroundColor Green
    } else {
        Write-Host "❌ ATTOM_API_KEY não configurada no Supabase" -ForegroundColor Red
        $demoIssue = $true
    }

    Write-Host ""
    Write-Host "📊 Resumo:" -ForegroundColor Cyan
    Write-Host "   Comparables encontrados: $($response.count)"
    Write-Host "   Source: $($response.source)"
    Write-Host "   isDemo: $($response.isDemo)"
    Write-Host "   ATTOM Key: $($response.apiKeysConfigured.attom)"
    Write-Host ""

    if ($demoIssue) {
        Write-Host "⚠️  ATENÇÃO: Dados NÃO são de produção!" -ForegroundColor Red
        Write-Host "   Configure ATTOM_API_KEY no Supabase para obter dados reais."
        Write-Host "   Comando: npx supabase secrets set ATTOM_API_KEY=SUA_KEY --project-ref atwdkhlyrffbaugkaker"
        Write-Host ""
        exit 1
    } else {
        Write-Host "✅ DADOS DE PRODUÇÃO CONFIRMADOS!" -ForegroundColor Green
        Write-Host ""
        exit 0
    }

} catch {
    Write-Host "❌ ERRO ao fazer requisição:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    exit 1
}

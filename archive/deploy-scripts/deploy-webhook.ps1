# Script para fazer deploy forçado do webhook Retell
# Execute: .\deploy-webhook.ps1

Write-Host "`n🚀 Deploy do Retell Webhook Handler" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

# Verificar se Supabase CLI está instalado
$supabaseCli = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseCli) {
    Write-Host "❌ Supabase CLI não encontrado!" -ForegroundColor Red
    Write-Host "`nInstale com: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Navegar para o diretório correto
Set-Location "Step 5 - Outreach & Campaigns"

Write-Host "📂 Diretório: $(Get-Location)" -ForegroundColor Gray
Write-Host "📄 Arquivo: supabase/functions/retell-webhook-handler/index.ts`n" -ForegroundColor Gray

# Fazer login (se necessário)
Write-Host "🔐 Verificando autenticação..." -ForegroundColor Yellow
$loginCheck = supabase projects list 2>&1

if ($loginCheck -match "not logged in") {
    Write-Host "⚠️  Você precisa fazer login primeiro!" -ForegroundColor Yellow
    Write-Host "Executando: supabase login`n" -ForegroundColor Gray
    supabase login
}

# Fazer deploy
Write-Host "🚀 Fazendo deploy da função..." -ForegroundColor Green
Write-Host "Comando: supabase functions deploy retell-webhook-handler --project-ref atwdkhlyrffbaugkaker`n" -ForegroundColor Gray

$deployOutput = supabase functions deploy retell-webhook-handler --project-ref atwdkhlyrffbaugkaker 2>&1

Write-Host "`n📋 Resultado do deploy:" -ForegroundColor Cyan
Write-Host $deployOutput

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deploy realizado com sucesso!" -ForegroundColor Green

    Write-Host "`n⏳ Aguardando 5 segundos para propagação..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5

    Write-Host "`n🧪 Testando webhook..." -ForegroundColor Cyan

    $testResult = curl --location 'https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler' `
        --header 'Content-Type: application/json' `
        --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WjzxLQKNl-R0QGy68F6wgtXs' `
        --data '{"event":"call_started","call":{"call_id":"deploy-script-test","from_number":"+12405814595","to_number":"+14075551234","direction":"inbound","call_status":"in-progress","start_timestamp":1736647200000}}'

    Write-Host "`n📊 Resposta do webhook:" -ForegroundColor Cyan
    $testResult | ConvertFrom-Json | ConvertTo-Json -Depth 10

    if ($testResult -match "v2.0-debug-deployed") {
        Write-Host "`n✅ SUCESSO! Nova versão está rodando!" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  Deploy feito, mas versão antiga ainda está ativa. Aguarde 30s e teste novamente." -ForegroundColor Yellow
    }
} else {
    Write-Host "`n❌ Erro no deploy!" -ForegroundColor Red
    Write-Host "Verifique as mensagens de erro acima." -ForegroundColor Yellow
}

Write-Host "`n==================================`n" -ForegroundColor Cyan

Set-Location ..

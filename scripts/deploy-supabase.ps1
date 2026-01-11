# ============================================
# 🚀 Deploy Supabase Edge Functions (PowerShell)
# Script para fazer deploy de todas as edge functions
# ============================================

Write-Host "============================================" -ForegroundColor Blue
Write-Host "🚀 Supabase Edge Functions Deployment" -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

# Check if supabase CLI is installed
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "✅ Supabase CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Install it: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# List of edge functions to deploy
$functions = @(
    "track-link-click",
    "track-button-click",
    "track-email-open",
    "get-skip-trace-data"
)

# Deploy each function
Write-Host "📦 Deploying Edge Functions..." -ForegroundColor Blue
Write-Host ""

$success = $true

foreach ($func in $functions) {
    Write-Host "Deploying: $func" -ForegroundColor Yellow

    try {
        supabase functions deploy $func
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $func deployed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to deploy $func" -ForegroundColor Red
            $success = $false
        }
    } catch {
        Write-Host "❌ Error deploying $func : $_" -ForegroundColor Red
        $success = $false
    }

    Write-Host ""
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Blue

if ($success) {
    Write-Host "✅ All Edge Functions Deployed!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some functions failed to deploy" -ForegroundColor Yellow
}

Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

# Show deployed functions
Write-Host "📋 Deployed Functions:" -ForegroundColor Blue
supabase functions list

Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "  - View logs: supabase functions logs <function-name> --follow"
Write-Host "  - Test function: supabase functions serve <function-name>"
Write-Host ""

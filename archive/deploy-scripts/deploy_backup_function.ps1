# Deploy Backup Function Edge
Write-Host "🚀 Deploying backup-database Edge Function..." -ForegroundColor Green

Set-Location "G:\My Drive\Sell House - code\Orlando\Step 5 - Outreach & Campaigns"

# Check if Supabase CLI is installed
$supabaseExists = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseExists) {
    Write-Host "📦 Installing Supabase CLI..." -ForegroundColor Yellow
    npm install -g supabase
}

Write-Host "🔧 Logging into Supabase..." -ForegroundColor Yellow
supabase login

Write-Host "📤 Deploying function..." -ForegroundColor Yellow
supabase functions deploy backup-database

Write-Host "✅ Function deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Function URL: https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/backup-database" -ForegroundColor Cyan
Write-Host ""
Write-Host "🧪 Test the function with:" -ForegroundColor Yellow
Write-Host "node test_backup_function.js" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
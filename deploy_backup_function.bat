@echo off
echo 🚀 Deploying backup-database Edge Function...

cd "G:\My Drive\Sell House - code\Orlando\Step 5 - Outreach & Campaigns"

echo 📦 Installing Supabase CLI if needed...
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing Supabase CLI...
    npm install -g supabase
)

echo 🔧 Logging into Supabase...
supabase login

echo 📤 Deploying function...
supabase functions deploy backup-database

echo ✅ Function deployed successfully!
echo.
echo 🌐 Function URL: https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/backup-database
echo.
echo 🧪 Test the function with:
echo node test_backup_function.js
echo.
pause
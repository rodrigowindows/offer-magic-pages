# Test API to verify data source
$SUPABASE_URL = "https://atwdkhlyrffbaugkaker.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WJzxLQKNl-R0QGy68F6wgtXs"

$body = @{
    address = "25217 Mathew ST"
    city = "Orlando"
    state = "FL"
    basePrice = 100000
    radius = 3
} | ConvertTo-Json

Write-Host "Testing API..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/fetch-comps" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $SUPABASE_ANON_KEY"
        } `
        -Body $body
    
    Write-Host "`nResponse:" -ForegroundColor Green
    Write-Host "  Source: $($response.source)" -ForegroundColor $(if ($response.source -eq 'demo') { 'Red' } else { 'Green' })
    Write-Host "  Count: $($response.count)"
    Write-Host "  isDemo: $($response.isDemo)"
    Write-Host "  API Keys - Attom: $($response.apiKeysConfigured.attom), RapidAPI: $($response.apiKeysConfigured.rapidapi)"
    
    if ($response.comps -and $response.comps.Count -gt 0) {
        Write-Host "`nFirst 3 comps:" -ForegroundColor Yellow
        $response.comps[0..2] | ForEach-Object {
            Write-Host "  - $($_.address) | Price: $($_.salePrice) | Source: $($_.source)"
        }
    }
    
    # Check if demo data
    $realSources = @('attom-v2', 'attom-v1', 'attom', 'zillow-api', 'county-csv')
    if ($realSources -contains $response.source) {
        Write-Host "`nRESULT: DADOS REAIS" -ForegroundColor Green
    } else {
        Write-Host "`nRESULT: DADOS DEMO" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

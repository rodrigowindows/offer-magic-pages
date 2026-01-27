# Test API to verify data source
$SUPABASE_URL = "https://atwdkhlyrffbaugkaker.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WJzxLQKNl-R0QGy68F6wgtXs"

$testProperties = @(
    @{
        address = "25217 Mathew ST"
        city = "Orlando"
        state = "FL"
        basePrice = 100000
        radius = 3
    },
    @{
        address = "5528 Long Lake DR"
        city = "Orlando"
        state = "FL"
        basePrice = 100000
        radius = 3
    }
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🔍 Testing API Data Sources" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

foreach ($prop in $testProperties) {
    Write-Host "`n🧪 Testing: $($prop.address), $($prop.city), $($prop.state)" -ForegroundColor Yellow
    Write-Host ("=" * 60) -ForegroundColor Gray
    
    $body = @{
        address = $prop.address
        city = $prop.city
        state = $prop.state
        basePrice = $prop.basePrice
        radius = $prop.radius
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/fetch-comps" `
            -Method Post `
            -Headers @{
                "Content-Type" = "application/json"
                "Authorization" = "Bearer $SUPABASE_ANON_KEY"
            } `
            -Body $body
        
        Write-Host "`n📊 Response Summary:" -ForegroundColor Green
        Write-Host "   Success: $($response.success)"
        Write-Host "   Source: $($response.source)" -ForegroundColor $(if ($response.source -eq 'demo') { 'Red' } else { 'Green' })
        Write-Host "   Count: $($response.count) comps"
        Write-Host "   isDemo: $($response.isDemo)"
        Write-Host "   API Keys: Attom=$($response.apiKeysConfigured.attom), RapidAPI=$($response.apiKeysConfigured.rapidapi)"
        
        # Verificar se é dados reais
        $realSources = @('attom-v2', 'attom-v1', 'attom', 'zillow-api', 'county-csv')
        $isRealData = $realSources -contains $response.source
        
        if ($isRealData) {
            Write-Host "`n✅ DADOS REAIS - Source: $($response.source)" -ForegroundColor Green
        } elseif ($response.source -eq 'demo') {
            Write-Host "`n❌ DADOS DEMO - Source: $($response.source)" -ForegroundColor Red
            Write-Host "   ⚠️ Configure API keys in Supabase for real data" -ForegroundColor Yellow
        } else {
            Write-Host "`n⚠️ Source desconhecida: $($response.source)" -ForegroundColor Yellow
        }
        
        # Analisar comps
        if ($response.comps -and $response.comps.Count -gt 0) {
            Write-Host "`n📋 First 3 Comparables:" -ForegroundColor Cyan
            $response.comps[0..2] | ForEach-Object -Begin { $idx = 1 } -Process {
                Write-Host "   $idx. $($_.address)"
                Write-Host "      Price: `$$([math]::Round($_.salePrice / 1000))K"
                Write-Host "      `$/Sqft: `$$([math]::Round($_.pricePerSqft))"
                Write-Host "      Source: $($_.source)"
                Write-Host "      Date: $($_.saleDate)"
                $idx++
            }
            
            # Validar valores
            $prices = $response.comps | ForEach-Object { $_.salePrice }
            $avgPrice = ($prices | Measure-Object -Average).Average
            $minPrice = ($prices | Measure-Object -Minimum).Minimum
            $maxPrice = ($prices | Measure-Object -Maximum).Maximum
            $avgSqftPrice = ($response.comps | ForEach-Object { $_.pricePerSqft } | Measure-Object -Average).Average
            
            Write-Host "`n💰 Price Analysis:" -ForegroundColor Magenta
            Write-Host "   Average: `$$([math]::Round($avgPrice / 1000))K"
            Write-Host "   Range: `$$([math]::Round($minPrice / 1000))K - `$$([math]::Round($maxPrice / 1000))K"
            Write-Host "   Avg `$/Sqft: `$$([math]::Round($avgSqftPrice))"
            
            # Verificar se valores fazem sentido
            $priceDiff = [math]::Abs($avgPrice - $prop.basePrice) / $prop.basePrice
            if ($priceDiff -gt 0.5) {
                Write-Host "   ⚠️ Average price differs $([math]::Round($priceDiff * 100))% from base price" -ForegroundColor Yellow
            }
            
            if ($avgSqftPrice -lt 30 -or $avgSqftPrice -gt 150) {
                Write-Host "   ⚠️ `$/Sqft outside normal Orlando range (`$30-`$150)" -ForegroundColor Yellow
            } else {
                Write-Host "   ✅ `$/Sqft within normal range" -ForegroundColor Green
            }
            
            # Verificar se endereços são genéricos (demo)
            $genericStreets = @("Colonial Dr", "Pine Ave", "Palm Way", "Main St", "Cedar Ln", "Sunset Blvd", "Oak St", "Maple Dr", "Park Ave", "Lake View Dr")
            $genericCount = 0
            $response.comps | ForEach-Object {
                $parts = $_.address -split " "
                $street = ($parts[-2..-1] -join " ")
                if ($genericStreets -contains $street) {
                    $genericCount++
                }
            }
            
            if ($genericCount -gt 0) {
                $percentGeneric = [math]::Round(($genericCount / $response.comps.Count) * 100)
                Write-Host "`n⚠️ $percentGeneric% of comps have generic street names (demo indicator)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "`n⚠️ No comparables returned" -ForegroundColor Yellow
        }
        
        Start-Sleep -Seconds 1
    } catch {
        Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ Testing Complete" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

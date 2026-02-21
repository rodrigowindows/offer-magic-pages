# Test script for all Retell webhook scenarios
$baseUrl = "https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler"
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WJzxLQKNl-R0QGy68F6wgtXs"
}

function Test-Scenario {
    param($scenarioName, $body)

    Write-Host "=== $scenarioName ===" -ForegroundColor Yellow

    try {
        $response = Invoke-WebRequest -Uri $baseUrl -Method POST -Headers $headers -Body $body -UseBasicParsing
        $result = $response.Content | ConvertFrom-Json

        Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Propriedade encontrada: $($result.result.property_found)"
        Write-Host "Correspondencia: $($result.result.matched_by)"

        if ($result.result.property_found) {
            Write-Host "Proprietario: $($result.result.property_info.owner_name)" -ForegroundColor Cyan
            Write-Host "Endereco: $($result.result.property_info.address)" -ForegroundColor Cyan
        }

        if ($result.result.skip_trace_data) {
            Write-Host "Skip Trace Data: $($result.result.skip_trace_data.total_phones) phones, $($result.result.skip_trace_data.total_emails) emails" -ForegroundColor Magenta
        }
    } catch {
        Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host ""
}

# Scenario 1: Exact phone match (using real phone from database)
Test-Scenario "CENARIO 1: Telefone Exato (4076718801)" @'
{
  "event": "call_ended",
  "call": {
    "call_id": "test-exact-phone",
    "from_number": "4076718801",
    "to_number": "+12405814595",
    "direction": "inbound",
    "call_status": "completed",
    "disconnection_reason": "user_hangup",
    "start_timestamp": 1714608475945,
    "end_timestamp": 1714608491736
  }
}
'@

# Scenario 2: Phone with +1 prefix
Test-Scenario "CENARIO 2: Telefone com +1 prefixo" @'
{
  "event": "call_ended",
  "call": {
    "call_id": "test-plus-one-phone",
    "from_number": "+14076718801",
    "to_number": "+12405814595",
    "direction": "inbound",
    "call_status": "completed",
    "disconnection_reason": "user_hangup",
    "start_timestamp": 1714608475945,
    "end_timestamp": 1714608491736
  }
}
'@

# Scenario 3: Non-matching phone
Test-Scenario "CENARIO 3: Telefone Nao Encontrado" @'
{
  "event": "call_ended",
  "call": {
    "call_id": "test-no-match",
    "from_number": "+19999999999",
    "to_number": "+12405814595",
    "direction": "inbound",
    "call_status": "completed",
    "disconnection_reason": "user_hangup",
    "start_timestamp": 1714608475945,
    "end_timestamp": 1714608491736
  }
}
'@

# Scenario 4: Invalid JSON
Test-Scenario "CENARIO 4: JSON Invalido" 'invalid json payload'

# Scenario 5: OPTIONS request
Write-Host "=== CENARIO 5: OPTIONS Request ===" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $baseUrl -Method OPTIONS -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "CORS Headers: $($response.Headers.'Access-Control-Allow-Origin')" -ForegroundColor Green
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TESTES CONCLUIDOS ===" -ForegroundColor Green
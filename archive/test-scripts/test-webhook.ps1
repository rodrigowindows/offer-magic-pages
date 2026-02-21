# Script de teste do Retell Webhook
# Execute depois do deploy: .\test-webhook.ps1

$webhook = 'https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler'
$token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WJzxLQKNl-R0QGy68F6wgtXs'

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "     TESTE RETELL WEBHOOK HANDLER" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# TESTE 1: Telefone que EXISTE (407) 928-3433
Write-Host "[TESTE 1] Telefone existente: +14079283433" -ForegroundColor White
Write-Host "Esperado: property_found = true, endereco Eatonville`n" -ForegroundColor Gray

$body1 = @'
{
  "event": "call_ended",
  "call": {
    "call_id": "test-existing-phone",
    "from_number": "+14079283433",
    "to_number": "+14079283433",
    "direction": "inbound",
    "call_status": "completed",
    "disconnection_reason": "user_hangup",
    "start_timestamp": 1714608475945,
    "end_timestamp": 1714608491736
  }
}
'@

try {
    $result1 = Invoke-RestMethod -Uri $webhook -Method POST -Headers @{
        'Content-Type'='application/json'
        'Authorization'=$token
    } -Body $body1
    
    Write-Host "RESULTADO:" -ForegroundColor White
    if ($result1.result.property_found) {
        Write-Host "  ✓ Propriedade encontrada!" -ForegroundColor Green
        Write-Host "  Metodo: $($result1.result.matched_by)" -ForegroundColor Cyan
        Write-Host "  Endereco: $($result1.result.property_info.address)" -ForegroundColor Yellow
        Write-Host "  Owner: $($result1.result.property_info.owner_name)" -ForegroundColor Gray
        Write-Host "  ID: $($result1.result.property_info.id)" -ForegroundColor DarkGray
    } else {
        Write-Host "  ✗ Propriedade NAO encontrada (ERRO!)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Erro na chamada: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n----------------------------------------`n" -ForegroundColor Gray

# TESTE 2: Telefone que NAO EXISTE
Write-Host "[TESTE 2] Telefone inexistente: +12405814595" -ForegroundColor White
Write-Host "Esperado: property_found = false`n" -ForegroundColor Gray

$body2 = @'
{
  "event": "call_ended",
  "call": {
    "call_id": "test-nonexistent-phone",
    "from_number": "+12405814595",
    "to_number": "+12405814595",
    "direction": "inbound",
    "call_status": "completed",
    "disconnection_reason": "user_hangup",
    "start_timestamp": 1714608475945,
    "end_timestamp": 1714608491736
  }
}
'@

try {
    $result2 = Invoke-RestMethod -Uri $webhook -Method POST -Headers @{
        'Content-Type'='application/json'
        'Authorization'=$token
    } -Body $body2
    
    Write-Host "RESULTADO:" -ForegroundColor White
    if (!$result2.result.property_found) {
        Write-Host "  ✓ Corretamente NAO encontrou propriedade" -ForegroundColor Green
    } else {
        Write-Host "  ✗ ERRO: Encontrou propriedade quando nao deveria!" -ForegroundColor Red
        Write-Host "  Endereco: $($result2.result.property_info.address)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Erro na chamada: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n----------------------------------------`n" -ForegroundColor Gray

# TESTE 3: Outro telefone existente (407) 780-5551
Write-Host "[TESTE 3] Segundo telefone: +14077805551" -ForegroundColor White
Write-Host "Esperado: property_found = true (mesmo endereco)`n" -ForegroundColor Gray

$body3 = @'
{
  "event": "call_ended",
  "call": {
    "call_id": "test-second-phone",
    "from_number": "+14077805551",
    "to_number": "+14077805551",
    "direction": "inbound",
    "call_status": "completed",
    "disconnection_reason": "user_hangup",
    "start_timestamp": 1714608475945,
    "end_timestamp": 1714608491736
  }
}
'@

try {
    $result3 = Invoke-RestMethod -Uri $webhook -Method POST -Headers @{
        'Content-Type'='application/json'
        'Authorization'=$token
    } -Body $body3
    
    Write-Host "RESULTADO:" -ForegroundColor White
    if ($result3.result.property_found) {
        Write-Host "  ✓ Propriedade encontrada!" -ForegroundColor Green
        Write-Host "  Metodo: $($result3.result.matched_by)" -ForegroundColor Cyan
        Write-Host "  Endereco: $($result3.result.property_info.address)" -ForegroundColor Yellow
    } else {
        Write-Host "  ✗ Propriedade NAO encontrada (ERRO!)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Erro na chamada: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "           TESTES CONCLUIDOS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

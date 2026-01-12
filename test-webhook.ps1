$webhook = "https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler"
$token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WJzxLQKNl-R0QGy68F6wgtXs"

Write-Host "`n========== TESTE RETELL WEBHOOK ==========" -ForegroundColor Cyan

# TESTE 1
Write-Host "`n[TESTE 1] +14079283433 (deve encontrar)" -ForegroundColor Yellow
$body1 = '{"event":"call_ended","call":{"call_id":"test-1","from_number":"+14079283433","to_number":"+14079283433","direction":"inbound","call_status":"completed","disconnection_reason":"user_hangup","start_timestamp":1714608475945,"end_timestamp":1714608491736}}'
$r1 = Invoke-RestMethod -Uri $webhook -Method POST -Headers @{"Content-Type"="application/json";"Authorization"=$token} -Body $body1
if($r1.result.property_found){ Write-Host "  OK: Encontrado - $($r1.result.property_info.address)" -ForegroundColor Green } else { Write-Host "  ERRO: Nao encontrou!" -ForegroundColor Red }

# TESTE 2  
Write-Host "`n[TESTE 2] +12405814595 (nao deve encontrar)" -ForegroundColor Yellow
$body2 = '{"event":"call_ended","call":{"call_id":"test-2","from_number":"+12405814595","to_number":"+12405814595","direction":"inbound","call_status":"completed","disconnection_reason":"user_hangup","start_timestamp":1714608475945,"end_timestamp":1714608491736}}'
$r2 = Invoke-RestMethod -Uri $webhook -Method POST -Headers @{"Content-Type"="application/json";"Authorization"=$token} -Body $body2
if(!$r2.result.property_found){ Write-Host "  OK: Nao encontrou (correto)" -ForegroundColor Green } else { Write-Host "  ERRO: Encontrou quando nao deveria!" -ForegroundColor Red }

Write-Host "`n==========================================`n" -ForegroundColor Cyan

# Script para remover lock file do Git
# Execute como Administrador se necessário

Write-Host "🔧 Removendo Git Lock File..." -ForegroundColor Cyan
Write-Host ""

# 1. Parar todos os processos Git
Write-Host "[1/4] Parando processos Git..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*git*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# 2. Parar processos que podem estar usando o arquivo
Write-Host "[2/4] Verificando processos que podem estar bloqueando..." -ForegroundColor Yellow
$processes = Get-Process | Where-Object {
    $_.Path -like "*cursor*" -or 
    $_.Path -like "*vscode*" -or
    $_.Path -like "*git*"
}
if ($processes) {
    Write-Host "   Encontrados processos que podem estar bloqueando:" -ForegroundColor Yellow
    $processes | Select-Object ProcessName, Id | Format-Table
    Write-Host "   ⚠️  Feche o Cursor/IDE antes de continuar" -ForegroundColor Red
    Read-Host "   Pressione Enter após fechar o IDE"
}

# 3. Remover lock file
Write-Host "[3/4] Removendo lock file..." -ForegroundColor Yellow
$lockPath = ".git\index.lock"
if (Test-Path $lockPath) {
    try {
        Remove-Item -Force -Path $lockPath -ErrorAction Stop
        Write-Host "   ✅ Lock file removido com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Erro ao remover: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   💡 Tente executar este script como Administrador" -ForegroundColor Yellow
        Write-Host "   💡 Ou feche todos os programas que podem estar usando o Git" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "   ℹ️  Lock file não encontrado (já foi removido)" -ForegroundColor Cyan
}

# 4. Verificar se foi removido
Write-Host "[4/4] Verificando..." -ForegroundColor Yellow
if (Test-Path $lockPath) {
    Write-Host "   ❌ Lock file ainda existe!" -ForegroundColor Red
    Write-Host "   💡 Tente remover manualmente: Remove-Item -Force .git\index.lock" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "   ✅ Lock file removido com sucesso!" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Pronto! Agora você pode fazer:" -ForegroundColor Green
Write-Host "   git add ." -ForegroundColor Cyan
Write-Host "   git commit -m 'sua mensagem'" -ForegroundColor Cyan
Write-Host "   git push" -ForegroundColor Cyan
Write-Host ""

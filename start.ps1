# HRMS Launch Script (PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   HRMS Launch Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$nodePath = "C:\Program Files\nodejs\node.exe"
if (-not (Test-Path $nodePath)) {
    Write-Host "[ERROR] Node.js v20 not found at $nodePath" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

& $nodePath --version
Write-Host ""

$env:PATH = "$nodePath;$env:PATH

Write-Host "[1/4] Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "server\node_modules")) {
    Set-Location server
    npm install
    Set-Location ..
}
Write-Host ""

if (-not (Test-Path "node_modules")) {
    npm install
}
Write-Host ""

Write-Host "[3/4] Starting backend server..." -ForegroundColor Yellow
$backendProc = Start-Process -FilePath $nodePath -ArgumentList "server\simple-server.js" -PassThru -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "[4/4] Starting frontend server..." -ForegroundColor Yellow
$frontendProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/k npm run dev" -PassThru -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Services starting..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:3000"
Write-Host "Backend:  http://localhost:8080"
Write-Host ""
Write-Host "Admin Account:" -ForegroundColor Yellow
Write-Host "  Username: admin"
Write-Host "  Password: 1"
Write-Host ""
Write-Host "Opening browser: http://localhost:3000" -ForegroundColor Cyan
Start-Process "http://localhost:3000"
Write-Host ""
Write-Host "Press Enter to keep this window open..."
Read-Host

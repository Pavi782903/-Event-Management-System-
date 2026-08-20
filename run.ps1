Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Event Management System - Startup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

if (-not (Test-Path "venv")) {
    Write-Host "[1/3] Creating virtual environment with Python 3.11..." -ForegroundColor Yellow
    py -3.11 -m venv venv
    Write-Host "[2/3] Installing dependencies..." -ForegroundColor Yellow
    .\venv\Scripts\pip install -r requirements.txt
} else {
    Write-Host "[1/3] Virtual environment found." -ForegroundColor Green
    Write-Host "[2/3] Checking dependencies..." -ForegroundColor Yellow
    .\venv\Scripts\pip install -r requirements.txt -q
}

Write-Host ""
Write-Host "[3/3] Starting server..." -ForegroundColor Green
Write-Host ""
Write-Host " >> Ensure MySQL is running and setup_db.sql has been executed." -ForegroundColor Yellow
Write-Host " >> Open browser at: http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

.\venv\Scripts\uvicorn main:app --reload --reload-dir app --host 127.0.0.1 --port 8000

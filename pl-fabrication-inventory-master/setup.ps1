# PL Fabrication Inventory - Setup Script
# Run from the root of the project: .\setup.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PL Fabrication Inventory Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Backend Setup
Write-Host "`n[1/5] Setting up Python virtual environment..." -ForegroundColor Yellow
Set-Location backend
python -m venv venv --clear

Write-Host "[2/5] Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

Write-Host "[3/5] Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host "[4/5] Seeding database (BioPanel LTP15-Plus)..." -ForegroundColor Yellow
python seed_biopanel.py

Write-Host "[5/5] Starting backend server..." -ForegroundColor Yellow
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Backend running at: http://localhost:8000" -ForegroundColor Green
Write-Host "  API Docs at: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nPress Ctrl+C to stop the server" -ForegroundColor Gray

uvicorn app.main:app --reload --port 8000

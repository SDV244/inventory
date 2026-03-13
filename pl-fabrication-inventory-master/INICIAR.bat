@echo off
title BioPanel Inventory - Iniciando...
color 0A

echo ========================================
echo   BioPanel PBM LTP15-Plus Inventory
echo   BioCellux MDV
echo ========================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no esta instalado
    echo Descarga Python desde: https://python.org
    pause
    exit /b 1
)

:: Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no esta instalado
    echo Descarga Node.js desde: https://nodejs.org
    pause
    exit /b 1
)

echo [1/6] Configurando Backend...
cd backend

if not exist venv (
    echo       Creando entorno virtual...
    python -m venv venv
)

echo       Activando entorno virtual...
call venv\Scripts\activate.bat

echo [2/6] Instalando dependencias Python...
pip install -r requirements.txt -q

if not exist pl_inventory.db (
    echo [3/6] Poblando base de datos...
    python seed_biopanel.py
) else (
    echo [3/6] Base de datos existente, saltando seed...
)

echo [4/6] Iniciando servidor Backend...
start "Backend - BioPanel API" cmd /k "venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"

cd ..

echo [5/6] Configurando Frontend...
cd frontend

if not exist node_modules (
    echo       Instalando dependencias npm...
    call npm install
)

echo [6/6] Iniciando Frontend...
start "Frontend - BioPanel UI" cmd /k "npm run dev"

cd ..

echo.
echo ========================================
echo   TODO LISTO!
echo ========================================
echo.
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo   Abriendo navegador en 5 segundos...
echo.

timeout /t 5 /nobreak >nul

start http://localhost:5173

echo Presiona cualquier tecla para cerrar esta ventana...
echo (Los servidores seguiran corriendo)
pause >nul

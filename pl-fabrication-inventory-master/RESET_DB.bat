@echo off
title Reiniciando Base de Datos...
color 0E

echo ========================================
echo   ATENCION: Esto borrara todos los datos
echo   y reiniciara la base de datos
echo ========================================
echo.

set /p confirm="Escriba SI para confirmar: "
if /i not "%confirm%"=="SI" (
    echo Cancelado.
    pause
    exit /b 0
)

cd backend

echo.
echo Eliminando base de datos...
if exist pl_inventory.db del pl_inventory.db

echo Activando entorno virtual...
call venv\Scripts\activate.bat

echo Recreando base de datos...
python seed_biopanel.py

echo.
echo ========================================
echo   Base de datos reiniciada!
echo ========================================
pause

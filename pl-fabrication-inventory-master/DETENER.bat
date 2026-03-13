@echo off
title Deteniendo BioPanel Inventory...
color 0C

echo ========================================
echo   Deteniendo servidores...
echo ========================================
echo.

:: Kill processes on ports 8000 and 5173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /F /PID %%a 2>nul

:: Close the server windows
taskkill /FI "WINDOWTITLE eq Backend - BioPanel API*" /F 2>nul
taskkill /FI "WINDOWTITLE eq Frontend - BioPanel UI*" /F 2>nul

echo.
echo Servidores detenidos.
echo.
pause

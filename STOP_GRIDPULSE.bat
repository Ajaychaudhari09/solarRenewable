@echo off
title GridPulse AI - Stop

echo.
echo ========================================
echo       STOPPING GRIDPULSE AI
echo ========================================
echo.

REM Close the two named windows without killing unrelated processes
taskkill /fi "WindowTitle eq GridPulse Backend" /f >nul 2>&1
taskkill /fi "WindowTitle eq GridPulse Frontend" /f >nul 2>&1

echo [OK] GridPulse Backend stopped.
echo [OK] GridPulse Frontend stopped.
echo.
echo GridPulse AI has been stopped.
echo.
pause
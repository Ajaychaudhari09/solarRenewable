@echo off
setlocal EnableDelayedExpansion

title GridPulse AI — Challenge 14 Launcher
cls

echo ================================================================
echo      GRIDPULSE AI — SMART RENEWABLE ASSET MONITORING
echo         Solar-Wind Hybrid Parks · Kutch ^& Banaskantha
echo ================================================================
echo.

REM ── Check Node.js ───────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not found in PATH.
    echo Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

REM ── Check MongoDB ────────────────────────────────────────────────
echo [1/3] Checking local MongoDB service (port 27017)...
powershell -Command "$t = Test-NetConnection -ComputerName 127.0.0.1 -Port 27017 -WarningAction SilentlyContinue; if ($t.TcpTestSucceeded) { exit 0 } else { exit 1 }" >nul 2>&1
if errorlevel 1 (
    echo [MongoDB Notice] Local MongoDB is not currently running on port 27017.
    echo                 Express server will start with high-availability memory fallback.
    echo                 To run official MongoDB Community Server:
    echo                 - In Admin terminal: net start MongoDB
    echo                 - Or run: mongod --dbpath "C:\data\db"
) else (
    echo [OK] Local MongoDB detected on port 27017.
)

REM ── Ensure Root Dependencies Installed ───────────────────────────
if not exist "node_modules" (
    echo.
    echo [2/3] Installing dependencies into main node_modules...
    call npm install
)

echo.
echo [3/3] Starting services...

REM ── Start Express API Server ─────────────────────────────────────
echo [Server] Starting Express API on http://localhost:5000...
start "GridPulse Express API" cmd /k "title GridPulse Express API && cd /d "%~dp0" && node src/server/index.js"

REM Wait for API to initialize
timeout /t 3 /nobreak >nul

REM ── Start Vite React Server ──────────────────────────────────────
echo [Frontend] Starting React Dashboard on http://localhost:5173...
start "GridPulse Frontend" cmd /k "title GridPulse Frontend && cd /d "%~dp0" && npm run dev"

REM Wait for Vite to bind port
timeout /t 3 /nobreak >nul

REM ── Open Local Browser ───────────────────────────────────────────
start "" "http://localhost:5173"

echo.
echo ================================================================
echo       GRIDPULSE AI — APPLICATION RUNNING
echo ================================================================
echo.
echo   LOCAL:                 http://localhost:5173
echo   EXPRESS API:           http://localhost:5000
echo.
echo   PUBLIC TUNNEL: Starting localtunnel on port 5173...
echo.
echo ================================================================
echo   WARNING:
echo   Public URL is live only while this window stays open.
echo   Anyone with this link can register an account unless you disable
echo   open registration — see README.
echo ================================================================
echo.
echo [Localtunnel] Connecting tunnel (press Ctrl+C to close tunnel)...
echo.

npx --yes localtunnel --port 5173

pause

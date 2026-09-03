@echo off
setlocal EnableDelayedExpansion

title GridPulse AI Launcher

echo.
echo ========================================
echo        GRIDPULSE AI STARTING
echo    Solar-Wind Renewable Intelligence
echo         Kutch - Banaskantha, Gujarat
echo ========================================
echo.

REM ── Check Python ─────────────────────────────────────────
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found.
    echo.
    echo Please install Python 3.10+ from https://python.org
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYVER=%%v
echo [OK] Python found: %PYVER%

REM ── Check Node.js ────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found.
    echo.
    echo Please install Node.js 18+ from https://nodejs.org
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version 2^>^&1') do set NODEVER=%%v
echo [OK] Node.js found: %NODEVER%

echo.
echo Checking environment...
echo.

REM ── Backend dependencies ─────────────────────────────────
cd /d "%~dp0backend"

echo [Backend] Checking Python packages...
python -c "import fastapi, uvicorn, numpy, pandas" >nul 2>&1
if errorlevel 1 (
    echo [Backend] Installing dependencies (this may take a minute)...
    pip install -r requirements.txt --quiet
    if errorlevel 1 (
        echo [ERROR] Failed to install backend dependencies.
        echo Run manually: cd backend ^&^& pip install -r requirements.txt
        pause
        exit /b 1
    )
    echo [OK] Backend dependencies installed.
) else (
    echo [OK] Backend dependencies ready.
)

REM ── Frontend dependencies ────────────────────────────────
cd /d "%~dp0"

if not exist "node_modules" (
    echo [Frontend] Installing npm packages in main node_modules...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install npm dependencies.
        echo Run manually: npm install
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed in main node_modules.
) else (
    echo [OK] Main dependencies ready.
)

echo.
echo ========================================
echo          Starting Services
echo ========================================
echo.
echo  Express API : http://localhost:5000
echo  Dashboard   : http://localhost:5173
echo.
echo  Press Ctrl+C in each window to stop.
echo ========================================
echo.

REM ── Start Express API ───────────────────────────────────────
cd /d "%~dp0"
echo [Server] Starting Express API server...
start "GridPulse Express API" cmd /k "title GridPulse Express API && cd /d "%~dp0" && node src/server/index.js"

REM Wait a moment for backend to boot
timeout /t 3 /nobreak >nul

REM ── Start Frontend ───────────────────────────────────────
cd /d "%~dp0"
echo [Frontend] Starting dashboard...
start "GridPulse Frontend" cmd /k "title GridPulse Frontend && cd /d "%~dp0" && npm run dev"

REM Wait for frontend to start
timeout /t 3 /nobreak >nul

REM ── Open Browser ─────────────────────────────────────────
echo [Browser] Opening GridPulse AI...
start "" "http://localhost:5173"

echo.
echo ========================================
echo    GridPulse AI is running!
echo.
echo    Dashboard: http://localhost:5173
echo    API:       http://localhost:8000
echo.
echo    Close the two terminal windows to stop.
echo ========================================
echo.

pause
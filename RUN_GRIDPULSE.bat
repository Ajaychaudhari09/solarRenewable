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
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo [Frontend] Installing npm packages (this may take a minute)...
    call npm install --silent
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies.
        echo Run manually: cd frontend ^&^& npm install
        pause
        exit /b 1
    )
    echo [OK] Frontend dependencies installed.
) else (
    echo [OK] Frontend dependencies ready.
)

echo.
echo ========================================
echo          Starting Services
echo ========================================
echo.
echo  Backend API : http://localhost:8000
echo  Dashboard   : http://localhost:5173
echo  API Docs    : http://localhost:8000/docs
echo.
echo  Press Ctrl+C in each window to stop.
echo ========================================
echo.

REM ── Start Backend ─────────────────────────────────────────
cd /d "%~dp0backend"
echo [Backend] Starting API server...
start "GridPulse Backend" cmd /k "title GridPulse Backend && cd /d "%~dp0backend" && python main.py"

REM Wait a moment for backend to boot
timeout /t 3 /nobreak >nul

REM ── Start Frontend ───────────────────────────────────────
cd /d "%~dp0frontend"
echo [Frontend] Starting dashboard...
start "GridPulse Frontend" cmd /k "title GridPulse Frontend && cd /d "%~dp0frontend" && npm run dev"

REM Wait for frontend to start
timeout /t 4 /nobreak >nul

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
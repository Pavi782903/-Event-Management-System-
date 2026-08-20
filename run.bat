@echo off
echo ============================================
echo    Event Management System - Startup
echo ============================================
echo.

cd /d "%~dp0"

REM Check if virtual environment exists
if not exist "venv" (
    echo [1/3] Creating virtual environment with Python 3.11...
    py -3.11 -m venv venv
    if errorlevel 1 (
        echo ERROR: Python 3.11 not found. Please install Python 3.11.
        pause
        exit /b 1
    )
    echo [2/3] Installing dependencies...
    venv\Scripts\pip install -r requirements.txt
) else (
    echo [1/3] Virtual environment found.
    echo [2/3] Checking dependencies...
    venv\Scripts\pip install -r requirements.txt -q
)

echo.
echo [3/3] Starting FastAPI server...
echo.
echo  >> Make sure MySQL is running and you have run setup_db.sql
echo  >> Open your browser at: http://127.0.0.1:8000
echo.
echo Press Ctrl+C to stop the server.
echo ============================================
echo.

venv\Scripts\uvicorn main:app --reload --reload-dir app --host 127.0.0.1 --port 8000

pause

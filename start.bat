@echo off
title MINDX Nexus - Launcher
echo ===================================================
echo   MINDX Nexus - Launching Application Services
echo ===================================================
echo.

echo Launching Backend API server (Port 8000)...
start "MINDX Nexus - Backend API (Port 8000)" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --reload --port 8000"

echo Launching Frontend Dev server (Port 5173)...
start "MINDX Nexus - Frontend (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ===================================================
echo   Both services are launching in separate windows!
echo   
echo   - App UI:   http://localhost:5173
echo   - API Docs: http://localhost:8000/docs
echo ===================================================
echo.
pause

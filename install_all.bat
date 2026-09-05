@echo off
title MINDX Nexus - Installer
echo ===================================================
echo   MINDX Nexus - Installing All Dependencies
echo ===================================================
echo.
echo [1/2] Installing Backend (Python)...
cd /d "%~dp0backend"
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WARNING: pip install encountered an issue or python/pip is not in PATH.
)
echo.
echo [2/2] Installing Frontend (Node.js)...
cd /d "%~dp0frontend"
npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WARNING: npm install encountered an issue or npm/node is not in PATH.
)
echo.
echo ===================================================
echo   Installation step completed!
echo   Run start.bat to launch both backend & frontend.
echo ===================================================
echo.
pause

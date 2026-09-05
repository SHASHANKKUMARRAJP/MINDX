@echo off
echo ==========================================
echo  MINDX Nexus - Installing Backend
echo ==========================================
cd /d "%~dp0backend"
pip install -r requirements.txt
echo.
echo Done! Run start.bat to launch the app.
pause

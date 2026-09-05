@echo off
echo ==========================================
echo  MINDX Nexus - Starting Backend API
echo ==========================================
cd /d "C:\Users\sshas\OneDrive\Desktop\hack\backend"
echo Starting FastAPI on http://localhost:8000
echo Press Ctrl+C to stop
echo.
python -m uvicorn main:app --reload --port 8000
pause

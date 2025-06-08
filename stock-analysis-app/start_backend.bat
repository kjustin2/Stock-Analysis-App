@echo off
echo Starting Stock Analysis Backend...
call venv\Scripts\activate.bat
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8004
pause 
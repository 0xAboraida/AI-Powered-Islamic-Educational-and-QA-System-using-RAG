@echo off
echo ====================================================
echo Starting Zad-AI Engine...
echo ====================================================

echo [1/4] Activating Virtual Environment...
call "E:\AI\AI-Code\ML Codes\.venv\Scripts\activate.bat"

echo [2/4] Setting PYTHONPATH...
set PYTHONPATH=E:\AI\AI-Code\ML Codes\Graduation Project Zad\Zad-AI

echo [3/4] Navigating to Project Directory...
cd /d "E:\AI\AI-Code\ML Codes\Graduation Project Zad\Zad-AI"

echo [4/4] Starting Uvicorn Server...
"E:\AI\AI-Code\ML Codes\.venv\Scripts\python.exe" -m uvicorn services.ai_rag_engine.app.main:app --host 0.0.0.0 --port 8000 --reload


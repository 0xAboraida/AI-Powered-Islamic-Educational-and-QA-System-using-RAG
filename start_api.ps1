# Script to start the Zad-AI FastAPI Server using the virtual environment
$VenvPython = "E:\AI\AI-Code\ML Codes\.venv\Scripts\python.exe"

Write-Host "Starting Zad-AI FastAPI Server..." -ForegroundColor Green
Write-Host "Virtual Environment: $VenvPython" -ForegroundColor Cyan
Write-Host "Access the UI at: http://localhost:8000/chat-ui" -ForegroundColor Yellow

# Run the Uvicorn server using the python executable from the virtual environment
& $VenvPython -m uvicorn services.ai_rag_engine.app.main:app --host 0.0.0.0 --port 8000 --reload

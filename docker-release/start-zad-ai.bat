@echo off
echo ==============================================
echo   Starting Zad-AI Server (with Redis)
echo ==============================================
echo.

IF NOT EXIST ".env" (
    echo [ERROR] The .env file is missing!
    echo Please rename .env.example to .env and add your API keys.
    echo.
    pause
    exit /b
)

echo Pulling the latest image from Docker Hub...
docker compose pull

echo.
echo Starting the containers...
docker compose up -d

echo.
echo ==============================================
echo   Server is running!
echo   API Docs: http://localhost:8000/docs
echo ==============================================
pause

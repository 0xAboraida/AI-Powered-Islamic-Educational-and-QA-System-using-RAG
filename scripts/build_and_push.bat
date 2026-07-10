@echo off
echo ==============================================
echo   Zad-AI Docker Build and Push Script
echo ==============================================

set /p DOCKER_USERNAME="Enter your Docker Hub username: "
set IMAGE_NAME=%DOCKER_USERNAME%/docker-zad-ai-engine:latest

echo.
echo Step 1: Logging into Docker Hub
docker login

echo.
echo Step 2: Building the Docker Image
cd /d "%~dp0\.."
docker build -t %IMAGE_NAME% -f infrastructure/docker/ai.Dockerfile .

echo.
echo Step 3: Pushing the Image to Docker Hub
docker push %IMAGE_NAME%

echo.
echo ==============================================
echo   Done! The image %IMAGE_NAME% is now online.
echo   Make sure to update docker-compose.prod.yml
echo   with your username before sending to your friend.
echo ==============================================
pause

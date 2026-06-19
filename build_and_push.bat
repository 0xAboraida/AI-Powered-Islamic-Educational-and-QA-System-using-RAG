@echo off
echo ==============================================
echo   Building and Pushing Zad-AI Engine Docker Image
echo ==============================================
echo.

echo 1. Building the Docker Image...
docker build -f infrastructure/docker/ai.Dockerfile -t abourida/zad-ai-engine:latest .

echo.
echo 2. Pushing the Image to Docker Hub...
docker push abourida/zad-ai-engine:latest

echo.
echo ==============================================
echo   Done! Image successfully built and pushed.
echo   You can now share the docker-release folder.
echo ==============================================
pause

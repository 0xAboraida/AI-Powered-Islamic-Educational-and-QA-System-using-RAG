# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
# Assuming context is at the root of the project Zad-AI
COPY requirements.txt .
COPY services/ai_rag_engine/requirements.txt ./services/ai_rag_engine/requirements.txt

# Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt
# Check if ai_rag_engine has its own requirements, if so install it
RUN pip install --no-cache-dir -r services/ai_rag_engine/requirements.txt || true

# Copy the rest of the application
COPY . .

# Expose port 8000 for FastAPI
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "services.ai_rag_engine.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]

# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
# Assuming context is at the root of the project Zad-AI
COPY requirements.txt .

# Install python dependencies using Docker's smart caching
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

# Copy the rest of the application
COPY . .

# Expose port 8000 for FastAPI
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "services.ai_rag_engine.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
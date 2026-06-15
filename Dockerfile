# ──────────────────────────────────────────────────────────────
# Stage 1: Base Image
# ──────────────────────────────────────────────────────────────
FROM python:3.11-slim

# Set working directory inside the container
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# ──────────────────────────────────────────────────────────────
# Stage 2: Install Dependencies
# ──────────────────────────────────────────────────────────────
# Copy only requirements first (for Docker cache optimization)
COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ──────────────────────────────────────────────────────────────
# Stage 3: Copy Project Code
# ──────────────────────────────────────────────────────────────
COPY . .

# ──────────────────────────────────────────────────────────────
# Stage 4: Run the API
# ──────────────────────────────────────────────────────────────
# Expose port 8000
EXPOSE 8000

# Start the FastAPI app with Uvicorn (production mode, no --reload)
CMD ["uvicorn", "services.ai_rag_engine.app.main:app", "--host", "0.0.0.0", "--port", "8000"]

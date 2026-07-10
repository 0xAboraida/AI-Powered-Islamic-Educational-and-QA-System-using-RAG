# syntax=docker/dockerfile:1

ARG PYTHON_VERSION=3.12

# ============================================================
# Base Image
# ============================================================
FROM ghcr.io/astral-sh/uv:python${PYTHON_VERSION}-bookworm-slim AS base

# Runtime libraries required by ONNX Runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    HOME=/app

WORKDIR /app

# ============================================================
# Builder
# ============================================================
FROM base AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files first for better cache usage
COPY pyproject.toml uv.lock ./

# Install dependencies into /app/.venv
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked

# Copy application source
COPY . .

# Download required LiveKit models
# If this command fails with your SDK version,
# replace it with:
# RUN uv run python -m livekit.agents download-files
RUN uv run agent.py download-files

# ============================================================
# Runtime
# ============================================================
FROM base

ARG UID=10001

RUN adduser \
    --disabled-password \
    --gecos "" \
    --home /app \
    --shell /usr/sbin/nologin \
    --uid ${UID} \
    appuser

WORKDIR /app

# Copy the virtual environment
COPY --from=builder --chown=appuser:appuser /app/.venv /app/.venv

# Copy the application code
COPY --from=builder --chown=appuser:appuser /app /app

USER appuser

# Ensure the venv is first on PATH
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8081

CMD ["uv", "run", "agent.py", "start"]
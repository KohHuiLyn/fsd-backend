# ---- Base image ----
FROM python:3.12-slim AS runtime

# Ensure stdout/stderr are unbuffered and no .pyc files
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_NO_CACHE_DIR=on

# (Optional) set a default; override at runtime in ECS/Lambda/EKS/compose
# ENV SECRET_NAME="photos-app/config"

# System deps (ca-certificates are already present; add curl for HEALTHCHECK)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
 && rm -rf /var/lib/apt/lists/*

# # Create a non-root user
RUN useradd -m -u 10001 appuser

# Workdir
WORKDIR /app

# Copy & install deps first (better layer caching)
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt \
    && pip install gunicorn

# Copy app code
COPY app.py .

# Expose Gunicorn port
# EXPOSE 8000
EXPOSE 5000

# Basic healthcheck hits /health
# HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://127.0.0.1:8000/health || exit 1
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://127.0.0.1:5000/health || exit 1
# Run as non-root
USER appuser

# Start Gunicorn (tweak workers/threads per CPU)
# CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "4", "--timeout", "60", "app:app"]
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--threads", "4", "--timeout", "60", "app:app"]











# # # Use an official Python runtime as base image
# # FROM python:3.9-slim

# # # Set working directory
# # WORKDIR /app

# # # Copy requirements and install dependencies
# # COPY . /app
# # RUN pip install --no-cache-dir -r requirements.txt

# # # Copy the application code
# # COPY . .

# # # Expose port 5000 for Flask
# # EXPOSE 5007

# # Run the app
# # CMD ["python", "app.py"]


# FROM python:3.11-slim

# ENV PYTHONDONTWRITEBYTECODE=1 \
#     PYTHONUNBUFFERED=1

# RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && \
#     rm -rf /var/lib/apt/lists/*

# WORKDIR /app
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt

# COPY app.py .

# ENV PORT=8080
# EXPOSE 8080
# CMD ["python", "app.py"]


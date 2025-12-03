# Start with a lightweight Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy dependency list first for better layer caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Create a non-root user for security (recommended by AWS)
RUN useradd -m appuser
USER appuser

# Expose port for Flask
EXPOSE 8080

# Optional: ECS health check (container must respond to GET /)
HEALTHCHECK CMD curl --fail http://localhost:8080/ || exit 1

# Start the Flask app
CMD ["python", "app.py"]

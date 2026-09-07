# Backend Dockerfile for Clinical MDT Decision System
FROM python:3.11-slim

WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HOST=0.0.0.0 \
    PORT=8000

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Create uploads directory if not present
RUN mkdir -p uploads

# Expose backend port
EXPOSE 8000

# Run FastAPI via run.py
CMD ["python", "run.py"]

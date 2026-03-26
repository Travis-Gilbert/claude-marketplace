FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput 2>/dev/null || true

# Railway sets PORT=8080. EXPOSE must match so Railway's proxy knows where to route.
EXPOSE 8080

CMD gunicorn plugin_server.wsgi:application \
    --bind "0.0.0.0:${PORT:-8080}" \
    --workers 2 \
    --threads 4 \
    --timeout 120

# ==============================================================
# Stage 1: Build frontend (Vite + React)
# ==============================================================
FROM node:24-alpine AS frontend-build

WORKDIR /app

# Cache layer: dependencias solas
COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable && \
    pnpm config set minimum-release-age 0 && \
    pnpm install --frozen-lockfile

# Código fuente
COPY frontend/ frontend/
COPY index.html vite.config.js eslint.config.js ./

# Build
RUN pnpm build

# ==============================================================
# Stage 2: Django backend (sirve API + frontend build)
# ==============================================================
FROM python:3.12-slim

WORKDIR /app

# Dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Código fuente
COPY . .

# Frontend build desde stage 1
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

EXPOSE 8000

# Seed + migraciones + arranque
CMD python manage.py collectstatic --noinput && \
    python manage.py migrate --noinput && \
    python seed.py 2>/dev/null || true && \
    gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --timeout 120 \
    --access-logfile -

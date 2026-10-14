# ==============================================================================
# DOCKERFILE MULTI-STAGE: Twinber en Busca del Secreto Guanche
# Combina compilación de Frontend (Vite/TS) y runtime optimizado de Python (FastAPI)
# ==============================================================================

# ------------------------------------------------------------------------------
# ETAPA 1: Compilación del Frontend (Node 20 Alpine)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Instalar dependencias npm
COPY frontend/package.json ./
RUN npm install

# Copiar código fuente y compilar SPA de producción
COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# ETAPA 2: Runtime de Producción (Python 3.11 Slim)
# ------------------------------------------------------------------------------
FROM python:3.11-slim AS runner

WORKDIR /app

# Instalar utilidades mínimas del sistema (curl para probes de Kubernetes)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar código fuente y datos del juego (NO se copia chroma_db/, self-healing activo)
COPY src/ ./src/
COPY data/ ./data/
COPY assets/ ./assets/

# Copiar artefactos web compilados desde la Etapa 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Variables de entorno por defecto
ENV PORT=8080 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    CHROMA_PERSIST_DIRECTORY=/app/chroma_db \
    GAME_AUDIT_LOG_PATH=/app/game_audit.log \
    ASSETS_DIR=/app/assets

EXPOSE 8080

# Comprobación de salud nativa para el contenedor
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Comando de arranque del servidor unificado
CMD ["uvicorn", "src.api.server:app", "--host", "0.0.0.0", "--port", "8080"]

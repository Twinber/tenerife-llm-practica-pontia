# ==============================================================================
# Makefile // Twinber en Busca del Secreto Guanche
# Automatización de Instalación, Compilación, Testing y Ejecución (Máster en IA)
# ==============================================================================

SHELL := /bin/bash
PYTHON := python3
VENV := .venv
VENV_BIN := $(VENV)/bin
PORT ?= 8080

.PHONY: help install build run dev test test-fast clean

# Objetivo por defecto: muestra ayuda interactiva con colores
help:
	@echo ""
	@echo "🌴 ===================================================================="
	@echo "   TWINBER EN BUSCA DEL SECRETO GUANCHE // COMANDOS DE EVALUACIÓN"
	@echo "======================================================================"
	@echo "  make install    -> Instala dependencias de Python (.venv) y Frontend (npm)"
	@echo "  make build      -> Compila la SPA de Frontend (Vite -> frontend/dist)"
	@echo "  make run        -> [RECOMENDADO] Levanta el juego completo en http://localhost:$(PORT)"
	@echo "  make dev        -> Levanta Backend (--reload) y Frontend (Vite HMR) en paralelo"
	@echo "  make test       -> Ejecuta la suite E2E completa (9 etapas agénticas)"
	@echo "  make clean      -> Limpia caches de Python, temporales y build de frontend"
	@echo "======================================================================"
	@echo ""

# 1. Instalación automática de dependencias
install:
	@echo "📦 [1/2] Preparando entorno virtual Python en $(VENV)..."
	@if [ ! -d "$(VENV)" ]; then $(PYTHON) -m venv $(VENV); fi
	@$(VENV_BIN)/pip install --upgrade pip
	@$(VENV_BIN)/pip install -r requirements.txt
	@if [ ! -f ".env" ] && [ -f ".env.example" ]; then cp .env.example .env; echo "ℹ️ Creado archivo .env desde plantilla .env.example"; fi
	@echo "📦 [2/2] Instalando dependencias de Frontend (Vite/TypeScript)..."
	@npm --prefix frontend install
	@echo "✅ Instalación completada con éxito."

# 2. Compilación de la SPA de Frontend
build:
	@echo "🔨 Compilando Frontend con Vite en frontend/dist..."
	@npm --prefix frontend run build
	@echo "✅ Compilación de Frontend lista."

# 3. Ejecución Unificada: Servidor Único para Profesor / Evaluador
run:
	@if [ ! -d "frontend/dist" ]; then $(MAKE) build; fi
	@echo ""
	@echo "🚀 ===================================================================="
	@echo "   JUEGO INICIADO: Abre en tu navegador web:"
	@echo "   👉 http://localhost:$(PORT)"
	@echo "======================================================================="
	@echo "   - Frontend Retro 16:9 servido en /"
	@echo "   - API y Streaming SSE servidos en /api/ y /api/stream"
	@echo "   - Documentación Swagger interactiva en /docs"
	@echo "======================================================================="
	@echo ""
	@$(VENV_BIN)/uvicorn src.api.server:app --host 0.0.0.0 --port $(PORT)

# 4. Modo Desarrollo con Recarga en Vivo
dev:
	@echo "🛠️ Iniciando entorno de desarrollo dual (Backend :$(PORT) + Vite :5173)..."
	@trap 'kill 0' EXIT; \
	$(VENV_BIN)/uvicorn src.api.server:app --host 0.0.0.0 --port $(PORT) --reload & \
	npm --prefix frontend run dev & \
	wait

# 5. Suite de Validación E2E (9 Etapas Agénticas)
test:
	@echo "🧪 Ejecutando suite de integración de extremo a extremo..."
	@$(VENV_BIN)/python scripts/test_full_game_integration.py

# 6. Limpieza de artefactos generados
clean:
	@echo "🧹 Limpiando temporales, caches y builds..."
	@rm -rf frontend/dist
	@find . -type d -name "__pycache__" -exec rm -rf {} +
	@find . -type d -name ".pytest_cache" -exec rm -rf {} +
	@find . -type f -name "*.pyc" -delete
	@echo "✅ Limpieza finalizada."

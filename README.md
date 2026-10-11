# 🌴 Twinber en Busca del Secreto Guanche // Aventura Gráfica Retro en Tenerife

Aventura gráfica conversacional retro inspirada en los clásicos de LucasArts (*The Secret of Monkey Island*, *Indiana Jones and the Fate of Atlantis*), desarrollada como proyecto final del módulo de **Large Language Models (LLMs)** en el Máster de IA, Cloud Computing & DevOps.

El proyecto implementa una **Arquitectura Limpia (Clean Architecture)** desacoplada cliente-servidor, combinando un frontend web interactivo (Vite + TypeScript) con un backend agéntico en Python (FastAPI + OpenAI SDK nativo), recuperación semántica RAG geocercada sobre la guía oficial `TENERIFE.pdf`, herramientas meteorológicas/astronómicas reales con Open-Meteo, gating determinista de viaje y una consola CRT interactiva de telemetría.

Repositorio oficial: [https://github.com/Twinber/tenerife-llm-practica-pontia](https://github.com/Twinber/tenerife-llm-practica-pontia)

---

## 🏛️ Arquitectura Limpia Desacoplada (Clean Architecture)

El sistema supera el prototipado monolítico en un único script/notebook separando estrictamente la presentación del núcleo de IA:

```text
proyecto-tenerife/
├── data/
│   └── TENERIFE.pdf                  # Documento fuente oficial (25 págs)
├── docs/                             # Documentación técnica, diseño y auditorías
│   ├── seguimiento_master_llm.md     # Bitácora de sesiones y control del máster
│   ├── especificaciones_juego.md     # Documento de diseño técnico y contratos
│   ├── calibracion_zonas_calientes_chroma.md # Evidencias de calibración de hotspots
│   ├── enclaves_validation.md        # Catálogo y validación de los 13 enclaves
│   └── matriz_fotos_rag.md           # Mapeo de las 28 fotografías RAG
├── frontend/                         # CLIENTE WEB RETRO (Vite + TypeScript)
│   ├── src/
│   │   ├── domain/                   # Entidades puras (Actor, locationsData, types)
│   │   ├── application/              # Casos de uso (GameEngine, ActionDispatcher, DialogueManager)
│   │   ├── infrastructure/           # Adaptadores (AssetLoader, AudioService Web Audio API)
│   │   ├── presentation/             # Vistas UI (ViewportView, ScummDockView, TelemetryView,
│   │   │                             #   IslandMapModal, PassportModal, PhotoAlbumModal,
│   │   │                             #   AnimationViewerModal)
│   │   └── styles/retro.css          # Estilo 16:9 LucasArts VGA, scanlines y efectos CRT
│   └── public/assets/                # Fondos 16:9, sprites normalizados e iconos SVG
├── src/                              # BACKEND AGÉNTICO EN PYTHON PURO
│   ├── domain/                       # Capa 1: Entidades, Pasaporte, Estado y Pydantic V2
│   ├── infrastructure/               # Capa 2: Open-Meteo HTTP, Chroma DB, OpenAI Client, PDF Extractor
│   ├── application/                  # Capa 3: Orquestador agéntico, RAG Geocercado, Guardrails, MCP
│   └── api/                          # Capa 4: Servidor FastAPI (REST + Server-Sent Events)
├── scripts/                          # Herramientas de extracción y validación de assets
│   ├── extract_assets.py             # Zero-Jitter Engine de sprites y normalización
│   └── take_screenshot.py            # Auditoría visual automatizada
├── requirements.txt                  # Dependencias de Python
└── README.md                         # Documentación principal
```

---

## 🎮 Mecánicas de Juego y Sistemas Implementados

### 1. 13 Enclaves Panorámicos en 16:9
Fondos píxel art VGA (1280x720 px) que recorren la diversidad de Tenerife:
* **Zona Norte (5):** Puerto de la Cruz, La Orotava, Santa Úrsula, Icod de los Vinos, Garachico.
* **Zona Metropolitana (3):** San Cristóbal de La Laguna, Santa Cruz de Tenerife, Parque Rural de Anaga.
* **Zona Sur (3):** Costa Adeje, Barranco de Masca, El Médano.
* **Zona Cumbre (2):** Las Cañadas del Teide, Pico del Teide (3.718m).

### 2. 14 Personajes con Animaciones & Zero-Jitter Engine
* 13 NPCs autóctonos y Twinber, cada uno con 8 fotogramas (4 frames IDLE + 4 frames TALK, 112 frames en total).
* Normalización canónica de sprites mediante el **Zero-Jitter Engine** (`scripts/extract_assets.py`):
  * Lienzo fijo por actor con canal alfa transparente.
  * Anclaje estricto de pies (*Ground Foot Anchor*) centrado en `x = canvas_w // 2` y alineado a la suela del calzado (`y = 450 px`).
  * Cero bamboleos ni saltos de posición al hablar o gesticular.

### 3. Mapa de Carreteras estilo Indiana Jones
* Carta náutica interactiva en pergamino (`IslandMapModal.ts`).
* Animación cinemática de trayecto con línea discontinua roja que une origen y destino por las carreteras insulares (TF-1, TF-5, TF-24, TF-21).
* Reglas de movilidad condicionadas al avance en el Pasaporte de Explorador.

### 4. Pasaporte de Explorador a Doble Página (5 Pliegos)
* Cuaderno oficial de visados abierto a doble página simultánea (10 páginas / 10 sellos oficiales de zona).
* Sellos vectoriales retro con fecha de aduana, lema, icono representativo y firma del NPC.
* Gating determinista: sellar el Norte desbloquea el Sur; completar el Sur abre el Teide.

### 5. Álbum de Fotos de Tenerife (28 Coleccionables)
* 28 fotografías reales extraídas de `TENERIFE.pdf`.
* Desbloqueo mediante interacción `MIRAR` en el escenario o consultas al RAG al conversar con los lugareños.

### 6. Calibración Rigurosa de Zonas Calientes (*Hotspots*)
* Auditoría con máscara Chroma Key fluorescente (`rgba(0, 255, 68, 0.38)`) documentada en `docs/calibracion_zonas_calientes_chroma.md`.
* Todos los monumentos, barricas, ruedas hidráulicas, árboles y elementos interactivos delimitados al píxel.

### 7. Consola CRT de Telemetría y Laboratorio de Animaciones (`SHOW_ANIMS`)
* Terminal interactiva accesible mediante la tecla **`T`** o el botón del HUD.
* Comandos disponibles:
  * `SHOW_ANIMS [filtro]`: Despliega el laboratorio visual para inspeccionar los 14 personajes en paralelo con bucles de reposo y habla, selector de velocidades (0.25x a 2.0x), selector de fondos (ajedrez, oscuro, claro, chroma) y filtros comarcales.
  * `MAPA`: Abre el mapa insular.
  * `LISTAR_DESTINOS`: Muestra la matriz de los 13 enclaves con sus estados.
  * `VIAJAR <destino>`: Teletransporte de depuración.
  * `AYUDA`: Lista de comandos.

---

## 🚀 Puesta en Marcha y Ejecución

### Requisitos Previos
* Node.js / Bun (recomendado Bun para velocidad óptima).
* Python 3.11+.

### 1. Ejecutar el Cliente Web (Frontend)
```bash
cd frontend
bun install          # o npm install
bun run dev          # arranca Vite en http://localhost:5173
```

Para compilar para producción:
```bash
bun run build        # genera la build optimizada en frontend/dist
```

### 2. Entorno Python (Backend)
```bash
# Crear entorno virtual e instalar dependencias
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Añadir OPENAI_API_KEY en .env
```

---

## 📋 Estado Actual del Proyecto (Checklist del Máster)

| Componente | Requisito del Máster | Estado |
| :--- | :--- | :---: |
| **Capa Visual & UX (16:9)** | Interfaz retro VGA, 13 enclaves, diálogos interactivos, mapa Indiana Jones, pasaporte de 5 pliegos, álbum de fotos. | ✅ **100% Completada** |
| **Sprites & Animaciones** | 14 personajes, 112 frames, Zero-Jitter Engine, laboratorio `SHOW_ANIMS`. | ✅ **100% Completada** |
| **Calibración de Escenarios** | Hotspots auditados con evidencias Chroma Key en los 13 enclaves. | ✅ **100% Completada** |
| **Control de Versiones** | Repositorio GitHub remoto sincronizado con commits convencionales. | ✅ **100% Sincronizado** |
| **Backend LLM Comercial** | Conexión a OpenAI SDK (`gpt-4o-mini`), `.env` e hiperparámetros. | ⏳ **Fase 3 (Siguiente)** |
| **Motor RAG Geocercado** | Chunking semántico de `TENERIFE.pdf`, Chroma DB, citas obligatorias. | ⏳ **Fase 3 (Siguiente)** |
| **Function Calling** | Open-Meteo (`get_weather`, `get_starlight_conditions`, `get_calima_alert`) con logging. | ⏳ **Fase 3 (Siguiente)** |
| **Memoria Conversacional** | Summary Buffer híbrido con presupuesto estricto de tokens. | ⏳ **Fase 3 (Siguiente)** |
| **Servidor API** | Endpoints REST y Server-Sent Events (SSE) en FastAPI para conectar front y back. | ⏳ **Fase 3 (Siguiente)** |
| **Notebook de Entrega** | Cuaderno reproducible `notebook_principal.ipynb` con evaluación y memoria técnica. | ⏳ **Fase 3 & 5 (Siguiente)** |

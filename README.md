# 🌴 Twinber en Busca del Secreto Guanche // Aventura Gráfica Retro en Tenerife

Aventura gráfica conversacional retro inspirada en los clásicos de LucasArts (*The Secret of Monkey Island*, *Indiana Jones and the Fate of Atlantis*), desarrollada como proyecto final del módulo de **Large Language Models (LLMs)** en el Máster de IA, Cloud Computing & DevOps.

El proyecto implementa una **Arquitectura Limpia (Clean Architecture)** desacoplada cliente-servidor, combinando un frontend web interactivo (Vite + TypeScript) con un backend agéntico en Python (FastAPI + ReAct + RAG Geocercado con ChromaDB + Function Calling Open-Meteo + Visión Multimodal VLM + Streaming SSE), gating determinista de viaje, pasaporte de explorador y una consola CRT interactiva de telemetría y auditoría en tiempo real.

Repositorio oficial: [https://github.com/Twinber/tenerife-llm-practica-pontia](https://github.com/Twinber/tenerife-llm-practica-pontia)

---

## ⚡ Guía Rápida para el Evaluador (Un Solo Comando con Makefile)

Para facilitar la evaluación del tribunal y profesorado sin configuraciones complejas, se incluye un `Makefile` automatizado:

```bash
# 1. Instalar dependencias completas (Python .venv + Frontend npm)
make install

# 2. Levantar el juego completo (Frontend + Backend en un único puerto)
make run
```

Abre en tu navegador:
👉 **[http://localhost:8080](http://localhost:8080)**

```bash
# 3. Ejecutar la suite de validación integral E2E (9/9 etapas agénticas)
make test
```

---

## 🏛️ Arquitectura Limpia Desacoplada (Clean Architecture)

El sistema supera el prototipado monolítico en un único script/notebook separando estrictamente la presentación del núcleo de IA:

```text
proyecto-tenerife/
├── Makefile                          # Automatización de evaluación (install, build, run, test)
├── data/
│   └── TENERIFE.pdf                  # Códice documental oficial de la expedición (25 págs)
├── docs/                             # Documentación técnica, diseño y auditorías
│   ├── seguimiento_master_llm.md     # Bitácora de sesiones y control del máster
│   ├── especificaciones_juego.md     # Documento de diseño técnico y contratos
│   ├── calibracion_zonas_calientes_chroma.md # Evidencias de calibración de hotspots
│   ├── enclaves_validation.md        # Catálogo y validación de los 13 enclaves
│   └── matriz_fotos_rag.md           # Mapeo de las fotografías RAG
├── frontend/                         # CLIENTE WEB RETRO (Vite + TypeScript)
│   ├── src/
│   │   ├── domain/                   # Entidades puras (Actor, locationsData, types, passportData)
│   │   ├── application/              # Casos de uso (GameEngine, ActionDispatcher, DialogueManager)
│   │   ├── infrastructure/           # Adaptadores (ApiClient REST/SSE, AssetLoader, AudioService Web Audio API)
│   │   ├── presentation/             # Vistas UI (ViewportView, ScummDockView, TelemetryView,
│   │   │                             #   IslandMapModal, PassportModal, PhotoAlbumModal,
│   │   │                             #   AnimationViewerModal)
│   │   └── styles/retro.css          # Estilo 16:9 LucasArts VGA, scanlines y efectos CRT
│   ├── public/assets/                # Fondos 16:9, sprites normalizados e iconos SVG
│   └── dist/                         # Single Page Application (SPA) compilada
├── src/                              # BACKEND AGÉNTICO EN PYTHON PURO
│   ├── domain/                       # Capa 1: Entidades, Pasaporte, Estado y Pydantic V2 (GameState, TurnResult)
│   ├── infrastructure/               # Capa 2: Open-Meteo HTTP, Chroma DB, LLM Client (Gemini/OpenAI), PDF Extractor
│   ├── application/                  # Capa 3: Orquestador agéntico ReAct, RAG Geocercado, Guardrails, MemoryManager, MCP
│   └── api/                          # Capa 4: Servidor FastAPI (REST + Server-Sent Events SSE + Static SPA)
├── scripts/                          # Herramientas de extracción, normalización y validación
│   ├── test_full_game_integration.py # Suite E2E integral (9 etapas agénticas)
│   ├── extract_assets.py             # Zero-Jitter Engine de sprites y normalización
│   └── take_screenshot.py            # Auditoría visual automatizada
├── requirements.txt                  # Dependencias de Python
└── README.md                         # Documentación principal
```

---

## 🤖 Núcleo de Inteligencia Artificial y Agentes

### 1. Orquestador Agéntico ReAct (`AgentOrchestrator`)
* Bucle de razonamiento agéntico con Gemini / OpenAI con trazabilidad estricta (*Thought -> Action -> Observation -> Final Answer*).
* Supervisión de turnos conversacionales con personalidad canaria (*chacho*, *muchacho*, modismos auténticos).

### 2. Motor RAG Geocercado (`ChromaRAGRetriever`)
* Indexación vectorial sobre `TENERIFE.pdf` con ChromaDB y embeddings semánticos.
* **Filtrado Geocercado estricto**: Si el jugador pregunta en Puerto de la Cruz, el retriever prioriza y aísla los chunks históricos y geográficos de dicho enclave.
* **Citas Obligatorias**: Todas las respuestas basadas en fuentes documentales acreditan rigurosamente la procedencia mediante `[Pág. X]`.

### 3. Function Calling en Tiempo Real (Open-Meteo)
* `get_weather(latitude, longitude)`: Temperatura real, sensación térmica, viento y humedad.
* `get_calima_alert(latitude, longitude)`: Detección y alerta de polvo en suspensión sahariano (PM10 / PM2.5).
* `get_starlight_conditions(latitude, longitude)`: Cobertura nubosa y visibilidad astronómica para la cumbre del Teide.

### 4. Visión Multimodal VLM (Tool-Augmented Vision)
* Botón `🔍 EXAMINAR CON LUPA` en el Álbum de Fotos: el jugador puede seleccionar cualquier fotografía para que el modelo VLM analice arquitectura (ej. Auditorio de Calatrava), botánica o geología volcánica.
* Botón `📍 ¿DÓNDE ESTOY?` en el HUD: deducción visual del enclave actual a partir de la panorámica activa.

### 5. Memoria Conversacional Híbrida (`ConversationMemoryManager`)
* Esquema híbrido *Sliding Window + Summary Buffer*.
* Mantiene los últimos 6 mensajes en ventana activa y sintetiza resúmenes semánticos progresivos con presupuesto estricto de tokens (<1000 tokens) para evitar deriva y costes descontrolados.

### 6. Streaming SSE en Tiempo Real (`/api/stream`)
* Generación progresiva de tokens vía Server-Sent Events (SSE).
* Los NPCs transmiten su respuesta palabra por palabra con efecto teletipo y blips de audio retro (`playTalk`).
* Emisión del evento final estructurado `[META]{...}` para sincronización atómica de sellos, fotos, monedas y efectos de sonido.

### 7. Guardarraíles de Entrada y Salida (`BouncerGuardrail`)
* Filtrado de inyecciones de prompt y ataques de evasión (*jailbreaks*).
* Defensa temática (*off-topic guardrail*) con soporte multimodal contextual para inspecciones visuales.

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

### 5. Álbum de Fotos de Tenerife (Coleccionables con Visión VLM)
* Fotografías reales extraídas de `TENERIFE.pdf`.
* Desbloqueo mediante interacción `MIRAR` en el escenario o consultas al RAG al conversar con los lugareños.
* Cada foto puede ser analizada con lupa multimodal.

### 6. Calibración Rigurosa de Zonas Calientes (*Hotspots*)
* Auditoría con máscara Chroma Key fluorescente documentada en `docs/calibracion_zonas_calientes_chroma.md`.
* Todos los monumentos, barricas, ruedas hidráulicas, árboles y elementos interactivos delimitados al píxel.

### 7. Consola CRT de Telemetría y Laboratorio de Animaciones (`SHOW_ANIMS`)
* Terminal interactiva accesible mediante la tecla **`T`** o el botón del HUD.
* Comandos disponibles:
  * `AUDIT`: Muestra los últimos eventos registrados en el log de auditoría persistente.
  * `ESTADO`: Resumen del inventario, monedas, sellos y enclaves visitados.
  * `RESET`: Reinicia la partida a su estado inicial.
  * `SHOW_ANIMS [filtro]`: Despliega el laboratorio visual para inspeccionar los 14 personajes en paralelo con bucles de reposo y habla, selector de velocidades (0.25x a 2.0x), selector de fondos (ajedrez, oscuro, claro, chroma) y filtros comarcales.
  * `MAPA`: Abre el mapa insular.
  * `LISTAR_DESTINOS`: Muestra la matriz de los 13 enclaves con sus estados.
  * `VIAJAR <destino>`: Teletransporte de depuración.
  * `AYUDA`: Lista completa de comandos interactivos.

---

## 🚀 Comandos del Makefile

| Comando | Acción |
| :--- | :--- |
| `make install` | Crea el entorno virtual `.venv`, instala dependencias Python y paquetes npm del frontend. |
| `make build` | Compila la Single Page Application (SPA) con Vite en `frontend/dist`. |
| `make run` | **[Recomendado]** Compila y arranca el servidor unificado FastAPI en `http://localhost:8080`. |
| `make dev` | Arranca concurrentemente el backend (`--reload`) y Vite Dev Server con Hot Module Replacement. |
| `make test` | Ejecuta la suite de validación agéntica E2E de 9 etapas (`scripts/test_full_game_integration.py`). |
| `make clean` | Elimina caches de Python (`__pycache__`, `.pytest_cache`) y artefactos de compilación (`frontend/dist`). |

---

## 📋 Estado Actual del Proyecto (Checklist del Máster)

| Componente | Requisito del Máster | Estado |
| :--- | :--- | :---: |
| **Capa Visual & UX (16:9)** | Interfaz retro VGA, 13 enclaves, diálogos interactivos, mapa Indiana Jones, pasaporte de 5 pliegos, álbum de fotos. | ✅ **100% Completada** |
| **Sprites & Animaciones** | 14 personajes, 112 frames, Zero-Jitter Engine, laboratorio `SHOW_ANIMS`. | ✅ **100% Completada** |
| **Calibración de Escenarios** | Hotspots auditados con evidencias Chroma Key en los 13 enclaves. | ✅ **100% Completada** |
| **Control de Versiones** | Repositorio GitHub remoto sincronizado con commits convencionales. | ✅ **100% Sincronizado** |
| **Backend LLM Comercial** | Orquestador ReAct con Gemini / OpenAI, `.env` e hiperparámetros. | ✅ **100% Completada** |
| **Motor RAG Geocercado** | Chunking semántico de `TENERIFE.pdf`, Chroma DB, citas obligatorias `[Pág. X]`. | ✅ **100% Completada** |
| **Function Calling** | Open-Meteo (`get_weather`, `get_starlight_conditions`, `get_calima_alert`) con logging. | ✅ **100% Completada** |
| **Multimodal VLM** | Inspección visual con lupa de fotos reales y deducción de escenario (*¿Dónde estoy?*). | ✅ **100% Completada** |
| **Memoria Conversacional** | Summary Buffer híbrido con presupuesto estricto de tokens (<1000 tokens). | ✅ **100% Completada** |
| **Servidor API & Streaming** | Endpoints REST y Server-Sent Events (SSE) en FastAPI con entrega unificada de SPA. | ✅ **100% Completada** |
| **Suite de Validación E2E** | Suite automatizada de 9 etapas que valida todo el sistema de extremo a extremo. | ✅ **100% Verificada (9/9)** |
| **Makefile de Evaluación** | Comandos `make install`, `make run`, `make test` para el evaluador. | ✅ **100% Operativo** |
| **Notebook de Entrega** | Cuaderno reproducible `notebook_principal.ipynb` con benchmarks y memorias. | ⏳ **Fase 5 (Siguiente)** |

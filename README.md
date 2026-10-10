# 🌴 Proyecto Tenerife: Twinber en Busca del Secreto Guanche

Aventura gráfica conversacional retro inspirada en los clásicos de LucasArts (*The Secret of Monkey Island*, *Indiana Jones and the Fate of Atlantis*), desarrollada como proyecto final del módulo de Large Language Models (LLMs).

El motor combina modelos comerciales de LLM (OpenAI SDK nativo), recuperación semántica RAG sobre el documento oficial `TENERIFE.pdf`, herramientas meteorológicas y astronómicas reales (Open-Meteo), un sistema de pasaporte con progresión determinista y una interfaz Point & Click implementada en Gradio.

---

## 🏛️ Arquitectura Limpia por Capas (Clean Architecture)

El núcleo agéntico está completamente desacoplado de cualquier interfaz de usuario:

```text
proyecto-tenerife/
├── data/
│   └── TENERIFE.pdf                  # Documento fuente oficial (25 págs)
├── assets/
│   ├── img/                          # Fotografías extraídas del PDF
│   └── data/
│       └── glosario_canario.json     # Recurso MCP: léxico y gastronomía canaria
├── src/                              # BACKEND AGÉNTICO EN PYTHON PURO
│   ├── domain/                       # Capa 1: Entidades, Pasaporte, Estado y Contratos Pydantic
│   ├── infrastructure/               # Capa 2: Open-Meteo HTTP, Chroma DB, OpenAI Client, PDF Extractor
│   ├── application/                  # Capa 3: Orquestador agéntico, RAG Geocercado, Guardrails, MCP
│   └── ui/                           # Capa 4: Adaptadores de presentación (Gradio, CLI, Notebook Runner)
├── notebook_principal.ipynb          # Entrega oficial ejecutable del máster
├── requirements.txt                  # Dependencias reproducibles
└── README.md                         # Documentación del proyecto
```

---

## 🎮 Mecánicas de Juego y Progresión

1. **El Pasaporte de Explorador:**
   * Twinber debe visitar y sellar **10 ubicaciones emblemáticas** (5 en la Zona Norte y 5 en la Zona Sur) antes de desbloquear el acceso a las cumbres del Teide.
   * **Zona Norte (5 sellos):** Santa Cruz, San Cristóbal de La Laguna, Parque Rural de Anaga, La Orotava, Puerto de la Cruz.
   * **Zona Sur (5 sellos):** Costa Adeje, Los Gigantes, Barranco de Masca, El Médano, Los Cristianos.
   * **Clímax Final:** Parque Nacional del Teide (observación de estrellas nocturnas con condiciones reales Starlight).
2. **Gating Determinista:**
   * La lógica de progresión está blindada en Python (`src/domain/state.py`): no se puede saltar al Sur sin el Norte completo, ni al Teide sin el Sur completo.
3. **RAG Geocercado con Humor:**
   * En cada ubicación se pueden formular preguntas libres que se responden mediante búsqueda semántica en `TENERIFE.pdf` con citas obligatorias de página.
   * Si el jugador pregunta por un lugar distinto a donde se encuentra físicamente, el narrador frena la consulta con humor canario de aventura gráfica.
4. **Viaje Cinematográfico Estilo Indiana Jones:**
   * Las transiciones de viaje muestran un mapa estilo pergamino de Tenerife con una **línea roja discontinua animada (SVG/CSS)** que recorre las carreteras insulares (TF-5, TF-1, TF-24).

---

## 🚀 Modos de Ejecución

1. **Modo Evaluación en Jupyter:** `launch_game(inline=True)` dentro de `notebook_principal.ipynb`.
2. **Modo Web Standalone:** `python -m src.ui.web_retro_app` (a pantalla completa en `http://localhost:7860`).
3. **Modo Terminal / CLI:** `python -m src.ui.terminal_cli`.

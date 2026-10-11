# Plan Maestro de Aprendizaje y Seguimiento: Módulo LLMs & Evaluación Final

**Estudiante:** Twinber  
**Materia:** Large Language Models (Máster en IA, Cloud Computing & DevOps)  
**Tutor:** Antigravity (Google DeepMind)  
**Objetivo de Calificación:** Sobresaliente (10 / 10 + 20% Bonus)  
**Estado General:** Fase 1 en curso (Repaso de Sesiones)

---

## 1. Visión Creativa del Proyecto: *Aventura Gráfica Retro en Tenerife*

Inspirado en los clásicos de LucasArts (*The Secret of Monkey Island*, *Indiana Jones and the Fate of Atlantis*):
* **Concepto:** Una aventura conversacional interactiva ("Point & Prompt" / Text-Adventure) donde el usuario es un viajero / explorador que recorre la isla de Tenerife.
* **Integración RAG:** La guía turística `TENERIFE.pdf` es el "Códice / Diario de Campo" del explorador. Cada vez que el explorador consulta información sobre lugares, senderos, historia o gastronomía, el sistema recupera el fragmento real del códice citando la fuente y página.
* **Integración Function Calling:**
  * Herramienta obligatoria: `get_weather(fecha, ubicacion)` que consulta el tiempo en la zona del mapa antes de iniciar una expedición (por ejemplo, subir al Teide o ir a Masca), alterando las opciones o advirtiendo del peligro climático.
  * Herramientas complementarias (bonus): Consulta de inventario, cálculo de rutas o estado de senderos.
* **Atmósfera y UI (Bonus):** Formato visual retro (estilo terminal vintage o web con Gradio/Streamlit, texto en streaming tipo máquina de escribir clásica de aventura gráfica).

---

## 2. Matriz de Requisitos y Criterios de Evaluación

### Requisitos Mínimos Obligatorios (100%)

| Componente | Peso | Requisito Formal | Estado |
| :--- | :---: | :--- | :---: |
| **RAG y Conexión LLM** | 30% | Conexión a LLM comercial vía `.env`, hiperparámetros expuestos (`temp`, `top_p`, etc.), chunking de `TENERIFE.pdf`, embeddings, vector store persistente y citas explícitas de fuentes. | ⏳ Pendiente |
| **Diálogo Multiturno & Function Calling** | 25% | Memoria contextual con control estricto de límite de tokens. Al menos una función `get_weather` con JSON Schema/Pydantic, ejecución con captura de errores y log de intentos (mínimo 3 invocaciones verificadas). | ⏳ Pendiente |
| **Evaluación y Análisis Crítico** | 15% | Batería de prompts reproducibles, métricas cualitativas/cuantitativas, análisis de casos límite, alucinaciones y fallos. | ⏳ Pendiente |
| **Calidad de Código & Documentación** | 20% | Cumplimiento estricto de PEP 8, docstrings informativos, código modular, `requirements.txt` o `pyproject.toml`, `.gitignore`. | ⏳ Pendiente |
| **Experiencia de Usuario (UX)** | 10% | Interfaz amigable, mensajes de error explicativos, ejemplos claros de interacción y guía al usuario. | ⏳ Pendiente |

### Bonos Técnicos Identificados (Hasta +20%)

| Bonus | Descripción Técnica | Potencial en la Práctica | Estado |
| :--- | :--- | :--- | :---: |
| **Despliegue Web** | Interfaz interactiva en Streamlit o Gradio con diseño temático de aventura gráfica. | ⭐⭐⭐ Alto impacto visual y narrativo | ⏳ Pendiente |
| **Streaming de Tokens** | Generación de respuesta en tiempo real por streaming en la UI/consola. | ⭐⭐⭐ Encaja a la perfección con el estilo "teletipo/aventura" | ⏳ Pendiente |
| **Arquitectura Agéntica / Multiherramienta** | Coordinación mediante agentes especializados (Guía Turístico, Guardián del Teide, Meteorólogo) con herramientas específicas. | ⭐⭐⭐ Aprovecha las sesiones 5 y 6 | ⏳ Pendiente |
| **Multimodalidad** | Generación o análisis visual de postales / mapas / imágenes de Tenerife. | ⭐⭐ Gran valor añadido temático | ⏳ Pendiente |
| **Observabilidad Avanzada** | Trazas detalladas de llamadas a herramientas, consumo de tokens y latencias. | ⭐⭐ Muy valorado en el criterio de ingeniería | ⏳ Pendiente |

---

## 3. Checklist de Fases y Progreso

```
[x] FASE 1: Repaso Sesión por Sesión (Dominio Teórico y Práctico) - 100% COMPLETADA
    [x] 1.1 Sesión 01: Arquitectura Transformer & Mecanismo de Atención (Completada)
    [x] 1.2 Sesión 02: LLMs Comerciales, APIs, Memoria y Streaming (Completada)
    [x] 1.3 Sesión 03: RAG (Ingesta, Chunking, Vector Stores, Citas y Retrieval) (Completada)
    [x] 1.4 Sesión 04: Function Calling, JSON Schema y Manejo de Errores (Completada)
    [x] 1.5 Sesión 05: Agentes Autónomos, Handoffs y Guardrails (Completada)
    [x] 1.6 Sesión 06: Multiagente, MCP y Skills Modulares (Completada y Aprobada)

[>] FASE 2: Diseño y Arquitectura de la Solución
    [x] 2.0 Arquitectura Limpia Desacoplada Cliente-Servidor y Frontend Modular (Aprobada)
        * Separación estricta Backend (`src/`) y Frontend desacoplado (`frontend/`) vía API REST y Server-Sent Events (SSE).
        * Justificación de diseño para el tribunal: Clean Architecture simétrica en ambas capas (Domain, Application, Infrastructure, Presentation), superando scripts monolíticos y permitiendo portabilidad futura a App Móvil o Unreal Engine 5.
        * Backend en FastAPI (`src/api/`) sirviendo API agnóstica y estáticos web compilados.
        * Frontend con Vite + TypeScript estructurado en capas limpias:
          - `domain/`: Entidades de negocio puras (`Actor`, interfaces de inventario y estado).
          - `application/`: Casos de uso y orquestación (`GameEngine`, `ActionDispatcher`, `DialogueManager`).
          - `infrastructure/`: Clientes externos (`ApiClient` para REST/SSE, `AudioService` Web Audio API, `AssetLoader`).
          - `presentation/`: Renderizado visual reactivo (`ViewportView`, `ScummDockView`, `TelemetryView`, `PhotoAlbumModal`, `PassportModal`).
          - `styles/retro.css`: Diseño 16:9 con aprovechamiento de franjas negras laterales (Pillarboxing) para inventario dual (`#sidebar-left` y `#sidebar-right`) y barra de acción contextual ultra-limpia (`#action-dock` / `.sentence-bar`, altura ~30px). **Supresión total de la rejilla de verbos** para máxima visibilidad panorámica; interacción inteligente automática (hover en NPC activa "Hablar con...", hover en escenario activa "Mirar..."). Menú de diálogo integrado y desplegable solo en conversación.
          - `assets/img/items/`: 8 iconos vectoriales SVG artesanales en 64x64 con paleta retro VGA (Monedas, Pasaporte, Álbum, Mapa, Gofio, Comanda, Billete y Plátano).
          - `assets/img/sprites/`: Pipeline canónico de sprites Zero-Jitter (`scripts/extract_assets.py`). Lienzos transparentes fijos (Twinber 192x256 px, Paco 280x400 px), anclaje de pies clavado en `x = canvas_w // 2` y `y = ground_baseline`, con `translateX(-50%)` para suprimir 100% el temblor o desplazamiento lateral al hablar o caminar.
        * Verificación visual y compilación: Vite Dev Server en puerto 5173 con build de producción impecable (`bun run build`).
    [x] 2.1 Análisis documental de TENERIFE.pdf y Pipeline de Ingesta/Extracción de Assets (Aprobado)
        * Chunking semántico por enclaves (unidades temáticas completas por lugar sin troceo ciego).
        * Almacenamiento dual en Chroma DB: Embeddings (búsqueda) + Documento textual literal (inyección en prompt) + Metadatos (`pagina`, `zona`, `lugar`, `image_path`).
        * Pipeline de extracción multimodal: fotos del PDF a `assets/img/` vinculadas a los metadatos de los chunks.
    [x] 2.2 Selección del stack tecnológico (Aprobado)
        * Carpeta canónica del proyecto: `proyecto-tenerife/`.
        * Proveedor y arquitectura: OpenAI con SDK nativo directo (`openai>=1.40.0`, Pydantic V2, sin LangChain).
        * Servidor API: FastAPI (`fastapi>=0.110.0`) y Uvicorn (`uvicorn>=0.28.0`).
        * Modelos base de desarrollo (vía `.env`):
          - Motor principal: `gpt-4o-mini` (`OPENAI_MODEL_MAIN`).
          - Guardrail rápido: `gpt-4o-mini` (`OPENAI_MODEL_FAST`).
          - Embeddings: `text-embedding-3-small` (`OPENAI_EMBEDDING_MODEL`).
        * Vector Store: Chroma DB local (`chromadb`).
        * Frontend: TypeScript + Vite, Web Audio API y Clean Architecture.
    [x] 2.3 Especificación del guión narrativo y mecánicas de la aventura (Aprobado)
        * Objetivo Principal: Pasaporte de Explorador con 10+1 pantallas visitables (5 Norte, 5 Sur y El Teide como clímax final).
        * Objetivo Secundario (Coleccionable Multimodal): Álbum de Fotos de Tenerife (28 fotos desbloqueables interrogando al RAG).
        * Gating determinista en Python: Todo el Norte sellado para abrir el Sur; todo el Sur sellado para subir al Teide.
        * RAG Geocercado con humor de contención ante preguntas fuera de la ubicación actual.
    [x] 2.4 Diseño formal de herramientas y esquemas Pydantic (Aprobado)
        * `WeatherResponse`: clima actual con fallback resiliente.
        * `StarlightResponse`: nubosidad en Teide y fase lunar continua.
        * `CalimaResponse`: concentración PM10 y polvo mineral según AEMET.
        * `RespuestaCodiceRAG`: citas estructuradas obligatorias de páginas de `TENERIFE.pdf`.
    [x] 2.5 Arquitectura de memoria y control de ventana de tokens (Aprobado)
        * Summary Buffer híbrido (ventana reciente de 4 turnos + sinopsis narrativa acumulada).
        * Estado estructurado invariante fuera del historial (Pasaporte, Álbum, Monedas).
        * Presupuesto fijo de tokens: ~2.500 tokens por turno ($< 0.001\$$ / turno en `gpt-4o-mini`).

[x] FASE 2: Diseño y Arquitectura de la Solución - 100% COMPLETADA

[>] FASE 3: Implementación Guiada en el Notebook Principal
    [ ] 3.1 Configuración de entorno y conexión segura al LLM
    [ ] 3.2 Pipeline RAG (Indexación, Retriever con metadatos y sistema de citación)
    [ ] 3.3 Gestor de memoria conversacional multiturno con presupuesto de tokens
    [ ] 3.4 Herramienta meteorológica, simulador/API real, logging y tolerancia a fallos
    [ ] 3.5 Bucle conversacional integrado (Game Engine / Assistant Loop)

[ ] FASE 4: Bonificaciones Técnicas (Web UI, Streaming y Agentes)
    [ ] 4.1 Implementación del streaming de respuesta
    [ ] 4.2 Interfaz Web temática (Gradio / Streamlit estilo retro adventure)
    [ ] 4.3 Multi-herramienta / Multi-agente (si aplica según diseño)

[ ] FASE 5: Evaluación Rigurosa, Documentación e Informe
    [ ] 5.1 Batería de pruebas empíricas (Casos de éxito, casos límite, fallos de herramienta)
    [ ] 5.2 Análisis crítico de resultados, latencias y costes
    [ ] 5.3 Redacción del Informe Técnico Final (PDF/Markdown de entrega)
    [ ] 5.4 Repositorio, README impecable, requirements y checklist PEP 8
```

---

## 4. Registro de Sesiones de Aprendizaje

### Sesión 01: La Arquitectura Transformer y el Mecanismo de Atención
* **Estado:** ✅ Completada y Asimilada
* **Conceptos dominados:**
  * Cuello de botella recurrente ($O(n)$ secuencial) vs paralelización Transformer.
  * Atención escalada: $\text{Softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$.
  * Rol intuitivo de Queries, Keys y Values (búsqueda asociativa).
  * Justificación matemática del factor de escala $\sqrt{d_k}$ (estabilidad de gradientes).
  * Autoatención global vs causal (máscara triangular superior) vs atención cruzada.
  * Codificación posicional (sinusoidal y aprendida) para inyectar orden espacial.
  * Feed-Forward Networks y normalización residual (LayerNorm).
* **Notas de discusión:** Dominados los conceptos de cuello secuencial de RNNs, escalado $\sqrt{d_k}$, cabezas de atención múltiples y generación autorregresiva causal.

### Sesión 02: LLMs Comerciales, APIs, Memoria y Streaming
* **Estado:** ✅ Completada y Asimilada
* **Conceptos dominados:**
  * Patrón común cliente-modelo-respuesta (OpenAI y Google Gemini).
  * Hiperparámetros de generación (`temperature`, `top_p`, `max_tokens`).
  * Por qué los LLMs son "stateless" (sin estado) por defecto.
  * Estrategias de memoria multiturno (Summary Buffer para la trama de Twinber).
  * Salidas estructuradas (JSON Schema y Pydantic) para contratos deterministas de juego.
  * Streaming de tokens para TTFT inmediato y experiencia arcade/teletipo.

### Sesión 03: RAG (Retrieval-Augmented Generation)
* **Estado:** ✅ Completada y Asimilada (Aporte del 30% a la evaluación)
* **Conceptos dominados:**
  * Elección de Chunking Semántico Estructurado por Lugares con metadatos para `TENERIFE.pdf`.
  * Preservación del overlap para evitar mutilación de relaciones causales y semánticas.
  * Extracción y enlace multimodal de fotografías del PDF (`assets/img/`).
  * Indexación vectorial con Chroma DB y búsqueda semántica con similitud coseno.
  * Reglas de oro de Grounded Prompting y garantía de citas de fuentes y páginas mediante Pydantic.

### Sesión 04: Function Calling y LLMs con Herramientas
* **Estado:** ✅ Completada y Asimilada (Aporte del 25% a la evaluación)
* **Conceptos dominados:**
  * Protocolo de 2 pasos de Function Calling: interceptación de `tool_calls` y devolución de rol `tool`.
  * Esquemas Pydantic para la herramienta `get_weather(fecha, ubicacion)`.
  * Manejo resiliente de excepciones con `try/except` devolviendo payloads explicativos al LLM para integración narrativa.
  * Logging estructurado de auditoría (timestamp, tool, args, estado `SUCCESS`/`ERROR`) para cumplir los requisitos de evaluación.

### Sesión 05: Agentes Autónomos, Handoffs y Guardrails
* **Estado:** ✅ Completada y Asimilada
* **Conceptos dominados:**
  * Bucle agéntico autónomo frente a tool calling estático y lineal.
  * Elección del patrón Supervisor (Narrador) + Subagentes como Herramientas frente a Handoffs directos.
  * Personalidad y tono temático propio para cada subagente.
  * Guardrails de entrada (patrón portero / bouncer con modelo ligero y Pydantic) y salida para contención de temática y seguridad.

### Sesión 06: Arquitecturas Multiagente, MCP y Skills Modulares
* **Estado:** ✅ Completada y Aprobada por el usuario
* **Puntos acordados y documentados:**
  * Recursos MCP (*Resources*):
    * ✅ Aprobados: `tenerife://mapa/conexiones` y `tenerife://glosario/canario`.
    * ❌ Descartado: `tenerife://codice/{zona}` descartado expresamente por el usuario para evitar saltarse el RAG y garantizar que toda consulta documental pase por el motor de búsqueda semántica.
  * Herramientas MCP (*Tools*) validadas empíricamente (Open-Meteo, 100% públicas, sin API keys ni costes):
    * `get_weather`: endpoint forecast probado para Tenerife.
    * `get_starlight_conditions`: nubosidad en Teide y `moon_phase` continuo probado.
    * `get_calima_alert`: endpoint air-quality probado con `dust` y `pm10` (estándar AEMET).
  * Política no bloqueante del clima y consola retro (`~`) para observabilidad.

### Sesión 07: Prototipado y Validación Frontend del Primer Escenario (Puerto de la Cruz)
* **Estado:** ✅ Completada y Validada 100% en Navegador
* **Puntos acordados y documentados:**
  1. **Locomoción y Límites Físicos:**
     * Twinber confinado a los adoquines transitables del muelle `[minX: 18.0%, maxX: 72.0%]` con línea de suelo en `bottom: 11%`. Evita que el personaje vuele sobre el mar o traspase barriles.
  2. **Matriz Canónica de 6 Verbos SCUMM:**
     * `HABLAR`, `MIRAR`, `USAR`, `COMPRAR` (economía de 15 monedas con NPCs), `VIAJAR` (guaguas y red insular), `💡 PENSAR` (monólogo interior con pistas adaptativas).
  3. **Álbum de Fotos y Pipeline RAG:**
     * Las 28 fotos catalogadas en `docs/matriz_fotos_rag.md` (12 vía `MIRAR` en escenario, 16 vía `HABLAR` con NPCs).
     * Modal de 1 foto a pantalla completa por página, sin pistas en ranuras bloqueadas (`[ 📷 FOTO #XX - BLOQUEADA ]`), pie de foto conciso de `TENERIFE.pdf`.
     * Desbloqueo gobernado por el Retriever mediante metadatos (`photo_id`) con geocercado estricto (la vista lejana del Teide no desbloquea la cumbre).
  4. **Control Manual de Diálogos:**
     * Eliminación de temporizadores automáticos de desaparición.
     * Botón interactivo parpadeante `[ ▶ CONTINUAR [ESPACIO] ]` que pausa indefinidamente hasta confirmación del jugador por ratón o teclado.
  5. **Sistema de Diálogo Ramificado con NPCs (Estilo LucasArts):**
     * Sustitución del dock de verbos por 4 opciones al hablar con un lugareño:
       - `1. "¿Puede sellarme el pasaporte?"` (Mecánica de juego sin RAG, marca la zona comarcal en el pasaporte: `1/10`).
       - `2. "¿Qué me puede contar de esta zona?"` (Consulta RAG genérica de zona, sin preconocimiento del PDF, desbloquea foto asociada).
       - `3. ⌨️ [ Input libre del usuario ]` (Prompt abierto al LLM tecleado en tiempo real con respuesta contextual del NPC y log de auditoría).
       - `4. "Tengo que marcharme. ¡Hasta luego!"` o `[ESC]` (Cierra el diálogo y restaura la botonera normal).
  6. **Visualización del Pasaporte de Explorador a Doble Página (5 Pliegos):**
     * Cuaderno oficial de visados abierto a doble página simultánea (5 pliegos x 2 páginas = 10 páginas / 10 sellos territoriales).
     * Sellos vectoriales retro auténticos en tinta de colores, fecha de aduana, icono característico del enclave y firma del NPC.
     * Ranuras bloqueadas con recuadro punteado de seguridad oficial y advertencia `🔒 PENDIENTE DE EXPEDICIÓN`.
     * Navegación por pliegos con flechas, teclado y sonido de pasar página de papel (`playPageTurn()`).

### Sesión 08: Expansión Panorámica a 13 Enclaves y Ergonomía Visual
* **Estado:** ✅ Completada y Validada (`docs/enclaves_validation.md`)
* **Hitos alcanzados:**
  * Generación y adaptación de fondos píxel art VGA panorámicos 16:9 (1280x720 px) para los 13 enclaves oficiales de la isla:
    - *Norte (5):* Puerto de la Cruz, La Orotava, Santa Úrsula, Icod de los Vinos, Garachico.
    - *Metropolitana (3):* San Cristóbal de La Laguna, Santa Cruz de Tenerife, Parque Rural de Anaga.
    - *Sur (3):* Costa Adeje, Barranco de Masca, El Médano.
    - *Cumbre (2):* Las Cañadas del Teide, Pico del Teide (3.718m).
  * Rediseño ergonómico de la interfaz de aventura gráfica:
    - Reubicación de subtítulos de diálogo al cuadrante superior izquierdo (`top: 7%, left: 4%, max-width: 50%`) para despejar totalmente los personajes y la escena central.
    - Anclaje físico de Twinber y de los NPCs al suelo transitable (`bottom: 7-8%`) sobre adoquines, arena o riscos según el escenario.

### Sesión 09: Generación de Sprites y Motor Zero-Jitter Engine
* **Estado:** ✅ Completada y Validada
* **Hitos alcanzados:**
  * Generación de hojas de sprites pixel art (2 filas x 4 columnas: 4 frames IDLE + 4 frames TALK) para los 13 NPCs temáticos más Twinber (14 personajes / 112 frames en total).
  * Creación del pipeline canónico de extracción y normalización en `scripts/extract_assets.py` con el **Zero-Jitter Engine**:
    - **Lienzo Uniforme Fijo:** Todos los frames de un personaje comparten exactamente el mismo ancho y alto con canal alfa transparente.
    - **Ground Foot Anchor:** El centro de gravedad horizontal de los pies (15% inferior de píxeles) se alinea estrictamente al centro del lienzo (`anchor_x = canvas_w // 2`) y la suela del calzado a una línea de tierra constante (`anchor_y = 450 px`).
    - Eliminación completa de saltos, temblores y bamboleos laterales al alternar entre reposo y diálogo.

### Sesión 10: Mapa Cartográfico de Tenerife & Animación Indiana Jones
* **Estado:** ✅ Completada y Validada
* **Hitos alcanzados:**
  * Generación de la carta náutica/mapa en pergamino de Tenerife en formato panorámico 16:9 (`map_tenerife.jpg`).
  * Implementación del componente `IslandMapModal.ts` con overlay SVG cartográfico:
    - Trazado de las principales vías insulares (TF-1 Autopista del Sur, TF-5 Autopista del Norte, TF-24 Dorsal de La Esperanza / Mar de Nubes, TF-21 Carretera del Teide).
    - Animación cinemática de trayecto tipo *Indiana Jones* con línea de puntos rojos discontinua que avanza progresivamente desde el origen hasta el destino, acompañada del icono del medio de transporte (avión o guagua/coche).
    - Reglas de movilidad deterministas del Pasaporte (`TravelRules.ts`): enclaves bloqueados hasta reunir los sellos requeridos de la zona.
    - Subsanación de incidencias visuales: eliminación del glitch de parpadeo/temblor vertical al hacer hover sobre los marcadores y corrección del anclaje del icono en La Orotava.

### Sesión 11: Auditoría y Calibración Visual de Zonas Calientes (Chroma Key)
* **Estado:** ✅ Completada y Documentada (`docs/calibracion_zonas_calientes_chroma.md`)
* **Hitos alcanzados:**
  * Implementación de un sistema de diagnóstico visual mediante máscara Chroma Key fluorescente semitransparente (`rgba(0, 255, 68, 0.38)`) con bordes discontinuos y etiquetas en tiempo real.
  * Auditoría individual de los 13 escenarios con captura automatizada mediante Playwright:
    - Corrección de desalineaciones críticas e inversiones de etiquetas (ej: Castillo de San Miguel en Garachico, Auditorio de Calatrava en Santa Cruz, Montaña Roja en El Médano, Caserío de Masca).
    - Delimitación milimétrica de elementos patrimoniales y naturales clave (Roque Cinchado, Barricas del Guachinche, Rueda del Molino de Gofio, Drago Milenario, Telescopio de cumbre).
  * Retirada limpia de la máscara Chroma Key tras la validación exhaustiva, dejando los *hotspots* transparentes y perfectamente calibrados.

### Sesión 12: Corrección Artesanal de Sprites (Manolo el Tabernero)
* **Estado:** ✅ Completada y Verificada
* **Hitos alcanzados:**
  * Detección y solución del recorte en `manolo_talk_1.png`, donde la jarra de vino de barro presentaba un corte vertical recto en el margen derecho.
  * Análisis del spritesheet original: el arte pixel art contenía la jarra completa hasta `x = 623 px`, pero al normalizar sobre un lienzo de 280 px con pies en `x = 140 px`, la jarra sobrepasaba el límite derecho en 30 píxeles.
  * Ajuste en `scripts/extract_assets.py` ampliando el lienzo de Manolo a `360x460 px` con anclaje a `(180, 450 px)` para todos sus frames de reposo y habla, preservando el anclaje Zero-Jitter sin saltos y restituyendo la jarra de barro 100% íntegra con sus contornos redondeados.

### Sesión 13: Laboratorio Visual de Animaciones (`SHOW_ANIMS`)
* **Estado:** ✅ Completada y Lista para Verificación
* **Hitos alcanzados:**
  * Implementación del componente `AnimationViewerModal.ts` y su integración en la consola interactiva de telemetría (tecla `T`).
  * Creación del comando de consola `SHOW_ANIMS [filtro]` (con alias `ANIMS`, `ANIMACIONES`, `SHOW_ANIMATIONS`) y botón de acceso rápido `[🎬 ANIMS]` en la cabecera CRT.
  * Funcionalidades del laboratorio:
    - Visualización simultánea de los **14 personajes** (Twinber + 13 NPCs) en una cuadrícula retro VGA.
    - Comparativa en paralelo por personaje: columna de **REPOSO (IDLE)** y columna de **HABLA (TALK)** reproduciéndose en bucles continuos con sus cadencias reales de animación.
    - Selector de velocidad de reproducción (`1.0x Normal`, `0.5x Lento`, `0.25x Super Lento`, `2.0x Rápido`) y botón de pausa para inspección fotograma a fotograma.
    - Selector de fondos de contraste: `🏁 AJEDREZ` (patrón de transparencia), `⬛ OSCURO` (escena nocturna), `⬜ CLARO` (siluetas y contornos) y `🟩 CHROMA` (fondo verde fluorescente de recorte).
    - Filtros temáticos por región (`Todos`, `Norte`, `Metropolitana`, `Sur`, `Teide`).

### Sesión 14: Gestión de Versiones y Repositorio Oficial en GitHub
* **Estado:** ✅ Sincronizado y al Día
* **Hitos alcanzados:**
  * Creación y vinculación del repositorio remoto: [`https://github.com/Twinber/tenerife-llm-practica-pontia`](https://github.com/Twinber/tenerife-llm-practica-pontia).
  * Sincronización continua de la rama `master` con commits atómicos convencionales (`feat`, `fix`, `docs`).
  * Todos los cambios de código, scripts, assets, documentación y evidencias gráficas respaldados en la nube.

---

## 5. Próximos Pasos Inmediatos: Entrada en FASE 3 (Backend LLM & RAG)

Con la capa de presentación y experiencia de usuario (Frontend) 100% implementada y calibrada, la hoja de ruta se enfoca ahora en el núcleo de inteligencia artificial:

1. **Configuración del Entorno Backend (`src/`):**
   - Carga de credenciales y variables de entorno (`.env` con OpenAI API Key y configuración de modelos).
   - Verificación de dependencias en `requirements.txt` (`fastapi`, `uvicorn`, `openai`, `chromadb`, `pydantic`).
2. **Pipeline RAG Vectorial (`src/application/rag_service.py`):**
   - Ingesta semántica estructurada de `data/TENERIFE.pdf` sin fragmentación ciega.
   - Indexación vectorial en Chroma DB persistente con metadatos de enclaves, páginas y fotografías asociadas.
   - Retriever con geocercado estricto y citas explícitas de página mediante Pydantic.
3. **Servicio de Function Calling y Open-Meteo (`src/infrastructure/weather_client.py`):**
   - Implementación de `get_weather`, `get_starlight_conditions` y `get_calima_alert` con llamadas HTTP reales y fallback resiliente.
   - Sistema de logging estructurado de auditoría en disco (`game_audit.log`).
4. **Gestión de Memoria Conversacional Multiturno (`src/application/memory_service.py`):**
   - Summary Buffer híbrido con control riguroso de ventana de tokens.
5. **API REST + SSE en FastAPI (`src/api/`):**
   - Endpoints para conectar el frontend web existente con el motor de IA para el streaming teletipo de respuestas en tiempo real.
6. **Notebook de Entrega Oficial (`notebook_principal.ipynb`):**
   - Cuaderno reproducible con la memoria técnica, justificaciones teóricas, batería de pruebas de evaluación, análisis de costes y modo de juego integrado.

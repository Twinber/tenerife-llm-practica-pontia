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
    [x] 2.0 Arquitectura Limpia por Capas y Elección de UI (Aprobada)
        * Separación estricta Backend (`src/`) y UI agnóstica (`TurnResult`).
        * Gradio seleccionado como motor de interfaz oficial retro (SCUMM Point & Click).
        * 3 Modos de ejecución: App Web independiente (`python -m src.ui.web_retro_app`), Celda Jupyter (`launch_game(inline=True)`) y Terminal CLI.
    [x] 2.1 Análisis documental de TENERIFE.pdf y Pipeline de Ingesta/Extracción de Assets (Aprobado)
        * Chunking semántico por enclaves (unidades temáticas completas por lugar sin troceo ciego).
        * Almacenamiento dual en Chroma DB: Embeddings (búsqueda) + Documento textual literal (inyección en prompt) + Metadatos (`pagina`, `zona`, `lugar`, `image_path`).
        * Pipeline de extracción multimodal: fotos del PDF a `assets/img/` vinculadas a los metadatos de los chunks.
    [x] 2.2 Selección del stack tecnológico (Aprobado)
        * Carpeta canónica del proyecto: `proyecto-tenerife/`.
        * Proveedor y arquitectura: OpenAI con SDK nativo directo (`openai>=1.40.0`, Pydantic V2, sin LangChain).
        * Modelos base de desarrollo (vía `.env`):
          - Motor principal: `gpt-4o-mini` (`OPENAI_MODEL_MAIN`).
          - Guardrail rápido: `gpt-4o-mini` (`OPENAI_MODEL_FAST`).
          - Embeddings: `text-embedding-3-small` (`OPENAI_EMBEDDING_MODEL`).
        * Vector Store: Chroma DB local (`chromadb`).
        * UI: Gradio con soporte dual (web standalone y celda inline).
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






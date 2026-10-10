# Diseño de Juego & Especificación Técnica: *Twinber en Busca del Secreto Guanche*

**Género:** Aventura Gráfica Conversacional Retro (Inspirada en *The Secret of Monkey Island* e *Indiana Jones and the Fate of Atlantis*).  
**Protagonista:** **Twinber**, aventurero y explorador.  
**Escenario:** La isla de Tenerife (Guía oficial: `TENERIFE.pdf`).  
**Arquitectura Subyacente:** LLM Comercial + RAG Semántico + Function Calling + Gestor de Estado.

---

## 0. Arquitectura de Software Limpia (Clean Architecture) y Desacoplamiento de UI

* **Filosofía de Diseño:**
  * La "aventura gráfica retro" o cualquier presentación visual es un **adaptador de interfaz (UI)** intercambiable.
  * El **núcleo de la práctica es un backend agéntico en Python puro**, estructurado por capas y con estricta separación de responsabilidades e inversión de dependencias.
  * Permite ser consumido sin cambios por:
    1. Un bucle interactivo de celdas en el Jupyter Notebook (`notebook_principal.ipynb`, entrega oficial).
    2. Una consola de terminal CLI interactiva.
    3. Una aplicación web (Gradio / Streamlit).

* **Capas de la Arquitectura:**
  1. **Capa 1: Dominio y Contratos (Core):**
     * Modelos de datos inmutables y esquemas Pydantic (`GameState`, `Inventory`, `LocationNode`, `WeatherInfo`, `CalimaAlert`, `StarlightInfo`).
     * Sin dependencias externas ni acoplamientos a frameworks.
  2. **Capa 2: Infraestructura y Adaptadores (Ports & Adapters):**
     * Adaptadores externos: `OpenMeteoClient` (HTTP con fallback offline resiliente), `ChromaVectorStoreAdapter` (embeddings y base vectorial), `LLMClientAdapter` (OpenAI / Gemini SDK), `PDFExtractor` (parser de texto e imágenes), `AuditLogger` (`game_audit.log`).
  3. **Capa 3: Aplicación y Casos de Uso (Services & Orchestration):**
     * `AssistantEngine` (orquestador del bucle conversacional del turno).
     * `RAGService` (búsqueda semántica, filtrado por metadatos y citación formal obligatoria).
     * `GuardrailService` (portero ligero de entrada y validador semántico/regex de salida).
     * `ToolDispatcher / MCPService` (resolución y ejecución de tools y recursos MCP).
     * `MemoryService` (gestión de ventana deslizante + Narrative Summary Buffer).
  4. **Capa 4: Presentación y Entrega (UI - Gradio Seleccionado):**
     * **Marco Elegido:** Gradio (soporte nativo de streaming, CSS retro inyectable, componentes reactivos y compatibilidad dual).
     * **3 Modos de Ejecución Independientes:**
       1. *Modo Aplicación Web Independiente:* `python -m src.ui.web_retro_app` (se ejecuta a pantalla completa en `http://localhost:7860`).
       2. *Modo Evaluación en Jupyter Notebook:* `launch_game(inline=True)` (se incrusta en la celda de salida para corrección directa del evaluador).
       3. *Modo Terminal / CLI:* `python -m src.ui.terminal_cli` (interfaz ligera por consola para pruebas y depuración ágil).

* **Ubicación Canónica del Proyecto:**
  * Carpeta raíz independiente: `proyecto-tenerife/`
  * Contiene todo el código fuente del backend (`src/`), assets, datos, libreta de entrega y entorno.

* **Stack Tecnológico Oficial Seleccionado:**
  * **Proveedor LLM:** OpenAI (SDK nativo directo `openai`, sin frameworks intermedios).
  * **Modelo Principal (Narrativa & Tools):** `gpt-4o-mini` (configurable vía `OPENAI_MODEL_MAIN` en `.env`).
  * **Modelo Rápido (Guardrail Bouncer):** `gpt-4o-mini` (configurable vía `OPENAI_MODEL_FAST` en `.env`).
  * **Modelo de Embeddings:** `text-embedding-3-small` (configurable vía `OPENAI_EMBEDDING_MODEL` en `.env`).
  * **Base de Datos Vectorial:** Chroma DB local (`chromadb`).
  * **APIs Externas:** Open-Meteo (Weather Forecast & Air Quality, sin API key, pública).
  * **Framework de Interfaz:** Gradio (Point & Click retro, modo app web y celda inline).

* **Contrato Público de Comunicación:**
  * La UI interactúa con el backend a través de una única interfaz: `engine.step(user_message: str) -> TurnResult`.
  * `TurnResult` devuelve: `narrative: str`, `state: GameState`, `visual_asset: Optional[str]`, `citations: list[RespuestaCodice]`, `audit_events: list[AuditEvent]`.

---

## 1. Núcleo Jugable y Mecánicas

### 1.1. El Objetivo del Juego: El Pasaporte de Explorador
* **La Misión de Twinber:** Twinber desembarca en Tenerife con un **Pasaporte de Explorador** que debe ir sellando visitando cada rincón de la isla.
* **El Gran Final (Clímax):** El ascenso a las cumbres del Teide y la contemplación de un cielo estrellado inolvidable desde el Parque Nacional, resolviendo el enigma astronómico del Códice con las tools `get_weather` y `get_starlight_conditions`.
* **Las 10+1 Pantallas Visibles con Fondos Pixel-Art Representativos:**
  * **Zona Norte (5 sellos obligatorios):**
    1. *Santa Cruz de Tenerife* (Avenida Marítima, Plaza de España, Auditorio).
    2. *San Cristóbal de La Laguna* (Casco colonial, Plaza de la Concepción).
    3. *Parque Rural de Anaga* (Mirador Pico del Inglés y Playa salvaje de Benijo).
    4. *La Orotava* (Balcones de madera, Molino de Chano y gofio).
    5. *Puerto de la Cruz* (Muelle pesquero, San Telmo y Lago Martiánez).
  * **Zona Sur (5 sellos obligatorios):**
    6. *Costa Adeje* (Playas de Troya/Torviscas, Siam Park).
    7. *Los Gigantes* (Acantilados volcánicos y avistamiento de cetáceos).
    8. *Masca* (Caserío y sendero del barranco).
    9. *El Médano & La Tejita* (Montaña Roja y playas de viento).
    10. *Los Cristianos* (Puerto marinero y Playa de Las Vistas).
  * **Zona Centro (Clímax Final):**
    11. *El Teide* (Parador de las Cañadas, Roques de García, Teleférico y Cielo Starlight nocturno).

### 1.2. El Objetivo Secundario (Coleccionable Multimodal): El Álbum de Fotos de Tenerife
* **Misión Opcional / Completionist:** Twinber lleva un **Álbum de Explorador** cuyo objetivo es desbloquear el 100% de las fotografías reales extraídas de `TENERIFE.pdf` (aproximadamente 28 fotos catalogadas).
* **Mecánica de Desbloqueo (Gatillo RAG):**
  * Al visitar un enclave, se desbloquea la postal principal del lugar.
  * Para desbloquear las fotos secundarias (miradores recónditos, playas salvajes como Bollullo/Los Patos, balcones coloniales, platos de comida o teleférico), el jugador debe **interrogar al RAG** haciendo preguntas específicas al LLM.
  * Cuando el retriever devuelve un chunk con `image_path`, la imagen se "revela" automáticamente en el álbum:  
    > 📸 *¡Nueva foto añadida a tu Álbum de Explorador: "Mirador de La Tarta (Pág. 11)"! [Progreso: 5/28 (18%)]*
* **Visualización en UI:** Un panel desplegable tipo álbum de cromos/diapositivas retro donde las fotos no descubiertas aparecen oscurecidas con un interrogante `[ ❓ Foto sin descubrir ]`.

### 1.3. Reglas de Gating Deterministas (Progresión por Zonas en Python)
* **El Estado manda (Cero Alucinaciones):** El pasaporte se modela como un objeto Pydantic determinista (`PasaporteTenerife`).
* **Barrera Norte $\rightarrow$ Sur:** Se deben visitar y sellar **las 5 ubicaciones del Norte** para desbloquear las guaguas hacia el Sur. Si el jugador intenta saltar al Sur antes de tiempo, los conductores de TITSA o los NPCs le cortan el paso con humor canario.
* **Barrera Sur $\rightarrow$ El Teide:** Se deben tener **los 5 sellos del Sur** para que los guardas forestales permitan el ascenso a las Cañadas del Teide por la TF-24.

### 1.4. RAG Geocercado (*Spatial Context Filter* & Contención con Humor)
* **Consulta Local Libre:** En cada enclave, el jugador puede preguntar lo que quiera sobre *esa* ubicación. La información se extrae del RAG de `TENERIFE.pdf` con metadatos filtrados por lugar (`where={"lugar": current_location}`).
* **Filtro de Discrepancia Espacial:** Si el jugador intenta preguntar deliberadamente por un sitio de otra zona distinta a donde está físicamente (ej. preguntar por las olas del Siam Park mientras está en La Laguna), el modelo no responde el dato y le reconviene amigablemente con humor de aventura gráfica:  
  > *"¡Chacho, despacio explorador! Aún tienes los pies en los adoquines de La Laguna. No quieras comerte la isla antes de tiempo; cuando llegues al Sur ya hablaremos de parques acuáticos. ¡Mira a tu alrededor!"*

### 1.5. Sistema de Viaje Cinematográfico Estilo Indiana Jones
* **El Homenaje a Indiana Jones:** Al desplazarse entre enclaves, la pantalla conmuta a un **mapa de Tenerife estilo pergamino de expedición**.
* **Línea Roja Discontinua Animada:** Mediante un componente SVG animado con CSS puro (`stroke-dashoffset`), se dibuja en 1.5 a 2 segundos una **línea de puntos rojos** sobre la carretera real (TF-5, TF-1, TF-24) uniendo origen y destino.
* **Sensación de Viaje:** Un rótulo dinámico anuncia el trayecto (*"Twinber toma la guagua de TITSA por la TF-5 hacia San Cristóbal de La Laguna..."*) antes de dar paso a la nueva postal pixel-art y sus personajes interactivos.

### 1.6. Separación Clave de Arquitectura: Estado vs. Conversación
* **El Texto es No Determinista (LLM):** La narración, descripciones y diálogos con lugareños o personajes no jugadores (NPCs) los genera el LLM con estilo inmersivo y humor fino.
* **El Estado es Determinista (Python State Engine):**
  * El **Pasaporte** e **Inventario** se mantienen en una estructura de datos estricta en memoria (`Pydantic`).
  * Los **Permisos y Sellos** se gestionan mediante **Function Calling (Tools)**.
  * La IA consulta el estado del jugador usando herramientas antes de permitir o denegar el avance a una zona.

### 1.7. Justificación Técnica del Chunking Semántico y Soporte Multimodal
* **Justificación de Diseño (para el Informe Final):**
  * Si tuviéramos un corpus inmenso de documentos heterogéneos y desconocidos, la opción adecuada sería un chunking heurístico de caracteres/tokens (`RecursiveCharacterTextSplitter`).
  * Sin embargo, dado que conocemos la estructura exacta de `TENERIFE.pdf` (25 páginas organizadas por enclaves geográficos y temáticos) y el objetivo es una aventura gráfica sin contaminación cruzada ni ruido, se adopta un **Chunking Semántico Estructurado por Lugares y Enclaves**.
  * Cada chunk preserva la unidad temática completa de un punto de interés con metadatos enriquecidos:
    `{"lugar": str, "zona": str, "pagina": int, "image_path": Optional[str]}`.
* **Almacenamiento Dual en Chroma DB:**
  * Chroma DB almacena simultáneamente el vector denso (para similitud coseno matemática), el documento textual literal (para inyectarlo directamente en el prompt del LLM) y el diccionario de metadatos (para filtrado y citas rigurosas).
* **Estrategia Multimodal (Bonus):**
  * Durante la fase de indexación se extraen las fotografías de `TENERIFE.pdf` a la carpeta `assets/img/`.
  * Cada chunk almacena la ruta de su imagen correspondiente.
  * Al recuperar el contexto en el juego, la interfaz proyecta la postal visual del lugar junto a la narración y la cita de la fuente.

### 1.8. Contratos Pydantic Formales del Dominio (`src/domain/`)

* **1. Herramienta Meteorológica (`WeatherResponse`):**
  ```python
  class WeatherResponse(BaseModel):
      ubicacion: str = Field(description="Nombre del enclave consultado (ej. Santa Cruz, El Teide)")
      temperatura_c: float = Field(description="Temperatura actual en grados Celsius")
      humedad_pct: int = Field(description="Humedad relativa del aire (%)")
      sensacion_termica_c: float = Field(description="Sensación térmica calculada (°C)")
      descripcion_clima: str = Field(description="Condición meteorológica humana (Despejado, Nublado, Lluvia...)")
      viento_kmh: float = Field(description="Velocidad del viento en km/h")
      simulated: bool = Field(default=False, description="True si se activó el fallback offline")
  ```

* **2. Herramienta Astronómica / Starlight (`StarlightResponse`):**
  ```python
  class StarlightResponse(BaseModel):
      ubicacion: str = Field(default="Parque Nacional del Teide (2.390 m)")
      cobertura_nubes_pct: int = Field(description="Porcentaje de nubes en cumbre (0% = cielo raso)")
      fase_lunar: float = Field(description="Valor de 0.0 (Luna Nueva / Óptimo) a 0.5 (Luna Llena)")
      nombre_fase_lunar: str = Field(description="Nombre descriptivo (Luna Nueva, Creciente, Llena, Menguante)")
      calidad_observacion: Literal["Excelente", "Buena", "Aceptable", "Baja visibilidad"]
      aviso_narrativo: str = Field(description="Contexto para el Narrador (modificador no bloqueante)")
      simulated: bool = Field(default=False)
  ```

* **3. Herramienta de Alerta de Calima (`CalimaResponse`):**
  ```python
  class CalimaResponse(BaseModel):
      zona: str = Field(description="Zona consultada (Norte, Sur o Cumbres)")
      pm10_ug_m3: float = Field(description="Concentración de partículas PM10 en microgramos por m³")
      polvo_mineral_ug_m3: float = Field(description="Concentración específica de polvo sahariano")
      nivel_alerta: Literal["Aire Limpio", "Calima Ligera", "Alerta Calima Densa"]
      efecto_visual: str = Field(description="Modificador visual/atmosférico para la narración")
      simulated: bool = Field(default=False)
  ```

* **4. Esquema RAG con Citas Obligatorias (`RespuestaCodiceRAG`):**
  ```python
  class RespuestaCodiceRAG(BaseModel):
      narracion_turistica: str = Field(description="Explicación o pista turística integrada en la aventura de Twinber")
      paginas_citadas: list[int] = Field(description="Páginas exactas de TENERIFE.pdf que respaldan el dato")
      lugar_referenciado: str = Field(description="Enclave de la isla sobre el que versa la respuesta")
      cita_textual_evidencia: str = Field(description="Cita textual exacta que respalda el dato aportado")
      foto_desbloqueada_id: Optional[str] = Field(default=None, description="ID de la foto si este chunk la contiene")
  ```

* **5. Registro de Auditoría (`AuditEvent` para Consola `~` y `game_audit.log`):**
  ```python
  class AuditEvent(BaseModel):
      timestamp: str
      tipo_evento: Literal["TOOL_CALL", "RAG_RETRIEVAL", "GUARDRAIL_CHECK", "STATE_MUTATION"]
      nombre_operacion: str
      argumentos: dict
      resultado_resumen: str
      latencia_ms: float
      estado: Literal["SUCCESS", "FALLBACK", "ERROR", "BLOCKED"]
  ```

### 1.9. Arquitectura Agéntica: Patrón Supervisor + Subagentes como Herramientas
* **Decisión de Diseño y Justificación Técnica (para el Informe):**
  * Se descarta el patrón de *Handoffs* completos porque transferir la conversación activa a especialistas obligaría a pasarles todo el inventario e historial acumulado, disparando los costes de tokens y el riesgo de spoilers o descontrol del estado.
  * Se adopta el patrón de **Supervisor (Narrador Central como Dungeon Master)** con **Subagentes Especialistas como Herramientas**:
    * **Narrador Principal (Supervisor):** Mantiene la visión de conjunto de la aventura, la memoria de hitos de Twinber, el inventario determinista y el tono retro de comedia de los 90.
    * **Subagentes Especialistas (Herramientas con Personalidad Propia):**
      * Cada subagente cuenta con su propio *System Prompt* que define su personalidad, tono de respuesta y vocabulario canario/temático:
        * *El Meteorólogo de la Radio:* Técnico, formal, obsesionado con los vientos alisios y las alertas climáticas del Teide.
        * *El Sabio del Códice RAG:* Un historiador erudito que cita páginas y fuentes documentales con rigor arqueológico.
        * *Lugareños y NPCs (ej. Pescador de Anaga, Tabernero del Guachinche):* Personajes pintorescos con giros locales (expresiones canarias, refranes populares y humor retro).
      * Devuelven sus respuestas caracterizadas para que el Narrador las proyecte directamente en el diálogo con Twinber.
    * **Beneficio:** Máxima contención de contexto, aislamiento de responsabilidades, riqueza narrativa y cero spoilers.

### 1.10. Sistema de Guardrails de Entrada y Salida (Contención y Seguridad)
* **Guardrail de Entrada (El Portero / Bouncer):**
  * Modelo ligero (`gpt-4o-mini`) con esquema Pydantic para clasificación en milisegundos.
  * Intercepta ataques de *Prompt Injection*, intentos de *Jailbreak* y cambios de rol antes de que consuman el contexto del Narrador.
  * *Respuesta Cortafuegos Inmersiva:* En lugar de errores HTTP, responde con misterio dentro del juego:
    *"Twinber tropieza con una extraña roca volcánica... Una brisa misteriosa desvanece tus palabras: 'Esos trucos no funcionan en esta isla, aventurero'."*
* **Guardrail de Salida (Verificación y Anti-Fugas):**
  * *Filtro Rápido Determinista (Regex):* Detección y bloqueo inmediato de patrones de API Keys (`sk-...`, `AIzaSy...`) o fragmentos del System Prompt confidencial.
  * *Validador Crítico Semántico:* Verificación de que el Narrador no alucine objetos o vehículos imposibles que rompan las reglas lógicas del inventario y la geografía de Tenerife.

### 1.11. Observabilidad en Tiempo Real: "Consola de Desarrollador Retro" (Tecla `~`)
* **Mecánica Retro & Telemetría:**
  * Inspirado en la consola clásica de los juegos de los 90 (estilo *Quake* o *Doom* accesible con la tecla `~`), la aplicación cuenta con una **Consola de Depuración en Tiempo Real** con estética terminal CRT (fondo negro, texto verde fósforo).
* **Registro Dual (Memoria + Disco):**
  * Cada interacción se audita simultáneamente en un archivo persistente (`game_audit.log` / `telemetry.jsonl`) y en un buffer en memoria para la UI.
  * Eventos auditados:
    1. *Guardrails:* Intentos bloqueados vs peticiones seguras con su latencia.
    2. *Herramientas:* Invocaciones a `get_weather` y tools de inventario, argumentos, resultado y control de excepciones (mínimo 3 llamadas auditadas exigidas por la rúbrica).
    3. *RAG:* Chunks recuperados de Chroma DB, páginas citadas y distancias de similitud.
    4. *Tokens y Costes:* Conteo exacto de tokens de entrada/salida y latencia total por turno.
* **Impacto en Evaluación:** Cumple el requisito de logging obligatorio del 25% y desbloquea el Bonus Técnico de Observabilidad.

### 1.12. Política de Ejecución: Vía Rápida (Fast Path) vs. Vía Planificada (Planner/Executor)
* **Justificación de UX y Eficiencia de Tokens:**
  * No se aplica el patrón *Planner/Executor* de forma indiscriminada para evitar burocracia, latencia innecesaria e inflación de costes en comandos triviales.
* **Vía Rápida (Fast Path - Solo Lectura):**
  * Para comandos cotidianos (mirar entorno, dialogar con NPCs, consultas puntuales al Códice RAG o al tiempo).
  * Ejecución directa en un solo turno sin confirmaciones ni planes previos.
* **Vía Planificada (Slow Path - Acciones Críticas con Efectos Secundarios):**
  * Se activa exclusivamente ante acciones de alto impacto: expediciones peligrosas (subir al Teide, bajar Masca), gasto de recursos (comprar billete de ferry) o mutaciones irreversibles del inventario.
  * *Mecánica Human-in-the-Loop:* El Narrador desglosa la hoja de ruta de la expedición (comprobar clima, provisiones, permisos) y solicita confirmación explícita al jugador antes de disparar las herramientas de mutación.

### 1.13. Servidor MCP de Tenerife: Especificación Técnica de Tools y Resources Validados

* **Decisión de Recursos MCP (Aprobados vs Descartados):**
  * ✅ `tenerife://mapa/conexiones`: Aprobado. Grafo de adyacencia (nodos y aristas con identificadores, nombres de carreteras reales como TF-1, TF-5, TF-24, TF-436 y tiempos estimados) para que el agente planifique desplazamientos lógicos sin inventar atajos imposibles.
  * ✅ `tenerife://glosario/canario`: Aprobado. Diccionario léxico y gastronómico extraído de:
    1. *TENERIFE.pdf:* Términos y platos citados expresamente (guachinche original sin carta con vino/Seven Up, batata con almogrote, gofio del Molino de Chano, bocadillo de pollo con salsa de aguacate y Nestea de mango-piña, arepas y cachapas de La Carajita).
    2. *Léxico autóctono tradicional:* Papas con mojo, barraquito, escaldón, guagua, chacho, fleje, millo, pateada.
    Vive como recurso estático en `assets/data/glosario_canario.json` servido por el MCP para inmersión de NPCs.
  * ❌ `tenerife://codice/{zona}`: **Descartado explícitamente**. Exponer fragmentos del PDF como recurso MCP permitiría al agente puentear el motor de búsqueda semántica RAG, lo que violaría los requisitos de evaluación de la Sesión 03. Todo acceso al documento oficial debe pasar obligatoriamente por el pipeline RAG.

* **Validación Técnica de APIs Reales (Sin API Key, Públicas, Gratuitas):**
  * Proveedor oficial verificado: **Open-Meteo GmbH** (Open source, libre para uso no comercial, hasta 10.000 peticiones/día por IP, latencia <200ms).
  * Documentación oficial:
    * Clima y Astronomía: [Open-Meteo Weather Forecast Docs](https://open-meteo.com/en/docs)
    * Calidad del Aire y Polvo Sahariano: [Open-Meteo Air Quality Docs](https://open-meteo.com/en/docs/air-quality-api)

* **Detalle de las 3 Herramientas (*Tools*):**

  1. **`get_weather(fecha: str, ubicacion: str) -> dict`**:
     * **Endpoint:** `GET https://api.open-meteo.com/v1/forecast`
     * **Parámetros:** `latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m&timezone=Atlantic%2FCanary`
     * **Coordenadas clave de Tenerife:**
       * Santa Cruz: `28.4682, -16.2546`
       * Puerto de la Cruz: `28.4162, -16.5447`
       * El Teide (Parador/Observatorio): `28.2723, -16.6425`
       * Costa Adeje: `28.0772, -16.7323`
       * La Laguna: `28.4872, -16.3159`
     * **Respuesta real validada:** Temperatura (°C), humedad (%), sensación térmica, código WMO meteorológico y viento.

  2. **`get_starlight_conditions(fecha: str) -> dict`**:
     * **Endpoint:** `GET https://api.open-meteo.com/v1/forecast`
     * **Parámetros:** `latitude=28.2723&longitude=-16.6425&current=cloud_cover,wind_speed_10m,temperature_2m&daily=sunrise,sunset,moonrise,moonset,moon_phase&timezone=Atlantic%2FCanary`
     * **Respuesta real validada:**
       * `moon_phase`: Valor continuo [0.0 = Luna Nueva (condición óptima de oscuridad), 0.5 = Luna Llena, 1.0 = Luna Nueva].
       * `cloud_cover`: Porcentaje de cobertura de nubes a 2.390 m de altitud.
       * `sunset` / `sunrise`: Ventana nocturna exacta para astroturismo.

  3. **`get_calima_alert(zona: str) -> dict`**:
     * **Endpoint:** `GET https://air-quality-api.open-meteo.com/v1/air-quality`
     * **Parámetros:** `latitude={lat}&longitude={lon}&current=pm10,pm2_5,dust,european_aqi&timezone=Atlantic%2FCanary`
     * **Criterio científico AEMET / Gobierno de Canarias:**
       * `dust`: Concentración de polvo sahariano mineral en µg/m³.
       * `pm10`: Partículas menores a 10 µm.
       * Umbrales de juego: PM10 < 50 (Aire limpio), 50-100 (Calima ligera / cielo calinoso), >=100 (Alerta por calima intensa).

* **Resiliencia y Fallback:**
  * Si la llamada HTTP falla (timeout / sin conexión a internet), la tool atrapa el error y retorna un diccionario sintético verosímil con `"simulated": True`, garantizando que la partida y la corrección del profesor nunca se detengan.





---

## 2. Estrategia de Memoria & Ventana de Contexto

* **Modelo Híbrido: Summary Buffer + Ventana Deslizante:**
  * Conserva intacto el `System Prompt` (identidad del juego, reglas, tono de aventura gráfica).
  * Mantiene una memoria resumida (*Narrative Summary*) de los hitos superados por Twinber: *"Twinber llegó al puerto, habló con el pescador y compró provisiones en el mercado de Nuestra Señora de África"*.
  * Mantiene en crudo los últimos **$K$ turnos** recientes para una conversación fluida y con agilidad de réplica.
  * El inventario y mapa de zonas desbloqueadas viaja fuera del historial como estado estructurado, reduciendo drásticamente el consumo de tokens.

---

## 3. UI y Estética Retro: El Homenaje a LucasArts (SCUMM Point & Click)

* **Filosofía de Interfaz (Homenaje a *Monkey Island* e *Indiana Jones*):**
  * Dinámica auténtica **Point & Click**: el escenario muestra los personajes, objetos y salidas interactuables de la zona actual.
  * **Diálogos Vivos por LLM:** En lugar de árboles de diálogo rígidos con frases enlatadas, al hacer clic en un personaje se abre un canal de conversación libre e inteligente donde el LLM encarna al NPC con su personalidad, acento canario y conocimientos del Códice RAG.
  * Implementación en **Gradio** (`launch(inline=True)` dentro de celda Jupyter) con estilos CSS retro (Google Fonts pixeladas, marco VGA, paleta clásica de 256 colores).

* **Distribución de la Pantalla SCUMM:**
  1. **El Visor Gráfico (60% superior):** Postal visual de la zona (fotos extraídas de `TENERIFE.pdf` con marco clásico).
  2. **Subtítulos y Diálogos:** Texto de narrador y personajes en color amarillo Monkey Island y cyan.
  3. **Línea de Frase e Input Libre:** Caja de texto para hablar con el NPC activo o dar órdenes libres.
  4. **Matriz de Acciones / Verbos (Abajo-Izquierda):** Botones directos `[HABLAR]`, `[MIRAR]`, `[USAR]`, `[VIAJAR]`, `[CLIMA]`, `[CALIMA]`.
  5. **Inventario de Twinber (Abajo-Derecha):** Cuadrícula visual con los objetos coleccionados (*Códice Guanche, monedas, ticket guagua, plátano*).
  6. **Consola CRT de Auditoría (`~`):** Terminal desplegable con logs estructurados en tiempo real (llamadas a tools de Open-Meteo, latencia, tokens y citas RAG).

* **Concept Mockup Visual:**
  * Archivo de referencia: `![Mockup SCUMM](/home/twinber/.gemini/antigravity-cli/brain/e6405918-3600-4f05-97bf-cd0127944c72/scumm_adventure_mockup_1791664109790.jpg)`


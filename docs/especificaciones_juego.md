# Diseño de Juego & Especificación Técnica: *Twinber en Tenerife*

**Género:** Aventura Gráfica Conversacional Retro (Inspirada en *The Secret of Monkey Island* e *Indiana Jones and the Fate of Atlantis*).  
**Protagonista:** **Twinber**, aventurero y explorador.  
**Escenario:** La isla de Tenerife (Guía oficial: `TENERIFE.pdf`).  
**Arquitectura Subyacente:** LLM Comercial + RAG Semántico + Function Calling + Gestor de Estado.

---

## 0. Arquitectura de Software Limpia (Clean Architecture) y Desacoplamiento Cliente-Servidor

* **Filosofía de Diseño y Justificación para el Tribunal del Máster:**
  * **Superación del Enfoque Monolítico (Gradio / Notebook-Only):**
    * Se descartan herramientas de prototipado monolítico como Gradio o Streamlit en favor de una **arquitectura desacoplada Cliente-Servidor (SOA / REST + Server-Sent Events)** con **Clean Architecture**.
    * **Justificación de Ingeniería:** La IA generativa, el motor RAG vectorial y la máquina de estados residen en un **Backend agéntico en Python puro**, expuesto mediante una API HTTP agnóstica.
    * **Preparado para el Futuro (*Future-Proofing*):** Al desacoplar completamente la lógica de negocio de la presentación, cualquier cliente ligero puede consumir el universo de Twinber sin alterar el backend:
      1. Un frontend web retro nativo (HTML5 / CSS / Vanilla JS) hoy.
      2. Una aplicación móvil nativa (Flutter / React Native) mañana.
      3. Un motor de videojuegos 3D profesional (Unreal Engine 5 / Unity / Godot) en el futuro.
    * **Cumplimiento Académico:** El profesor permite no ceñirse al notebook siempre que las decisiones de arquitectura estén formalmente justificadas en la documentación técnica, garantizando el máximo rigor de software.

* **Capas de la Arquitectura Limpia:**
  1. **Capa 1: Dominio y Contratos (Core - `src/domain/`):**
     * Modelos de datos inmutables y esquemas Pydantic (`GameState`, `Inventory`, `LocationNode`, `SceneHotspot`, `WeatherInfo`, `CalimaAlert`, `StarlightInfo`, `TurnResult`).
     * Cero dependencias externas o de frameworks de transporte.
  2. **Capa 2: Infraestructura y Adaptadores (`src/infrastructure/`):**
     * `OpenMeteoClient` (HTTP con fallback offline resiliente).
     * `ChromaVectorStoreAdapter` (embeddings y base vectorial persistente).
     * `LLMClientAdapter` (SDK oficial OpenAI directo para completados y streaming).
     * `PDFExtractor` (parser estructurado de texto y extractor de las 28 fotos de `TENERIFE.pdf`).
     * `AuditLogger` (escritura en disco de telemetría estructurada `game_audit.log`).
  3. **Capa 3: Aplicación y Casos de Uso (`src/application/`):**
     * `AssistantEngine` (orquestador del bucle conversacional y resolución de turnos).
     * `RAGService` (búsqueda semántica geocercada, filtrado y citación formal de fuentes).
     * `GuardrailService` (portero ligero `gpt-4o-mini` y validador de salida).
     * `ToolDispatcher / MCPService` (ejecución de tools de Open-Meteo y recursos MCP).
     * `MemoryService` (gestión de ventana deslizante + Summary Buffer acumulativo).
  4. **Capa 4: Servidor API (`src/api/` - FastAPI + Uvicorn):**
     * Servidor HTTP asíncrono que expone la API REST y los streams de eventos.
     * Sirve además la aplicación web estática (`frontend/`) en `http://localhost:8000`.
  5. **Capa 5: Cliente Web Retro Nativo (`frontend/`):**
     * Frontend ligero en HTML5 semántico, CSS3 retro con scanlines CRT y Vanilla JavaScript ES6 (sin Node.js ni empaquetadores pesados).

* **Contratos de la API REST & Streaming (FastAPI):**
  * `POST /api/action`: Envía una orden del jugador (`verbo`, `item_id`, `target_hotspot_id`, `texto_libre`) y procesa el turno en el backend.
  * `GET /api/stream`: Canal de **Server-Sent Events (SSE)** (`text/event-stream`) para transmitir el texto del Narrador/NPC en tiempo real letra a letra.
  * `GET /api/state`: Retorna el estado completo del juego (`GameState`: sellos, fotos, monedas, mochila).
  * `GET /api/scene/{enclave_id}`: Retorna los datos de la escena actual (postal RAG, hotspots interactivos, bucles ambientales y NPCs presentes).
  * `GET /api/mcp/connections`: Grafo de carreteras insulares (TF-1, TF-5, TF-24) para el mapa interactivo.
  * `GET /api/audit`: Retorna la telemetría acumulada para la consola retro `~`.

* **Ubicación Canónica del Proyecto:**
  * Carpeta raíz independiente: `proyecto-tenerife/`
  * Backend: `proyecto-tenerife/src/`
  * Frontend: `proyecto-tenerife/frontend/`

* **Stack Tecnológico Oficial Seleccionado:**
  * **Servidor Web y API:** FastAPI (`fastapi>=0.110.0`) + Uvicorn (`uvicorn>=0.28.0`).
  * **Proveedor LLM:** OpenAI SDK nativo (`openai>=1.40.0`).
  * **Modelo Principal (Narrativa & Tools):** `gpt-4o-mini` (`OPENAI_MODEL_MAIN`).
  * **Modelo Rápido (Guardrail Bouncer):** `gpt-4o-mini` (`OPENAI_MODEL_FAST`).
  * **Modelo de Embeddings:** `text-embedding-3-small` (`OPENAI_EMBEDDING_MODEL`).
  * **Base de Datos Vectorial:** Chroma DB local (`chromadb>=0.4.24`).
  * **Validación & Settings:** Pydantic V2 (`pydantic>=2.7.0`, `pydantic-settings>=2.2.0`).
  * **APIs Externas:** Open-Meteo (Weather Forecast & Air Quality, pública y gratuita).
  * **Frontend:** HTML5, CSS3, JavaScript nativo ES6 (Web Audio API para SFX).

* **Contrato Público Interno de Comunicación:**
  * `TurnResult` devuelve: `narrative: str`, `state: GameState`, `visual_asset: Optional[str]`, `citations: list[RespuestaCodice]`, `audit_events: list[AuditEvent]`, `sfx_to_play: list[str]`.

---

## 1. Núcleo Jugable y Mecánicas

### 1.1. El Objetivo del Juego: El Pasaporte de Explorador
* **La Misión de Twinber:** Twinber desembarca en Tenerife con un **Pasaporte de Explorador** que debe ir sellando visitando cada rincón de la isla.
* **El Gran Final (Clímax):** El ascenso a las cumbres del Teide y la contemplación de un cielo estrellado inolvidable desde el Parque Nacional, con las tools `get_weather` y `get_starlight_conditions`.
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

* **Diseño y Visualización en UI (Cuaderno a Doble Página Abierta — 5 Pliegos):**
  * **Estructura Real de Pasaporte Oficial:** Cuadernillo con cubierta de piel azul marino (`#0b1532`), ribete dorado y lomo central con efecto 3D y pespunte cosido (`#b89758`).
  * **5 Pliegos Dobles (10 Páginas / 10 Sellos Oficiales):**
    * *Pliego 1 / 5 (Págs. 01 - 02):* **Puerto de la Cruz** (Muelle Pesquero y San Telmo) + **La Orotava** (Valle de Taoro y Molino de Chano).
    * *Pliego 2 / 5 (Págs. 03 - 04):* **Icod & Garachico** (Drago Milenario y El Caletón) + **San Cristóbal de La Laguna** (Ciudad Patrimonio UNESCO).
    * *Pliego 3 / 5 (Págs. 05 - 06):* **Santa Cruz de Tenerife** (Capital Insular y Auditorio) + **Parque Rural de Anaga** (Reserva de la Biosfera y Laurisilva).
    * *Pliego 4 / 5 (Págs. 07 - 08):* **Costa Adeje & Las Américas** (Litoral Sur) + **Los Gigantes & Masca** (Murallas Basálticas y Garganta).
    * *Pliego 5 / 5 (Págs. 09 - 10):* **El Médano & Los Cristianos** (Montaña Roja y Bahía) + **Las Cañadas del Teide** (Cumbre 3.718m).
  * **Sellos Gráficos Vectoriales Auténticos:**
    * *Estado Sellado:* Sello circular retro con borde dentado, tipografía circular, icono emblemático en SVG (faro, molino, drago, catedral, auditorio, laurisilva, palmera, acantilado, volcán, Teide), fecha aduanera (`11 OCT 2026`), rúbrica del personaje que lo estampó (ej. *"Fdo: Paco el Pescador"*) e inclinación natural manual (`tilt-left` / `tilt-right`).
    * *Estado Pendiente:* Recuadro punteado de seguridad oficial `[ ⭕ ESPACIO PARA VISADO ]`, marca de agua sutil y estado de advertencia `🔒 PENDIENTE DE EXPEDICIÓN`.
  * **Navegación e Interacción:** Se abre usando `MIRAR` en el pasaporte o con doble clic en el inventario. Controles `◀ PLIEGO ANTERIOR` y `PLIEGO SIGUIENTE ▶`, atajos de teclado (`ArrowLeft`, `ArrowRight`, `Escape`) y sonido de pasar página de papel (`playPageTurn()`).

### 1.2. El Objetivo Secundario (Coleccionable Multimodal): El Álbum de Fotos de Tenerife
* **Misión Opcional / Completionist:** Twinber lleva un **Álbum de Fotos de Tenerife** (28 fotografías reales extraídas y optimizadas de `TENERIFE.pdf`, catalogadas exhaustivamente en [`docs/matriz_fotos_rag.md`](file:///home/twinber/Projects/Master-IA/10-LLM/proyecto-tenerife/docs/matriz_fotos_rag.md)).
* **Mecánica de Desbloqueo (Gatillo RAG Determinista):**
  * **12 Fotos desbloqueadas por `MIRAR`:** Se gatillan al examinar hitos visualmente presentes en el escenario pixel-art (ej. Faro de San Telmo, Drago Milenario, Auditorio de Tenerife, Roques de García). El motor emite un query semántico al RAG y el Retriever devuelve el chunk con metadatos (`photo_id`) y un pie de foto fotográfico conciso (máximo 2 líneas).
  * **16 Fotos desbloqueadas por `HABLAR`:** Se gatillan al conversar con los NPCs locales (ej. Paco en Puerto de la Cruz revela el Lago Martiánez de César Manrique; barquero en Buenavista revela Punta de Teno). El LLM/Retriever inyecta la foto asociada en los metadatos de respuesta.
  * **Determinismo del Desbloqueo:** El LLM genera la narrativa inmersiva, pero el desbloqueo de la foto lo gobierna estrictamente el Retriever en base a los metadatos vectoriales asociados en ChromaDB (cero alucinaciones).
  * **Geocercado Estricto (*Geofencing*):** Solo se desbloquean fotos del enclave físico actual. La inspección lejana del Teide desde la costa advierte que la foto de cumbre exige viajar físicamente a Las Cañadas.
* **Diseño y Visualización en UI (Modal Retro Paginado):**
  * **1 Foto por Página a Pantalla Completa:** Vista amplia e inmersiva sin rejillas apretadas, con botones de navegación `◀ ANTERIOR` y `SIGUIENTE ▶`.
  * **Pie de Foto Conciso:** Al pie de la fotografía aparece el texto oficial de `TENERIFE.pdf` y la página de procedencia.
  * **Cero Pistas / Spoilers:** Las fotos no desbloqueadas se muestran como ranuras vacías bloqueadas con el texto `[ 📷 FOTO #XX - BLOQUEADA ]`, sin desvelar nombres ni pistas que arruinen la exploración.

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

### 1.6. Microeconomía, Franjas Laterales y Matriz Canónica de Objetos

#### 1.6.1. Reubicación Espacial del Inventario y Supresión Total de la Rejilla de Verbos
* **Eliminación Total de la Rejilla de Verbos SCUMM:** Se suprime definitivamente la botonera de verbos (HABLAR, MIRAR, USAR, COMPRAR, VIAJAR, PENSAR). Estorbaban la visión del escenario y resultaban redundantes.
* **Cursor Inteligente y Acciones Contextuales Automáticas:**
  * **Al pasar el ratón por un personaje (NPC):** Se activa automáticamente la acción contextual `"Hablar con [Nombre]"` (ej. `"Hablar con Paco el Pescador"`). Al pulsar sobre el personaje, Twinber se aproxima e inicia la conversación.
  * **Al pasar el ratón por elementos del escenario (Hotspots):** Se activa automáticamente `"Mirar [Elemento]"` (ej. `"Mirar Faro y Fortín de San Telmo"`). Al pulsar, Twinber examina el lugar y activa la inspección/desbloqueo fotográfico.
  * **Al pulsar en el suelo:** Twinber camina hacia las coordenadas indicadas (`"Caminar hacia el muelle..."`).
  * **Objetos como Llaves Pasivas:** Se descarta el verbo `USAR`. Los objetos funcionan como llaves de progresión (*keys*): si el jugador posee el objeto en su inventario, la ruta o acción se valida de forma transparente. Pulsar sobre un objeto en la franja lateral ejecuta su inspección *in-character* o abre su modal (Pasaporte, Álbum).
  * **Viaje Directo vía Mapa:** Pulsar sobre el *Mapa de Tenerife* en la barra lateral activa directamente la acción de viaje insular.
  * **Comprar Integrado en Diálogo:** Descartado el verbo independiente de compra; en aquellos personajes que tengan artículos a la venta (Chano, Manolo, Taquilla, Frutero), la adquisición se realiza mediante una opción específica dentro de su menú de diálogo.
  * **Suspensión Temporal de 'PENSAR':** No se implementa de momento como verbo ni botón; si más adelante la aventura requiere soporte de pistas ante atascos, se incorporará como un icono sutil de ayuda.
* **Descongestión Absoluta del Escenario:** La barra inferior (`#action-dock`) se reduce a una única línea flotante ultra-compacta (`.sentence-bar`), dejando al 100% visible todo el fondo panorámico. Solo se expande verticalmente al interactuar con un NPC para mostrar las opciones de conversación.
* **Aprovechamiento de las Franjas Negras Laterales (*Pillarboxing*):** Las pantallas panorámicas y monitores de sobremesa generan márgenes negros laterales al proyectar la escena 16:9. Se aprovechan estas dos franjas para alojar dos barras verticales temáticas de inventario con estética retro SCUMM (`#sidebar-left` y `#sidebar-right`):
  * **Franja Lateral Izquierda (Equipo Básico Permanente — 4 ranuras):** Monedas, Pasaporte, Álbum y Mapa.
  * **Franja Lateral Derecha (Objetos Adquiribles a NPCs — 4 ranuras):** Gofio, Comanda, Billete y Plátanos. Permanecen completamente ocultos e invisibles hasta su adquisición efectiva.
* **Iconografía Vectorial SVG Artesanal:** 8 iconos vectoriales SVG artesanales en 64x64 con degradados, paletas retro de 256 colores y ribetes oscuros de alto contraste.

#### 1.6.2. Matriz Canónica de Objetos del Juego
A continuación se define la matriz oficial e inmutable de objetos, su cometido en la aventura, su coste económico y su ubicación en la interfaz:

| # | Objeto | Icono | Cometido en la Aventura | Precio | Ubicación en UI | Proveedor / Enclave | Utilidad Práctica |
|---|--------|-------|--------------------------|--------|-----------------|---------------------|-------------------|
| **01** | **Bolsa de Monedas de Oro** | `item_monedas.svg` | Fondo de maniobra económico de Twinber. Permite sufragar compras, provisiones y billetes de viaje. | **15 💰 (Saldo Inicial)** | Franja Izquierda (Ranura 1) | Inicial (Riñonera de Twinber) | Esencial (Economía del juego) |
| **02** | **Pasaporte de Explorador** | `item_pasaporte.svg` | Cuaderno de 10 visados comarcales. Se abre a doble página (5 pliegos) para inspeccionar sellos oficiales con un clic. | **Gratuito (0 💰)** | Franja Izquierda (Ranura 2) | Inicial (Oficial del Cabildo) | **Clave de Progresión Primaria** (10 sellos obligatorios) |
| **03** | **Álbum de Fotos de Tenerife** | `item_album.svg` | Álbum coleccionable de recuerdos fotográficos (28 fotos reales de `TENERIFE.pdf`). Se abre en visor paginado modal con un clic. | **Gratuito (0 💰)** | Franja Izquierda (Ranura 3) | Inicial (Cámara 35mm al cuello) | Coleccionable Multimodal RAG (100% completionist) |
| **04** | **Mapa de Tenerife** *(Sustituto de la Brújula)* | `item_mapa.svg` | Mapa cartográfico de carreteras insulares con el Teide y rosa náutica. **Pulsar sobre él activa directamente el viaje insular**. | **Gratuito (0 💰)** | Franja Izquierda (Ranura 4) | Inicial (Guía de bolsillo) | Navegación e Interfaz de Viaje (*Fast Travel*) |
| **05** | **Saco de Gofio** | `item_gofio.svg` | Harina tradicional de trigo y millo tostado. Aporta la energía calórica requerida para internarse en las cumbres del norte. | **3 💰** | Franja Derecha (Ranura 1) | Chano el Molinero (Molino de La Orotava) | **Llave de Enclave:** Permite el ascenso hacia las cumbres |
| **06** | **Comanda del Guachinche** | `item_comanda.svg` | Factura doblada de taberna con mancha circular de vino tinto. Contiene notas manuscritas que revelan la ruta entre el mar de nubes. | **4 💰** | Franja Derecha (Ranura 2) | Manolo el Tabernero (Guachinche en Santa Úrsula) | **Llave de Ruta:** Permite cruzar el mar de nubes de la TF-24 |
| **07** | **Billete del Teleférico** | `item_billete.svg` | Ticket troquelado y numerado para subir en la cabina del teleférico desde la base (2.356 m) hasta La Rambleta (3.555 m). | **5 💰** | Franja Derecha (Ranura 3) | Taquilla Oficial (Las Cañadas del Teide) | **Llave de Clímax Final:** Acceso al pico para contemplación Starlight |
| **08** | **Plátanos de Canarias (x3)** | `item_platano.svg` | **Elemento humorístico / coleccionable alimenticio.** Plátano dulce con motitas (IGP). Se pueden adquirir hasta 3 unidades (1 💰 c/u). En el universo del juego, Twinber lo trata con total naturalidad *in-character* como un delicioso plátano para reponer fuerzas (sin romper la cuarta pared ni denominarlo "meme" en interfaz, diálogos o pistas). No resuelve acertijos ni abre puertas mecánicas, pero genera réplicas cómicas al examinarlo. | **1 💰 c/u (Total 3 💰)** | Franja Derecha (Ranura 4, contador `🍌 xN`) | Frutero ambulante canario (Puesto callejero) | Humor *in-character* / Diálogos clásicos de aventura gráfica |

#### 1.6.3. Balance Económico Perfecto (Economía Cerrada de 15 Monedas)
La economía de la aventura es matemáticamente exacta:
$$\text{Presupuesto Inicial: } 15\text{ 💰}$$
$$-3\text{ 💰 (Saco de Gofio en La Orotava)} \longrightarrow 12\text{ 💰}$$
$$-4\text{ 💰 (Comanda del Guachinche en Santa Úrsula)} \longrightarrow 8\text{ 💰}$$
$$-5\text{ 💰 (Billete del Teleférico en Las Cañadas)} \longrightarrow 3\text{ 💰}$$
$$-3\text{ 💰 (3 Plátanos de Canarias a 1 💰 cada uno)} \longrightarrow 0\text{ 💰}$$
* **Cero monedas sobrantes:** Cada una de las 15 monedas iniciales tiene una correspondencia exacta en el diseño del juego.
* **Mecánica Human-in-the-Loop:** Al gastar monedas (mutación irreversible), el Narrador desglosa la compra y solicita confirmación explícita previa al jugador.
* **Eliminación Definitiva de la Brújula de Latón:** Descartada por completo del diseño; sus funciones de orientación y viaje quedan consolidadas de forma limpia en el *Mapa de Tenerife*.

### 1.7. Sistema Adaptativo de Pistas (*Adaptive Hinting* ante Atascos)
Para evitar la frustración clásica de las aventuras gráficas:
1. **Pistas Orgánicas Progresivas:**  
   Si el jugador intenta realizar una acción bloqueada, el Narrador no responde con un frío error, sino con pistas de dificultad adaptativa en boca de Twinber o de los lugareños.
2. **Acción de Reflexión / Ayuda (Opcional Futura):**  
   Pospuesta de momento para evitar saturación visual; si el testeo demuestra necesidad de apoyo extra, se incorporará un icono sutil de pista.

### 1.8. Catálogo de NPCs y Arquitectura Híbrida (Python Determinista + LLM Libre)
* **¿Son NPCs Deterministas? (Arquitectura Híbrida):**
  * **La Lógica es 100% Determinista (Python):** Las precondiciones, el saldo de monedas y el inventario están blindados en código Python (`src/domain/state.py`). El LLM no puede "alucinar" compras sin llamar a la tool correspondiente.
  * **El Diálogo es 100% Libre (LLM):** La conversación, el humor, las anécdotas y las bromas en dialecto canario se generan en tiempo real sin árboles de diálogo rígidos ni frases enlatadas.
* **Catálogo Oficial de NPCs:**
  1. **Chano el Molinero (La Orotava):** Anciano sabio y orgulloso de la tradición del gofio y las alfombras del Teide. Vende la bolsa de gofio (3 monedas) mediante opción de diálogo.
  2. **Manolo el Tabernero (Santa Úrsula):** Hospitalario, socarrón y dicharachero (*"chacho, fleje, mi niño"*). Vende la comanda del guachinche (4 monedas) y entrega la nota de ruta mediante diálogo.
  3. **Operario del Teleférico (El Teide):** Técnico, precavido, obsesionado con la velocidad del viento y la seguridad de la cumbre. Vende el billete (5 monedas) mediante diálogo.
  4. **Paco el Pescador (Puerto de la Cruz):** Marinero curtido y nostálgico. Da pistas sobre el mar, sella el pasaporte y aporta anécdotas del muelle.
  5. **Yeray el Conductor de Guagua (TITSA):** Pragmático y simpático. Revisa los sellos del pasaporte antes de abrir las rutas entre zonas.

### 1.8.1. Arquitectura del Sistema de Diálogo Ramificado con NPCs (Estilo LucasArts)
* **Filosofía de Conversación:** Se evita sobrecargar al jugador con listas extensas de preguntas prefabricadas que exigirían conocer previamente el contenido de `TENERIFE.pdf`. La conversación sigue una estructura limpia y ágil de **3 a 4 opciones operativas + 1 de despedida**:
  1. **Opción 1 (Mecánica sin RAG) — `"¿Puede sellarme el pasaporte?"`:**
     * Interacción funcional directa: el habitante o autoridad de la zona estampa el sello correspondiente en el Pasaporte de Explorador (`1/10` sellos comarcales).
     * Si ya está sellado, el NPC informa amablemente de que esa zona ya está validada y orienta hacia los siguientes enclaves.
  2. **Opción 2 (Consulta RAG Genérica de Zona) — `"¿Qué me puede contar de esta zona?"`:**
     * Actúa como prompt de consulta semántica genérico para el enclave actual (ej. Puerto de la Cruz $\rightarrow$ San Telmo, muelle y Lago Martiánez de César Manrique).
     * El Retriever devuelve la información cultural relevante sin exigir que el jugador conozca los secretos de antemano y **desbloquea la fotografía coleccionable asociada en el Álbum** (ej. Foto #02).
  3. **Opción Mercante (Si el NPC tiene productos en venta) — `"Comprar [Artículo] ([Precio] 💰)"`:**
     * Despliega la transacción económica directamente en la conversación, sin necesidad de un verbo externo.
  4. **Opción Abierta (Prompt Abierto al LLM) — `⌨️ [ Input libre del usuario ]`:**
     * Un campo de texto interactivo con estética retro en el dock donde el jugador puede escribir cualquier pregunta o inquietud libre al NPC (gastronomía, historia, clima, leyendas locales).
     * Twinber vocaliza la pregunta formulada por el jugador y el NPC responde en tiempo real con su personalidad canaria y contexto geocercado.
     * Toda consulta queda registrada en la consola de telemetría bajo el tag `[PROMPT ABIERTO AL LLM]`.
  5. **Opción de Despedida — `"Tengo que marcharme. ¡Hasta luego!"` o `[ESC]`:**
     * Cierra el modo diálogo y restaura la barra de acción contextual normal de una sola línea.
* **Control Manual de Progresión de Subtítulos (Sin Temporizadores Automáticos):**
  * **Pausa Indefinida:** Se eliminan los temporizadores de desvanecimiento automático (`waitTimer`). El texto permanece visible en pantalla hasta que el usuario decida avanzar, garantizando una lectura cómoda a su propio ritmo.
  * **Botón Interactivo `[ ▶ CONTINUAR [ESPACIO] ]`:** Se muestra un indicador parpadeante en el bocadillo de diálogo.
  * **Métodos de Avance:** Tecla `Espacio`, tecla `Enter`, clic sobre el botón de continuar, clic sobre el bocadillo de diálogo o clic en el escenario.
  * **Salto de Teletipo:** Si el usuario pulsa mientras el texto aún se está escribiendo letra por letra, la frase se completa inmediatamente; una segunda pulsación avanza a la siguiente réplica.

### 1.9. Separación Clave de Arquitectura: Estado vs. Conversación
* **El Texto es No Determinista (LLM):** La narración, descripciones y diálogos con lugareños o personajes no jugadores (NPCs) los genera el LLM con estilo inmersivo y humor fino.
* **El Estado es Determinista (Python State Engine):**
  * El **Pasaporte**, **Álbum** e **Inventario de monedas** se mantienen en estructuras estrictas en memoria (`Pydantic`).
  * Los **Permisos y Sellos** se gestionan mediante **Function Calling (Tools)**.
  * La IA consulta el estado del jugador usando herramientas antes de permitir o denegar el avance a una zona.

### 1.10. Justificación Técnica del Chunking Semántico y Soporte Multimodal
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

### 1.11. Contratos Pydantic Formales del Dominio (`src/domain/`)

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

### 1.12. Arquitectura Agéntica: Patrón Supervisor + Subagentes como Herramientas
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

### 1.13. Sistema de Guardrails de Entrada y Salida (Contención y Seguridad)
* **Guardrail de Entrada (El Portero / Bouncer):**
  * Modelo ligero (`gpt-4o-mini`) con esquema Pydantic para clasificación en milisegundos.
  * Intercepta ataques de *Prompt Injection*, intentos de *Jailbreak* y cambios de rol antes de que consuman el contexto del Narrador.
  * *Respuesta Cortafuegos Inmersiva:* En lugar de errores HTTP, responde con misterio dentro del juego:
    *"Twinber tropieza con una extraña roca volcánica... Una brisa misteriosa desvanece tus palabras: 'Esos trucos no funcionan en esta isla, aventurero'."*
* **Guardrail de Salida (Verificación y Anti-Fugas):**
  * *Filtro Rápido Determinista (Regex):* Detección y bloqueo inmediato de patrones de API Keys (`sk-...`, `AIzaSy...`) o fragmentos del System Prompt confidencial.
  * *Validador Crítico Semántico:* Verificación de que el Narrador no alucine objetos o vehículos imposibles que rompan las reglas lógicas del inventario y la geografía de Tenerife.

### 1.14. Observabilidad en Tiempo Real: "Consola de Desarrollador Retro" (Tecla `~`)
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

### 1.15. Política de Ejecución: Vía Rápida (Fast Path) vs. Vía Planificada (Planner/Executor)
* **Justificación de UX y Eficiencia de Tokens:**
  * No se aplica el patrón *Planner/Executor* de forma indiscriminada para evitar burocracia, latencia innecesaria e inflación de costes en comandos triviales.
* **Vía Rápida (Fast Path - Solo Lectura):**
  * Para comandos cotidianos (mirar entorno, dialogar con NPCs, consultas puntuales al Códice RAG o al tiempo).
  * Ejecución directa en un solo turno sin confirmaciones ni planes previos.
* **Vía Planificada (Slow Path - Acciones Críticas con Efectos Secundarios):**
  * Se activa exclusivamente ante acciones de alto impacto: expediciones peligrosas (subir al Teide, bajar Masca), gasto de recursos (comprar billete de ferry) o mutaciones irreversibles del inventario.
  * *Mecánica Human-in-the-Loop:* El Narrador desglosa la hoja de ruta de la expedición (comprobar clima, provisiones, permisos) y solicita confirmación explícita al jugador antes de disparar las herramientas de mutación.

### 1.16. Servidor MCP de Tenerife: Especificación Técnica de Tools y Resources Validados

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

### 1.17. Motor Visual de Animaciones y Micro-Movimiento por Hotspots (Point & Click)

* **Arquitectura de Composición Visual por Capas (Layered Canvas):**
  Para ofrecer una estética viva sin sobrecargar el Notebook ni requerir un motor 3D, el visor se implementa como un contenedor HTML5/CSS multicapa dentro del componente Gradio:
  ```text
  ┌────────────────────────────────────────────────────────┐
  │ Capa 4: Filtro Retro CRT (Scanlines + curvatura CSS)   │
  ├────────────────────────────────────────────────────────┤
  │ Capa 3: Bocadillo / Subtítulos (Streaming teletipo)     │
  ├────────────────────────────────────────────────────────┤
  │ Capa 2: Sprites de Personajes (Twinber + NPC activo)   │
  │         - Estados: IDLE, WALK, TALK                   │
  ├────────────────────────────────────────────────────────┤
  │ Capa 1: Bucles Ambientales (Olas, nubes, aspas molino) │
  ├────────────────────────────────────────────────────────┤
  │ Capa 0: Postal del Enclave (Imagen RAG de TENERIFE.pdf)│
  └────────────────────────────────────────────────────────┘
  ```

* **Esquema Formal del Hotspot (`SceneHotspot`):**
  Cada uno de los 10+1 enclaves define un conjunto de puntos de interés interactuables mediante coordenadas relativas (%) para garantizar compatibilidad responsive:
  ```python
  from typing import Literal, Optional
  from pydantic import BaseModel, Field

  class SceneHotspot(BaseModel):
      id: str = Field(..., description="Identificador único del hotspot (ej: 'npc_chano', 'molino_aspas')")
      nombre: str = Field(..., description="Texto visible en cursor/hover (ej: 'Hablar con Chano')")
      x_pct: float = Field(..., ge=0.0, le=100.0, description="Posición horizontal en % del ancho")
      y_pct: float = Field(..., ge=0.0, le=100.0, description="Posición vertical en % de la altura")
      target_x_pct: float = Field(..., ge=0.0, le=100.0, description="Coordenada X a la que camina Twinber")
      cursor_icon: Literal["speech", "look", "use", "exit"] = "speech"
      accion_tipo: Literal["HABLAR", "MIRAR", "USAR", "VIAJAR"]
      target_id: Optional[str] = Field(None, description="ID del NPC, objeto o enlace a invocar")
  ```

* **Mecánica de Locomoción de Twinber (Micro-Movimiento):**
  1. **Clic en Hotspot:** El usuario hace clic sobre un elemento o personaje en la pantalla.
  2. **Cálculo de Desplazamiento:** Se calcula la distancia horizontal entre la posición actual de Twinber y `target_x_pct`.
  3. **Orientación Horizontal:** Si `target_x_pct < x_actual`, se aplica `transform: scaleX(-1)` (mirar a la izquierda); en caso contrario, `scaleX(1)` (mirar a la derecha).
  4. **Ciclo de Caminata (`WALK`):** El sprite conmuta a la animación de pasos (`steps(4)` a 8 fps) mientras CSS desplaza la posición `left` con `transition: left 1.2s ease-in-out`.
  5. **Llegada y Activación:** Al alcanzar `target_x_pct`, el sprite pasa a estado `IDLE` (o `TALK` si es una conversación) y se dispara la llamada al `engine.step()`.

* **Sincronización de Animaciones con Streaming de Tokens:**
  * **Estado `IDLE` (En reposo):** Animación en bucle sutil (respiración y pestañeo ocasional) a 4 fps.
  * **Estado `TALK` (Hablando en vivo):** Mientras el LLM emite tokens por streaming (`delta.content`), el contenedor del personaje que habla adquiere la clase CSS `.is-talking` (animación de mandíbula y gestos retro).
  * **Retorno a Reposo:** Al detectarse `finish_reason == "stop"`, se retira la clase `.is-talking` y el personaje regresa a `IDLE`.

### 1.17.1. Reglas Canónicas de Extracción, Normalización y Anclaje de Sprites (Zero-Jitter Engine)
Para evitar los desplazamientos laterales indeseados y el "bamboleo" durante las animaciones (especialmente visible al hablar o cambiar de fotograma), se establecen **4 reglas obligatorias e inmutables** para Twinber, Paco y cualquier personaje futuro:

1. **Lienzo Fijo Uniforme (Uniform Bounding Canvas):**  
   Todos los frames de un mismo personaje (ciclos de caminata, reposo y diálogo) **deben compartir exactamente la misma resolución de lienzo transparente RGBA**.
   * *Twinber:* Exactamente `192 x 256 px` en todos sus 14 fotogramas (6 walk, 4 idle, 4 talk).
   * *Paco el Pescador:* Exactamente `280 x 400 px` en todos sus 8 fotogramas (4 idle, 4 talk).
   * *Futuros Personajes (Chano, Manolo, Taquillero, Yeray):* Se define un lienzo uniforme que envuelva holgadamente la silueta más ancha y alta de su hoja de sprites.
2. **Punto de Anclaje de Contacto con el Suelo Invariante (Ground Foot Anchor):**  
   * **Eje Horizontal (X):** El centro de masa horizontal de los pies (el 15% inferior de la silueta en contacto con los adoquines) se alinea **estrictamente en el centro horizontal del lienzo** ($X_{\text{anchor}} = \text{ancho} // 2$).
   * **Eje Vertical (Y):** La suela de los zapatos se apoya sobre una **línea de tierra constante** ($Y_{\text{anchor}} = \text{alto} - \text{margen}$).
   * Al gesticular con las manos o mover la mandíbula al hablar, los pies y el eje de la columna permanecen clavados al milímetro en la misma coordenada, suprimiendo al 100% el temblor o jitter lateral.
3. **Anclaje CSS y Transformación con `translateX(-50%)`:**  
   * En CSS (`retro.css`) y en el bucle de renderizado reactivo (`ViewportView.ts`):
     `transform: translateX(-50%) scaleX(facing);`
     `transform-origin: bottom center;`
   * La coordenada `left: xPct%` define con exactitud matemática el centro de los pies del actor en el escenario. Al girar hacia la izquierda (`facing = -1`) o derecha (`facing = 1`), el personaje pivota sobre sus propios talones sin desplazarse de su posición.
4. **Pipeline Automatizado (`scripts/extract_assets.py`):**  
   Cualquier nueva hoja de sprites debe procesarse mediante la función canónica `extract_aligned_actor()`, que calcula automáticamente el centroide de los pies mediante flood-fill y compone cada fotograma centrado sobre el lienzo uniforme correspondiente.

* **Bucles Ambientales de Enclave (Capa 1):**
  * *Puerto de la Cruz:* Olas rompiendo en el muelle y gaviotas flotando.
  * *La Orotava:* Aspas giratorias del Molino de Chano (`animation: rotate 6s linear infinite`).
  * *El Teide:* Fumarolas ascendentes y capa de "mar de nubes" con desplazamiento horizontal continuo.

### 1.18. Barra de Acciones SCUMM, Línea de Frase Dinámica e Inventario Gráfico con Visor Modal

* **Distribución del Tercio Inferior (Layout de 3 Bloques Retro):**
  Inspirado en la ergonomía clásica de los juegos de LucasArts de 1990:
  ```text
  ┌─────────────────────────┬───────────────────────────────┬─────────────────────────┐
  │  1. MATRIZ DE VERBOS    │   2. LÍNEA DE FRASE & INPUT   │   3. INVENTARIO GRÁFICO │
  │  (Botones de Acción)    │   (Orquestador Conversacional)│   (Mochila de Twinber)  │
  ├─────────────────────────┼───────────────────────────────┼─────────────────────────┤
  │  [ HABLAR ]  [ MIRAR ]  │   Línea de Orden (Ámbar/Cian):│   [📘 Pasaporte (X/10)] │
  │  [ USAR   ]  [ DAR   ]  │   "Usar Monedas con Chano..." │   [📸 Álbum     (Y/28)] │
  │  [ IR A   ]  [ VIAJAR]  │  ┌──────────────────────────┐ │   [🪙 Bolsa     (12 💰)]│
  │  [ CLIMA  ]  [ CALIMA]  │  │ Escribe o edita aquí...  │ │   [🌾 Bolsa de Gofio  ] │
  │  [ 💡 PENSAR         ]  │  └──────────────────────────┘ │   [📜 Nota de Ruta    ] │
  └─────────────────────────┴───────────────────────────────┴─────────────────────────┘
  ```

* **Línea de Frase Dinámica (Modelo Híbrido Point & Click + LLM Libre):**
  1. **Construcción Asistida por Clics:**
     * Clic en verbo `[DAR]` $\rightarrow$ Línea muestra: `"Dar..."`.
     * Clic en ítem de inventario `[🪙 Bolsa]` $\rightarrow$ Línea muestra: `"Dar Monedas a..."`.
     * Clic en hotspot de NPC `[Chano]` $\rightarrow$ Línea completa: `"Dar 3 Monedas a Chano el Molinero"` y dispara la ejecución.
  2. **Entrada de Texto Libre:**
     * Caja de entrada debajo de la línea de frase.
     * Permite conversar naturalmente con el NPC activo para indagar sobre secretos, historia o pistas sin limitarse a órdenes rígidas.

* **Inventario Gráfico y Visores Modales de Coleccionables:**
  * **Objetos Permanentes:**
    * 📘 `Pasaporte de Explorador`: Registra los 10 sellos comarcales + Teide.
    * 📸 `Álbum de Fotos`: Registra las 28 fotografías extraídas de `TENERIFE.pdf`.
    * 🪙 `Bolsa de Monedas`: Contador visual (15 monedas iniciales).
  * **Mecánica de Inspección Modal (`[MIRAR]` en Coleccionables):**
    * Al pulsar `[MIRAR]` en el Pasaporte, se superpone un modal retro tipo libreta mostrando los sellos físicos estampados (tinta roja y azul) en el mapa de las 2 zonas.
    * Al pulsar `[MIRAR]` en el Álbum de Fotos, se abre una galería retro en cuadrícula/carrusel con las postales a alta resolución desbloqueadas, su página citada en el PDF y el pie de foto.
  * **Objetos de Aventura Adquiridos:**
    * 🌾 `Bolsa de Gofio` (3 monedas, Chano).
    * 📜 `Comanda del Guachinche y Nota TF-24` (4 monedas, Manolo).
    * 🎫 `Billete del Teleférico del Teide` (5 monedas, Operario).
    * 🍌 `Plátano de Canarias` (encontrado en plantación).

* **Contrato Pydantic para el Estado de la UI (`UIActionState` & `InventoryItem`):**
  ```python
  from typing import Literal, Optional
  from pydantic import BaseModel, Field

  class InventoryItem(BaseModel):
      id: str = Field(..., description="ID único del ítem")
      nombre: str = Field(..., description="Nombre visible")
      icono: str = Field(..., description="Icono o emoji representativo")
      tipo: Literal["PERMANENTE", "CONSUMIBLE", "CLAVE"]
      cantidad: int = 1
      inspeccionable: bool = False  # Abre modal al hacer MIRAR

  class UIActionState(BaseModel):
      verbo_activo: Optional[str] = None
      item_origen_id: Optional[str] = None
      target_hotspot_id: Optional[str] = None
      frase_compuesta: str = ""
      texto_libre: str = ""
  ```

### 1.19. El Clímax del Teide, La Prueba de las Estrellas y Scorecard de Victoria

* **Precondiciones Deterministas para el Ascenso a la Cumbre (3.718 m):**
  1. **Pasaporte Completo:** 10 sellos estampados (5 Norte + 5 Sur).
  2. **Billete del Teleférico:** Adquirido al Operario por 5 monedas de oro.
  3. **Provisiones Térmicas:** Bolsa de Gofio de La Orotava (3 monedas) para resistir el frío y mal de altura.
  4. **Condición Meteorológica Cumbre (`get_weather`):** Viento < 50 km/h y cielo sin tormenta severa.

* **El Encuentro Final: El Guardián de las Estrellas:**
  * Al alcanzar la cumbre al atardecer, la escena conmuta al cielo nocturno estrellado (Reserva Starlight del Teide).
  * Aparece **El Guardián de la Cumbre** (sabio astrónomo y protector de las tradiciones guanches).
  * **Revelación del Secreto Guanche:** Tras la leyenda del encierro de *Guayota* en *Echeyde* por el dios *Achamán*, el Guardián desvela que el verdadero tesoro es el legado vivo de Tenerife (el mar de nubes, los cielos limpios, la biodiversidad de la laurisilva y la memoria de su gente).
  * **La Prueba Final (3 Preguntas del Viaje):** El Guardián formula 3 preguntas aleatorias sobre enclaves visitados. El LLM valida las respuestas con el RAG de `TENERIFE.pdf`.

* **Pantalla de Victoria y Scorecard del Explorador:**
  Al superar la prueba final, se activa el cartel retro **"THE END - ¡EXPEDICIÓN COMPLETADA!"** con el informe de evaluación para el tribunal:
  ```text
  ╔══════════════════════════════════════════════════════════════════╗
  ║             ¡EXPEDICIÓN A TENERIFE COMPLETADA CON ÉXITO!        ║
  ╠══════════════════════════════════════════════════════════════════╣
  ║ 📘 Pasaporte de Explorador:  11 / 11 Sellos (Ruta 100% Superada) ║
  ║ 📸 Álbum de Fotos de la Isla: X / 28 Postales Desbloqueadas      ║
  ║    → Rango: "Gran Explorador" (o "Maestro Guanche" si 28/28)    ║
  ║ 🪙 Monedas Restantes:        Y / 15 Monedas de Oro               ║
  ║                                                                  ║
  ║ --- MÉTRICAS DE TELEMETRÍA Y EVALUACIÓN (TRIBUNAL DEL MÁSTER) -- ║
  ║ ⏱️ Turnos Totales Jugados:   N turnos                            ║
  ║ 🧠 Tokens Totales:           T tokens (Coste aproximado en $)    ║
  ║ 🛠️ Llamadas a Herramientas:  M invocaciones verificadas          ║
  ║ 🛡️ Incidentes de Seguridad:  0 (Guardrails 100% limpios)        ║
  ╚══════════════════════════════════════════════════════════════════╝
  ```

### 1.20. Diseño Sonoro Retro (SFX Chiptune y Web Audio API)

* **Catálogo Oficial de Efectos de Sonido (SFX):**
  | ID de Sonido | Momento de Activación | Efecto Acústico Retro (8/16 bits) |
  | :--- | :--- | :--- |
  | `sfx_stamp` | Nuevo sello estampado en pasaporte | Golpe sordo y seco de sello de goma (*"¡Khlump!"*) |
  | `sfx_photo` | Foto del PDF desbloqueada vía RAG | Clic mecánico de obturador y flash (*"Chik-chiiik!"*) |
  | `sfx_coin` | Pago a un NPC con monedas | Tintineo metálico de monedas de oro (*"¡Plink-chink!"*) |
  | `sfx_travel` | Transición del mapa Indiana Jones | Motor de guagua/avión y chasquido de brújula |
  | `sfx_talk_blip`| Streaming de tokens | Micro-bips suaves de teletipo (discretos) |
  | `sfx_hint` | Clic en botón `[💡 PENSAR]` | Campanilla mágica ascendente (*"¡Dlinnn!"*) |
  | `sfx_victory`| Final del juego superado | Fanfarria arpegiada chiptune triunfal (5 seg) |

* **Arquitectura de Audio No Bloqueante (Web Audio API en el Frontend):**
  * Archivos minúsculos (5-15 KB cada uno) en `assets/audio/` (`.wav`/`.mp3` mono a 8 kHz).
  * El contrato `TurnResult` devuelve la lista de sonidos a disparar: `sfx_to_play: list[str]`.
  * El módulo `frontend/js/audio.js` ejecuta la reproducción de forma asíncrona mediante HTML5 Web Audio (`new Audio(...).play()`), sin bloquear nunca el hilo principal ni la interfaz.
  * Botón de accesibilidad `[ 🔊 / 🔇 ]` en la barra superior para silenciar el juego con un solo clic.

---

## 2. Estrategia de Memoria & Control de Ventana de Tokens

* **Modelo Híbrido: Summary Buffer + Ventana Deslizante:**
  * Conserva intacto el `System Prompt` (identidad del juego, reglas, tono de aventura gráfica).
  * **Estado Invariante Fuera del Historial:** El pasaporte (sellos), el álbum (fotos conseguidas) y el inventario (monedas/objetos) viajan como un bloque compacto de estado estructurado dentro del `System Prompt`, consumiendo apenas ~100 tokens y eliminando alucinaciones.
  * **Ventana Reciente (Últimos 4 turnos):** Conserva íntegros los últimos 4 intercambios con el interlocutor activo para garantizar fluidez y coherencia conversacional inmediata.
  * **Resumen Narrativo Acumulado (*Narrative Summary*):** Comprime los turnos antiguos en una sinopsis compacta de 3 o 4 líneas sobre los hitos superados por Twinber en la isla.

* **Presupuesto Fijo de Tokens por Turno (*Token Budgeting*):**

| Componente del Prompt | Presupuesto Máximo de Tokens |
| :--- | :--- |
| **System Prompt + Personalidad + Estado Compacto** | $\sim 700\text{ tokens}$ |
| **Contexto RAG recuperado (Top-2 chunks de `TENERIFE.pdf`)** | $\sim 600\text{ tokens}$ |
| **Resumen narrativo + Últimos 4 turnos de diálogo** | $\sim 600\text{ tokens}$ |
| **Mensaje actual del jugador** | $\sim 100\text{ tokens}$ |
| **Margen de generación (`max_tokens`)** | $500\text{ tokens}$ |
| **Total Estimado por Turno** | **$\sim 2.500\text{ tokens}$** *(Coste $< 0.001\$$ con `gpt-4o-mini`)* |

---

## 3. UI y Estética Retro: El Homenaje a LucasArts (SCUMM Point & Click Nativo)

* **Filosofía de Interfaz (Homenaje a *Monkey Island* e *Indiana Jones*):**
  * Dinámica auténtica **Point & Click**: el escenario muestra los personajes, objetos y salidas interactuables de la zona actual.
  * **Diálogos Vivos por LLM:** En lugar de árboles de diálogo rígidos con frases enlatadas, al hacer clic en un personaje se abre un canal de conversación libre e inteligente donde el LLM encarna al NPC con su personalidad, acento canario y conocimientos del Códice RAG.
  * Implementación en **Frontend Web Nativo Desacoplado (`frontend/`)** servido por **FastAPI**, con estilos CSS retro puros (Google Fonts pixeladas 'Press Start 2P', marco VGA 320x200 escalado con `image-rendering: pixelated`, paleta clásica de 256 colores y scanlines CRT).

* **Estructura Modular del Frontend (`frontend/`):**
  * `frontend/index.html`: Marcado semántico del escenario, lienzo multicapa, matriz de verbos, inventario y consola CRT.
  * `frontend/css/retro.css`: Estilos visuales retro, animaciones de sprites (`steps`), scanlines CRT y diseño adaptable.
  * `frontend/js/game.js`: Control del micro-movimiento de Twinber, selección de hotspots y renderizado de la escena.
  * `frontend/js/api.js`: Cliente HTTP REST y consumidor de Server-Sent Events (SSE) para streaming de tokens.
  * `frontend/js/audio.js`: Gestor Web Audio API para disparar efectos de sonido SFX sin latencia.

* **Distribución y Cuadrícula del Layout Oficial (Base 640 x 360 px, 16:9):**
  ```text
   0 px ┌────────────────────────────────────────────────────────────────────────┐
        │  ZONA 1: EL ESCENARIO GRÁFICO (VIEWPORT)                               │
        │  Tamaño: 640 x 240 px (66.6% del alto total)                           │
        │  - Fondo del enclave: 640 x 240 px                                     │
        │  - Sprites de personajes: ~ 48 x 96 px                                 │
        │  - Subtítulos flotantes de diálogo (amarillo / cyan)                   │
  240 px ├────────────────────────────────────────────────────────────────────────┤
        │  ZONA 2: LÍNEA DE FRASE DINÁMICA & INPUT                               │
        │  Tamaño: 640 x 24 px (Texto en color ámbar / cian: "Hablar con...")    │
  264 px ├───────────────────────────────┬────────────────────────────────────────┤
        │  ZONA 3A: MATRIZ DE VERBOS    │  ZONA 3B: INVENTARIO GRÁFICO           │
        │  Tamaño: 320 x 96 px          │  Tamaño: 320 x 96 px                   │
        │  - Cuadrícula de 6 botones    │  - Cuadrícula 2 filas x 4 columnas     │
        │    (HABLAR, MIRAR, USAR,      │  - 8 casillas de 36 x 36 px (o 48x48)  │
        │     IR A, CLIMA, PENSAR)      │    (Monedas, Pasaporte, Álbum, Gofio)  │
  360 px └───────────────────────────────┴────────────────────────────────────────┘
  ```

* **Ficha Técnica Oficial de Tamaño de Assets:**

| Tipo de Asset | Dimensiones Nativas (Píxeles) | Proporción | Formato | Uso en el Juego |
| :--- | :---: | :---: | :---: | :--- |
| **Fondos de Escenario (10+1 enclaves)** | **$640 \times 240$ px** | $8:3$ (~2.67:1) | `.png` / `.webp` | Fondo panorámico de la escena visible. |
| **Sprite de Twinber (Protagonista)** | **$48 \times 96$ px** | $1:2$ | `.png` transparente | Altura equivalente al 40% del escenario. |
| **Sprites de NPCs** | **$48 \times 96$ px** (o $64 \times 96$) | $\sim 1:2$ | `.png` transparente | Chano, Manolo, Operario, Paco, Yeray. |
| **Iconos de Inventario** | **$36 \times 36$ px** (o $48 \times 48$) | $1:1$ | `.png` transparente | Bolsa de monedas, gofio, nota, billete. |
| **Sellos del Pasaporte** | **$40 \times 40$ px** | $1:1$ | `.png` transparente | Estampas de tinta roja/azul. |
| **Postales del Álbum RAG (Miniatura)** | **$80 \times 60$ px** | $4:3$ | `.png` / `.webp` | Casilla del álbum en cuadrícula. |
| **Postales del Álbum RAG (Zoom Modal)**| **$480 \times 320$ px** | $3:2$ | `.png` / `.webp` | Visor a pantalla completa al pulsar `[MIRAR]`. |

* **Concept Mockup Visual:**
  * Archivo de referencia: `![Mockup SCUMM](/home/twinber/.gemini/antigravity-cli/brain/e6405918-3600-4f05-97bf-cd0127944c72/scumm_adventure_mockup_1791664109790.jpg)`




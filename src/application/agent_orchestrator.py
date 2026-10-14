"""
Aplicación: Orquestador Agéntico Central (Supervisor ReAct Loop) con soporte Multimodal y Grounding.
Unifica RAG (ChromaDB), Meteorología (Open-Meteo), Memoria Híbrida, Guardrails y Auditoría.
Cumple con los requisitos de las Sesiones 03, 04 y 05 del Máster (RAG, Function Calling y Agentes).
"""

import base64
import json
import logging
import mimetypes
import time
from pathlib import Path
from typing import Any, Callable, Optional

from openai import OpenAI

from src.domain.guardrail_models import GuardrailDecision
from src.domain.rag_models import RespuestaCodiceRAG, ResultadoBusquedaRAG
from src.domain.state_models import GameState, TurnResult, OFFICIAL_ENCLAVE_STAMPS, is_passport_stamp_request, ExecutionStep
from src.infrastructure.audit_logger import AuditLogger
from src.infrastructure.config import Settings, get_settings
from src.application.guardrails import BouncerGuardrail
from src.application.memory_manager import ConversationMemoryManager
from src.application.rag_retriever import RAGRetriever
from src.application.weather_service import WeatherService

logger = logging.getLogger(__name__)

SUPERVISOR_SYSTEM_PROMPT = """Eres el Narrador Oficial y Motor de Juego de 'Twinber en busca del secreto Guanche', una aventura gráfica conversacional interactiva (estilo retro SCUMM / LucasArts de los 90, como Monkey Island o Fate of Atlantis).

Tu personalidad y estilo:
- Narras en segunda persona ("Miras a tu alrededor...", "Paco te mira con socarronería...", "Avanzas por la empedrada calle...") con humor inteligente, calidez canaria y tono de explorador intrépido.
- Cada enclave de la isla tiene su propia atmósfera: el salitre pesquero en Puerto de la Cruz, el aroma a gofio tostado en La Orotava, los guachinches de Santa Úrsula, los acantilados imponentes de Masca o la inmensidad volcánica bajo las estrellas en el Teide.

REGLAS DE ORO DE GROUNDING Y CITAS (OBLIGATORIAS):
1. Cuando el jugador pregunte sobre historia, lugares, monumentos, senderos, playas o gastronomía de Tenerife, DEBES invocar la herramienta 'search_guide' para consultar el Códice oficial (TENERIFE.pdf).
2. Cuando utilices información recuperada de 'search_guide', DEBES citar explícitamente el número de página oficial (ejemplo: "[Pág. 8]", "[Pág. 11]") devuelto por la herramienta dentro de tu narración. ¡Jamás inventes datos geográficos o históricos!
3. ¡ESTRICTAMENTE PROHIBIDO inventar o simular citas de páginas como [Pág. X] si no has recibido esa página exacta en el resultado de 'search_guide'! Si no se llamó a la herramienta, jamás inventes corchetes con páginas.
4. Cuando el jugador pregunte sobre el clima, viento, lluvia, mar de nubes o temperatura, DEBES invocar 'get_weather'.
5. Cuando el jugador pregunte sobre la calidad del cielo nocturno o estrellas en el Teide, DEBES invocar 'get_starlight_conditions'.
6. Cuando el jugador pregunte sobre polvo sahariano, calima o visibilidad, DEBES invocar 'get_calima_alert'.
7. Si recibes una imagen visual (el escenario pixel-art o una foto del álbum), obsérvala detenidamente, deduce el enclave y utiliza 'search_guide' para enriquecer tu descripción con hechos históricos de la guía.

REGLAS ESPECÍFICAS DE PERSONAJES Y PASAPORTE DE EXPLORADOR (ESTRICTAMENTE OBLIGATORIAS):
1. AUTORIDAD LOCAL DE CADA ENCLAVE:
   El personaje (NPC) presente ante Twinber es la máxima autoridad del lugar y el custodio que porta el cuño oficial de su enclave:
   - Puerto de la Cruz: Paco el Pescador (Aduana Marítima).
   - La Orotava: Chano el Molinero (Molinos de Gofio).
   - Santa Úrsula: Manolo el Tabernero (¡Atención! Es un guachinche de comida tradicional, NO tiene cuño aduanero oficial).
   - Icod de los Vinos: Don Cándido el Bodeguero (Sabio botánico y guardián del Drago Milenario).
   - Garachico: Doña Nieves (Artesana y guardiana de El Caletón).
   - San Cristóbal de La Laguna: Profesora Herminia (UNESCO / Universidad).
   - Santa Cruz de Tenerife: Oficial Morales (Autoridad Portuaria).
   - Anaga: Yeray el Guarda Forestal (Reserva de la Biosfera).
   - Costa Adeje: Ayoze el Socorrista (Litoral Sur).
   - Masca / Los Gigantes: Tanausú el Guía de Montaña (Barranco de Masca).
   - El Médano: El Frutero Canario (Bahía de Montaña Roja).
   - Las Cañadas del Teide: Operario del Teleférico (Base del volcán).
   - Pico del Teide: Guardián del Teide (Cumbre a 3.718m).

2. PROTOCOLO DE SELLADO DEL PASAPORTE:
   Cuando el jugador pida sellar su pasaporte de explorador (o mencione sellos, cuños o visar pasaporte):
   - SI EL ENCLAVE ES SELLABLE Y EL SELLO ESTÁ PENDIENTE:
     El personaje DEBE ACEPTAR DE INMEDIATO con entusiasmo y orgullo isleño. Saca su almohadilla de tinta y cuño oficial, y estampa solemnemente el sello en el pasaporte de Twinber (*¡CLAC! ¡Sello oficial estampado!*).
     ¡BAJO NINGÚN CONCEPTO envíes al jugador a otro lugar, ni a un centro de visitantes, ni a un museo, ni a una oficina de turismo! El personaje QUE TIENE DELANTE es el custodio oficial y lo estampa en ese mismo instante.
   - SI EL SELLO YA HABÍA SIDO ESTAMPADO PREVIAMENTE:
     El personaje examina el pasaporte con simpatía y le recuerda con humor canario que la marca oficial de este enclave ya luce en sus páginas, animándole a viajar a los demás pueblos para reunir los 10 sellos.
   - SI ESTÁ EN SANTA ÚRSULA (GUACHINCHE):
     Manolo el Tabernero suelta una carcajada afable y explica que esto es un guachinche de vino del país y carne fiesta, no una oficina del Cabildo. Aclara que allí se sella el apetito y que busque los sellos oficiales en las villas y enclaves patrimoniales.

3. FORMATO Y PRESENTACIÓN VISUAL EN PANTALLA (ESTRICTAMENTE OBLIGATORIO):
   - NUNCA generes un bloque continuo o atropellado de texto.
   - Usa saltos de línea dobles entre párrafos para separar la introducción, los puntos clave y el cierre.
   - Si enumeras secretos, curiosidades, lugares o historias del enclave, coloca CADA elemento en una línea independiente precedida de un guión:
     - **Nombre del Lugar o Monumento**: Breve explicación histórica o curiosidad interesante.
     - **Siguiente Punto**: Su detalle clave [Pág. X].
   - NUNCA unas títulos o puntos sin espacios ni saltos de línea (evita escribir `...palabra.**Punto**:...`).
   - Mantén la narración ágil, atractiva y legible (máximo 2 o 3 párrafos cortos o viñetas bien estructuradas), adecuada para los subtítulos de una aventura gráfica.
"""


class AgentOrchestrator:
    """
    Supervisor central agéntico.
    Ejecuta el bucle ReAct autónomo, gestiona el estado determinista del juego,
    coordina herramientas y produce el contrato TurnResult tipado.
    """

    MAX_TOOL_ITERATIONS = 5

    def __init__(
        self,
        settings: Optional[Settings] = None,
        memory_manager: Optional[ConversationMemoryManager] = None,
        rag_retriever: Optional[RAGRetriever] = None,
        weather_service: Optional[WeatherService] = None,
        guardrail: Optional[BouncerGuardrail] = None,
        audit_logger: Optional[AuditLogger] = None,
        openai_client: Optional[OpenAI] = None
    ):
        self.settings = settings or get_settings()
        self.client = openai_client or OpenAI(api_key=self.settings.OPENAI_API_KEY)
        self.audit_logger = audit_logger or AuditLogger()
        self.memory_manager = memory_manager or ConversationMemoryManager(
            settings=self.settings,
            openai_client=self.client
        )
        self.rag_retriever = rag_retriever or RAGRetriever()
        self.weather_service = weather_service or WeatherService(audit_logger=self.audit_logger)
        self.guardrail = guardrail or BouncerGuardrail(
            settings=self.settings,
            openai_client=self.client,
            audit_logger=self.audit_logger
        )

        # Construcción del catálogo unificado de herramientas para OpenAI
        self.tools = self._build_tools_definitions()

    def _build_tools_definitions(self) -> list[dict[str, Any]]:
        """Unifica las herramientas climatológicas y la herramienta documental RAG."""
        tools = list(self.weather_service.get_openai_tools_definitions())

        rag_tool = {
            "type": "function",
            "function": {
                "name": "search_guide",
                "description": (
                    "Consulta el Códice oficial de Tenerife (TENERIFE.pdf) para recuperar fragmentos históricos, "
                    "puntos de interés, rutas, gastronomía y recomendaciones verificables citando página oficial."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Consulta de búsqueda en lenguaje natural (ej: 'Casa de los Balcones y molino de Chano')"
                        },
                        "enclave": {
                            "type": "string",
                            "description": "Enclave específico opcional para geocercado (ej: 'La Orotava', 'Puerto de la Cruz')"
                        }
                    },
                    "required": ["query"],
                    "additionalProperties": False
                }
            }
        }
        tools.append(rag_tool)
        return tools

    def _encode_image_to_data_url(self, image_path: str) -> Optional[str]:
        """Convierte una imagen en disco local a una Data URL Base64 para OpenAI Vision API."""
        p = Path(image_path)
        if not p.exists() or not p.is_file():
            # Intentar resolver mediante rutas relativas al frontend
            candidates = [
                Path("frontend/public") / image_path.lstrip("/"),
                Path("frontend/public/assets") / image_path.replace("assets/", "").lstrip("/"),
                Path(image_path.lstrip("/"))
            ]
            for cand in candidates:
                if cand.exists() and cand.is_file():
                    p = cand
                    break

        if not p.exists() or not p.is_file():
            logger.warning("Ruta de imagen no encontrada para visión: '%s'", image_path)
            return None

        mime_type, _ = mimetypes.guess_type(str(p))
        mime_type = mime_type or "image/jpeg"

        with open(p, "rb") as f:
            b64_data = base64.b64encode(f.read()).decode("utf-8")

        return f"data:{mime_type};base64,{b64_data}"

    def _apply_state_mutations(
        self,
        state: GameState,
        user_input: str,
        fotos_desbloqueadas_en_turno: list[int],
        sellos_desbloqueados_en_turno: list[str],
        sfx_list: list[str],
        pasos_ejecucion: list[ExecutionStep],
        record_step: Callable[[ExecutionStep], None]
    ) -> None:
        """Aplica mutaciones deterministas a GameState y registra el ExecutionStep si hubo novedades."""
        loc_actual = state.ubicacion_actual
        if is_passport_stamp_request(user_input):
            stamp_info = OFFICIAL_ENCLAVE_STAMPS.get(loc_actual)
            if stamp_info and stamp_info.get("stampable"):
                stamp_key = stamp_info["stamp_key"]
                if stamp_key and stamp_key not in state.sellos_obtenidos and stamp_key not in sellos_desbloqueados_en_turno:
                    state.sellos_obtenidos.append(stamp_key)
                    sellos_desbloqueados_en_turno.append(stamp_key)
                    if "sfx_stamp" not in sfx_list:
                        sfx_list.append("sfx_stamp")

        for f_id in fotos_desbloqueadas_en_turno:
            if f_id not in state.fotos_desbloqueadas:
                state.fotos_desbloqueadas.append(f_id)
                if "sfx_photo" not in sfx_list:
                    sfx_list.append("sfx_photo")

        mutaciones_desc = []
        if sellos_desbloqueados_en_turno:
            mutaciones_desc.append(f"Sello estampado: {sellos_desbloqueados_en_turno[0]}")
        if fotos_desbloqueadas_en_turno:
            mutaciones_desc.append(f"Fotos desbloqueadas: {fotos_desbloqueadas_en_turno}")

        if mutaciones_desc and not any(p.tipo == "MUTACION_ESTADO" for p in pasos_ejecucion):
            record_step(ExecutionStep(
                id=f"step-{len(pasos_ejecucion)+1}",
                tipo="MUTACION_ESTADO",
                titulo="Mutación Determinista de Estado (GameState)",
                icono="⚙️",
                color="#00e676",
                contenido=" | ".join(mutaciones_desc),
                detalles={
                    "sellos_nuevos": sellos_desbloqueados_en_turno,
                    "fotos_nuevas": fotos_desbloqueadas_en_turno,
                    "sellos_totales": len(state.sellos_obtenidos),
                    "fotos_totales": len(state.fotos_desbloqueadas)
                }
            ))
            self.audit_logger.log_state_mutation(
                nombre_operacion="game_state_update",
                argumentos={
                    "sellos_nuevos": list(sellos_desbloqueados_en_turno),
                    "fotos_nuevas": list(fotos_desbloqueadas_en_turno)
                },
                resultado_resumen=" | ".join(mutaciones_desc),
                latencia_ms=0.0,
                estado="SUCCESS"
            )

    def process_turn(
        self,
        user_input: str,
        game_state: Optional[GameState] = None,
        image_path: Optional[str] = None,
        on_step: Optional[Callable[[ExecutionStep], None]] = None,
        on_token: Optional[Callable[[str], None]] = None
    ) -> TurnResult:
        """
        Ejecuta un turno completo de juego:
        1. Filtro Guardrail Bouncer de entrada.
        2. Ensamblado del System Prompt y memoria con GameState.
        3. Bucle ReAct con tools (RAG, Weather, Starlight, Calima).
        4. Mutación determinista del juego (sellos, fotos, monedas).
        5. Retorno de TurnResult estructurado y emisión de tokens en tiempo real.
        """
        start_turn_time = time.perf_counter()
        state = game_state.model_copy(deep=True) if game_state else GameState()
        loc_actual = state.ubicacion_actual
        pasos_ejecucion: list[ExecutionStep] = []

        def record_step(step: ExecutionStep) -> None:
            pasos_ejecucion.append(step)
            if on_step:
                try:
                    on_step(step)
                except Exception as e:
                    logger.warning("Error notificando on_step: %s", e)

        # 1. EVALUACIÓN DE GUARDRAIL BOUNCER
        t_guard = time.perf_counter()
        guardrail_decision: GuardrailDecision = self.guardrail.evaluate(
            user_input,
            has_image=bool(image_path)
        )
        lat_guard_ms = (time.perf_counter() - t_guard) * 1000.0

        if not guardrail_decision.es_valido:
            # Entrada rechazada por off-topic o prompt injection
            rechazo_texto = guardrail_decision.respuesta_tematica or (
                "Twinber consulta su brújula y sacude la cabeza con una sonrisa irónica: "
                "'Mi cuaderno de bitácora solo tiene ojos para los enigmas de Tenerife, forastero. "
                "Hablemos de la isla, sus senderos o sus volcanes.'"
            )
            record_step(ExecutionStep(
                id=f"step-{len(pasos_ejecucion)+1}",
                tipo="GUARDRAIL",
                titulo="Guardrail Bouncer Check [BLOQUEADO]",
                icono="🛡️",
                color="#ff5252",
                contenido=f"Entrada bloqueada por moderación: {guardrail_decision.motivo_bloqueo or 'Off-topic'}",
                detalles={
                    "es_valido": False,
                    "categoria": guardrail_decision.motivo_bloqueo or "OFF_TOPIC",
                    "motivo": guardrail_decision.motivo_bloqueo or "Rechazado por moderación"
                },
                latencia_ms=round(lat_guard_ms, 1)
            ))
            if on_token:
                try:
                    on_token(rechazo_texto)
                except Exception:
                    pass
            return TurnResult(
                narrativa=rechazo_texto,
                estado=state,
                visual_asset=None,
                citas=[],
                fotos_nuevas=[],
                sellos_nuevos=[],
                sfx_to_play=[],
                pasos_ejecucion=pasos_ejecucion
            )

        record_step(ExecutionStep(
            id=f"step-{len(pasos_ejecucion)+1}",
            tipo="GUARDRAIL",
            titulo="Guardrail Bouncer Check",
            icono="🛡️",
            color="#00ffcc",
            contenido="Entrada analizada: TEMATICA_TENERIFE (Segura / On-topic)",
            detalles={
                "es_valido": True,
                "categoria": "TEMATICA_TENERIFE",
                "latencia_ms": round(lat_guard_ms, 1)
            },
            latencia_ms=round(lat_guard_ms, 1)
        ))

        # 2. CONSTRUCCIÓN DEL MENSAJE DEL USUARIO (CON O SIN IMAGEN MULTIMODAL)
        image_data_url = self._encode_image_to_data_url(image_path) if image_path else None

        if image_data_url:
            record_step(ExecutionStep(
                id=f"step-{len(pasos_ejecucion)+1}",
                tipo="VLM_VISION",
                titulo="Visión Multimodal VLM (GPT-4o-mini)",
                icono="👁️",
                color="#d500f9",
                contenido=f"Inspección de imagen: '{image_path}' codificada en Base64",
                detalles={
                    "asset": image_path,
                    "modelo": self.settings.OPENAI_MODEL_MAIN,
                    "modalidad": "Visión computacional + RAG documental"
                }
            ))
            user_message_payload: Any = [
                {"type": "text", "text": user_input},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": image_data_url,
                        "detail": "auto"
                    }
                }
            ]
        else:
            user_message_payload = user_input

        # Registro del mensaje en el gestor de memoria
        self.memory_manager.add_user_message(user_input)

        # Obtención de los mensajes listos para el LLM con el GameState inyectado
        messages = self.memory_manager.get_messages_for_llm(
            base_system_prompt=SUPERVISOR_SYSTEM_PROMPT,
            game_state=state
        )

        # Si el turno es multimodal, reemplazamos el contenido textual del último mensaje con el payload visual
        if image_data_url and messages and messages[-1]["role"] == "user":
            messages[-1]["content"] = user_message_payload

        # 3. BUCLE REACT AUTÓNOMO (TOOL CALLING)
        citas_recuperadas: list[RespuestaCodiceRAG] = []
        fotos_desbloqueadas_en_turno: list[int] = []
        fotos_relacionadas_en_turno: list[int] = []
        sellos_desbloqueados_en_turno: list[str] = []
        sfx_list: list[str] = []
        narrativa_final = ""
        turn_tokens_input = 0
        turn_tokens_output = 0

        def should_require_tools(text: str, has_img: bool) -> bool:
            if has_img:
                return True
            lower = text.lower()
            keywords = [
                "qué me puedes contar", "que me puedes contar", "secretos", "curiosidades",
                "historia", "monumentos", "lugares", "playas", "senderos", "qué ver",
                "que ver", "qué hay aquí", "que hay aqui", "dónde comer", "donde comer",
                "guachinche", "información", "informacion", "guía", "guia", "códice", "codice",
                "clima", "viento", "tiempo", "temperatura", "estrellas", "starlight", "calima"
            ]
            return any(k in lower for k in keywords)

        require_tool_on_first_iter = should_require_tools(user_input, image_data_url is not None)

        iteration = 0
        while iteration < self.MAX_TOOL_ITERATIONS:
            iteration += 1

            # Si ya se ejecutaron herramientas en iteraciones previas, transmitimos la síntesis en tiempo real
            if iteration > 1:
                stream_resp = self.client.chat.completions.create(
                    model=self.settings.OPENAI_MODEL_MAIN,
                    messages=messages,
                    temperature=self.settings.TEMPERATURE,
                    top_p=self.settings.TOP_P,
                    max_tokens=self.settings.MAX_TOKENS,
                    stream=True,
                    stream_options={"include_usage": True}
                )
                narrativa_final = ""
                for chunk in stream_resp:
                    if hasattr(chunk, "usage") and chunk.usage:
                        turn_tokens_input += getattr(chunk.usage, "prompt_tokens", 0) or 0
                        turn_tokens_output += getattr(chunk.usage, "completion_tokens", 0) or 0
                    delta = chunk.choices[0].delta if chunk.choices else None
                    if delta and delta.content:
                        narrativa_final += delta.content
                        if on_token:
                            try:
                                on_token(delta.content)
                            except Exception as e:
                                logger.warning("Error notificando on_token: %s", e)
                break

            # Si la consulta versa sobre conocimiento documental o clima, exigimos tool call
            # en la primera iteración para evitar atajos perezosos o alucinaciones de páginas.
            current_tool_choice = "required" if (iteration == 1 and require_tool_on_first_iter) else "auto"

            resp = self.client.chat.completions.create(
                model=self.settings.OPENAI_MODEL_MAIN,
                messages=messages,
                tools=self.tools,
                tool_choice=current_tool_choice,
                temperature=self.settings.TEMPERATURE,
                top_p=self.settings.TOP_P,
                max_tokens=self.settings.MAX_TOKENS
            )

            if hasattr(resp, "usage") and resp.usage:
                turn_tokens_input += getattr(resp.usage, "prompt_tokens", 0) or 0
                turn_tokens_output += getattr(resp.usage, "completion_tokens", 0) or 0

            assistant_msg = resp.choices[0].message

            # Comprobar si el modelo requiere ejecutar herramientas
            if assistant_msg.tool_calls:
                # Añadir la llamada del asistente al historial de mensajes
                messages.append(assistant_msg.to_dict())

                for tc in assistant_msg.tool_calls:
                    fn_name = tc.function.name
                    fn_args_raw = tc.function.arguments

                    try:
                        fn_args = json.loads(fn_args_raw)
                    except Exception:
                        fn_args = {}

                    logger.info("Agente invocando herramienta '%s' con args: %s", fn_name, fn_args)

                    # Registrar paso de Tool Call
                    record_step(ExecutionStep(
                        id=f"step-{len(pasos_ejecucion)+1}",
                        tipo="TOOL_CALL",
                        titulo=f"Tool Call: {fn_name}()",
                        icono="🔧" if fn_name == "search_guide" else "🌤️",
                        color="#00e5ff" if fn_name == "search_guide" else "#29b6f6",
                        contenido=f"Llamada estructurada a función '{fn_name}'",
                        detalles={
                            "herramienta": fn_name,
                            "argumentos": fn_args
                        }
                    ))

                    # Ejecución según herramienta
                    if fn_name == "search_guide":
                        query = fn_args.get("query", user_input)
                        enclave_arg = fn_args.get("enclave") or state.ubicacion_actual
                        rag_results = self.rag_retriever.retrieve(
                            query=query,
                            ubicacion_id=enclave_arg,
                            top_k=2
                        )

                        # Registrar fotos desbloqueables y citas
                        for res in rag_results:
                            for f_id in res.fotos_asociadas:
                                if f_id not in fotos_relacionadas_en_turno:
                                    fotos_relacionadas_en_turno.append(f_id)
                                if f_id not in state.fotos_desbloqueadas and f_id not in fotos_desbloqueadas_en_turno:
                                    fotos_desbloqueadas_en_turno.append(f_id)

                            citas_recuperadas.append(
                                RespuestaCodiceRAG(
                                    narracion_turistica=f"Referencia documental: {res.lugar}",
                                    paginas_citadas=[res.pagina],
                                    lugar_referenciado=res.lugar,
                                    cita_textual_evidencia=res.contenido[:200],
                                    foto_desbloqueada_id=res.fotos_asociadas[0] if res.fotos_asociadas else None
                                )
                            )

                        # Registrar paso de RAG
                        record_step(ExecutionStep(
                            id=f"step-{len(pasos_ejecucion)+1}",
                            tipo="RAG_CODICE",
                            titulo="RAG Códice (TENERIFE.pdf)",
                            icono="📚",
                            color="#ffb300",
                            contenido=f"{len(rag_results)} citas documentales recuperadas de ChromaDB para '{query}'",
                            detalles={
                                "enclave": enclave_arg,
                                "query": query,
                                "citas": [
                                    {
                                        "pagina": r.pagina,
                                        "lugar": r.lugar,
                                        "similitud": f"{r.distancia:.3f}" if r.distancia is not None else "N/A",
                                        "texto": r.contenido[:220] + ("..." if len(r.contenido) > 220 else "")
                                    }
                                    for r in rag_results
                                ]
                            }
                        ))

                        # Auditoría persistente de la consulta RAG
                        self.audit_logger.log_rag_retrieval(
                            nombre_operacion="search_guide",
                            argumentos={"query": query, "enclave": enclave_arg},
                            resultado_resumen=f"{len(rag_results)} citas de {', '.join(set(r.lugar for r in rag_results))} (Págs: {', '.join(str(r.pagina) for r in rag_results)})",
                            latencia_ms=(time.perf_counter() - start_turn_time) * 1000.0,
                            estado="SUCCESS"
                        )

                        tool_output_str = self.rag_retriever.format_context_for_prompt(rag_results)

                    else:
                        # Herramientas meteorológicas / Starlight / Calima
                        tool_output_dict = self.weather_service.execute_tool(fn_name, fn_args)
                        tool_output_str = json.dumps(tool_output_dict, ensure_ascii=False)

                        record_step(ExecutionStep(
                            id=f"step-{len(pasos_ejecucion)+1}",
                            tipo="TOOL_RESULT",
                            titulo=f"Respuesta Tool: {fn_name}()",
                            icono="🌤️",
                            color="#29b6f6",
                            contenido=f"Datos meteorológicos/atmosféricos obtenidos de Open-Meteo",
                            detalles=tool_output_dict
                        ))

                    # Añadir la respuesta de la herramienta al contexto para la siguiente iteración
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "name": fn_name,
                        "content": tool_output_str
                    })

                # Mutaciones deterministas de estado inmediatamente tras las herramientas
                self._apply_state_mutations(
                    state=state,
                    user_input=user_input,
                    fotos_desbloqueadas_en_turno=fotos_desbloqueadas_en_turno,
                    sellos_desbloqueados_en_turno=sellos_desbloqueados_en_turno,
                    sfx_list=sfx_list,
                    pasos_ejecucion=pasos_ejecucion,
                    record_step=record_step
                )

            else:
                # El modelo terminó su razonamiento en la iteración 1 sin herramientas
                narrativa_final = assistant_msg.content or ""
                self._apply_state_mutations(
                    state=state,
                    user_input=user_input,
                    fotos_desbloqueadas_en_turno=fotos_desbloqueadas_en_turno,
                    sellos_desbloqueados_en_turno=sellos_desbloqueados_en_turno,
                    sfx_list=sfx_list,
                    pasos_ejecucion=pasos_ejecucion,
                    record_step=record_step
                )
                if on_token and narrativa_final:
                    palabras = narrativa_final.split(" ")
                    for i, p in enumerate(palabras):
                        token = p + (" " if i < len(palabras) - 1 else "")
                        try:
                            on_token(token)
                        except Exception:
                            pass
                        time.sleep(0.015)
                break

        if not narrativa_final:
            narrativa_final = "Twinber observa la escena mientras reflexiona sobre el siguiente paso en la isla."
            if on_token:
                try:
                    on_token(narrativa_final)
                except Exception:
                    pass

        # Registrar paso final de Narrativa (AHORA que la narración ha terminado de transmitirse)
        record_step(ExecutionStep(
            id=f"step-{len(pasos_ejecucion)+1}",
            tipo="NARRATIVA_FINAL",
            titulo="Respuesta Narrativa Final",
            icono="💬",
            color="#ffd700",
            contenido=narrativa_final[:160] + ("..." if len(narrativa_final) > 160 else ""),
            detalles={
                "caracteres": len(narrativa_final),
                "citas_detectadas": [f"[Pág. {p}]" for c in citas_recuperadas for p in c.paginas_citadas]
            }
        ))

        # Incrementar contador de turnos
        state.turnos_jugados += 1

        # 5. ACTUALIZAR GESTOR DE MEMORIA
        self.memory_manager.add_assistant_message(narrativa_final)

        total_latency_ms = (time.perf_counter() - start_turn_time) * 1000.0

        # Registro de auditoría del turno completo con telemetría de tokens
        self.audit_logger.log_agent_turn(
            nombre_operacion="agent_supervisor_turn",
            argumentos={"ubicacion": loc_actual, "multimodal": bool(image_data_url)},
            resultado_resumen=narrativa_final[:100],
            latencia_ms=total_latency_ms,
            estado="SUCCESS",
            tokens_input=turn_tokens_input if turn_tokens_input > 0 else None,
            tokens_output=turn_tokens_output if turn_tokens_output > 0 else None
        )

        return TurnResult(
            narrativa=narrativa_final,
            estado=state,
            visual_asset=image_path,
            citas=citas_recuperadas,
            fotos_nuevas=fotos_desbloqueadas_en_turno,
            fotos_relacionadas=fotos_relacionadas_en_turno,
            sellos_nuevos=sellos_desbloqueados_en_turno,
            sfx_to_play=sfx_list,
            pasos_ejecucion=pasos_ejecucion
        )

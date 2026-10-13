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
from typing import Any, Optional

from openai import OpenAI

from src.domain.guardrail_models import GuardrailDecision
from src.domain.rag_models import RespuestaCodiceRAG, ResultadoBusquedaRAG
from src.domain.state_models import GameState, TurnResult, OFFICIAL_ENCLAVE_STAMPS, is_passport_stamp_request
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
2. Cuando utilices información recuperada de 'search_guide', DEBES citar explícitamente el número de página oficial (ejemplo: "[Pág. 8]", "[Pág. 11]") dentro de tu narración. ¡Jamás inventes datos geográficos o históricos!
3. Cuando el jugador pregunte sobre el clima, viento, lluvia, mar de nubes o temperatura, DEBES invocar 'get_weather'.
4. Cuando el jugador pregunte sobre la calidad del cielo nocturno o estrellas en el Teide, DEBES invocar 'get_starlight_conditions'.
5. Cuando el jugador pregunte sobre polvo sahariano, calima o visibilidad, DEBES invocar 'get_calima_alert'.
6. Si recibes una imagen visual (el escenario pixel-art o una foto del álbum), obsérvala detenidamente, deduce el enclave y utiliza 'search_guide' para enriquecer tu descripción con hechos históricos de la guía.

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

    def process_turn(
        self,
        user_input: str,
        game_state: Optional[GameState] = None,
        image_path: Optional[str] = None
    ) -> TurnResult:
        """
        Ejecuta un turno completo de juego:
        1. Filtro Guardrail Bouncer de entrada.
        2. Ensamblado del System Prompt y memoria con GameState.
        3. Bucle ReAct con tools (RAG, Weather, Starlight, Calima).
        4. Mutación determinista del juego (sellos, fotos, monedas).
        5. Retorno de TurnResult estructurado.
        """
        start_turn_time = time.perf_counter()
        state = game_state.model_copy(deep=True) if game_state else GameState()

        # 1. EVALUACIÓN DE GUARDRAIL BOUNCER
        guardrail_decision: GuardrailDecision = self.guardrail.evaluate(
            user_input,
            has_image=bool(image_path)
        )

        if not guardrail_decision.es_valido:
            # Entrada rechazada por off-topic o prompt injection
            rechazo_texto = guardrail_decision.respuesta_tematica or (
                "Twinber consulta su brújula y sacude la cabeza con una sonrisa irónica: "
                "'Mi cuaderno de bitácora solo tiene ojos para los enigmas de Tenerife, forastero. "
                "Hablemos de la isla, sus senderos o sus volcanes.'"
            )
            return TurnResult(
                narrativa=rechazo_texto,
                estado=state,
                visual_asset=None,
                citas=[],
                fotos_nuevas=[],
                sellos_nuevos=[],
                sfx_to_play=[]
            )

        # 2. CONSTRUCCIÓN DEL MENSAJE DEL USUARIO (CON O SIN IMAGEN MULTIMODAL)
        image_data_url = self._encode_image_to_data_url(image_path) if image_path else None

        if image_data_url:
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
        sellos_desbloqueados_en_turno: list[str] = []
        sfx_list: list[str] = []
        narrativa_final = ""

        iteration = 0
        while iteration < self.MAX_TOOL_ITERATIONS:
            iteration += 1

            resp = self.client.chat.completions.create(
                model=self.settings.OPENAI_MODEL_MAIN,
                messages=messages,
                tools=self.tools,
                temperature=self.settings.TEMPERATURE,
                top_p=self.settings.TOP_P,
                max_tokens=self.settings.MAX_TOKENS
            )

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

                        tool_output_str = self.rag_retriever.format_context_for_prompt(rag_results)

                    else:
                        # Herramientas meteorológicas / Starlight / Calima
                        tool_output_dict = self.weather_service.execute_tool(fn_name, fn_args)
                        tool_output_str = json.dumps(tool_output_dict, ensure_ascii=False)

                    # Añadir la respuesta de la herramienta al contexto para la siguiente iteración
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "name": fn_name,
                        "content": tool_output_str
                    })

            else:
                # El modelo terminó su razonamiento y generó la respuesta narrativa final
                narrativa_final = assistant_msg.content or ""
                break

        if not narrativa_final:
            narrativa_final = "Twinber observa la escena mientras reflexiona sobre el siguiente paso en la isla."

        # 4. MUTACIONES DETERMINISTAS DEL ESTADO DE JUEGO (GAMESTATE)
        # Sello del enclave actual: ÚNICAMENTE si el jugador solicitó sellar el pasaporte
        loc_actual = state.ubicacion_actual
        if is_passport_stamp_request(user_input):
            stamp_info = OFFICIAL_ENCLAVE_STAMPS.get(loc_actual)
            if stamp_info and stamp_info.get("stampable"):
                stamp_key = stamp_info.get("stamp_key")
                if stamp_key and stamp_key not in state.sellos_obtenidos and stamp_key not in sellos_desbloqueados_en_turno:
                    state.sellos_obtenidos.append(stamp_key)
                    sellos_desbloqueados_en_turno.append(stamp_key)
                    if "sfx_stamp" not in sfx_list:
                        sfx_list.append("sfx_stamp")

        # Fotos recién desbloqueadas
        for f_id in fotos_desbloqueadas_en_turno:
            if f_id not in state.fotos_desbloqueadas:
                state.fotos_desbloqueadas.append(f_id)
                if "sfx_photo" not in sfx_list:
                    sfx_list.append("sfx_photo")

        # Incrementar contador de turnos
        state.turnos_jugados += 1

        # 5. ACTUALIZAR GESTOR DE MEMORIA
        self.memory_manager.add_assistant_message(narrativa_final)

        total_latency_ms = (time.perf_counter() - start_turn_time) * 1000.0

        # Registro de auditoría del turno completo
        self.audit_logger.log_tool_call(
            nombre_operacion="agent_supervisor_turn",
            argumentos={"ubicacion": loc_actual, "multimodal": bool(image_data_url)},
            resultado_resumen=narrativa_final[:100],
            latencia_ms=total_latency_ms,
            estado="SUCCESS"
        )

        return TurnResult(
            narrativa=narrativa_final,
            estado=state,
            visual_asset=image_path,
            citas=citas_recuperadas,
            fotos_nuevas=fotos_desbloqueadas_en_turno,
            sellos_nuevos=sellos_desbloqueados_en_turno,
            sfx_to_play=sfx_list
        )

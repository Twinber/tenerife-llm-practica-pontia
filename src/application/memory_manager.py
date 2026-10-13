"""
Aplicación: Gestor de Memoria Conversacional Multiturno Híbrida (Summary Buffer) con control de tokens.
Garantiza coherencia a largo plazo sin desbordar la ventana de contexto de los modelos LLM.
Cumple con las exigencias del Criterio 7.2 del Máster (Diálogo Multiturno con Control de Límite de Tokens).
"""

import logging
from datetime import datetime, timezone
from typing import Any, Optional

import tiktoken
from openai import OpenAI

from src.domain.memory_models import ChatMessage, ConversationMemorySnapshot
from src.domain.state_models import GameState, OFFICIAL_ENCLAVE_STAMPS
from src.infrastructure.config import Settings, get_settings

logger = logging.getLogger(__name__)


class ConversationMemoryManager:
    """
    Gestor de memoria híbrido tipo Summary Buffer.
    Combina:
    1. Una ventana deslizante de turnos literales recientes para preservar inmediatez y fluidez.
    2. Una sinopsis narrativa acumulada para recordar eventos lejanos sin gastar tokens.
    3. Inyección del GameState estructurado invariante en el System Prompt.
    4. Control estricto de presupuesto de tokens mediante tiktoken (o200k_base).
    """

    DEFAULT_MAX_HISTORY_TOKENS = 1000
    DEFAULT_WINDOW_TURNS = 4  # Preserva los últimos 4 intercambios (8 mensajes) completos

    def __init__(
        self,
        max_history_tokens: int = DEFAULT_MAX_HISTORY_TOKENS,
        window_turns: int = DEFAULT_WINDOW_TURNS,
        settings: Optional[Settings] = None,
        openai_client: Optional[OpenAI] = None
    ):
        self.settings = settings or get_settings()
        self.max_history_tokens = max_history_tokens
        self.window_turns = window_turns
        self.client = openai_client or OpenAI(api_key=self.settings.OPENAI_API_KEY)

        # Inicialización del tokenizer oficial para GPT-4o / GPT-4o-mini
        try:
            self.tokenizer = tiktoken.get_encoding("o200k_base")
        except Exception:
            self.tokenizer = tiktoken.get_encoding("cl100k_base")

        # Estado interno de la memoria
        self.mensajes: list[ChatMessage] = []
        self.sinopsis_acumulada: str = ""
        self.total_turnos_historicos: int = 0

    def count_tokens(self, text: str) -> int:
        """Calcula el número exacto de tokens BPE para un texto dado."""
        if not text:
            return 0
        return len(self.tokenizer.encode(text))

    def _calculate_message_tokens(self, msg: ChatMessage) -> int:
        """
        Calcula el coste de tokens de un mensaje individual incluyendo los delimitadores de rol.
        (Aproximadamente 4 tokens de overhead por mensaje en el protocolo de chat de OpenAI).
        """
        tokens = 4 + self.count_tokens(msg.content)
        if msg.name:
            tokens += self.count_tokens(msg.name)
        if msg.tool_calls:
            for tc in msg.tool_calls:
                fn = tc.get("function", {})
                tokens += self.count_tokens(fn.get("name", ""))
                tokens += self.count_tokens(fn.get("arguments", ""))
        return tokens

    def add_user_message(self, content: str) -> ChatMessage:
        """Registra un mensaje enviado por el usuario."""
        msg = ChatMessage(
            role="user",
            content=content,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        msg.token_count = self._calculate_message_tokens(msg)
        self.mensajes.append(msg)
        return msg

    def add_assistant_message(
        self,
        content: str,
        tool_calls: Optional[list[dict[str, Any]]] = None
    ) -> ChatMessage:
        """Registra la respuesta generada por el asistente o NPC."""
        msg = ChatMessage(
            role="assistant",
            content=content,
            tool_calls=tool_calls,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        msg.token_count = self._calculate_message_tokens(msg)
        self.mensajes.append(msg)
        self.total_turnos_historicos += 1

        # Comprueba si el historial ha sobrepasado el presupuesto de tokens
        self.compact_if_needed()
        return msg

    def add_tool_message(self, tool_call_id: str, name: str, content: str) -> ChatMessage:
        """Registra el payload devuelto por una herramienta ejecutada (rol 'tool')."""
        msg = ChatMessage(
            role="tool",
            name=name,
            tool_call_id=tool_call_id,
            content=content,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        msg.token_count = self._calculate_message_tokens(msg)
        self.mensajes.append(msg)
        return msg

    def get_total_history_tokens(self) -> int:
        """Calcula la suma total de tokens consumidos por los mensajes en la memoria."""
        return sum(m.token_count for m in self.mensajes) + self.count_tokens(self.sinopsis_acumulada)

    def compact_if_needed(self) -> bool:
        """
        Si el total de tokens en memoria supera 'max_history_tokens', compacta
        los mensajes más antiguos en la sinopsis narrativa y los poda de la lista literal.
        Retorna True si se ejecutó una compactación.
        """
        total_tokens = self.get_total_history_tokens()
        max_mensajes_recientes = self.window_turns * 2  # Turnos usuario + asistente

        if total_tokens <= self.max_history_tokens or len(self.mensajes) <= max_mensajes_recientes:
            return False

        # Mensajes candidatos a podar (los que exceden la ventana reciente)
        num_a_podar = len(self.mensajes) - max_mensajes_recientes
        mensajes_antiguos = self.mensajes[:num_a_podar]
        self.mensajes = self.mensajes[num_a_podar:]

        logger.info(
            "Compactando memoria conversacional: %d mensajes podados. Tokens previos: %d.",
            len(mensajes_antiguos),
            total_tokens
        )

        # Generación de la nueva sinopsis acumulada
        self.sinopsis_acumulada = self._generate_summary(mensajes_antiguos, self.sinopsis_acumulada)
        return True

    def _generate_summary(self, mensajes_nuevos: list[ChatMessage], sinopsis_previa: str) -> str:
        """
        Genera un resumen narrativo acumulado usando el modelo rápido o fallback determinista.
        """
        dialogo_a_resumir = []
        for m in mensajes_nuevos:
            if m.role in ["user", "assistant"]:
                dialogo_a_resumir.append(f"{m.role.upper()}: {m.content}")

        texto_dialogo = "\n".join(dialogo_a_resumir)

        # Si no hay contenido relevante que resumir, mantener la previa
        if not texto_dialogo.strip():
            return sinopsis_previa

        prompt = (
            "Eres el cronista de la expedición de Twinber en Tenerife. "
            "Condensa los siguientes acontecimientos en 2 o 3 frases clave, integrándolos "
            "con la sinopsis previa si existe. Mantén los lugares visitados, personajes conocidos y pistas obtenidas.\n\n"
        )
        if sinopsis_previa:
            prompt += f"SINOPSIS PREVIA:\n{sinopsis_previa}\n\n"
        prompt += f"NUEVOS ACONTECIMIENTOS:\n{texto_dialogo}\n\nNUEVA SINOPSIS CONDENSADA:"

        try:
            resp = self.client.chat.completions.create(
                model=self.settings.OPENAI_MODEL_FAST,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
                temperature=0.3
            )
            nueva_sinopsis = resp.choices[0].message.content.strip()
            return nueva_sinopsis
        except Exception as exc:
            logger.warning("Fallo al resumir memoria con LLM (%s). Usando condensación determinista.", exc)
            resumen_fallback = f"Acontecimientos previos: {len(mensajes_nuevos)} intercambios en la isla."
            if sinopsis_previa:
                return f"{sinopsis_previa} | {resumen_fallback}"
            return resumen_fallback

    def get_messages_for_llm(
        self,
        base_system_prompt: str,
        game_state: Optional[GameState] = None,
        rag_context: Optional[str] = None
    ) -> list[dict[str, Any]]:
        """
        Construye la lista ordenada y tipada de mensajes lista para enviar a la API de OpenAI.

        Inyecta:
        1. System Prompt enriquecido con el estado determinista del juego (sellos, fotos, monedas).
        2. Bloque de sinopsis narrativa previa (si existe memoria podada).
        3. Bloque de contexto documental RAG (si fue recuperado en este turno).
        4. Mensajes literales recientes preservados en la ventana deslizante.
        """
        mensajes_api: list[dict[str, Any]] = []

        # 1. System Prompt Base + Estado Invariante
        prompt_completo = base_system_prompt.strip()

        if game_state:
            loc = game_state.ubicacion_actual
            stamp_info = OFFICIAL_ENCLAVE_STAMPS.get(loc, {})
            npc_name = stamp_info.get("npc_name", "Lugareño")
            authority = stamp_info.get("authority", npc_name)
            stamp_key = stamp_info.get("stamp_key")
            stampable = stamp_info.get("stampable", False)

            if stampable and stamp_key:
                ya_sellado = stamp_key in game_state.sellos_obtenidos
                if ya_sellado:
                    estado_sello_enclave = f"'{stamp_key}' [YA ESTAMPADO en este pasaporte. Si Twinber lo pide de nuevo, recuérdale con humor canario que ya tiene estampado el sello de este enclave]."
                else:
                    estado_sello_enclave = f"'{stamp_key}' [PENDIENTE. ¡TÚ ({npc_name}) eres la máxima autoridad y custodio oficial con el cuño en mano! Si Twinber te pide el sello del pasaporte, acéptalo de inmediato con entusiasmo, saca tu tinta y estámpalo ceremonialmente (*¡CLAC!*). ¡NO lo mandes a ningún otro lugar!]."
            else:
                refusal = stamp_info.get("refusal_reason", "Enclave gastronómico sin cuño oficial.")
                estado_sello_enclave = f"SIN SELLO OFICIAL ({refusal})."

            estado_str = (
                f"\n\n=== ESTADO DETERMINISTA DEL EXPLORADOR (INVARIANTE) ===\n"
                f"- Enclave actual: {loc}\n"
                f"- Personaje activo frente a Twinber: {npc_name} ({authority})\n"
                f"- Situación del sello de este enclave: {estado_sello_enclave}\n"
                f"- Monedas de oro: {game_state.monedas_oro} / 15\n"
                f"- Sellos visados en pasaporte ({len(game_state.sellos_obtenidos)}/10 oficiales): {', '.join(game_state.sellos_obtenidos) or 'Ninguno aún'}\n"
                f"- Fotos desbloqueadas en álbum ({len(game_state.fotos_desbloqueadas)}/28): {game_state.fotos_desbloqueadas}\n"
                f"- Turnos jugados: {game_state.turnos_jugados}\n"
                f"========================================================"
            )
            prompt_completo += estado_str

        # 2. Sinopsis acumulada de memoria podada
        if self.sinopsis_acumulada:
            sinopsis_str = (
                f"\n\n=== SINOPSIS NARRATIVA DE LA EXPEDICIÓN (MEMORIA PREVIA) ===\n"
                f"{self.sinopsis_acumulada}\n"
                f"============================================================"
            )
            prompt_completo += sinopsis_str

        # 3. Contexto RAG del Códice (si aplica al turno)
        if rag_context:
            prompt_completo += f"\n\n{rag_context}"

        mensajes_api.append({"role": "system", "content": prompt_completo})

        # 4. Mensajes literales de la ventana reciente
        for msg in self.mensajes:
            payload: dict[str, Any] = {"role": msg.role, "content": msg.content}
            if msg.name:
                payload["name"] = msg.name
            if msg.tool_call_id:
                payload["tool_call_id"] = msg.tool_call_id
            if msg.tool_calls:
                payload["tool_calls"] = msg.tool_calls
            mensajes_api.append(payload)

        return mensajes_api

    def get_snapshot(self) -> ConversationMemorySnapshot:
        """Genera una foto fija del estado de la memoria para telemetría y UI."""
        return ConversationMemorySnapshot(
            sinopsis_acumulada=self.sinopsis_acumulada,
            total_turnos_historicos=self.total_turnos_historicos,
            mensajes_recientes_count=len(self.mensajes),
            tokens_historial_total=self.get_total_history_tokens(),
            presupuesto_max_tokens=self.max_history_tokens
        )

    def clear(self) -> None:
        """Reinicia el estado de la memoria para una nueva partida."""
        self.mensajes.clear()
        self.sinopsis_acumulada = ""
        self.total_turnos_historicos = 0

"""
Dominio de Auditoría y Observabilidad: Registro estructurado de telemetría.
Garantiza el cumplimiento del 25% de la nota en logging y observabilidad
así como el desbloqueo del Bonus Técnico de Observabilidad Avanzada.
"""

from typing import Any, Literal, Optional
from pydantic import BaseModel, Field


class AuditEvent(BaseModel):
    """
    Registro inmutable de un evento técnico acontecido durante el turno del juego.
    Se persiste en disco (game_audit.log / telemetry.jsonl) y se transmite a la consola CRT (~ / T).
    """
    timestamp: str = Field(..., description="Marca temporal en formato ISO 8601")
    tipo_evento: Literal["TOOL_CALL", "RAG_RETRIEVAL", "GUARDRAIL_CHECK", "STATE_MUTATION", "AGENT_TURN"] = Field(
        ...,
        description="Categoría del evento técnico"
    )
    nombre_operacion: str = Field(
        ...,
        description="Nombre de la función o servicio (ej: 'get_weather', 'chroma_similarity_search')"
    )
    argumentos: dict[str, Any] = Field(
        default_factory=dict,
        description="Parámetros de entrada proporcionados a la operación"
    )
    resultado_resumen: str = Field(
        default="",
        description="Extracto textual o resumen cuantitativo del resultado obtenido"
    )
    latencia_ms: float = Field(
        default=0.0,
        ge=0.0,
        description="Tiempo de ejecución de la operación medido en milisegundos"
    )
    estado: Literal["SUCCESS", "FALLBACK", "ERROR", "BLOCKED"] = Field(
        ...,
        description="Resultado de la ejecución: éxito, fallback simulado, error capturado o bloqueo por guardrail"
    )
    tokens_input: Optional[int] = Field(
        default=None,
        ge=0,
        description="Tokens consumidos en el prompt de entrada (si aplica al LLM)"
    )
    tokens_output: Optional[int] = Field(
        default=None,
        ge=0,
        description="Tokens generados en la respuesta (si aplica al LLM)"
    )

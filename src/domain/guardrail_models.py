"""
Dominio de Guardrails y Seguridad: Contratos Pydantic para el filtrado de entrada y salida.
Garantiza el cumplimiento de las directrices de la Sesión 05 del Máster (Guardrails y Contención).
"""

from typing import Optional
from pydantic import BaseModel, Field


class GuardrailDecision(BaseModel):
    """
    Decisión formal emitida por el filtro de entrada (Bouncer Guardrail).
    Evalúa la seguridad contra inyecciones y la pertinencia temática con la isla de Tenerife.
    """
    es_valido: bool = Field(
        ...,
        description="True si el mensaje es seguro y pertinente para la aventura gráfica de exploración en Tenerife"
    )
    motivo_bloqueo: Optional[str] = Field(
        default=None,
        description="Categoría del bloqueo si es_valido es False ('OFF_TOPIC', 'PROMPT_INJECTION', 'TOXIC', 'SYSTEM_LEAK')"
    )
    respuesta_tematica: Optional[str] = Field(
        default=None,
        description="Respuesta literaria con humor retro SCUMM para reconducir amablemente al explorador"
    )

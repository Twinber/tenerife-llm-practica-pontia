"""
Dominio de Memoria Conversacional: Contratos Pydantic para el historial multiturno y control de tokens.
Garantiza el cumplimiento estricto del Criterio 7.2 del Máster (Diálogo Multiturno y Límite de Tokens).
"""

from typing import Any, Literal, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """
    Representa un mensaje individual en el historial conversacional multiturno.
    Soporta roles de usuario, asistente, sistema y herramientas (Function Calling).
    """
    role: Literal["system", "user", "assistant", "tool"] = Field(
        ...,
        description="Rol del emisor en el protocolo de chat de OpenAI"
    )
    content: str = Field(
        ...,
        description="Contenido textual del mensaje"
    )
    name: Optional[str] = Field(
        default=None,
        description="Nombre del emisor, NPC o herramienta que originó el mensaje"
    )
    tool_call_id: Optional[str] = Field(
        default=None,
        description="Identificador único de la llamada a herramienta si el rol es 'tool'"
    )
    tool_calls: Optional[list[dict[str, Any]]] = Field(
        default=None,
        description="Lista de tool_calls emitidos por el modelo si el rol es 'assistant'"
    )
    token_count: int = Field(
        default=0,
        ge=0,
        description="Número de tokens exactos calculados para este mensaje"
    )
    timestamp: Optional[str] = Field(
        default=None,
        description="Marca temporal ISO 8601 del turno"
    )


class ConversationMemorySnapshot(BaseModel):
    """
    Instantánea inmutable del estado de la memoria conversacional híbrida (Summary Buffer).
    Permite auditar el presupuesto de tokens y la sinopsis narrativa acumulada.
    """
    sinopsis_acumulada: str = Field(
        default="",
        description="Resumen condensado de turnos antiguos podados para no saturar el contexto"
    )
    total_turnos_historicos: int = Field(
        default=0,
        ge=0,
        description="Total de turnos conversacionales procesados en la partida"
    )
    mensajes_recientes_count: int = Field(
        default=0,
        ge=0,
        description="Número de mensajes literales preservados en la ventana deslizante reciente"
    )
    tokens_historial_total: int = Field(
        default=0,
        ge=0,
        description="Tokens totales consumidos actualmente por el historial en el prompt"
    )
    presupuesto_max_tokens: int = Field(
        default=1200,
        ge=100,
        description="Umbral límite de tokens que dispara la compactación y poda automática"
    )

"""
Capa de Dominio de Clean Architecture.
Contiene los contratos y modelos inmutables del núcleo de la aplicación.
"""

from src.domain.rag_models import DocumentChunk, RespuestaCodiceRAG, ResultadoBusquedaRAG
from src.domain.weather_models import CalimaResponse, StarlightResponse, WeatherResponse
from src.domain.state_models import GameState, InventoryItem, TurnResult
from src.domain.audit_models import AuditEvent
from src.domain.memory_models import ChatMessage, ConversationMemorySnapshot

__all__ = [
    "DocumentChunk",
    "ResultadoBusquedaRAG",
    "RespuestaCodiceRAG",
    "WeatherResponse",
    "StarlightResponse",
    "CalimaResponse",
    "InventoryItem",
    "GameState",
    "TurnResult",
    "AuditEvent",
    "ChatMessage",
    "ConversationMemorySnapshot",
]

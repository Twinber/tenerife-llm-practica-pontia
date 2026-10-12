"""
Capa de Dominio de Clean Architecture.
Contiene los contratos y modelos inmutables del núcleo de la aplicación.
"""

from src.domain.rag_models import DocumentChunk, RespuestaCodiceRAG
from src.domain.weather_models import CalimaResponse, StarlightResponse, WeatherResponse
from src.domain.state_models import GameState, InventoryItem, TurnResult
from src.domain.audit_models import AuditEvent

__all__ = [
    "DocumentChunk",
    "RespuestaCodiceRAG",
    "WeatherResponse",
    "StarlightResponse",
    "CalimaResponse",
    "InventoryItem",
    "GameState",
    "TurnResult",
    "AuditEvent",
]

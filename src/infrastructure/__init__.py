"""
Capa de Infraestructura de Clean Architecture.
Contiene clientes de bases de datos, APIs externas, configuración y parseadores de archivos.
"""

from src.infrastructure.config import Settings, get_settings
from src.infrastructure.pdf_extractor import PDFExtractor
from src.infrastructure.chroma_vector_store import ChromaVectorStore
from src.infrastructure.weather_client import OpenMeteoClient
from src.infrastructure.audit_logger import AuditLogger

__all__ = [
    "Settings",
    "get_settings",
    "PDFExtractor",
    "ChromaVectorStore",
    "OpenMeteoClient",
    "AuditLogger",
]

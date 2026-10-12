"""
Dominio RAG: Contratos y modelos de datos para la recuperación semántica y citación de fuentes.
Garantiza el cumplimiento estricto de las exigencias académicas de la Sesión 03 del Máster (RAG).
"""

from typing import Optional
from pydantic import BaseModel, Field


class DocumentChunk(BaseModel):
    """
    Representa una unidad semántica indivisible extraída de TENERIFE.pdf.
    A diferencia de un chunking por longitud de caracteres ciego, cada chunk
    preserva el contexto completo de un enclave con sus metadatos temáticos.
    """
    chunk_id: str = Field(..., description="Identificador único del chunk (ej: 'chunk_puerto_cruz_01')")
    contenido: str = Field(..., description="Texto literal extraído del documento")
    lugar: str = Field(..., description="Enclave al que pertenece (ej: 'Puerto de la Cruz')")
    zona: str = Field(..., description="Comarca geográfica: 'Norte', 'Metropolitana', 'Sur' o 'Cumbre'")
    pagina: int = Field(..., ge=1, le=25, description="Número de página de procedencia en TENERIFE.pdf")
    foto_id: Optional[int] = Field(None, ge=1, le=50, description="ID principal de la foto asociada si aplica")
    fotos_asociadas: list[int] = Field(default_factory=list, description="Lista de IDs de fotos (1-36) asociadas a este fragmento")
    image_path: Optional[str] = Field(None, description="Ruta relativa a la imagen extraída en assets/img/")


class RespuestaCodiceRAG(BaseModel):
    """
    Contrato formal de respuesta del motor RAG mediante Structured Outputs.
    Obliga al LLM a fundamentar sus afirmaciones citando la página exacta
    y aportando la cita textual literal para eliminar cualquier alucinación.
    """
    narracion_turistica: str = Field(
        ...,
        description="Explicación o diálogo inmersivo integrado en la aventura gráfica retro"
    )
    paginas_citadas: list[int] = Field(
        ...,
        min_length=1,
        description="Páginas exactas de TENERIFE.pdf que respaldan la información aportada"
    )
    lugar_referenciado: str = Field(
        ...,
        description="Enclave de la isla sobre el que versa la respuesta"
    )
    cita_textual_evidencia: str = Field(
        ...,
        description="Cita textual literal extraída del documento que demuestra la veracidad del dato"
    )
    foto_desbloqueada_id: Optional[int] = Field(
        default=None,
        ge=1,
        le=50,
        description="ID de la foto del álbum desbloqueada por esta consulta, si corresponde"
    )

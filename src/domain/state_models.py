"""
Dominio de Estado de Juego: Estructuras inmutables para el control determinista de la partida.
Garantiza que la lógica de inventario, economía y sellos resida en código Python
y no en la memoria volátil o sujeta a alucinaciones del LLM.
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field

from src.domain.rag_models import RespuestaCodiceRAG


class InventoryItem(BaseModel):
    """
    Representa un objeto presente en el inventario o alforja de Twinber.
    """
    id: str = Field(..., description="Identificador único del ítem (ej: 'item_gofio')")
    nombre: str = Field(..., description="Nombre visible del objeto")
    icono: str = Field(..., description="Nombre del archivo SVG (ej: 'item_gofio.svg')")
    tipo: Literal["PERMANENTE", "CONSUMIBLE", "CLAVE"] = Field(
        ...,
        description="Categoría del ítem en la aventura gráfica"
    )
    cantidad: int = Field(default=1, ge=0, description="Cantidad en posesión")
    inspeccionable: bool = Field(
        default=False,
        description="True si al pulsar directamente sobre el ítem en la barra lateral se abre su visor modal interactivo (ej. Pasaporte, Álbum o Mapa)"
    )


class GameState(BaseModel):
    """
    Estado global determinista de la partida de Twinber en Tenerife.
    Controla los sellos del pasaporte, las fotos del álbum, las monedas y la ubicación.
    """
    ubicacion_actual: str = Field(default="puerto_cruz", description="ID del enclave actual")
    monedas_oro: int = Field(default=15, ge=0, le=15, description="Saldo de monedas de oro (economía cerrada de 15)")
    sellos_obtenidos: list[str] = Field(
        default_factory=list,
        description="Lista de IDs de enclaves sellados en el pasaporte (máximo 10 oficiales)"
    )
    fotos_desbloqueadas: list[int] = Field(
        default_factory=list,
        description="Lista de identificadores de fotos coleccionadas en el álbum (1 a 28)"
    )
    inventario: list[InventoryItem] = Field(
        default_factory=list,
        description="Lista de objetos en posesión del explorador"
    )
    turnos_jugados: int = Field(default=0, ge=0, description="Contador total de turnos de interacción")
    juego_completado: bool = Field(default=False, description="True tras superar el clímax final en el Teide")

    def tiene_sello(self, enclave_id: str) -> bool:
        """Comprueba si un enclave ya ha sido visado en el pasaporte."""
        return enclave_id in self.sellos_obtenidos

    def tiene_foto(self, foto_id: int) -> bool:
        """Comprueba si una fotografía ya forma parte del álbum."""
        return foto_id in self.fotos_desbloqueadas

    def tiene_item(self, item_id: str) -> bool:
        """Comprueba si Twinber porta un determinado objeto en su inventario."""
        return any(item.id == item_id for item in self.inventario)


class TurnResult(BaseModel):
    """
    Contrato devuelto tras procesar un turno conversacional o interactivo.
    Se transmite hacia la API REST y los Server-Sent Events (SSE).
    """
    narrativa: str = Field(..., description="Texto literario generado por el Narrador o NPC")
    estado: GameState = Field(..., description="Estado actualizado de la partida")
    visual_asset: Optional[str] = Field(None, description="Ruta a imagen destacada para el cliente web")
    citas: list[RespuestaCodiceRAG] = Field(
        default_factory=list,
        description="Citas documentales de TENERIFE.pdf recuperadas mediante RAG"
    )
    fotos_nuevas: list[int] = Field(
        default_factory=list,
        description="IDs de fotografías recién desbloqueadas en este turno"
    )
    sellos_nuevos: list[str] = Field(
        default_factory=list,
        description="IDs de sellos recién estampados en este turno"
    )
    sfx_to_play: list[str] = Field(
        default_factory=list,
        description="Efectos de sonido retro a reproducir en el cliente (sfx_stamp, sfx_photo, etc.)"
    )

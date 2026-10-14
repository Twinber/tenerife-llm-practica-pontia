"""
Dominio de Estado de Juego: Estructuras inmutables para el control determinista de la partida.
Garantiza que la lógica de inventario, economía y sellos resida en código Python
y no en la memoria volátil o sujeta a alucinaciones del LLM.
"""

from typing import Any, Literal, Optional
from pydantic import BaseModel, Field

from src.domain.rag_models import RespuestaCodiceRAG


# Registro oficial de enclaves, NPCs custodios y claves de sellos del pasaporte (10 oficiales)
OFFICIAL_ENCLAVE_STAMPS: dict[str, dict[str, Any]] = {
    "puerto_cruz": {
        "stamp_key": "puerto_cruz",
        "npc_name": "Paco el Pescador",
        "authority": "Paco el Pescador (Aduana Marítima)",
        "zone_title": "Puerto de la Cruz — Muelle Pesquero & San Telmo",
        "stampable": True,
    },
    "la_orotava": {
        "stamp_key": "la_orotava",
        "npc_name": "Chano el Molinero",
        "authority": "Chano el Molinero (Molino de Gofio)",
        "zone_title": "La Orotava — Valle de Taoro & Molinos de Gofio",
        "stampable": True,
    },
    "santa_ursula": {
        "stamp_key": None,
        "npc_name": "Manolo el Tabernero",
        "authority": "Manolo el Tabernero (Guachinche tradicional)",
        "zone_title": "Santa Úrsula — Guachinche tradicional",
        "stampable": False,
        "refusal_reason": "Santa Úrsula es un guachinche de comida tradicional y vino del país, no un organismo aduanero oficial. Manolo bromea diciendo que aquí solo se sella el buche con buen mojo y escaldón.",
    },
    "icod": {
        "stamp_key": "icod_garachico",
        "npc_name": "Don Cándido el Bodeguero",
        "authority": "Don Cándido el Bodeguero (Sabio botánico y guardián del Drago Milenario)",
        "zone_title": "Icod de los Vinos — Drago Milenario & El Caletón",
        "stampable": True,
    },
    "garachico": {
        "stamp_key": "icod_garachico",
        "npc_name": "Doña Nieves",
        "authority": "Doña Nieves (Artesana y guardiana de El Caletón)",
        "zone_title": "Garachico — Drago Milenario & El Caletón",
        "stampable": True,
    },
    "la_laguna": {
        "stamp_key": "la_laguna",
        "npc_name": "Profesora Herminia",
        "authority": "Profesora Herminia (Patrimonio UNESCO / Universidad)",
        "zone_title": "San Cristóbal de La Laguna — Ciudad Patrimonio de la Humanidad",
        "stampable": True,
    },
    "santa_cruz": {
        "stamp_key": "santa_cruz",
        "npc_name": "Oficial Morales",
        "authority": "Oficial Morales (Autoridad Portuaria)",
        "zone_title": "Santa Cruz de Tenerife — Capital Insular & Auditorio",
        "stampable": True,
    },
    "anaga": {
        "stamp_key": "anaga",
        "npc_name": "Guarda Forestal Yeray",
        "authority": "Yeray (Guarda Rural de Anaga)",
        "zone_title": "Parque Rural de Anaga — Reserva de la Biosfera & Laurisilva",
        "stampable": True,
    },
    "costa_adeje": {
        "stamp_key": "costa_adeje",
        "npc_name": "Ayoze el Socorrista",
        "authority": "Ayoze el Socorrista (Litoral Turístico del Sur)",
        "zone_title": "Costa Adeje & Las Américas — Litoral Sur",
        "stampable": True,
    },
    "masca": {
        "stamp_key": "los_gigantes_masca",
        "npc_name": "Tanausú el Guía de Montaña",
        "authority": "Tanausú (Guía de Montaña de Masca)",
        "zone_title": "Los Gigantes & Masca — Barranco & Acantilados",
        "stampable": True,
    },
    "el_medano": {
        "stamp_key": "el_medano_cristianos",
        "npc_name": "El Frutero Canario",
        "authority": "El Frutero Canario (Bahía de Montaña Roja)",
        "zone_title": "El Médano & Montaña Roja — Bahía Marina",
        "stampable": True,
    },
    "las_canadas": {
        "stamp_key": "el_teide",
        "npc_name": "Operario del Teleférico",
        "authority": "Operario del Teleférico (Base del Teide)",
        "zone_title": "Las Cañadas del Teide — Base del Teleférico",
        "stampable": True,
    },
    "pico_teide": {
        "stamp_key": "el_teide",
        "npc_name": "Guardián del Teide",
        "authority": "Guardián del Teide (Cumbre de España, 3.718m)",
        "zone_title": "Pico del Teide — 3.718m Cumbre de España",
        "stampable": True,
    },
}


import unicodedata


def is_passport_stamp_request(user_input: str) -> bool:
    """
    Detecta de forma determinista y tolerante a conjugaciones/acentos
    si la intervención del jugador constituye una petición expresa de sellado del pasaporte.
    """
    if not user_input:
        return False
    norm = unicodedata.normalize('NFKD', user_input).encode('ASCII', 'ignore').decode('utf-8').lower().strip()
    words = norm.split()
    has_stamp_action = any(
        w.startswith(('sell', 'estamp', 'vis', 'cun'))
        for w in words
    ) or any(phrase in norm for phrase in ['poner el sello', 'ponme el sello', 'dame el sello', 'marcar pasaporte', 'cuño oficial'])
    has_passport_ref = any(
        w.startswith(('pasaport', 'sell', 'cun', 'vis', 'marca', 'explorador'))
        for w in words
    )
    return has_stamp_action and has_passport_ref


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
        description="Lista de identificadores de fotos coleccionadas en el álbum (1 a 37)"
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

    def tiene_equipo_cumbre(self) -> tuple[bool, list[str]]:
        """
        Comprueba si Twinber dispone de los 4 ítems indispensables para coronar el Teide (3.718m):
        1. Billete del Teleférico (item_billete)
        2. Saco de Gofio (item_gofio)
        3. Comanda del Guachinche (item_comanda)
        4. Plátano de Canarias (item_platano)
        Retorna (True, []) si posee todos, o (False, [lista_faltantes]).
        """
        reqs = [
            ("item_billete", "Billete del Teleférico"),
            ("item_gofio", "Saco de Gofio"),
            ("item_comanda", "Comanda del Guachinche"),
            ("item_platano", "Plátano de Canarias"),
        ]
        faltantes = []
        for i_id, i_nom in reqs:
            tiene = any(
                it.id == i_id or i_nom.lower() in it.nombre.lower() or (i_id == "item_platano" and "platano" in it.id)
                for it in self.inventario
            )
            if not tiene:
                faltantes.append(i_nom)
        return (len(faltantes) == 0, faltantes)


class ExecutionStep(BaseModel):
    """
    Representa un paso secuencial de la traza de ejecución del agente (ReAct / RAG / Tools).
    Permite auditar e inspeccionar en la interfaz cada fase del razonamiento del modelo.
    """
    id: str = Field(..., description="Identificador único del paso (ej: 'step-1')")
    tipo: Literal[
        "GUARDRAIL",
        "PENSAMIENTO",
        "TOOL_CALL",
        "TOOL_RESULT",
        "RAG_CODICE",
        "VLM_VISION",
        "MUTACION_ESTADO",
        "NARRATIVA_FINAL"
    ] = Field(..., description="Categoría semántica del paso de ejecución agéntica")
    titulo: str = Field(..., description="Título visible (ej: 'Invocación Tool: search_guide')")
    icono: str = Field(default="🔧", description="Emoji distintivo para el frontend")
    color: str = Field(default="#00e5ff", description="Color temático para la píldora UI")
    contenido: str = Field(..., description="Descripción o resumen textual del paso")
    detalles: Optional[dict[str, Any]] = Field(default=None, description="Metadatos estructurados o argumentos JSON")
    latencia_ms: Optional[float] = Field(default=None, description="Tiempo de cómputo en milisegundos")


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
    fotos_relacionadas: list[int] = Field(
        default_factory=list,
        description="IDs de fotografías referenciadas o asociadas a las citas documentales de este turno"
    )
    sellos_nuevos: list[str] = Field(
        default_factory=list,
        description="IDs de sellos recién estampados en este turno"
    )
    sfx_to_play: list[str] = Field(
        default_factory=list,
        description="Efectos de sonido retro a reproducir en el cliente (sfx_stamp, sfx_photo, etc.)"
    )
    pasos_ejecucion: list[ExecutionStep] = Field(
        default_factory=list,
        description="Traza secuencial de pasos de ejecución agéntica (Guardrail, Tools, RAG, GameState)"
    )

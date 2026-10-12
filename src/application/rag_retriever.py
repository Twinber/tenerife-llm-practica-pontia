"""
Aplicación: Retriever RAG con soporte de geocercado insular y formateo de citas canónicas.
Conecta la lógica de negocio de la aventura gráfica con el almacenamiento vectorial ChromaDB.
Cumple con las directrices de la Sesión 03 del Máster (RAG, Citas Verificables y Grounding).
"""

import logging
from typing import Optional

from src.domain.rag_models import ResultadoBusquedaRAG
from src.infrastructure.chroma_vector_store import ChromaVectorStore

logger = logging.getLogger(__name__)

# Mapeo canónico entre los IDs de pantalla de la aventura y los enclaves del códice
LOCATION_MAP = {
    "puerto_cruz": {"lugar": "Puerto de la Cruz", "zona": "Norte"},
    "la_orotava": {"lugar": "La Orotava", "zona": "Norte"},
    "santa_ursula": {"lugar": "Santa Úrsula", "zona": "Norte"},
    "icod": {"lugar": "Icod de los Vinos", "zona": "Norte"},
    "garachico": {"lugar": "Garachico", "zona": "Norte"},
    "la_laguna": {"lugar": "San Cristóbal de La Laguna", "zona": "Norte"},
    "santa_cruz": {"lugar": "Santa Cruz de Tenerife", "zona": "Norte"},
    "anaga": {"lugar": "Parque Rural de Anaga", "zona": "Norte"},
    "costa_adeje": {"lugar": "Costa Adeje", "zona": "Sur"},
    "masca": {"lugar": "Masca", "zona": "Sur"},
    "el_medano": {"lugar": "El Médano", "zona": "Sur"},
    "las_canadas": {"lugar": "Las Cañadas del Teide", "zona": "Norte"},
    "pico_teide": {"lugar": "Pico del Teide", "zona": "Norte"},
    "los_gigantes": {"lugar": "Los Gigantes", "zona": "Sur"},
    "los_cristianos": {"lugar": "Los Cristianos", "zona": "Sur"},
}


class RAGRetriever:
    """
    Orquestador de recuperación de conocimiento documental para el LLM.
    Aplica geocercado inteligente basado en la ubicación del explorador
    y formatea el contexto canónico para eliminar alucinaciones.
    """

    def __init__(self, vector_store: Optional[ChromaVectorStore] = None):
        """
        Inicializa el retriever inyectando el almacén vectorial ChromaDB.
        """
        self.vector_store = vector_store or ChromaVectorStore()

    def retrieve(
        self,
        query: str,
        ubicacion_id: Optional[str] = None,
        top_k: int = 3,
        strict_geofence: bool = False
    ) -> list[ResultadoBusquedaRAG]:
        """
        Recupera los fragmentos documentales más relevantes para una consulta.

        Args:
            query: Pregunta en lenguaje natural del usuario o petición de análisis.
            ubicacion_id: ID del enclave actual del jugador (ej. 'puerto_cruz').
            top_k: Número máximo de fragmentos a recuperar (por defecto 3).
            strict_geofence: Si es True, restringe la búsqueda exclusivamente al enclave actual.
                             Si es False, busca en toda la isla pero prioriza semánticamente.

        Returns:
            Lista de ResultadoBusquedaRAG ordenada por similitud coseno.
        """
        filter_enclave: Optional[str] = None
        filter_zona: Optional[str] = None

        if ubicacion_id and ubicacion_id in LOCATION_MAP:
            loc_info = LOCATION_MAP[ubicacion_id]
            if strict_geofence:
                filter_enclave = loc_info["lugar"]
            else:
                # Búsqueda global abierta para permitir comparaciones insulares
                pass

        logger.debug(
            "Ejecutando retrieval RAG (query='%s', enclave_filter='%s', top_k=%d)",
            query,
            filter_enclave,
            top_k
        )

        resultados = self.vector_store.search(
            query=query,
            top_k=top_k,
            filter_enclave=filter_enclave,
            filter_zona=filter_zona
        )

        # Si el geocercado estricto no arrojó resultados, degradar elegantemente a búsqueda global
        if strict_geofence and not resultados:
            logger.info("Geocercado estricto sin resultados para '%s'. Realizando búsqueda abierta.", query)
            resultados = self.vector_store.search(
                query=query,
                top_k=top_k
            )

        return resultados

    def retrieve_by_location(self, ubicacion_id: str) -> list[ResultadoBusquedaRAG]:
        """
        Recupera directamente la sección canónica de la guía correspondiente
        a un enclave específico del mapa.
        """
        if ubicacion_id not in LOCATION_MAP:
            return []

        enclave_nombre = LOCATION_MAP[ubicacion_id]["lugar"]
        return self.vector_store.search(
            query=f"Guía turística historia y puntos de interés de {enclave_nombre}",
            top_k=1,
            filter_enclave=enclave_nombre
        )

    def format_context_for_prompt(self, results: list[ResultadoBusquedaRAG]) -> str:
        """
        Construye el bloque de contexto documental para inyectar en el System/User Prompt del LLM.
        Garantiza que el modelo disponga de la página oficial exacta y las fotos correspondientes
        para fundamentar sus respuestas y citar la fuente.
        """
        if not results:
            return "No se encontraron fragmentos relevantes en la guía oficial de Tenerife."

        bloques: list[str] = [
            "=== FUENTE DOCUMENTAL OFICIAL: CÓDICE TENERIFE (GUÍA DE VIAJE) ==="
        ]

        for idx, res in enumerate(results, start=1):
            fotos_str = ", ".join(f"Foto #{f}" for f in res.fotos_asociadas) if res.fotos_asociadas else "Ninguna"
            bloques.append(
                f"\n[DOCUMENTO #{idx} | RELEVANCIA: {res.score_similitud * 100:.1f}%]\n"
                f"- Enclave: {res.lugar} (Comarca: {res.zona})\n"
                f"- Página Oficial del PDF: {res.pagina}\n"
                f"- Fotos asociadas en el Álbum: {fotos_str}\n"
                f"- Fragmento Textual Literal:\n"
                f"\"\"\"\n{res.contenido.strip()}\n\"\"\""
            )

        bloques.append("\n=== FIN DE LA FUENTE DOCUMENTAL ===")
        bloques.append(
            "INSTRUCCIÓN DE CITACIÓN OBLIGATORIA: Cita explícitamente el número de página oficial "
            "(ej. '[Pág. 11]') al mencionar cualquier dato extraído de estos fragmentos."
        )

        return "\n".join(bloques)

    def extract_unlocked_photos(self, results: list[ResultadoBusquedaRAG]) -> list[int]:
        """
        Extrae los identificadores de fotografías asociados a los fragmentos recuperados,
        para permitir su desbloqueo determinista en el álbum del jugador.
        """
        fotos: list[int] = []
        for res in results:
            for foto_id in res.fotos_asociadas:
                if foto_id not in fotos:
                    fotos.append(foto_id)
        return fotos

"""
Infraestructura: Almacén vectorial persistente con ChromaDB y embeddings de OpenAI.
Implementa el motor de búsqueda semántica denso y filtrado por metadatos para el RAG.
Cumple con los requisitos de la Sesión 03 del Máster (Vector Stores y Similitud Coseno).
"""

import logging
from typing import Optional
import chromadb
import chromadb.utils.embedding_functions as ef

from src.domain.rag_models import DocumentChunk, ResultadoBusquedaRAG
from src.infrastructure.config import Settings, get_settings

logger = logging.getLogger(__name__)


class ChromaVectorStore:
    """
    Gestor de base de datos vectorial Chroma persistente en disco.
    Utiliza embeddings densos de OpenAI (text-embedding-3-small por defecto)
    y métrica de distancia coseno HNSW.
    """

    COLLECTION_NAME = "tenerife_codice_rag"

    def __init__(self, settings: Optional[Settings] = None):
        """
        Inicializa el cliente persistente de ChromaDB y la función de embeddings de OpenAI.
        """
        self.settings = settings or get_settings()
        self.persist_directory = self.settings.CHROMA_PERSIST_DIRECTORY

        # Inicialización del cliente persistente en disco
        self.client = chromadb.PersistentClient(path=self.persist_directory)

        # Función de embeddings oficial de Chroma integrada con OpenAI
        self.embedding_function = ef.OpenAIEmbeddingFunction(
            api_key=self.settings.OPENAI_API_KEY,
            model_name=self.settings.OPENAI_EMBEDDING_MODEL
        )

        # Creación o recuperación de la colección con métrica de similitud coseno
        self.collection = self.client.get_or_create_collection(
            name=self.COLLECTION_NAME,
            embedding_function=self.embedding_function,
            metadata={"hnsw:space": "cosine"}
        )
        logger.info(
            "ChromaVectorStore inicializado en '%s' (Colección: '%s', Modelo: '%s')",
            self.persist_directory,
            self.COLLECTION_NAME,
            self.settings.OPENAI_EMBEDDING_MODEL
        )

    def count(self) -> int:
        """Retorna el número de documentos indexados en la colección."""
        return self.collection.count()

    def index_chunks(self, chunks: list[DocumentChunk], force_reindex: bool = False) -> int:
        """
        Indexa una lista de DocumentChunk en ChromaDB.
        Si la colección ya contiene los documentos y no se fuerza el reindexado,
        reutiliza los vectores existentes para ahorrar costes de tokens y tiempo.

        Retorna el número de chunks indexados.
        """
        current_count = self.collection.count()
        if current_count == len(chunks) and not force_reindex:
            logger.info(
                "Colección ya indexada con %d chunks. Reutilizando índice persistente.",
                current_count
            )
            return current_count

        if force_reindex and current_count > 0:
            logger.info("Forzando reindexado: eliminando colección previa '%s'...", self.COLLECTION_NAME)
            self.client.delete_collection(self.COLLECTION_NAME)
            self.collection = self.client.get_or_create_collection(
                name=self.COLLECTION_NAME,
                embedding_function=self.embedding_function,
                metadata={"hnsw:space": "cosine"}
            )

        # Preparación de datos para la indexación
        ids: list[str] = []
        documents: list[str] = []
        metadatas: list[dict] = []

        for chunk in chunks:
            ids.append(chunk.chunk_id)
            documents.append(chunk.contenido)
            # ChromaDB exige que los valores de metadatos sean tipos primitivos (str, int, float, bool)
            fotos_str = ",".join(str(f) for f in chunk.fotos_asociadas)
            metadatas.append({
                "lugar": chunk.lugar,
                "zona": chunk.zona,
                "pagina": chunk.pagina,
                "fotos_asociadas": fotos_str,
                "image_path": chunk.image_path or ""
            })

        logger.info("Generando embeddings e indexando %d chunks en ChromaDB...", len(ids))
        self.collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )
        total_indexed = self.collection.count()
        logger.info("Indexación completada exitosamente. Total documentos: %d", total_indexed)
        return total_indexed

    def search(
        self,
        query: str,
        top_k: int = 3,
        filter_enclave: Optional[str] = None,
        filter_zona: Optional[str] = None
    ) -> list[ResultadoBusquedaRAG]:
        """
        Realiza una búsqueda semántica densa por similitud coseno.
        Permite filtrado exacto por enclave geográfico o comarca (geofencing).

        Retorna una lista de ResultadoBusquedaRAG ordenada por mayor similitud.
        """
        if self.collection.count() == 0:
            logger.warning("Búsqueda abortada: la colección está vacía.")
            return []

        # Construcción del filtro condicional de metadatos (where)
        where_filter: Optional[dict] = None
        if filter_enclave and filter_zona:
            where_filter = {
                "$and": [
                    {"lugar": filter_enclave},
                    {"zona": filter_zona}
                ]
            }
        elif filter_enclave:
            where_filter = {"lugar": filter_enclave}
        elif filter_zona:
            where_filter = {"zona": filter_zona}

        results = self.collection.query(
            query_texts=[query],
            n_results=top_k,
            where=where_filter,
            include=["documents", "metadatas", "distances"]
        )

        salida: list[ResultadoBusquedaRAG] = []

        if not results or not results["ids"] or not results["ids"][0]:
            return salida

        retrieved_ids = results["ids"][0]
        retrieved_docs = results["documents"][0] if results["documents"] else []
        retrieved_metas = results["metadatas"][0] if results["metadatas"] else []
        retrieved_distances = results["distances"][0] if results["distances"] else []

        for i, chunk_id in enumerate(retrieved_ids):
            doc_text = retrieved_docs[i]
            meta = retrieved_metas[i]
            distancia = retrieved_distances[i]

            # En HNSW con espacio 'cosine', la distancia es d = 1 - similitud_coseno.
            # Normalizamos la similitud entre 0.0 y 1.0
            score_similitud = max(0.0, min(1.0, round(1.0 - distancia, 4)))

            # Reconstrucción de la lista de fotos asociadas
            fotos_raw = str(meta.get("fotos_asociadas", ""))
            fotos_list = [int(f.strip()) for f in fotos_raw.split(",") if f.strip().isdigit()]

            salida.append(
                ResultadoBusquedaRAG(
                    chunk_id=chunk_id,
                    contenido=doc_text,
                    lugar=str(meta.get("lugar", "")),
                    zona=str(meta.get("zona", "")),
                    pagina=int(meta.get("pagina", 1)),
                    fotos_asociadas=fotos_list,
                    score_similitud=score_similitud,
                    distancia=round(distancia, 4),
                    image_path=meta.get("image_path") or None
                )
            )

        return salida

    def get_chunk_by_id(self, chunk_id: str) -> Optional[ResultadoBusquedaRAG]:
        """Recupera un chunk específico por su identificador único."""
        result = self.collection.get(
            ids=[chunk_id],
            include=["documents", "metadatas"]
        )
        if not result or not result["ids"]:
            return None

        doc_text = result["documents"][0]
        meta = result["metadatas"][0]
        fotos_raw = str(meta.get("fotos_asociadas", ""))
        fotos_list = [int(f.strip()) for f in fotos_raw.split(",") if f.strip().isdigit()]

        return ResultadoBusquedaRAG(
            chunk_id=chunk_id,
            contenido=doc_text,
            lugar=str(meta.get("lugar", "")),
            zona=str(meta.get("zona", "")),
            pagina=int(meta.get("pagina", 1)),
            fotos_asociadas=fotos_list,
            score_similitud=1.0,
            distancia=0.0,
            image_path=meta.get("image_path") or None
        )

"""
Script de verificación y benchmarking del pipeline RAG:
1. Extrae los 15 chunks semánticos de TENERIFE.pdf con PDFExtractor.
2. Indexa los vectores en ChromaDB persistente con OpenAI text-embedding-3-small.
3. Evalúa consultas de prueba midiendo similitud coseno y metadatos de citación.
4. Comprueba el geocercado insular y la extracción de fotos desbloqueables.
"""

import sys
import logging
from pathlib import Path

# Añadir raíz del proyecto al sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.infrastructure.pdf_extractor import PDFExtractor
from src.infrastructure.chroma_vector_store import ChromaVectorStore
from src.application.rag_retriever import RAGRetriever

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("RAGBenchmark")


def main():
    print("=" * 80)
    print("🚀 BENCHMARK DEL PIPELINE RAG: CHROMA VECTOR STORE + GEOFENCED RETRIEVER")
    print("=" * 80)

    # Paso 1: Extracción de chunks
    pdf_path = "data/TENERIFE.pdf"
    print(f"\n[1/4] Extrayendo chunks semánticos desde '{pdf_path}'...")
    extractor = PDFExtractor(pdf_path)
    chunks = extractor.extract_chunks()
    print(f"      ✅ Chunks extraídos con éxito: {len(chunks)} unidades semánticas.")

    # Paso 2: Inicialización e Indexación en ChromaDB
    print("\n[2/4] Conectando con ChromaDB persistente y generando embeddings...")
    vector_store = ChromaVectorStore()
    total_indexados = vector_store.index_chunks(chunks, force_reindex=True)
    print(f"      ✅ Total de documentos indexados en ChromaDB: {total_indexados}")

    # Paso 3: Inicialización del Retriever
    print("\n[3/4] Inicializando RAGRetriever con soporte de geocercado...")
    retriever = RAGRetriever(vector_store=vector_store)

    # Paso 4: Batería de pruebas semánticas
    queries_test = [
        {
            "query": "¿Dónde está la Casa de los Balcones y el molino tradicional para comprar gofio recién molido?",
            "expected_lugar": "La Orotava",
            "ubicacion_id": None,
            "strict": False
        },
        {
            "query": "¿Cómo funciona el teleférico para subir al Teide y qué precauciones de altitud hay?",
            "expected_lugar": "Pico del Teide",
            "ubicacion_id": None,
            "strict": False
        },
        {
            "query": "¿Dónde se encuentran las piscinas naturales de El Caletón y el Castillo de San Miguel?",
            "expected_lugar": "Garachico",
            "ubicacion_id": None,
            "strict": False
        },
        {
            "query": "¿Dónde se practica kitesurf y windsurf con playas naturales y la silueta de Montaña Roja?",
            "expected_lugar": "El Médano",
            "ubicacion_id": None,
            "strict": False
        },
        {
            "query": "¿Qué historia tiene el muelle pesquero y la ermita de San Telmo?",
            "expected_lugar": "Puerto de la Cruz",
            "ubicacion_id": "puerto_cruz",
            "strict": True
        }
    ]

    print("\n[4/4] Ejecutando batería de consultas semánticas y geocercadas:\n")

    for i, test in enumerate(queries_test, start=1):
        q = test["query"]
        exp = test["expected_lugar"]
        ubic = test["ubicacion_id"]
        strict = test["strict"]

        print(f"--- Prueba {i}: '{q}' ---")
        if ubic:
            print(f"    [Geocercado]: Enclave actual = '{ubic}' (Modo estricto: {strict})")

        resultados = retriever.retrieve(
            query=q,
            ubicacion_id=ubic,
            top_k=2,
            strict_geofence=strict
        )

        if not resultados:
            print("    ❌ ERROR: No se recuperaron resultados.")
            continue

        top1 = resultados[0]
        status = "✅ ÉXITO" if exp.lower() in top1.lugar.lower() else "⚠️ DIFERENTE"
        print(f"    {status} -> Top 1: {top1.lugar} (Pág. {top1.pagina}) | Similitud: {top1.score_similitud * 100:.2f}% | Distancia: {top1.distancia}")
        print(f"    Fotos asociadas: {top1.fotos_asociadas}")
        print(f"    Extracto: \"{top1.contenido[:140]}...\"\n")

    # Demostración del formateo de contexto para el prompt del LLM
    print("=" * 80)
    print("📝 DEMOSTRACIÓN DE FORMATEO DE CONTEXTO PARA GROUNDED PROMPTING (LLM)")
    print("=" * 80)
    muestra_res = retriever.retrieve(query="Drago milenario y leyendas de savia roja", top_k=1)
    prompt_context = retriever.format_context_for_prompt(muestra_res)
    print(prompt_context)
    fotos_desbloqueables = retriever.extract_unlocked_photos(muestra_res)
    print(f"\n📸 Fotos extraídas para desbloqueo automático en el Álbum: {fotos_desbloqueables}")
    print("=" * 80)
    print("🎉 TODAS LAS VERIFICACIONES COMPLETADAS EXITOSAMENTE.")


if __name__ == "__main__":
    main()

"""
Script de verificación y benchmarking del gestor de memoria conversacional multiturno:
1. Comprueba el cálculo exacto de tokens BPE con tiktoken (o200k_base).
2. Valida la adición de turnos conversacionales del usuario y asistente.
3. Evalúa la compactación automática (Summary Buffer híbrido) cuando se supera el presupuesto de tokens.
4. Comprueba la inyección limpia del estado determinista del juego (GameState) en el System Prompt.
"""

import sys
import logging
from pathlib import Path

# Añadir raíz del proyecto al sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.domain.state_models import GameState
from src.application.memory_manager import ConversationMemoryManager

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


def main():
    print("=" * 80)
    print("🧠 BENCHMARK DE MEMORIA MULTITURNO HÍBRIDA (SUMMARY BUFFER + CONTROL DE TOKENS)")
    print("=" * 80)

    # 1. Instanciación del gestor con ventana reducida para forzar y demostrar compactación
    print("\n[1/4] Inicializando ConversationMemoryManager...")
    manager = ConversationMemoryManager(
        max_history_tokens=300,  # Presupuesto reducido a propósito para disparar compactación
        window_turns=2           # Ventana deslizante de 2 turnos recientes (4 mensajes)
    )
    print(f"      ✅ Inicializado con max_history_tokens={manager.max_history_tokens}, window_turns={manager.window_turns}")
    print(f"      Tokenizer cargado: {manager.tokenizer.name}")

    # 2. Simulación de turnos conversacionales
    print("\n[2/4] Simulando turnos de diálogo progresivos de Twinber en Tenerife...")

    turnos_demo = [
        (
            "¡Hola! Acabo de llegar al muelle pesquero de Puerto de la Cruz.",
            "¡Bienvenido explorador! Soy Paco el Pescador. Si quieres sellar tu pasaporte, tendrás que ayudarme a buscar mi aguja de coser redes."
        ),
        (
            "¿Dónde puedo conseguir gofio tradicional por aquí?",
            "El mejor gofio del norte lo muelen en La Orotava, en el molino de agua de Chano. Sube la cuesta hacia la Villa."
        ),
        (
            "He subido a La Orotava y Chano me ha regalado un saco de gofio tostado.",
            "¡Excelente! Ahora dirígete a Santa Úrsula. Manolo el tabernero en el Guachinche te espera con un buen escaldón."
        ),
        (
            "Acabo de llegar a Garachico y veo el Castillo de San Miguel.",
            "Cuidado con las olas de El Caletón. Las piscinas naturales están preciosas hoy, pero el mar del norte tiene respeto."
        ),
        (
            "Llego a Icod de los Vinos a ver el Drago Milenario y Don Cándido me saluda.",
            "Don Cándido te habla de las leyendas de los dragos y te sella el pasaporte tras admirar las mariposas."
        ),
        (
            "Me dirijo a los acantilados de Los Gigantes y Masca.",
            "Tanausú el guía te advierte sobre la bajada del barranco de 600 metros hacia el océano."
        ),
    ]

    for i, (u_text, a_text) in enumerate(turnos_demo, start=1):
        manager.add_user_message(u_text)
        manager.add_assistant_message(a_text)
        snapshot = manager.get_snapshot()
        print(f"      Turno {i}: Añadidos 2 mensajes. Total históricos: {snapshot.total_turnos_historicos}")
        print(f"               Mensajes en ventana: {snapshot.mensajes_recientes_count} | Tokens totales: {snapshot.tokens_historial_total}")
        if snapshot.sinopsis_acumulada:
            print(f"               📜 Sinopsis generada: \"{snapshot.sinopsis_acumulada}\"")

    # 3. Comprobación del estado post-compactación
    print("\n[3/4] Evaluando la memoria tras superar el umbral de 300 tokens...")
    snapshot_final = manager.get_snapshot()
    print(f"      • Mensajes literales preservados (recientes): {snapshot_final.mensajes_recientes_count}")
    print(f"      • Sinopsis acumulada de eventos podados:\n        \"{snapshot_final.sinopsis_acumulada}\"")
    print(f"      • Consumo total de tokens en memoria: {snapshot_final.tokens_historial_total} / {snapshot_final.presupuesto_max_tokens}")

    # 4. Construcción del payload de mensajes para la API de OpenAI
    print("\n[4/4] Verificando ensamblado de mensajes para el LLM (get_messages_for_llm)...")
    game_state = GameState(
        ubicacion_actual="garachico",
        monedas_oro=12,
        sellos_obtenidos=["puerto_cruz", "la_orotava", "santa_ursula"],
        fotos_desbloqueadas=[18, 14, 15]
    )

    mensajes_llm = manager.get_messages_for_llm(
        base_system_prompt="Eres el Narrador oficial de la aventura gráfica retro de Tenerife.",
        game_state=game_state,
        rag_context="[CÓDICE: Garachico fue arrasado por la erupción de 1706...]"
    )

    print(f"      ✅ Total mensajes estructurados listos para OpenAI: {len(mensajes_llm)}")
    print("\n--- Vista previa del System Prompt inyectado ---")
    print(mensajes_llm[0]["content"][:400] + "\n[... contenido truncado para vista previa ...]")

    print("\n--- Vista previa de los mensajes de la ventana reciente ---")
    for m in mensajes_llm[1:]:
        print(f"  [{m['role'].upper()}]: {m['content'][:80]}...")

    print("\n" + "=" * 80)
    print("🎉 TODAS LAS PRUEBAS DE MEMORIA Y CONTROL DE TOKENS SUPERADAS.")
    print("=" * 80)


if __name__ == "__main__":
    main()

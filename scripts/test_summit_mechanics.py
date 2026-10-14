"""
Test de verificación de la mecánica central del juego:
1. Reglas de acceso a la cúspide del Teide (3.718m) mediante equipo completo de 4 ítems:
   - Billete del Teleférico (5 💰)
   - Saco de Gofio (3 💰)
   - Comanda del Guachinche (4 💰)
   - Plátano de Canarias (1 💰)
2. Inyección de inventario y estado de expedición en el System Prompt para el LLM.
3. Asesoramiento del LLM Narrador ante consultas sobre cómo desbloquear la cúspide.
"""

import sys
from pathlib import Path

# Añadir raíz al sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.domain.state_models import GameState, InventoryItem
from src.application.memory_manager import ConversationMemoryManager
from src.application.agent_orchestrator import SUPERVISOR_SYSTEM_PROMPT


def test_game_state_summit_equipment():
    print("\n[1/3] Probando GameState.tiene_equipo_cumbre()...")
    
    # Caso 1: Estado inicial (sin ítems de expedición)
    state = GameState(ubicacion_actual="puerto_cruz", monedas_oro=15)
    ok, faltantes = state.tiene_equipo_cumbre()
    assert not ok, "No debería tener equipo completo al inicio"
    assert len(faltantes) == 4, f"Deben faltar 4 ítems, faltan: {faltantes}"
    print(f"      ✅ Inicial: faltan {len(faltantes)} ítems: {faltantes}")

    # Caso 2: Con 3 ítems (falta Plátano)
    state.inventario.append(InventoryItem(id="item_billete", nombre="Billete del Teleférico", icono="item_billete.svg", tipo="CLAVE"))
    state.inventario.append(InventoryItem(id="item_gofio", nombre="Saco de Gofio", icono="item_gofio.svg", tipo="CLAVE"))
    state.inventario.append(InventoryItem(id="item_comanda", nombre="Comanda del Guachinche", icono="item_comanda.svg", tipo="CLAVE"))
    ok, faltantes = state.tiene_equipo_cumbre()
    assert not ok, "No debería estar completo si falta el Plátano"
    assert faltantes == ["Plátano de Canarias"], f"Debería faltar solo Plátano, falta: {faltantes}"
    print(f"      ✅ Parcial (3/4): falta {faltantes}")

    # Caso 3: Con los 4 ítems
    state.inventario.append(InventoryItem(id="item_platano", nombre="Plátano de Canarias", icono="item_platano.svg", tipo="CONSUMIBLE"))
    ok, faltantes = state.tiene_equipo_cumbre()
    assert ok, "Debería estar completo con los 4 ítems"
    assert len(faltantes) == 0, f"No debería faltar nada: {faltantes}"
    print("      ✅ Completo (4/4): Equipo validado con éxito.")


def test_memory_manager_prompt_injection():
    print("\n[2/3] Probando inyección de inventario y estado en System Prompt...")
    manager = ConversationMemoryManager()
    state = GameState(
        ubicacion_actual="las_canadas",
        monedas_oro=7,
        sellos_obtenidos=["puerto_cruz", "la_orotava", "santa_cruz", "la_laguna"],
        inventario=[
            InventoryItem(id="item_mapa", nombre="Mapa de Tenerife", icono="item_mapa.svg", tipo="PERMANENTE"),
            InventoryItem(id="item_gofio", nombre="Saco de Gofio", icono="item_gofio.svg", tipo="CLAVE"),
            InventoryItem(id="item_comanda", nombre="Comanda del Guachinche", icono="item_comanda.svg", tipo="CLAVE"),
        ]
    )

    messages = manager.get_messages_for_llm(
        base_system_prompt=SUPERVISOR_SYSTEM_PROMPT,
        game_state=state
    )

    system_content = messages[0]["content"]
    assert "MECÁNICA CENTRAL DEL JUEGO: ASCENSO Y DESBLOQUEO DE LA CÚSPIDE DEL TEIDE" in system_content
    assert "Saco de Gofio" in system_content
    assert "Comanda del Guachinche" in system_content
    assert "Billete del Teleférico" in system_content
    assert "Plátano de Canarias" in system_content
    assert "Estado del equipo de expedición al Teide (3.718m): INCOMPLETO" in system_content
    assert '"Billete del Teleférico" (5 monedas, Operario en Las Cañadas)' in system_content
    assert '"Plátano de Canarias" (1 moneda, Frutero en El Médano / Paco / Ayoze)' in system_content
    print("      ✅ Inyección de estado verificada: el LLM recibe inventario y estado de expedición exactos.")


def test_prompt_rules_advisor_coverage():
    print("\n[3/4] Verificando instrucciones del Narrador como Consejero de Expedición...")
    assert "ROL DEL NARRADOR COMO ASESOR Y CONSEJERO DE EXPEDICIÓN" in SUPERVISOR_SYSTEM_PROMPT
    assert "4 sellos" in SUPERVISOR_SYSTEM_PROMPT
    assert "TF-21" in SUPERVISOR_SYSTEM_PROMPT
    assert "La Rambleta" in SUPERVISOR_SYSTEM_PROMPT
    assert "Gofio" in SUPERVISOR_SYSTEM_PROMPT
    assert "Comanda" in SUPERVISOR_SYSTEM_PROMPT
    assert "Plátano" in SUPERVISOR_SYSTEM_PROMPT
    print("      ✅ SUPERVISOR_SYSTEM_PROMPT contiene todas las directrices para orientar al jugador.")


def test_live_llm_summit_advisor():
    print("\n[4/4] Ejecutando turno en vivo con AgentOrchestrator consultando al Narrador...")
    from src.application.agent_orchestrator import AgentOrchestrator
    orchestrator = AgentOrchestrator()
    state = GameState(
        ubicacion_actual="puerto_cruz",
        monedas_oro=12,
        sellos_obtenidos=["puerto_cruz"],
        inventario=[
            InventoryItem(id="item_mapa", nombre="Mapa de Tenerife", icono="item_mapa.svg", tipo="PERMANENTE"),
            InventoryItem(id="item_gofio", nombre="Saco de Gofio", icono="item_gofio.svg", tipo="CLAVE"),
        ]
    )

    res = orchestrator.process_turn(
        user_input="¿Cómo puedo desbloquear el camino hacia la cúspide del Teide? ¿Qué necesito para subir a la cumbre?",
        game_state=state
    )

    print("\n--- Respuesta del Narrador LLM ---")
    print(res.narrativa)
    print("----------------------------------\n")

    lower = res.narrativa.lower()
    # Debe orientar sobre los ítems necesarios o sellos requeridos
    has_item_mention = any(k in lower for k in ["gofio", "comanda", "billete", "teleférico", "plátano", "sello", "cañadas"])
    assert has_item_mention, "La narrativa debe mencionar los requerimientos de la expedición"
    print("      ✅ El Narrador LLM asesoró adecuadamente al jugador con los requisitos de la cúspide.")


if __name__ == "__main__":
    test_game_state_summit_equipment()
    test_memory_manager_prompt_injection()
    test_prompt_rules_advisor_coverage()
    test_live_llm_summit_advisor()
    print("\n" + "=" * 70)
    print("🎉 TODAS LAS VERIFICACIONES DE MECÁNICA Y ADVISOR SUPERADAS CON ÉXITO")
    print("=" * 70)

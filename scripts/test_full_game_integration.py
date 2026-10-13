"""
Script de Integración y Validación Completa del Juego de Extremo a Extremo (E2E).
Valida la integración real entre el Frontend (Vite/TypeScript) y el Backend (FastAPI + ReAct + RAG + Open-Meteo + VLM):
1. [SETUP] Consulta de Estado Inicial (/api/state) y Salud del Servidor (/api/health).
2. [CONVERSACIÓN] Diálogo en Puerto de la Cruz con Paco el Pescador (Personalidad y acento canario).
3. [FUNCTION CALLING] Consulta meteorológica en tiempo real mediante Open-Meteo (get_weather, get_calima_alert).
4. [RAG RETRIEVER] Consulta del Códice con citas rigurosas [Pág. X] y desbloqueo de sellos.
5. [MULTIMODAL VLM] Inspección visual con lupa de fotografías reales (Tool-Augmented Vision).
6. [STREAMING SSE] Generación progresiva de tokens mediante Server-Sent Events (/api/stream).
7. [TRANSICIÓN Y VIAJE] Cambio de enclave a La Orotava e interacción con Chano el Molinero.
8. [AUDITORÍA Y TELEMETRÍA] Verificación de métricas en game_audit.log y memoria híbrida (/api/telemetry).
9. [FRONTEND ESTÁTICO] Verificación de la SPA Vite compilada servida por FastAPI.
"""

import sys
import time
from pathlib import Path
from fastapi.testclient import TestClient

# Añadir raíz del proyecto al sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.api.server import app, session


def main():
    print("=" * 80)
    print("🎮 VALIDACIÓN COMPLETA DEL JUEGO: FRONTEND + BACKEND + LLM + RAG + TOOLS")
    print("=" * 80)

    client = TestClient(app)

    # 1. SETUP: Reiniciar sesión a estado limpio
    print("\n[1/9] Verificando salud y reiniciando estado inicial de la partida...")
    res_reset = client.post("/api/reset")
    assert res_reset.status_code == 200, "Error reiniciando sesión"
    state = res_reset.json()
    assert state["ubicacion_actual"] == "puerto_cruz"
    assert state["monedas_oro"] == 15
    assert len(state["sellos_obtenidos"]) == 0
    print(f"      ✅ Estado inicial verificado: {state['ubicacion_actual']} | 15 Monedas | 0 Sellos")

    # 2. DIÁLOGO CON PACO EL PESCADOR EN PUERTO DE LA CRUZ
    print("\n[2/9] Diálogo libre con Paco el Pescador en el muelle de Puerto de la Cruz...")
    t0 = time.perf_counter()
    res_dialogue = client.post("/api/action", json={
        "tipo_accion": "CONVERSAR",
        "target_hotspot_id": "Paco el Pescador",
        "texto_libre": "¡Hola Paco! ¿Qué tal la pesca hoy en el muelle del Puerto?",
        "ubicacion": "puerto_cruz"
    })
    lat_diag = (time.perf_counter() - t0) * 1000
    assert res_dialogue.status_code == 200, f"Error en diálogo: {res_dialogue.status_code}"
    turn_diag = res_dialogue.json()
    print(f"      ✅ Respuesta recibida ({lat_diag:.1f}ms):")
    print(f"         \"{turn_diag['narrativa'][:120]}...\"")
    assert len(turn_diag["narrativa"]) > 20

    # 3. FUNCTION CALLING: OPEN-METEO Y CALIMA
    print("\n[3/9] Probando Function Calling: Consulta de clima y calima en Puerto de la Cruz...")
    t0 = time.perf_counter()
    res_weather = client.post("/api/action", json={
        "tipo_accion": "CONVERSAR",
        "target_hotspot_id": "Paco el Pescador",
        "texto_libre": "¿Cómo está el tiempo meteorológico hoy aquí en el Puerto de la Cruz y si hay calima?",
        "ubicacion": "puerto_cruz"
    })
    lat_weather = (time.perf_counter() - t0) * 1000
    assert res_weather.status_code == 200
    turn_weather = res_weather.json()
    print(f"      ✅ Narrativa meteorológica ({lat_weather:.1f}ms):")
    print(f"         \"{turn_weather['narrativa'][:130]}...\"")

    # Verificar que el log de auditoría registró la llamada a la tool meteorológica
    res_telem_tools = client.get("/api/telemetry")
    eventos_audit = res_telem_tools.json()["eventos_recientes"]
    tool_names = [e["nombre_operacion"] for e in eventos_audit if e["tipo_evento"] == "TOOL_CALL"]
    print(f"      ✅ Tools meteorológicas registradas en auditoría: {tool_names[:3]}")
    assert any("weather" in t or "calima" in t for t in tool_names), "No se registraron tools meteorológicas"

    # 4. RAG RETRIEVER: CÓDICE DE TENERIFE CON CITA RIGUROSA
    print("\n[4/9] Probando RAG Retriever: Consulta histórica de San Telmo y César Manrique...")
    t0 = time.perf_counter()
    res_rag = client.post("/api/action", json={
        "tipo_accion": "CONVERSAR",
        "target_hotspot_id": "Paco el Pescador",
        "texto_libre": "¿Qué me puedes contar sobre las piscinas del Lago Martiánez de César Manrique y el Faro de San Telmo?",
        "ubicacion": "puerto_cruz"
    })
    lat_rag = (time.perf_counter() - t0) * 1000
    assert res_rag.status_code == 200
    turn_rag = res_rag.json()
    print(f"      ✅ RAG ejecutado ({lat_rag:.1f}ms):")
    print(f"         - Citas documentales: {len(turn_rag['citas'])}")
    print(f"         - Narrativa: \"{turn_rag['narrativa'][:140]}...\"")
    # Validar que una pregunta de lore NO sella automáticamente el pasaporte
    assert "puerto_cruz" not in turn_rag["estado"]["sellos_obtenidos"], "Error: El lore no debe sellar el pasaporte"
    print("      ✅ Verificado: Preguntar por lore NO sella el pasaporte indebidamente.")

    # 4b. PASAPORTE: PETICIÓN EXPLÍCITA DE SELLADO
    print("      👉 Solicitando sellado oficial del pasaporte a Paco el Pescador...")
    res_stamp = client.post("/api/action", json={
        "tipo_accion": "CONVERSAR",
        "target_hotspot_id": "Paco el Pescador",
        "texto_libre": "¿Podría sellarme el pasaporte de explorador oficial de Tenerife en Puerto de la Cruz?",
        "ubicacion": "puerto_cruz"
    })
    assert res_stamp.status_code == 200
    turn_stamp = res_stamp.json()
    assert "puerto_cruz" in turn_stamp["estado"]["sellos_obtenidos"], "No se obtuvo el sello de puerto_cruz tras petición expresa"
    assert "sfx_stamp" in turn_stamp["sfx_to_play"], "No se emitió el efecto de sonido sfx_stamp"
    print(f"      ✅ Sello oficial de puerto_cruz obtenido con éxito: {turn_stamp['estado']['sellos_obtenidos']}")

    # 5. MULTIMODAL VLM: INSPECCIÓN CON LUPA DE FOTOGRAFÍA
    print("\n[5/9] Probando Multimodal VLM: Inspección de fotografía con visión aumentada...")
    photo_path = "assets/img/photos/photo_01.jpg"
    t0 = time.perf_counter()
    res_vlm = client.post("/api/action", json={
        "tipo_accion": "OBSERVAR",
        "texto_libre": "Inspecciona con lupa esta fotografía de la expedición en Santa Cruz de Tenerife. ¿Qué monumento arquitectónico observas y qué detalles de diseño tiene?",
        "ubicacion": "santa_cruz",
        "image_path": photo_path
    })
    lat_vlm = (time.perf_counter() - t0) * 1000
    assert res_vlm.status_code == 200
    turn_vlm = res_vlm.json()
    print(f"      ✅ VLM ejecutado ({lat_vlm:.1f}ms):")
    print(f"         - Narrativa VLM: \"{turn_vlm['narrativa'][:140]}...\"")
    assert any(term in turn_vlm["narrativa"].lower() for term in ["auditorio", "calatrava", "santa cruz", "arquitectura"]), "El VLM no reconoció el monumento"

    # 6. STREAMING SSE: SERVER-SENT EVENTS
    print("\n[6/9] Probando Streaming de Tokens SSE (Server-Sent Events en tiempo real)...")
    with client.stream("GET", "/api/stream?texto=Dime+una+frase+corta+de+ánimo+para+un+viajero&ubicacion=puerto_cruz") as response:
        assert response.status_code == 200
        tokens_received = []
        for line in response.iter_lines():
            if line and line.startswith("data: "):
                token = line.replace("data: ", "")
                if token != "[DONE]":
                    tokens_received.append(token)
                if len(tokens_received) >= 8:
                    break
        print(f"      ✅ Streaming activo. Tokens emitidos: \"{''.join(tokens_received[:6])}...\"")

    # 7. TRANSICIÓN DE ENCLAVE Y VIAJE POR EL MAPA
    print("\n[7/9] Simulando viaje por la isla hacia La Orotava...")
    res_travel = client.post("/api/action", json={
        "tipo_accion": "VIAJAR",
        "ubicacion": "la_orotava",
        "texto_libre": "He tomado la guagua y acabo de llegar a La Orotava."
    })
    assert res_travel.status_code == 200
    turn_travel = res_travel.json()
    assert turn_travel["estado"]["ubicacion_actual"] == "la_orotava"
    print(f"      ✅ Viaje completado: Ubicación actualizada a '{turn_travel['estado']['ubicacion_actual']}'")

    # 8. TELEMETRÍA Y OBSERVABILIDAD (game_audit.log)
    print("\n[8/9] Verificando consola CRT de telemetría y auditoría persistente...")
    res_telem = client.get("/api/telemetry")
    assert res_telem.status_code == 200
    telem = res_telem.json()
    print(f"      ✅ Total eventos registrados en disco: {telem['total_eventos_registrados']}")
    print(f"      ✅ Tokens en memoria híbrida: {telem['memoria_snapshot']['tokens_historial_total']} / {telem['memoria_snapshot']['presupuesto_max_tokens']}")
    print(f"      ✅ Mensajes en ventana conversacional: {telem['memoria_snapshot']['mensajes_recientes_count']}")
    assert telem["total_eventos_registrados"] > 5
    assert telem["memoria_snapshot"]["tokens_historial_total"] <= 2000, "Violación del presupuesto de tokens"

    # 9. FRONTEND ESTÁTICO COMPILADO
    print("\n[9/9] Verificando servicio de la Single Page Application (SPA)...")
    res_html = client.get("/")
    assert res_html.status_code == 200
    assert "Twinber en Tenerife" in res_html.text or "game-wrapper" in res_html.text
    print(f"      ✅ Frontend SPA servido correctamente (Tamaño HTML: {len(res_html.text)} bytes)")

    print("\n" + "=" * 80)
    print("🎉 VALIDACIÓN INTEGRAL COMPLETADA CON ÉXITO: 9/9 ETAPAS VERIFICADAS.")
    print("=" * 80)


if __name__ == "__main__":
    main()

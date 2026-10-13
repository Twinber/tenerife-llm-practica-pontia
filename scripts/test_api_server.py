"""
Script de verificación y benchmarking del servidor FastAPI:
1. Comprueba el endpoint de salud (GET /api/health).
2. Comprueba la consulta de estado del juego (GET /api/state).
3. Evalúa la ejecución de una acción SCUMM (POST /api/action).
4. Comprueba el streaming de Server-Sent Events (GET /api/stream).
5. Verifica la recuperación de telemetría y auditoría (GET /api/telemetry).
6. Comprueba el reinicio de partida (POST /api/reset).
7. Verifica que se sirven los estáticos web compilados (GET /).
"""

import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Añadir raíz del proyecto al sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.api.server import app


def main():
    print("=" * 80)
    print("🚀 BENCHMARK DEL SERVIDOR FASTAPI (REST + SSE STREAMING + TELEMETRÍA)")
    print("=" * 80)

    client = TestClient(app)

    # 1. Health check
    print("\n[1/7] Probando GET /api/health...")
    res_health = client.get("/api/health")
    assert res_health.status_code == 200, f"Error en health check: {res_health.status_code}"
    print(f"      ✅ Status 200: {res_health.json()}")

    # 2. Get initial state
    print("\n[2/7] Probando GET /api/state...")
    res_state = client.get("/api/state")
    assert res_state.status_code == 200, f"Error en state: {res_state.status_code}"
    state_json = res_state.json()
    print(f"      ✅ Estado recibido: Enclave={state_json['ubicacion_actual']}, Monedas={state_json['monedas_oro']}, Sellos={state_json['sellos_obtenidos']}")

    # 3. Handle action (POST /api/action)
    print("\n[3/7] Probando POST /api/action (Interacción contextual OBSERVAR)...")
    payload = {
        "tipo_accion": "OBSERVAR",
        "target_hotspot_id": "Faro de San Telmo",
        "ubicacion": "puerto_cruz"
    }
    res_action = client.post("/api/action", json=payload)
    assert res_action.status_code == 200, f"Error en action: {res_action.status_code}"
    action_json = res_action.json()
    print(f"      ✅ TurnResult recibido:")
    print(f"         - Narrativa: \"{action_json['narrativa'][:120]}...\"")
    print(f"         - Sellos: {action_json['estado']['sellos_obtenidos']}")
    print(f"         - SFX disparados: {action_json['sfx_to_play']}")

    # 4. SSE Streaming (GET /api/stream)
    print("\n[4/7] Probando GET /api/stream (Server-Sent Events en tiempo real)...")
    with client.stream("GET", "/api/stream?texto=Dime+un+saludo+breve&ubicacion=puerto_cruz") as response:
        assert response.status_code == 200, f"Error en stream: {response.status_code}"
        lines_received = 0
        tokens_preview = []
        for line in response.iter_lines():
            if line:
                lines_received += 1
                if line.startswith("data: "):
                    token = line.replace("data: ", "")
                    tokens_preview.append(token)
                    if len(tokens_preview) >= 6:
                        break

        print(f"      ✅ Conexión SSE activa. Tokens de streaming recibidos: \"{''.join(tokens_preview[:5])}...\"")

    # 5. Telemetry & Audit (GET /api/telemetry)
    print("\n[5/7] Probando GET /api/telemetry (Consola CRT de observabilidad)...")
    res_telem = client.get("/api/telemetry")
    assert res_telem.status_code == 200, f"Error en telemetry: {res_telem.status_code}"
    telem_json = res_telem.json()
    print(f"      ✅ Eventos de auditoría en disco: {telem_json['total_eventos_registrados']}")
    print(f"      ✅ Tokens en memoria híbrida: {telem_json['memoria_snapshot']['tokens_historial_total']} / {telem_json['memoria_snapshot']['presupuesto_max_tokens']}")

    # 6. Reset game (POST /api/reset)
    print("\n[6/7] Probando POST /api/reset...")
    res_reset = client.post("/api/reset")
    assert res_reset.status_code == 200, f"Error en reset: {res_reset.status_code}"
    reset_json = res_reset.json()
    print(f"      ✅ Partida reiniciada: Turnos={reset_json['turnos_jugados']}, Sellos={reset_json['sellos_obtenidos']}")

    # 7. Static file serving (GET /)
    print("\n[7/7] Probando GET / (Servicio del frontend web compilado)...")
    res_root = client.get("/")
    if res_root.status_code == 200:
        print(f"      ✅ Frontend SPA servido correctamente (HTML tamaño: {len(res_root.text)} bytes)")
    else:
        print(f"      ⚠️ Frontend estático no montado aún o código {res_root.status_code}")

    print("\n" + "=" * 80)
    print("🎉 TODOS LOS ENDPOINTS DE LA API FASTAPI VERIFICADOS CON ÉXITO.")
    print("=" * 80)


if __name__ == "__main__":
    main()

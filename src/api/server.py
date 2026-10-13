"""
Servidor API: Backend FastAPI con endpoints REST y streaming Server-Sent Events (SSE).
Conecta el Frontend (TypeScript / Vite) con el Orquestador Agéntico y el RAG de Tenerife.
Cumple con las exigencias de la Sesión 02 (Streaming de Tokens) y Criterio 7.2 (Integración).
"""

import asyncio
import json
import logging
import threading
from pathlib import Path
from typing import Any, AsyncGenerator, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from src.application.agent_orchestrator import AgentOrchestrator
from src.domain.audit_models import AuditEvent
from src.domain.memory_models import ConversationMemorySnapshot
from src.domain.state_models import GameState, InventoryItem, TurnResult, ExecutionStep
from src.infrastructure.config import get_settings

logger = logging.getLogger(__name__)

# Configuración de FastAPI
app = FastAPI(
    title="Twinber en busca del secreto Guanche - API",
    description="Motor agéntico conversacional con RAG, Open-Meteo, Visión VLM y gestión de estado.",
    version="1.0.0"
)

# Habilitar CORS para desarrollo local con Vite (puerto 5173) y producción
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# MODELOS DE ENTRADA Y SALIDA DE LA API
# ------------------------------------------------------------------------------
class ActionRequest(BaseModel):
    """
    Contrato de acción enviado desde la interfaz contextual del juego.
    Soporta interacción directa sobre hotspots/NPCs y consultas libres.
    """
    tipo_accion: Optional[str] = Field(
        default="OBSERVAR",
        description="Tipo de interacción contextual: OBSERVAR (hotspot), CONVERSAR (NPC), USAR_ITEM o CONSULTA_LIBRE"
    )
    verbo: Optional[str] = Field(
        default=None,
        description="Alias de compatibilidad retroactiva para tipo_accion"
    )
    target_hotspot_id: Optional[str] = Field(default=None, description="ID del hotspot o NPC sobre el que se actúa")
    item_id: Optional[str] = Field(default=None, description="ID del ítem del inventario utilizado si aplica")
    texto_libre: Optional[str] = Field(default=None, description="Pregunta directa o texto libre del jugador")
    ubicacion: Optional[str] = Field(default=None, description="ID del enclave actual de la pantalla")
    image_path: Optional[str] = Field(default=None, description="Ruta relativa o absoluta de la imagen a inspeccionar")


class TelemetryResponse(BaseModel):
    """
    Contrato devuelto para la consola CRT de telemetría y auditoría del frontend.
    """
    eventos_recientes: list[AuditEvent]
    memoria_snapshot: ConversationMemorySnapshot
    total_eventos_registrados: int


# ------------------------------------------------------------------------------
# ESTADO GLOBAL DE LA SESIÓN DE JUEGO (SINGLETON IN-MEMORY)
# ------------------------------------------------------------------------------
def create_initial_game_state() -> GameState:
    """Genera el estado limpio al iniciar una nueva partida."""
    return GameState(
        ubicacion_actual="puerto_cruz",
        monedas_oro=15,
        sellos_obtenidos=[],
        fotos_desbloqueadas=[],
        inventario=[
            InventoryItem(id="item_mapa", nombre="Mapa de Tenerife", icono="item_mapa.svg", tipo="PERMANENTE", inspeccionable=True),
            InventoryItem(id="item_album", nombre="Álbum de Fotos", icono="item_album.svg", tipo="PERMANENTE", inspeccionable=True),
            InventoryItem(id="item_pasaporte", nombre="Pasaporte de Explorador", icono="item_pasaporte.svg", tipo="PERMANENTE", inspeccionable=True),
            InventoryItem(id="item_monedas", nombre="Monedas de Oro", icono="item_monedas.svg", tipo="PERMANENTE", cantidad=15, inspeccionable=False),
        ],
        turnos_jugados=0,
        juego_completado=False
    )


class GameSession:
    """Contenedor de estado y orquestador para la sesión activa."""
    def __init__(self):
        self.state: GameState = create_initial_game_state()
        self.orchestrator: AgentOrchestrator = AgentOrchestrator()

    def reset(self) -> GameState:
        self.state = create_initial_game_state()
        self.orchestrator.memory_manager.clear()
        return self.state


session = GameSession()


# ------------------------------------------------------------------------------
# RUTAS DE LA API REST
# ------------------------------------------------------------------------------
@app.get("/api/health")
async def health_check() -> dict[str, str]:
    """Endpoint de comprobación de salud del servicio."""
    return {
        "status": "ok",
        "app": "Twinber Tenerife AI Engine",
        "version": "1.0.0"
    }


@app.get("/api/state", response_model=GameState)
async def get_state() -> GameState:
    """Retorna el estado determinista actual de la partida."""
    return session.state


@app.post("/api/action", response_model=TurnResult)
async def handle_action(req: ActionRequest) -> TurnResult:
    """
    Procesa una interacción contextual (observar hotspot, conversar con NPC) o consulta libre del jugador.
    Ejecuta el bucle agéntico ReAct y retorna el TurnResult con narrativa y mutaciones.
    """
    # Sincronizar ubicación si el frontend indica que el jugador viajó
    if req.ubicacion and req.ubicacion != session.state.ubicacion_actual:
        session.state.ubicacion_actual = req.ubicacion

    # Determinar el tipo de acción (contextual inteligente o compatible con llamadas previas)
    tipo = (req.tipo_accion or req.verbo or "OBSERVAR").upper()

    # Reconstrucción de la intención textual del jugador según la interacción contextual
    if req.texto_libre and req.texto_libre.strip():
        user_prompt = req.texto_libre.strip()
    elif tipo in ("OBSERVAR", "MIRAR", "EXAMINAR"):
        target = req.target_hotspot_id or session.state.ubicacion_actual
        user_prompt = f"Observo con atención {target}. ¿Qué descubro en detalle y qué historia o datos de interés tiene este lugar?"
    elif tipo in ("CONVERSAR", "HABLAR", "DIALOGO"):
        target = req.target_hotspot_id or "el personaje local"
        user_prompt = f"Converso con {target}. Saludo amablemente y le pregunto qué sabe sobre este enclave de Tenerife y si tiene algún dato o pista para mi viaje."
    elif tipo in ("USAR_ITEM", "USAR"):
        user_prompt = f"Intento usar el objeto {req.item_id} con {req.target_hotspot_id}."
    else:
        user_prompt = f"Realizo la interacción {tipo} en {session.state.ubicacion_actual}."

    # Ejecutar turno mediante el Orquestador Agéntico
    turn_result = session.orchestrator.process_turn(
        user_input=user_prompt,
        game_state=session.state,
        image_path=req.image_path
    )

    # Actualizar estado persistente
    session.state = turn_result.estado
    return turn_result


@app.get("/api/stream")
async def stream_action(
    texto: str = Query(..., description="Texto o consulta del jugador"),
    ubicacion: Optional[str] = Query(None, description="Enclave actual"),
    image_path: Optional[str] = Query(None, description="Imagen opcional para visión")
) -> StreamingResponse:
    """
    Endpoint de streaming en tiempo real mediante Server-Sent Events (SSE).
    Envía los eventos agénticos ([STEP]) conforme se ejecutan en el bucle ReAct,
    seguidos de los tokens de la narrativa final y metadatos de sincronización ([META]).
    """
    if ubicacion and ubicacion != session.state.ubicacion_actual:
        session.state.ubicacion_actual = ubicacion

    async def sse_generator() -> AsyncGenerator[str, None]:
        loop = asyncio.get_running_loop()
        queue: asyncio.Queue[tuple[str, Any]] = asyncio.Queue()

        def on_step_callback(step: ExecutionStep) -> None:
            loop.call_soon_threadsafe(queue.put_nowait, ("STEP", step))

        def run_sync_turn() -> None:
            try:
                turn_res = session.orchestrator.process_turn(
                    user_input=texto,
                    game_state=session.state,
                    image_path=image_path,
                    on_step=on_step_callback
                )
                loop.call_soon_threadsafe(queue.put_nowait, ("DONE_RESULT", turn_res))
            except Exception as exc:
                logger.exception("Error en ejecución agéntica SSE: %s", exc)
                loop.call_soon_threadsafe(queue.put_nowait, ("ERROR", str(exc)))

        worker_thread = threading.Thread(target=run_sync_turn, daemon=True)
        worker_thread.start()

        turn_result: Optional[TurnResult] = None
        while True:
            evt_type, payload = await queue.get()
            if evt_type == "STEP":
                step_obj: ExecutionStep = payload
                yield f"data: [STEP]{step_obj.model_dump_json()}\n\n"
            elif evt_type == "DONE_RESULT":
                turn_result = payload
                break
            elif evt_type == "ERROR":
                yield f"data: [ERROR]{payload}\n\n"
                yield "data: [DONE]\n\n"
                return

        if turn_result:
            session.state = turn_result.estado
            palabras = turn_result.narrativa.split(" ")

            for palabra in palabras:
                yield f"data: {palabra} \n\n"
                await asyncio.sleep(0.018)

            # Evento de metadatos estructurados del turno (sellos, fotos, sfx, estado, pasos_ejecucion)
            meta = {
                "type": "turn_metadata",
                "fotos_nuevas": turn_result.fotos_nuevas,
                "sellos_nuevos": turn_result.sellos_nuevos,
                "sfx_to_play": turn_result.sfx_to_play,
                "pasos_ejecucion": [p.model_dump() for p in turn_result.pasos_ejecucion],
                "estado": turn_result.estado.model_dump()
            }
            yield f"data: [META]{json.dumps(meta)}\n\n"

        # Evento de finalización SSE
        yield "data: [DONE]\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")


@app.get("/api/telemetry", response_model=TelemetryResponse)
async def get_telemetry() -> TelemetryResponse:
    """
    Retorna las métricas de observabilidad, últimos eventos del log de auditoría
    y el snapshot actual del gestor de memoria.
    """
    eventos = session.orchestrator.audit_logger.get_recent_events(limit=15)
    snapshot = session.orchestrator.memory_manager.get_snapshot()
    total_ev = session.orchestrator.audit_logger.count_events()

    return TelemetryResponse(
        eventos_recientes=eventos,
        memoria_snapshot=snapshot,
        total_eventos_registrados=total_ev
    )


@app.post("/api/reset", response_model=GameState)
async def reset_game() -> GameState:
    """Reinicia la partida y limpia la memoria conversacional."""
    nuevo_estado = session.reset()
    session.orchestrator.audit_logger.log_tool_call(
        nombre_operacion="game_reset",
        argumentos={},
        resultado_resumen="Partida reiniciada a estado inicial.",
        latencia_ms=0.0,
        estado="SUCCESS"
    )
    return nuevo_estado


# ------------------------------------------------------------------------------
# SERVICIO DE ARCHIVOS ESTÁTICOS Y FRONTEND COMPILADO
# ------------------------------------------------------------------------------
frontend_dist = Path("frontend/dist")
frontend_assets = Path("frontend/public/assets")
project_assets = Path("assets")

if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend_app")
elif frontend_assets.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_assets)), name="frontend_assets")
elif project_assets.exists():
    app.mount("/assets", StaticFiles(directory=str(project_assets)), name="project_assets")

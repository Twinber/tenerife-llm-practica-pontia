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
    monedas: Optional[int] = Field(default=None, ge=0, le=15, description="Saldo de monedas de oro actual del explorador")


class StateUpdateRequest(BaseModel):
    """
    Contrato para sincronización directa de estado iniciada por el cliente.
    Permite registrar compras en tiendas de NPCs, deducción de monedas y viajes.
    """
    monedas_oro: Optional[int] = Field(default=None, ge=0, le=15, description="Saldo de monedas restante")
    ubicacion_actual: Optional[str] = Field(default=None, description="Nuevo enclave")
    item_adquirido_id: Optional[str] = Field(default=None, description="ID del objeto comprado (ej. item_gofio)")
    item_adquirido_nombre: Optional[str] = Field(default=None, description="Nombre del objeto")
    item_adquirido_icono: Optional[str] = Field(default=None, description="Icono SVG del objeto")
    item_adquirido_cantidad: Optional[int] = Field(default=1, ge=1)
    items_adquiridos: Optional[list[dict[str, Any]]] = Field(
        default=None,
        description="Lista de objetos adquiridos para resincronización completa desde el cliente"
    )


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


@app.patch("/api/state", response_model=GameState)
@app.post("/api/state", response_model=GameState)
async def update_state(update: StateUpdateRequest) -> GameState:
    """
    Sincroniza mutaciones de estado iniciadas por el cliente (compras en tiendas, viajes, deducción de monedas).
    """
    if update.monedas_oro is not None and 0 <= update.monedas_oro <= 15:
        session.state.monedas_oro = update.monedas_oro
        for item in session.state.inventario:
            if item.id == "item_monedas":
                item.cantidad = update.monedas_oro

    if update.items_adquiridos:
        for it_raw in update.items_adquiridos:
            nom = it_raw.get("name") or it_raw.get("nombre")
            if not nom:
                continue
            cnt = it_raw.get("count") or it_raw.get("cantidad") or 1
            i_id = "item_gofio"
            if "platano" in nom.lower() or "plátano" in nom.lower():
                i_id = "item_platano"
            elif "comanda" in nom.lower():
                i_id = "item_comanda"
            elif "billete" in nom.lower():
                i_id = "item_billete"
            existente = next((it for it in session.state.inventario if it.id == i_id or it.nombre.lower() == nom.lower()), None)
            if existente:
                existente.cantidad = cnt
            else:
                session.state.inventario.append(InventoryItem(
                    id=i_id,
                    nombre=nom,
                    icono=f"{i_id}.svg",
                    tipo="CONSUMIBLE" if i_id == "item_platano" else "CLAVE",
                    cantidad=cnt
                ))

    if update.item_adquirido_id and update.item_adquirido_nombre:
        existente = next((it for it in session.state.inventario if it.id == update.item_adquirido_id), None)
        if existente:
            existente.cantidad += update.item_adquirido_cantidad or 1
        else:
            session.state.inventario.append(InventoryItem(
                id=update.item_adquirido_id,
                nombre=update.item_adquirido_nombre,
                icono=update.item_adquirido_icono or "item_gofio.svg",
                tipo="CONSUMIBLE" if "platano" in update.item_adquirido_id else "CLAVE",
                cantidad=update.item_adquirido_cantidad or 1
            ))

    if update.ubicacion_actual is not None:
        if update.ubicacion_actual == "pico_teide":
            ok_cumbre, faltantes = session.state.tiene_equipo_cumbre()
            if ok_cumbre and session.state.ubicacion_actual == "las_canadas":
                session.state.ubicacion_actual = update.ubicacion_actual
            else:
                logger.warning("Bloqueado intento de viaje a cumbre: ok_cumbre=%s, ubicacion_actual=%s, faltantes=%s",
                               ok_cumbre, session.state.ubicacion_actual, faltantes)
        else:
            session.state.ubicacion_actual = update.ubicacion_actual

    session.orchestrator.audit_logger.log_state_mutation(
        nombre_operacion="client_state_sync",
        argumentos=update.model_dump(exclude_none=True),
        resultado_resumen=f"Estado sincronizado: monedas={session.state.monedas_oro}, enclave={session.state.ubicacion_actual}",
        latencia_ms=0.0,
        estado="SUCCESS"
    )
    return session.state


@app.post("/api/action", response_model=TurnResult)
async def handle_action(req: ActionRequest) -> TurnResult:
    """
    Procesa una interacción contextual (observar hotspot, conversar con NPC) o consulta libre del jugador.
    Ejecuta el bucle agéntico ReAct y retorna el TurnResult con narrativa y mutaciones.
    """
    # Sincronizar ubicación y monedas si el frontend las proporciona
    if req.ubicacion and req.ubicacion != session.state.ubicacion_actual:
        if req.ubicacion == "pico_teide":
            ok_cumbre, _ = session.state.tiene_equipo_cumbre()
            if ok_cumbre and session.state.ubicacion_actual == "las_canadas":
                session.state.ubicacion_actual = req.ubicacion
        else:
            session.state.ubicacion_actual = req.ubicacion
    if req.monedas is not None and 0 <= req.monedas <= 15:
        session.state.monedas_oro = req.monedas
        for item in session.state.inventario:
            if item.id == "item_monedas":
                item.cantidad = req.monedas

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
    image_path: Optional[str] = Query(None, description="Imagen opcional para visión"),
    monedas: Optional[int] = Query(None, ge=0, le=15, description="Saldo de monedas actual del explorador"),
    items: Optional[str] = Query(None, description="JSON serializado con nombres o dicts de items adquiridos")
) -> StreamingResponse:
    """
    Endpoint de streaming en tiempo real mediante Server-Sent Events (SSE).
    Envía los eventos agénticos ([STEP]) conforme se ejecutan en el bucle ReAct,
    seguidos de los tokens de la narrativa final y metadatos de sincronización ([META]).
    """
    if items:
        try:
            parsed_items = json.loads(items)
            if isinstance(parsed_items, list):
                for it_raw in parsed_items:
                    nom = it_raw.get("name") if isinstance(it_raw, dict) else str(it_raw)
                    if not nom:
                        continue
                    cnt = it_raw.get("count", 1) if isinstance(it_raw, dict) else 1
                    i_id = "item_gofio"
                    if "platano" in nom.lower() or "plátano" in nom.lower():
                        i_id = "item_platano"
                    elif "comanda" in nom.lower():
                        i_id = "item_comanda"
                    elif "billete" in nom.lower():
                        i_id = "item_billete"
                    existente = next((it for it in session.state.inventario if it.id == i_id or it.nombre.lower() == nom.lower()), None)
                    if existente:
                        existente.cantidad = cnt
                    else:
                        session.state.inventario.append(InventoryItem(
                            id=i_id,
                            nombre=nom,
                            icono=f"{i_id}.svg",
                            tipo="CONSUMIBLE" if i_id == "item_platano" else "CLAVE",
                            cantidad=cnt
                        ))
        except Exception as e:
            logger.warning("Error parseando items en stream_action: %s", e)

    if ubicacion and ubicacion != session.state.ubicacion_actual:
        if ubicacion == "pico_teide":
            ok_cumbre, _ = session.state.tiene_equipo_cumbre()
            if ok_cumbre and session.state.ubicacion_actual == "las_canadas":
                session.state.ubicacion_actual = ubicacion
        else:
            session.state.ubicacion_actual = ubicacion
    if monedas is not None and 0 <= monedas <= 15:
        session.state.monedas_oro = monedas
        for item in session.state.inventario:
            if item.id == "item_monedas":
                item.cantidad = monedas

    async def sse_generator() -> AsyncGenerator[str, None]:
        loop = asyncio.get_running_loop()
        queue: asyncio.Queue[tuple[str, Any]] = asyncio.Queue()

        def on_step_callback(step: ExecutionStep) -> None:
            loop.call_soon_threadsafe(queue.put_nowait, ("STEP", step))

        def on_token_callback(token: str) -> None:
            loop.call_soon_threadsafe(queue.put_nowait, ("TOKEN", token))

        def run_sync_turn() -> None:
            try:
                turn_res = session.orchestrator.process_turn(
                    user_input=texto,
                    game_state=session.state,
                    image_path=image_path,
                    on_step=on_step_callback,
                    on_token=on_token_callback
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
            elif evt_type == "TOKEN":
                token_str: str = payload
                yield f"data: [TOKEN]{json.dumps(token_str)}\n\n"
            elif evt_type == "DONE_RESULT":
                turn_result = payload
                break
            elif evt_type == "ERROR":
                yield f"data: [ERROR]{payload}\n\n"
                yield "data: [DONE]\n\n"
                return

        if turn_result:
            session.state = turn_result.estado

            # Evento de metadatos estructurados del turno (sellos, fotos, sfx, estado, pasos_ejecucion)
            meta = {
                "type": "turn_metadata",
                "fotos_nuevas": turn_result.fotos_nuevas,
                "fotos_relacionadas": turn_result.fotos_relacionadas,
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
    session.orchestrator.audit_logger.log_state_mutation(
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

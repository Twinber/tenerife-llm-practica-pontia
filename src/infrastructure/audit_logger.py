"""
Infraestructura de Observabilidad: Logger estructurado de auditoría persistente en disco.
Registra cada invocación de herramientas, recuperaciones RAG y cambios de estado en formato JSON Lines.
Cumple con los requisitos obligatorios de la Sesión 04 del Máster (Logging de Invocaciones)
y desbloquea el Bonus Técnico de Observabilidad Avanzada.
"""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from src.domain.audit_models import AuditEvent
from src.infrastructure.config import Settings, get_settings

logger = logging.getLogger(__name__)


class AuditLogger:
    """
    Gestor de persistencia de eventos de auditoría y telemetría en archivo JSON Lines.
    Permite registrar y auditar de forma inmutable cada tool call y consulta externa.
    """

    def __init__(self, log_path: Optional[str] = None, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        self.log_path = Path(log_path or self.settings.GAME_AUDIT_LOG_PATH)

        # Asegurar existencia del directorio padre si aplica
        if self.log_path.parent:
            self.log_path.parent.mkdir(parents=True, exist_ok=True)

        logger.info("AuditLogger inicializado en '%s'", self.log_path.resolve())

    def log_event(self, event: AuditEvent) -> None:
        """
        Escribe un AuditEvent en formato JSON Lines en disco.
        """
        try:
            line = event.model_dump_json() + "\n"
            with open(self.log_path, "a", encoding="utf-8") as f:
                f.write(line)
        except Exception as exc:
            logger.error("Error al escribir evento de auditoría en disco: %s", exc)

    def log_tool_call(
        self,
        nombre_operacion: str,
        argumentos: dict[str, Any],
        resultado_resumen: str,
        latencia_ms: float,
        estado: str = "SUCCESS",
        tokens_input: Optional[int] = None,
        tokens_output: Optional[int] = None,
        tipo_evento: str = "TOOL_CALL"
    ) -> AuditEvent:
        """
        Método de conveniencia para registrar una llamada a herramienta (Function Calling)
        o cualquier otro evento tipado en el log de auditoría.
        """
        event = AuditEvent(
            timestamp=datetime.now(timezone.utc).isoformat(),
            tipo_evento=tipo_evento,  # type: ignore[arg-type]
            nombre_operacion=nombre_operacion,
            argumentos=argumentos,
            resultado_resumen=resultado_resumen,
            latencia_ms=round(latencia_ms, 2),
            estado=estado,  # type: ignore[arg-type]
            tokens_input=tokens_input,
            tokens_output=tokens_output
        )
        self.log_event(event)
        return event

    def log_guardrail_check(
        self,
        nombre_operacion: str,
        argumentos: dict[str, Any],
        resultado_resumen: str,
        latencia_ms: float,
        estado: str = "SUCCESS",
        tokens_input: Optional[int] = None,
        tokens_output: Optional[int] = None
    ) -> AuditEvent:
        """Registra una evaluación de seguridad o filtro de moderación (Guardrail Bouncer)."""
        return self.log_tool_call(
            nombre_operacion=nombre_operacion,
            argumentos=argumentos,
            resultado_resumen=resultado_resumen,
            latencia_ms=latencia_ms,
            estado=estado,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            tipo_evento="GUARDRAIL_CHECK"
        )

    def log_rag_retrieval(
        self,
        nombre_operacion: str,
        argumentos: dict[str, Any],
        resultado_resumen: str,
        latencia_ms: float,
        estado: str = "SUCCESS",
        tokens_input: Optional[int] = None,
        tokens_output: Optional[int] = None
    ) -> AuditEvent:
        """Registra una recuperación documental en la base de conocimiento vectorial (RAG)."""
        return self.log_tool_call(
            nombre_operacion=nombre_operacion,
            argumentos=argumentos,
            resultado_resumen=resultado_resumen,
            latencia_ms=latencia_ms,
            estado=estado,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            tipo_evento="RAG_RETRIEVAL"
        )

    def log_state_mutation(
        self,
        nombre_operacion: str,
        argumentos: dict[str, Any],
        resultado_resumen: str,
        latencia_ms: float = 0.0,
        estado: str = "SUCCESS",
        tokens_input: Optional[int] = None,
        tokens_output: Optional[int] = None
    ) -> AuditEvent:
        """Registra una mutación determinista de estado del juego (sellos, fotos, reset)."""
        return self.log_tool_call(
            nombre_operacion=nombre_operacion,
            argumentos=argumentos,
            resultado_resumen=resultado_resumen,
            latencia_ms=latencia_ms,
            estado=estado,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            tipo_evento="STATE_MUTATION"
        )

    def log_agent_turn(
        self,
        nombre_operacion: str,
        argumentos: dict[str, Any],
        resultado_resumen: str,
        latencia_ms: float,
        estado: str = "SUCCESS",
        tokens_input: Optional[int] = None,
        tokens_output: Optional[int] = None
    ) -> AuditEvent:
        """Registra la ejecución y consumo de tokens de un turno agéntico completo."""
        return self.log_tool_call(
            nombre_operacion=nombre_operacion,
            argumentos=argumentos,
            resultado_resumen=resultado_resumen,
            latencia_ms=latencia_ms,
            estado=estado,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            tipo_evento="AGENT_TURN"
        )

    def get_recent_events(
        self,
        limit: int = 10,
        tipo_evento: Optional[str] = None
    ) -> list[AuditEvent]:
        """
        Recupera los últimos N eventos registrados para visualización en telemetría o tests.
        """
        if not self.log_path.exists():
            return []

        events: list[AuditEvent] = []
        try:
            with open(self.log_path, "r", encoding="utf-8") as f:
                lines = f.readlines()

            for line in reversed(lines):
                line_str = line.strip()
                if not line_str:
                    continue
                try:
                    data = json.loads(line_str)
                    ev = AuditEvent(**data)
                    if tipo_evento is None or ev.tipo_evento == tipo_evento:
                        events.append(ev)
                        if len(events) >= limit:
                            break
                except Exception:
                    continue

        except Exception as exc:
            logger.error("Error al leer eventos recientes de auditoría: %s", exc)

        return events

    def count_events(self) -> int:
        """Retorna el número total de eventos registrados en el log."""
        if not self.log_path.exists():
            return 0
        with open(self.log_path, "r", encoding="utf-8") as f:
            return sum(1 for line in f if line.strip())

    def clear(self) -> None:
        """Limpia el archivo de log (útil para tests o reset)."""
        if self.log_path.exists():
            self.log_path.unlink()

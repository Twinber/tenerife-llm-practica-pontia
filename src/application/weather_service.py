"""
Aplicación: Servicio de herramientas meteorológicas y astronómicas con observabilidad y Function Calling.
Orquesta OpenMeteoClient y AuditLogger para la ejecución segura de llamadas externas desde el LLM.
Cumple con los requisitos obligatorios de la Sesión 04 del Máster (JSON Schema, Manejo de Errores y Logging).
"""

import logging
import time
from typing import Any, Optional

from src.domain.weather_models import CalimaResponse, StarlightResponse, WeatherResponse
from src.infrastructure.audit_logger import AuditLogger
from src.infrastructure.weather_client import OpenMeteoClient

logger = logging.getLogger(__name__)


class WeatherService:
    """
    Servicio de aplicación para Function Calling meteorológico y astronómico.
    Ejecuta las herramientas solicitadas por el LLM, mide latencias,
    captura fallos con degradación suave y persiste la telemetría en disco.
    """

    def __init__(
        self,
        weather_client: Optional[OpenMeteoClient] = None,
        audit_logger: Optional[AuditLogger] = None
    ):
        self.weather_client = weather_client or OpenMeteoClient()
        self.audit_logger = audit_logger or AuditLogger()

    def get_weather(self, ubicacion: str, fecha: Optional[str] = None) -> WeatherResponse:
        """
        Herramienta obligatoria: consulta las condiciones meteorológicas actuales o previstas.
        Registra el intento en el log de auditoría con su latencia y estado.
        """
        start_time = time.perf_counter()
        args = {"ubicacion": ubicacion, "fecha": fecha}

        try:
            res = self.weather_client.get_weather(ubicacion=ubicacion, fecha=fecha)
            latency_ms = (time.perf_counter() - start_time) * 1000.0

            estado = "FALLBACK" if res.simulated else "SUCCESS"
            resumen = f"{res.ubicacion}: {res.temperatura_c}°C, {res.descripcion_clima}, viento {res.viento_kmh} km/h"

            self.audit_logger.log_tool_call(
                nombre_operacion="get_weather",
                argumentos=args,
                resultado_resumen=resumen,
                latencia_ms=latency_ms,
                estado=estado
            )
            return res

        except Exception as exc:
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            logger.error("Error inesperado en get_weather: %s", exc)
            fallback = self.weather_client._fallback_weather(ubicacion)

            self.audit_logger.log_tool_call(
                nombre_operacion="get_weather",
                argumentos=args,
                resultado_resumen=f"Error ({exc}). Activado fallback de emergencia.",
                latencia_ms=latency_ms,
                estado="ERROR"
            )
            return fallback

    def get_starlight_conditions(self, fecha: Optional[str] = None) -> StarlightResponse:
        """
        Herramienta astronómica: consulta la nubosidad en la cumbre del Teide y la fase lunar.
        """
        start_time = time.perf_counter()
        args = {"fecha": fecha}

        try:
            res = self.weather_client.get_starlight_conditions(fecha=fecha)
            latency_ms = (time.perf_counter() - start_time) * 1000.0

            estado = "FALLBACK" if res.simulated else "SUCCESS"
            resumen = f"Teide Starlight: Calidad {res.calidad_observacion}, Nubosidad {res.cobertura_nubes_pct}%, Luna {res.nombre_fase_lunar}"

            self.audit_logger.log_tool_call(
                nombre_operacion="get_starlight_conditions",
                argumentos=args,
                resultado_resumen=resumen,
                latencia_ms=latency_ms,
                estado=estado
            )
            return res

        except Exception as exc:
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            logger.error("Error inesperado en get_starlight_conditions: %s", exc)
            fallback = self.weather_client._fallback_starlight(0.0, "Luna Nueva")

            self.audit_logger.log_tool_call(
                nombre_operacion="get_starlight_conditions",
                argumentos=args,
                resultado_resumen=f"Error ({exc}). Activado fallback de emergencia.",
                latencia_ms=latency_ms,
                estado="ERROR"
            )
            return fallback

    def get_calima_alert(self, zona: str = "Sur") -> CalimaResponse:
        """
        Herramienta de calidad del aire: consulta la intrusión de polvo sahariano mineral (PM10).
        """
        start_time = time.perf_counter()
        args = {"zona": zona}

        try:
            res = self.weather_client.get_calima_alert(zona=zona)
            latency_ms = (time.perf_counter() - start_time) * 1000.0

            estado = "FALLBACK" if res.simulated else "SUCCESS"
            resumen = f"Calima {res.zona}: {res.nivel_alerta} (PM10: {res.pm10_ug_m3} µg/m³, Polvo: {res.polvo_mineral_ug_m3} µg/m³)"

            self.audit_logger.log_tool_call(
                nombre_operacion="get_calima_alert",
                argumentos=args,
                resultado_resumen=resumen,
                latencia_ms=latency_ms,
                estado=estado
            )
            return res

        except Exception as exc:
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            logger.error("Error inesperado en get_calima_alert: %s", exc)
            fallback = self.weather_client._fallback_calima(zona)

            self.audit_logger.log_tool_call(
                nombre_operacion="get_calima_alert",
                argumentos=args,
                resultado_resumen=f"Error ({exc}). Activado fallback de emergencia.",
                latencia_ms=latency_ms,
                estado="ERROR"
            )
            return fallback

    def execute_tool(self, tool_name: str, tool_args: dict[str, Any]) -> dict[str, Any]:
        """
        Despachador central para el bucle de Function Calling del LLM.
        Ejecuta la función indicada por su nombre y devuelve un diccionario serializable en JSON.
        """
        if tool_name == "get_weather":
            ubicacion = tool_args.get("ubicacion", "Puerto de la Cruz")
            fecha = tool_args.get("fecha")
            res = self.get_weather(ubicacion=ubicacion, fecha=fecha)
            return res.model_dump()

        elif tool_name == "get_starlight_conditions":
            fecha = tool_args.get("fecha")
            res = self.get_starlight_conditions(fecha=fecha)
            return res.model_dump()

        elif tool_name == "get_calima_alert":
            zona = tool_args.get("zona", "Sur")
            res = self.get_calima_alert(zona=zona)
            return res.model_dump()

        else:
            err_msg = f"Herramienta desconocida solicitada: '{tool_name}'"
            logger.warning(err_msg)
            self.audit_logger.log_tool_call(
                nombre_operacion=tool_name,
                argumentos=tool_args,
                resultado_resumen=err_msg,
                latencia_ms=0.0,
                estado="ERROR"
            )
            return {"error": err_msg}

    @staticmethod
    def get_openai_tools_definitions() -> list[dict[str, Any]]:
        """
        Genera la lista formal de herramientas con JSON Schema compatible con OpenAI API.
        """
        return [
            {
                "type": "function",
                "function": {
                    "name": "get_weather",
                    "description": (
                        "Consulta la predicción o estado meteorológico en tiempo real para cualquier enclave "
                        "de la isla de Tenerife (temperatura, lluvia, viento, humedad y sensación térmica)."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "ubicacion": {
                                "type": "string",
                                "description": (
                                    "Nombre del enclave, municipio o punto de interés en Tenerife "
                                    "(ej: 'Puerto de la Cruz', 'La Orotava', 'El Teide', 'Masca', 'El Médano')."
                                )
                            },
                            "fecha": {
                                "type": "string",
                                "description": "Fecha opcional en formato ISO (YYYY-MM-DD) o expresiones como 'hoy', 'mañana'."
                            }
                        },
                        "required": ["ubicacion"],
                        "additionalProperties": False
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_starlight_conditions",
                    "description": (
                        "Evalúa las condiciones astronómicas nocturnas en la cumbre del Parque Nacional del Teide (Izaña, 2.390 m). "
                        "Indica la nubosidad en alta montaña, la fase lunar continua (0.0=Nueva, 0.5=Llena) y la calidad para astroturismo."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "fecha": {
                                "type": "string",
                                "description": "Fecha opcional de la observación astronómica."
                            }
                        },
                        "additionalProperties": False
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_calima_alert",
                    "description": (
                        "Consulta los niveles de intrusión de polvo sahariano mineral (Calima) y concentración de partículas PM10 "
                        "en la vertiente Norte, Sur o Cumbres de Tenerife según los umbrales de alerta de AEMET."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "zona": {
                                "type": "string",
                                "enum": ["Norte", "Sur", "Cumbres"],
                                "description": "Vertiente o comarca geográfica de la isla de Tenerife."
                            }
                        },
                        "required": ["zona"],
                        "additionalProperties": False
                    }
                }
            }
        ]

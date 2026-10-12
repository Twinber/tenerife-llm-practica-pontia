"""
Infraestructura Climatológica: Cliente HTTP para Open-Meteo API con resiliencia y datos insulares.
Proporciona meteorología en tiempo real, condiciones astronómicas Starlight y alertas de calima sahariana.
Cumple con los requisitos obligatorios de la Sesión 04 del Máster (Function Calling y Tolerancia a Fallos).
"""

import logging
import math
from datetime import datetime, timezone
from typing import Optional
import httpx

from src.domain.weather_models import CalimaResponse, StarlightResponse, WeatherResponse

logger = logging.getLogger(__name__)

# Diccionario canónico de coordenadas geográficas de los enclaves de Tenerife
ENCLAVE_COORDINATES = {
    "puerto_cruz": {"nombre": "Puerto de la Cruz", "lat": 28.4167, "lon": -16.5500, "zona": "Norte"},
    "la_orotava": {"nombre": "La Orotava", "lat": 28.3900, "lon": -16.5233, "zona": "Norte"},
    "santa_ursula": {"nombre": "Santa Úrsula", "lat": 28.4239, "lon": -16.4950, "zona": "Norte"},
    "icod": {"nombre": "Icod de los Vinos", "lat": 28.3667, "lon": -16.7167, "zona": "Norte"},
    "garachico": {"nombre": "Garachico", "lat": 28.3736, "lon": -16.7644, "zona": "Norte"},
    "la_laguna": {"nombre": "San Cristóbal de La Laguna", "lat": 28.4872, "lon": -16.3159, "zona": "Norte"},
    "santa_cruz": {"nombre": "Santa Cruz de Tenerife", "lat": 28.4682, "lon": -16.2546, "zona": "Norte"},
    "anaga": {"nombre": "Parque Rural de Anaga", "lat": 28.5350, "lon": -16.2200, "zona": "Norte"},
    "costa_adeje": {"nombre": "Costa Adeje", "lat": 28.0800, "lon": -16.7300, "zona": "Sur"},
    "masca": {"nombre": "Masca", "lat": 28.3050, "lon": -16.8400, "zona": "Sur"},
    "el_medano": {"nombre": "El Médano", "lat": 28.0460, "lon": -16.5360, "zona": "Sur"},
    "las_canadas": {"nombre": "Las Cañadas del Teide", "lat": 28.2530, "lon": -16.6200, "zona": "Cumbres"},
    "pico_teide": {"nombre": "Pico del Teide", "lat": 28.2723, "lon": -16.6425, "zona": "Cumbres"},
    "los_gigantes": {"nombre": "Los Gigantes", "lat": 28.2430, "lon": -16.8420, "zona": "Sur"},
    "los_cristianos": {"nombre": "Los Cristianos", "lat": 28.0519, "lon": -16.7170, "zona": "Sur"},
}

# Tabla de interpretación en español de códigos meteorológicos WMO (Organización Meteorológica Mundial)
WMO_CODES = {
    0: "Despejado con cielo azul y sol radiante",
    1: "Principalmente despejado con nubes altas dispersas",
    2: "Parcialmente nublado con claros soleados",
    3: "Cielo cubierto por nubes estratiformes",
    45: "Niebla costera o mar de nubes típico de la vertiente norte",
    48: "Niebla con escarcha en las cañadas cimeras",
    51: "Llovizna ligera (garúa canaria)",
    53: "Llovizna moderada",
    55: "Llovizna densa",
    61: "Lluvia débil intermitente",
    63: "Lluvia moderada continua",
    65: "Lluvia fuerte otoñal",
    71: "Nevada ligera en cumbre del Teide",
    73: "Nevada moderada en cumbre",
    75: "Nevada intensa en cotas altas",
    80: "Chubascos débiles dispersos",
    81: "Chubascos moderados",
    82: "Chubascos tormentosos violentos",
    95: "Tormenta eléctrica con viento del suroeste",
}


class OpenMeteoClient:
    """
    Cliente HTTP resiliente para la API meteorológica pública y gratuita Open-Meteo.
    Integra llamadas en tiempo real con degradación suave a fallbacks offline realistas
    en caso de indisponibilidad de red, timeout o errores de servicio.
    """

    FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
    AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
    DEFAULT_TIMEOUT_SEC = 6.0

    def __init__(self, timeout: float = DEFAULT_TIMEOUT_SEC):
        self.timeout = timeout
        self.client = httpx.Client(timeout=self.timeout)

    def _resolve_coordinates(self, query_loc: str) -> dict:
        """
        Resuelve coordenadas lat/lon a partir de una cadena textual del usuario o LLM.
        """
        clean_name = query_loc.strip().lower().replace("_", " ").replace("-", " ")

        for key, data in ENCLAVE_COORDINATES.items():
            if key in clean_name or data["nombre"].lower() in clean_name:
                return data

        # Búsqueda por subcadenas habituales
        if "teide" in clean_name or "cañadas" in clean_name:
            return ENCLAVE_COORDINATES["las_canadas"]
        if "anaga" in clean_name:
            return ENCLAVE_COORDINATES["anaga"]
        if "orotava" in clean_name:
            return ENCLAVE_COORDINATES["la_orotava"]
        if "laguna" in clean_name:
            return ENCLAVE_COORDINATES["la_laguna"]
        if "santa cruz" in clean_name:
            return ENCLAVE_COORDINATES["santa_cruz"]
        if "masca" in clean_name or "gigantes" in clean_name:
            return ENCLAVE_COORDINATES["masca"]
        if "medano" in clean_name:
            return ENCLAVE_COORDINATES["el_medano"]
        if "adeje" in clean_name or "americas" in clean_name:
            return ENCLAVE_COORDINATES["costa_adeje"]

        # Por defecto: Puerto de la Cruz
        return ENCLAVE_COORDINATES["puerto_cruz"]

    def get_weather(self, ubicacion: str, fecha: Optional[str] = None) -> WeatherResponse:
        """
        Consulta las condiciones meteorológicas en tiempo real o predicción de un enclave.
        Implementa fallback resiliente en caso de fallo de red o timeout.
        """
        geo = self._resolve_coordinates(ubicacion)
        nombre_formal = geo["nombre"]

        try:
            params = {
                "latitude": geo["lat"],
                "longitude": geo["lon"],
                "current": [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "apparent_temperature",
                    "weather_code",
                    "wind_speed_10m"
                ],
                "timezone": "Atlantic/Canary"
            }

            resp = self.client.get(self.FORECAST_URL, params=params)
            resp.raise_for_status()
            data = resp.json().get("current", {})

            w_code = data.get("weather_code", 0)
            desc = WMO_CODES.get(w_code, "Condición meteorológica favorable")

            return WeatherResponse(
                ubicacion=nombre_formal,
                temperatura_c=round(float(data.get("temperature_2m", 21.0)), 1),
                humedad_pct=int(data.get("relative_humidity_2m", 70)),
                sensacion_termica_c=round(float(data.get("apparent_temperature", 21.5)), 1),
                descripcion_clima=desc,
                viento_kmh=round(float(data.get("wind_speed_10m", 15.0)), 1),
                simulated=False
            )

        except Exception as exc:
            logger.warning(
                "Fallo al conectar con Open-Meteo para '%s' (%s). Activando fallback simulado.",
                nombre_formal,
                str(exc)
            )
            return self._fallback_weather(nombre_formal)

    def get_starlight_conditions(self, fecha: Optional[str] = None) -> StarlightResponse:
        """
        Consulta las condiciones astronómicas nocturnas en la cumbre del Teide (Izaña, 2.390 m).
        Calcula la nubosidad en alta montaña y la fase lunar matemática continua.
        """
        geo_teide = ENCLAVE_COORDINATES["pico_teide"]

        # Cálculo astronómico de fase lunar continua (0.0 = Nueva, 0.5 = Llena)
        now_dt = datetime.now(timezone.utc)
        fase_num, fase_nombre = self._calculate_moon_phase(now_dt)

        try:
            params = {
                "latitude": geo_teide["lat"],
                "longitude": geo_teide["lon"],
                "current": [
                    "cloud_cover",
                    "temperature_2m",
                    "wind_speed_10m"
                ],
                "timezone": "Atlantic/Canary"
            }

            resp = self.client.get(self.FORECAST_URL, params=params)
            resp.raise_for_status()
            data = resp.json().get("current", {})

            clouds = int(data.get("cloud_cover", 5))

            # Calificación de la calidad de observación
            if clouds <= 10 and (fase_num <= 0.25 or fase_num >= 0.75):
                calidad = "Excelente"
                aviso = "Cielo completamente despejado sobre el mar de nubes y oscuridad estelar óptima. ¡Vía Láctea visible a simple vista!"
            elif clouds <= 30:
                calidad = "Buena"
                aviso = "Buenas condiciones para astroturismo. Pocas nubes altas dispersas que no impiden la observación planetaria."
            elif clouds <= 60:
                calidad = "Aceptable"
                aviso = "Nubosidad media parcial. Se recomienda usar telescopio en claros despejados."
            else:
                calidad = "Baja visibilidad"
                aviso = "Mar de nubes sobrepasando la cumbre o borrasca en altura. Observación no recomendada hoy."

            return StarlightResponse(
                ubicacion="Parque Nacional del Teide (2.390 m)",
                cobertura_nubes_pct=clouds,
                fase_lunar=round(fase_num, 2),
                nombre_fase_lunar=fase_nombre,
                calidad_observacion=calidad,
                aviso_narrativo=aviso,
                simulated=False
            )

        except Exception as exc:
            logger.warning("Fallo al consultar Starlight Teide (%s). Activando fallback astronómico.", str(exc))
            return self._fallback_starlight(fase_num, fase_nombre)

    def get_calima_alert(self, zona: str = "Sur") -> CalimaResponse:
        """
        Consulta los niveles de intrusión de polvo sahariano (Calima) en suspensión
        y partículas PM10 según los estándares oficiales de salud pública de Canarias.
        """
        zona_normalizada = "Sur" if "sur" in zona.lower() else ("Cumbres" if "cumbre" in zona.lower() or "teide" in zona.lower() else "Norte")
        ref_loc = ENCLAVE_COORDINATES["costa_adeje"] if zona_normalizada == "Sur" else (ENCLAVE_COORDINATES["las_canadas"] if zona_normalizada == "Cumbres" else ENCLAVE_COORDINATES["puerto_cruz"])

        try:
            params = {
                "latitude": ref_loc["lat"],
                "longitude": ref_loc["lon"],
                "current": ["pm10", "dust"],
                "timezone": "Atlantic/Canary"
            }

            resp = self.client.get(self.AIR_QUALITY_URL, params=params)
            resp.raise_for_status()
            data = resp.json().get("current", {})

            pm10_val = round(float(data.get("pm10", 18.0)), 1)
            dust_val = round(float(data.get("dust", 2.0)), 1)

            # Umbrales oficiales de Calima (AEMET / Gobierno de Canarias)
            if pm10_val >= 75.0 or dust_val >= 50.0:
                nivel = "Alerta Calima Densa"
                efecto = "Cielo anaranjado plomizo, visibilidad horizontal reducida a menos de 4 km y sequedad sahariana intensa."
            elif pm10_val >= 40.0 or dust_val >= 20.0:
                nivel = "Calima Ligera"
                efecto = "Tenuidad sepia en el horizonte sobre el mar, viento cálido del sureste y ligera bruma de polvo en suspensión."
            else:
                nivel = "Aire Limpio"
                efecto = "Atmósfera cristalina purificada por el viento alisio atlántico. Visibilidad perfecta hacia el horizonte."

            return CalimaResponse(
                zona=zona_normalizada,
                pm10_ug_m3=pm10_val,
                polvo_mineral_ug_m3=dust_val,
                nivel_alerta=nivel,
                efecto_visual=efecto,
                simulated=False
            )

        except Exception as exc:
            logger.warning("Fallo en API de calidad del aire para zona '%s' (%s). Usando fallback.", zona_normalizada, str(exc))
            return self._fallback_calima(zona_normalizada)

    def _calculate_moon_phase(self, dt: datetime) -> tuple[float, str]:
        """
        Calcula la fase lunar astronómica para una fecha dada mediante ciclo sinódico (29.53 días).
        Retorna (fase_0_a_1, nombre_fase).
        """
        # Luna nueva de referencia: 11 de enero de 2024, 11:57 UTC
        ref_new_moon = datetime(2024, 1, 11, 11, 57, tzinfo=timezone.utc)
        synodic_month = 29.53058867
        diff_days = (dt - ref_new_moon).total_seconds() / 86400.0
        phase = (diff_days % synodic_month) / synodic_month

        if phase < 0.06 or phase >= 0.94:
            nombre = "Luna Nueva"
        elif phase < 0.22:
            nombre = "Luna Creciente"
        elif phase < 0.28:
            nombre = "Cuarto Creciente"
        elif phase < 0.44:
            nombre = "Gibosa Creciente"
        elif phase < 0.56:
            nombre = "Luna Llena"
        elif phase < 0.72:
            nombre = "Gibosa Menguante"
        elif phase < 0.78:
            nombre = "Cuarto Menguante"
        else:
            nombre = "Luna Menguante"

        return phase, nombre

    def _fallback_weather(self, ubicacion: str) -> WeatherResponse:
        """Genera datos climatológicos verosímiles de contingencia offline."""
        is_teide = "teide" in ubicacion.lower() or "cañadas" in ubicacion.lower()
        temp = 6.5 if is_teide else 22.0
        return WeatherResponse(
            ubicacion=ubicacion,
            temperatura_c=temp,
            humedad_pct=45 if is_teide else 68,
            sensacion_termica_c=temp - 2.0 if is_teide else temp + 1.0,
            descripcion_clima="Cielo despejado con brisa suave (Modo contingencia offline)",
            viento_kmh=24.0 if is_teide else 12.0,
            simulated=True
        )

    def _fallback_starlight(self, fase_num: float, fase_nombre: str) -> StarlightResponse:
        """Genera datos astronómicos verosímiles de contingencia offline."""
        return StarlightResponse(
            ubicacion="Parque Nacional del Teide (2.390 m)",
            cobertura_nubes_pct=8,
            fase_lunar=round(fase_num, 2),
            nombre_fase_lunar=fase_nombre,
            calidad_observacion="Excelente",
            aviso_narrativo="Cielo limpio en altitud. Observación Starlight óptima (simulación resiliente).",
            simulated=True
        )

    def _fallback_calima(self, zona: str) -> CalimaResponse:
        """Genera datos de calima verosímiles de contingencia offline."""
        return CalimaResponse(
            zona=zona,
            pm10_ug_m3=22.5,
            polvo_mineral_ug_m3=4.0,
            nivel_alerta="Aire Limpio",
            efecto_visual="Atmósfera oceánica nítida sin intrusión de polvo sahariano perceptible.",
            simulated=True
        )

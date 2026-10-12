"""
Dominio Climatológico: Contratos Pydantic para Function Calling con Open-Meteo.
Cumple los requisitos obligatorios de la Sesión 04 del Máster (Function Calling)
y añade valor científico diferencial con herramientas astronómicas (Starlight) y de calima sahariana.
"""

from typing import Literal
from pydantic import BaseModel, Field


class WeatherResponse(BaseModel):
    """
    Respuesta normalizada de la herramienta obligatoria get_weather().
    Proporciona información meteorológica en tiempo real del enclave consultado.
    """
    ubicacion: str = Field(..., description="Nombre del enclave consultado (ej: Puerto de la Cruz, El Teide)")
    temperatura_c: float = Field(..., description="Temperatura ambiente actual en grados Celsius")
    humedad_pct: int = Field(..., ge=0, le=100, description="Humedad relativa del aire (%)")
    sensacion_termica_c: float = Field(..., description="Sensación térmica calculada (°C)")
    descripcion_clima: str = Field(..., description="Condición meteorológica humana (Despejado, Nublado, Lluvia...)")
    viento_kmh: float = Field(..., ge=0, description="Velocidad del viento medida a 10m de altura en km/h")
    simulated: bool = Field(default=False, description="True si se activó el fallback resiliente offline")


class StarlightResponse(BaseModel):
    """
    Respuesta de la herramienta astronómica get_starlight_conditions() para el clímax del Teide.
    Evalúa la calidad del cielo nocturno en la Reserva Starlight del Teide (2.390 m).
    """
    ubicacion: str = Field(default="Parque Nacional del Teide (2.390 m)", description="Estación de observación")
    cobertura_nubes_pct: int = Field(..., ge=0, le=100, description="Porcentaje de nubosidad en cumbre (0% = cielo raso)")
    fase_lunar: float = Field(..., ge=0.0, le=1.0, description="Fase lunar continua (0.0 = Luna Nueva / Óptimo, 0.5 = Luna Llena)")
    nombre_fase_lunar: str = Field(..., description="Nombre de la fase lunar (Luna Nueva, Creciente, Llena, Menguante)")
    calidad_observacion: Literal["Excelente", "Buena", "Aceptable", "Baja visibilidad"] = Field(
        ...,
        description="Calificación cuantitativa de la calidad del cielo nocturno para astroturismo"
    )
    aviso_narrativo: str = Field(..., description="Recomendación descriptiva para integrar en la narrativa del juego")
    simulated: bool = Field(default=False, description="True si se activó el fallback resiliente offline")


class CalimaResponse(BaseModel):
    """
    Respuesta de la herramienta de calidad del aire get_calima_alert().
    Calcula la intrusión de polvo sahariano mineral en suspensión según el estándar oficial de AEMET.
    """
    zona: str = Field(..., description="Comarca consultada: 'Norte', 'Sur' o 'Cumbres'")
    pm10_ug_m3: float = Field(..., ge=0, description="Concentración de partículas PM10 en µg/m³")
    polvo_mineral_ug_m3: float = Field(..., ge=0, description="Concentración de polvo sahariano mineral en µg/m³")
    nivel_alerta: Literal["Aire Limpio", "Calima Ligera", "Alerta Calima Densa"] = Field(
        ...,
        description="Nivel oficial de alerta por calima según umbrales de salud pública del Gobierno de Canarias"
    )
    efecto_visual: str = Field(..., description="Efecto atmosférico sugerido para la narración (calina, visibilidad reducida)")
    simulated: bool = Field(default=False, description="True si se activó el fallback resiliente offline")

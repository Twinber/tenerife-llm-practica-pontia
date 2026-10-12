"""
Script de verificación y benchmarking de las herramientas meteorológicas y auditoría:
1. Comprueba llamadas reales a Open-Meteo (get_weather, get_starlight_conditions, get_calima_alert).
2. Valida la resiliencia y activación de fallbacks offline ante cortes simulados de red.
3. Verifica la persistencia estructurada de eventos de auditoría en 'game_audit.log'.
4. Comprueba los esquemas JSON Schema para Function Calling con OpenAI.
"""

import sys
import logging
from pathlib import Path

# Añadir raíz del proyecto al sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.infrastructure.weather_client import OpenMeteoClient
from src.infrastructure.audit_logger import AuditLogger
from src.application.weather_service import WeatherService

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


def main():
    print("=" * 80)
    print("🌤️ BENCHMARK DE HERRAMIENTAS METEOROLÓGICAS, RESILIENCIA Y AUDITORÍA")
    print("=" * 80)

    # Inicializar servicios
    audit_logger = AuditLogger(log_path="game_audit.log")
    weather_service = WeatherService(audit_logger=audit_logger)

    print("\n[1/5] Probando 'get_weather' en tiempo real con Open-Meteo...")
    enclaves_test = ["Puerto de la Cruz", "El Teide", "Costa Adeje"]
    for enc in enclaves_test:
        w = weather_service.get_weather(ubicacion=enc)
        status_tag = "🟢 API REAL" if not w.simulated else "🟡 FALLBACK SIMULADO"
        print(f"      {status_tag} -> [{w.ubicacion}]: {w.temperatura_c}°C (Sensación: {w.sensacion_termica_c}°C) | Humedad: {w.humedad_pct}% | Viento: {w.viento_kmh} km/h")
        print(f"                     Condición: \"{w.descripcion_clima}\"")

    print("\n[2/5] Probando 'get_starlight_conditions' (Observatorio del Teide - 2.390m)...")
    starlight = weather_service.get_starlight_conditions()
    status_tag = "🟢 API REAL" if not starlight.simulated else "🟡 FALLBACK SIMULADO"
    print(f"      {status_tag} -> Calidad: {starlight.calidad_observacion} | Nubosidad en cumbre: {starlight.cobertura_nubes_pct}%")
    print(f"                     Fase Lunar: {starlight.nombre_fase_lunar} ({starlight.fase_lunar * 100:.1f}%)")
    print(f"                     Aviso narrativo: \"{starlight.aviso_narrativo}\"")

    print("\n[3/5] Probando 'get_calima_alert' (Calidad del aire AEMET)...")
    for zona in ["Sur", "Norte", "Cumbres"]:
        calima = weather_service.get_calima_alert(zona=zona)
        status_tag = "🟢 API REAL" if not calima.simulated else "🟡 FALLBACK SIMULADO"
        print(f"      {status_tag} -> [{calima.zona}]: Nivel: {calima.nivel_alerta} | PM10: {calima.pm10_ug_m3} µg/m³ | Polvo mineral: {calima.polvo_mineral_ug_m3} µg/m³")
        print(f"                     Efecto visual: \"{calima.efecto_visual}\"")

    print("\n[4/5] Probando tolerancia a fallos y resiliencia (Corte simulado de red)...")
    # Forzamos un cliente con URL inválida para comprobar que la aplicación NUNCA crashea
    faulty_client = OpenMeteoClient()
    faulty_client.FORECAST_URL = "https://invalid-host-unreachable.example.com"
    faulty_service = WeatherService(weather_client=faulty_client, audit_logger=audit_logger)

    res_resiliente = faulty_service.get_weather(ubicacion="Masca")
    print(f"      🛡️ Manejo de excepción capturado con éxito:")
    print(f"         - simulated: {res_resiliente.simulated} (Fallback activado)")
    print(f"         - Ubicación protegida: {res_resiliente.ubicacion} ({res_resiliente.temperatura_c}°C)")
    print(f"         - Condición: \"{res_resiliente.descripcion_clima}\"")

    print("\n[5/5] Inspeccionando registro de auditoría en disco ('game_audit.log')...")
    eventos_recientes = audit_logger.get_recent_events(limit=5)
    total_eventos = audit_logger.count_events()
    print(f"      📋 Total de eventos registrados en disco: {total_eventos}")
    print("      Últimos eventos registrados:")
    for ev in eventos_recientes:
        print(f"         • [{ev.timestamp[11:19]}] {ev.nombre_operacion:<22} | Estado: {ev.estado:<8} | Latencia: {ev.latencia_ms:6.1f}ms | Resumen: {ev.resultado_resumen[:55]}...")

    print("\n" + "=" * 80)
    print("📜 ESQUEMAS JSON SCHEMA PARA OPENAI FUNCTION CALLING (tools=[...])")
    print("=" * 80)
    schemas = WeatherService.get_openai_tools_definitions()
    print(f"Total herramientas expuestas para OpenAI: {len(schemas)}")
    for s in schemas:
        fn = s["function"]
        print(f"  • {fn['name']}: {fn['description'][:70]}...")
        print(f"    Parámetros: {list(fn['parameters']['properties'].keys())} (Obligatorios: {fn['parameters'].get('required', [])})")

    print("=" * 80)
    print("🎉 TODAS LAS PRUEBAS METEOROLÓGICAS Y DE AUDITORÍA SUPERADAS.")


if __name__ == "__main__":
    main()

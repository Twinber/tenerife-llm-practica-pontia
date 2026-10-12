"""
Infraestructura: Configuración centralizada de variables de entorno con Pydantic Settings.
Garantiza que todas las claves API, rutas y parámetros de los modelos se carguen de forma tipada y segura.
"""

from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Configuración inmutable de la aplicación.
    Carga automáticamente las variables definidas en el archivo .env.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Proveedor de Inteligencia Artificial (OpenAI)
    OPENAI_API_KEY: str = Field(
        default="",
        description="Clave de API de OpenAI para el modelo de lenguaje y embeddings"
    )
    OPENAI_MODEL_MAIN: str = Field(
        default="gpt-4o-mini",
        description="Modelo principal para el Narrador, NPCs y Function Calling"
    )
    OPENAI_MODEL_FAST: str = Field(
        default="gpt-4o-mini",
        description="Modelo rápido y ligero para guardrails y verificación"
    )
    OPENAI_EMBEDDING_MODEL: str = Field(
        default="text-embedding-3-small",
        description="Modelo de embeddings semánticos densos (1536 dimensiones)"
    )

    # Hiperparámetros de generación (expuestos para cumplimiento del 30% RAG)
    TEMPERATURE: float = Field(
        default=0.7,
        ge=0.0,
        le=2.0,
        description="Temperatura de muestreo para balancear creatividad y fidelidad fáctica"
    )
    TOP_P: float = Field(
        default=0.95,
        ge=0.0,
        le=1.0,
        description="Parámetro de corte Nucleus Sampling (Top-p)"
    )
    MAX_TOKENS: int = Field(
        default=600,
        ge=50,
        le=2000,
        description="Límite máximo de tokens generados en la respuesta por turno"
    )

    # Rutas de almacenamiento y persistencia
    CHROMA_PERSIST_DIRECTORY: str = Field(
        default="./chroma_db",
        description="Directorio de persistencia local de la base de datos vectorial Chroma"
    )
    GAME_AUDIT_LOG_PATH: str = Field(
        default="./game_audit.log",
        description="Ruta del archivo de registro estructurado de auditoría en disco"
    )
    ASSETS_DIR: str = Field(
        default="./assets",
        description="Directorio de recursos multimedia estáticos (imágenes, sprites, audios)"
    )
    DATA_PDF_PATH: str = Field(
        default="./data/TENERIFE.pdf",
        description="Ruta de la guía oficial de Tenerife utilizada como base de conocimiento RAG"
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Retorna la instancia singleton de la configuración del sistema.
    Utiliza lru_cache para evitar lecturas redundantes del archivo .env en cada llamada.
    """
    return Settings()

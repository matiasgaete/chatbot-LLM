"""Módulo de configuración y cliente para la integración con Groq."""

from pathlib import Path

from openai import OpenAI
from pydantic_settings import BaseSettings, SettingsConfigDict

# Ruta absoluta al archivo de entorno (.env) ubicado en el mismo directorio
ENV_FILE = Path(__file__).resolve().parent / ".env"


class Settings(BaseSettings):
    """Configuración de variables de entorno utilizando Pydantic."""

    GROQ_KEY: str
    model_config = SettingsConfigDict(env_file=ENV_FILE, end_file_encoding="uft-8")


# Instancia de configuración cargada desde el entorno
setting = Settings()

# Carga del prompt del sistema desde el archivo de texto
with open("chatbot/prompt.txt", "r", encoding="utf-8") as f:
    kb = f.read()

# Inicialización del cliente de OpenAI configurado para la API de Groq
cliente = OpenAI(
    api_key=setting.GROQ_KEY,
    base_url="https://api.groq.com/openai/v1",
)

# Estructura inicial del contexto de mensajes con el rol de sistema
sistema = f"{kb}"
context = [{"role": "system", "content": sistema}]

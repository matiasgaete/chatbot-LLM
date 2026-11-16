from openai import OpenAI
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

ENV_FILE = Path(__file__).resolve().parent / ".env" 

class Settings(BaseSettings):
    GROQ_KEY: str
    GEMINI_KEY: str
    model_config = SettingsConfigDict(env_file=ENV_FILE, end_file_encoding="uft-8")

setting = Settings()

with open("chatbot/prompt2.txt", "r", encoding="utf-8") as f:
    KB = f.read()

cliente = OpenAI(
    api_key=setting.GROQ_KEY,
    base_url="https://api.groq.com/openai/v1",
)

sistema = f"{KB}"
context = [{"role": "system", "content": sistema}]
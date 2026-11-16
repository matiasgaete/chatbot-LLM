"""Router de FastAPI para la gestión de las interacciones del chatbot."""

from fastapi import APIRouter
from pydantic import BaseModel

from config import *

# Inicialización del router con el prefijo /chatbot
router = APIRouter(prefix="/chatbot")


class PeticionDTO(BaseModel):
    """Modelo de transferencia de datos para la pregunta del usuario."""

    pregunta: str


@router.post("/refresh")
def refresh() -> None:
    """Reinicia el contexto de la conversación al estado inicial del sistema."""
    global context
    context = [{"role": "system", "content": sistema}]


@router.post("/responder")
def responder(peticion: PeticionDTO) -> dict:
    """Procesa la pregunta del usuario, consulta a la API de Groq y retorna la respuesta generada."""
    context.append({"role": "user", "content": f"{peticion.pregunta}"})

    stream = cliente.chat.completions.create(
        model="openai/gpt-oss-120b",
        temperature=2.0,
        stream=True,
        messages=context,
    )

    cadena = ""
    for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            cadena = cadena + chunk.choices[0].delta.content

    return {"respuesta": cadena}

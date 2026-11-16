from config import *
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/chatbot")

class peticionDTO(BaseModel):
    pregunta: str

@router.post("/refresh")
def refresh():
    global context
    context = [{"role": "system", "content": sistema}]

@router.post("/responder")
def responder(peticion: peticionDTO):
    context.append({"role": "user", "content": f"{peticion.pregunta}"})
    stream = cliente.chat.completions.create(
        model="openai/gpt-oss-120b", 
        temperature=2.0,
        stream=True,
        messages=context
    )
    
    cadena = ""
    for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            cadena = cadena + chunk.choices[0].delta.content
    return {"respuesta": cadena}

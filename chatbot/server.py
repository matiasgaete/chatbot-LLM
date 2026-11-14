"""API HTTP del chatbot.

Ejecutar desde la raíz del repositorio:

    uvicorn chatbot.server:app --reload --port 8000

Si faltan `openai`, `pyswip` o SWI-Prolog, el servidor arranca igual y
`/api/chat` responde 503 para que la interfaz use su modo local de respaldo.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .pipeline import (
    KB_PATH,
    MissingDependency,
    PipelineError,
    dependencias,
    modelo_actual,
    responder,
)

try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent / ".env")
except ImportError:
    # python-dotenv es opcional: también se puede exportar la variable a mano.
    pass

LOGGER = logging.getLogger("chatbot")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "info").upper())

BASE_DIR = Path(__file__).resolve().parent
DIST_DIR = BASE_DIR.parent / "frontend" / "dist"

ORIGENES = [
    origen.strip()
    for origen in os.getenv(
        "CHATBOT_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:4173,http://127.0.0.1:4173",
    ).split(",")
    if origen.strip()
]

app = FastAPI(
    title="Chatbot LLM",
    description="API del chatbot de idiomas con trazabilidad Groq + SWI-Prolog.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGENES,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class MensajeHistorial(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[MensajeHistorial] = Field(default_factory=list, max_length=20)


@app.get("/api/health")
def health() -> dict:
    estado = dependencias()
    listo = all(estado.values())

    return {
        "status": "ok" if listo else "degraded",
        "ready": listo,
        "model": modelo_actual(),
        "dependencies": estado,
        "kb": KB_PATH.name,
    }


@app.post("/api/chat")
def chat(peticion: ChatRequest) -> dict:
    historial = [mensaje.model_dump() for mensaje in peticion.history]

    try:
        return responder(peticion.message, historial)
    except MissingDependency as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except PipelineError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    except Exception as error:  # noqa: BLE001 - se registra sin filtrar detalles
        LOGGER.exception("Error inesperado en /api/chat")
        raise HTTPException(
            status_code=500,
            detail="Error inesperado del pipeline. Revisa los logs del servidor.",
        ) from error


if DIST_DIR.is_dir():
    assets = DIST_DIR / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    @app.get("/{ruta:path}", include_in_schema=False)
    def frontend(ruta: str):
        if ruta.startswith("api/"):
            raise HTTPException(status_code=404, detail="Ruta no encontrada")

        candidato = (DIST_DIR / ruta).resolve()
        try:
            candidato.relative_to(DIST_DIR.resolve())
        except ValueError:
            raise HTTPException(status_code=404, detail="Ruta no encontrada")

        if candidato.is_file():
            return FileResponse(candidato)

        return FileResponse(DIST_DIR / "index.html")

else:

    @app.get("/", include_in_schema=False)
    def raiz() -> dict:
        return {
            "name": "Chatbot LLM",
            "docs": "/docs",
            "health": "/api/health",
            "chat": "/api/chat",
            "frontend": "compila frontend/ con `pnpm build` para servirla aquí",
        }

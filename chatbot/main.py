"""Aplicación principal de FastAPI para el backend del chat."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from motor_chat import router

# Inicialización de la aplicación FastAPI
app = FastAPI()

# Registro de las rutas provenientes del router de chat
app.include_router(router)

# Configuración del middleware de CORS para permitir peticiones desde el frontend en desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

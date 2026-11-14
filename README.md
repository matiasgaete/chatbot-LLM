# Chatbot LLM

Chatbot de idiomas del mundo con dos piezas:

- **`frontend/`**: interfaz estilo WhatsApp (React + Vite).
- **`chatbot/`**: pipeline real con Groq + SWI-Prolog y una API FastAPI.

La base de conocimiento (`chatbot/base_conocimiento.pl`) contiene familias,
macrofamilias, países, dialectos y lenguas de origen. El modelo traduce la
pregunta a una consulta Prolog, el servidor la valida contra una lista blanca
de predicados, SWI-Prolog la ejecuta y el modelo redacta la respuesta final.

## Inicio rápido (solo interfaz, modo demo)

```bash
cd frontend
pnpm install
pnpm dev
```

Abre `http://localhost:5173`. Sin backend, la interfaz responde localmente con
datos equivalentes. No necesita
clave ni conexión.

## Backend real

### Requisitos

- Python 3.10 o superior.
- SWI-Prolog instalado y disponible como `swipl`.
- Una clave de Groq (https://console.groq.com/keys).

macOS:

```bash
brew install swi-prolog
```

### Instalación

Desde la raíz del repositorio:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r chatbot/requirements.txt

cp chatbot/.env.example chatbot/.env
# edita chatbot/.env y define GROQ_API_KEY
```

### Arrancar la API

```bash
source .venv/bin/activate
uvicorn chatbot.server:app --reload --port 8000
```

Comprueba el estado:

```bash
curl http://127.0.0.1:8000/api/health
curl -X POST http://127.0.0.1:8000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"¿De dónde proviene el inglés?","history":[]}'
```

Documentación interactiva: `http://127.0.0.1:8000/docs`.

### Conectar la interfaz

En otra terminal:

```bash
cd frontend
cp .env.example .env.local   # VITE_CHAT_API_URL=/api/chat
pnpm dev
```

Vite reenvía `/api` al puerto `8000`. Si el backend falla o falta alguna
dependencia, la interfaz lo avisa y usa el modo local de respaldo.

### Servir la interfaz compilada

```bash
cd frontend
VITE_CHAT_API_URL=/api/chat pnpm build
cd ..
uvicorn chatbot.server:app --port 8000
```

El servidor detecta `frontend/dist` y sirve la interfaz en
`http://127.0.0.1:8000/`.

## Trazabilidad

La API devuelve metadatos de trazabilidad de cada respuesta (interpretación,
consulta Prolog, resultado y redacción), pero la interfaz no los muestra.

## Seguridad

- La clave de Groq se lee de `GROQ_API_KEY` (o de `chatbot/.env`, ignorado por
  Git). Nunca se envía al navegador.
- La API no ejecuta la consulta que propone el modelo sin validarla: solo acepta
  los predicados del dominio y argumentos con formato de átomo o variable.
- **Importante:** las claves que estaban escritas en `chatbot/grok.py` y
  `chatbot/grok_pl.py` quedaron expuestas en el historial de Git. Revócalas en
  la consola de Groq y genera una nueva. No las reutilices.
- `chatbot/clave.txt` sigue versionado con una clave antigua. Elimínalo del
  repositorio (y del historial si es posible) y rota esa clave.

# Chatbot LLM · Interfaz de chat

Interfaz web con apariencia de WhatsApp para el proyecto **Chatbot LLM** de
idiomas. Incluye un chat a pantalla completa, burbujas, emojis y adjuntos.

## Ejecutar

```bash
cd frontend
pnpm install   # también funciona: npm install
pnpm dev       # también funciona: npm run dev
```

Abre `http://localhost:5173`. Sin configuración adicional funciona el **modo
demo**, que responde en el navegador con los datos locales.

Otros comandos:

```bash
pnpm build    # compila para producción en dist/
pnpm preview  # sirve la versión compilada
pnpm lint     # revisa el código con ESLint
```

## Conectar el backend real

El backend está en `../chatbot/` y usa Groq + SWI-Prolog. Sigue los pasos del
[README principal](../README.md) para instalarlo y arrancarlo en el puerto
`8000`.

Después crea `frontend/.env.local`:

```bash
VITE_CHAT_API_URL=/api/chat
```

Vite reenvía `/api` a `http://127.0.0.1:8000` (ver `vite.config.js`). Reinicia
`pnpm dev` para que tome la variable.

También puedes apuntar directo al servidor sin proxy:

```bash
VITE_CHAT_API_URL=http://localhost:8000/api/chat
```

Si el backend no está disponible, la interfaz avisa y responde con la base
local de respaldo para no cortar la conversación.

## Interfaz

- La conversación se muestra con burbujas estilo WhatsApp.
- El menú de la cabecera permite descargar la conversación o vaciarla.
- No se muestran preguntas sugeridas ni el rastro interno de las respuestas.

## Contrato de la API

La interfaz hace `POST /api/chat`:

```json
{
  "message": "¿De dónde proviene el inglés?",
  "history": [
    { "role": "user", "content": "¿Qué se habla en Chile?" },
    { "role": "assistant", "content": "En Chile se habla español." }
  ]
}
```

La respuesta esperada:

```json
{
  "reply": "El inglés proviene del protogermánico.",
  "trace": {
    "mode": "api",
    "model": "openai/gpt-oss-120b",
    "durationMs": 1200,
    "steps": [
      {
        "id": "analisis",
        "kind": "analysis",
        "title": "Interpretación de la pregunta",
        "summary": "Se tradujo la pregunta al dominio de idiomas.",
        "durationMs": 600
      },
      {
        "id": "consulta",
        "kind": "query",
        "title": "Traducción a Prolog",
        "summary": "Consulta validada.",
        "code": "proviene(ingles, X).",
        "durationMs": 1
      },
      {
        "id": "resultado",
        "kind": "result",
        "title": "Consulta en la base",
        "summary": "1 solución",
        "code": "X = protogermanico.",
        "rows": ["X = protogermanico"],
        "durationMs": 4
      },
      {
        "id": "respuesta",
        "kind": "answer",
        "title": "Respuesta en lenguaje natural",
        "summary": "El inglés proviene del protogermánico.",
        "durationMs": 500
      }
    ]
  }
}
```

También se aceptan respuestas antiguas con solo `reply`; los campos de traza
se ignoran en la interfaz.

## Estructura

```text
frontend/
├── src/
│   ├── App.jsx                  interfaz y estado de la conversación
│   ├── App.css                  estilos estilo WhatsApp
│   ├── index.css                estilos base
│   ├── components/
│   │   ├── BotAvatar.jsx        avatar del chatbot
│   │   ├── FormattedText.jsx    formato *negrita*, _cursiva_, `código`
│   │   └── Icons.jsx            iconos SVG
│   ├── lib/
│   │   ├── api.js               API real, demo y respaldo local
│   │   ├── chatbot.js           respuestas locales y análisis de entidades
│   │   └── knowledge.js         idiomas, familias, países y dialectos
│   └── assets/
│       └── chat-pattern.svg     fondo de la conversación
└── ...
```

## Seguridad

No guardes claves de API en el repositorio. Usa `chatbot/.env` (ignorado por
Git) y rota cualquier clave que ya haya quedado expuesta en el historial. Las
claves que estaban escritas en `chatbot/grok.py`, `chatbot/grok_pl.py` y
`chatbot/clave.txt` deben revocarse en la consola de Groq.

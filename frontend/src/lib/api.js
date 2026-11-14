import { responderLocal } from './chatbot'

const API_URL = import.meta.env.VITE_CHAT_API_URL?.trim()

export const modoApi = Boolean(API_URL)

export { responderLocal }

function ahora() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

function duracionDesde(inicio) {
  return Math.max(1, Math.round(ahora() - inicio))
}

/**
 * Obtiene una respuesta del backend o, si no hay API configurada, del motor
 * local. Devuelve `{ text, meta }`; la traza interna no se muestra en la
 * interfaz.
 */
export async function obtenerRespuesta(mensaje, historial = []) {
  const inicio = ahora()

  if (!API_URL) {
    const text = responderLocal(mensaje)
    return {
      text,
      meta: { mode: 'demo', durationMs: duracionDesde(inicio) },
    }
  }

  try {
    const respuesta = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: mensaje, history: historial }),
    })

    if (!respuesta.ok) {
      let detalle = ''
      try {
        const error = await respuesta.json()
        detalle = error.detail ?? error.message ?? ''
      } catch {
        // La respuesta de error no era JSON; se conserva solo el estado.
      }

      throw new Error(
        `La API respondió con estado ${respuesta.status}${
          detalle ? `: ${detalle}` : ''
        }`,
      )
    }

    const datos = await respuesta.json()
    const texto = datos.reply ?? datos.respuesta ?? datos.message

    if (typeof texto !== 'string' || !texto.trim()) {
      throw new Error('La API no devolvió una respuesta válida')
    }

    return {
      text: texto.trim(),
      meta: {
        mode: 'api',
        model: datos.model ?? datos.meta?.model,
        durationMs: duracionDesde(inicio),
        usage: datos.usage ?? datos.meta?.usage ?? null,
      },
    }
  } catch (error) {
    console.error('No se pudo consultar la API del chatbot:', error)

    const text = responderLocal(mensaje)
    return {
      text,
      meta: {
        mode: 'fallback',
        error: error.message,
        durationMs: duracionDesde(inicio),
      },
    }
  }
}

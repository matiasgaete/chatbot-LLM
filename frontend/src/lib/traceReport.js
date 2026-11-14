import {
  agruparTurnos,
  etiquetaModo,
  formatearDuracion,
  resumirTurnos,
} from './trace'

const formatoHora = new Intl.DateTimeFormat('es', {
  hour: '2-digit',
  minute: '2-digit',
})

const formatoFecha = new Intl.DateTimeFormat('es', {
  dateStyle: 'long',
  timeStyle: 'short',
})

function textoPaso(paso, indice) {
  const lineas = [
    `${indice + 1}. ${paso.title}${
      Number.isFinite(paso.durationMs)
        ? ` (${formatearDuracion(paso.durationMs)})`
        : ''
    }`,
  ]

  if (paso.summary) {
    lineas.push(`   ${String(paso.summary).replace(/\n/g, '\n   ')}`)
  }

  if (paso.code) {
    lineas.push(`   ${String(paso.code).replace(/\n/g, '\n   ')}`)
  }

  if (paso.rows?.length) {
    lineas.push(
      `   ${paso.rows
        .map((fila) => `${fila.variable ?? '?'} = ${fila.valor ?? fila}`)
        .join(' ; ')}`,
    )
  }

  if (paso.facts?.length) {
    lineas.push(`   Hechos: ${paso.facts.join(', ')}`)
  }

  if (paso.detail) {
    lineas.push(`   ${String(paso.detail).replace(/\n/g, '\n   ')}`)
  }

  return lineas.join('\n')
}

export function crearReporteRastro(mensajes) {
  const turnos = agruparTurnos(mensajes)
  const resumen = resumirTurnos(turnos)
  const modos = [...resumen.modos].map(etiquetaModo).join(', ') || 'Sin rastro'

  const lineas = [
    'CHATBOT LLM — RASTRO DE LA CONVERSACIÓN',
    formatoFecha.format(new Date()),
    '',
    `Turnos con rastro: ${resumen.turnos}`,
    `Pasos registrados: ${resumen.pasos}`,
    `Duración acumulada: ${formatearDuracion(resumen.duracion)}`,
    `Modo: ${modos}`,
    '',
  ]

  turnos.forEach((turno, indice) => {
    const trace = turno.respuesta.trace

    lineas.push(`===== TURNO ${indice + 1} =====`)
    lineas.push(
      `Hora: ${formatoHora.format(new Date(turno.respuesta.at))}`,
    )
    lineas.push(
      `Pregunta: ${turno.pregunta?.text ?? '(no disponible)'}`,
    )
    lineas.push(
      `Modo: ${etiquetaModo(trace.mode)}${
        trace.model ? ` · ${trace.model}` : ''
      }`,
    )
    lineas.push(
      `Duración: ${formatearDuracion(
        trace.durationMs ??
          trace.steps.reduce(
            (total, paso) => total + (paso.durationMs ?? 0),
            0,
          ),
      )}`,
    )
    lineas.push('')

    trace.steps.forEach((paso, numero) => {
      lineas.push(textoPaso(paso, numero))
      lineas.push('')
    })

    lineas.push(`Respuesta: ${turno.respuesta.text}`)
    lineas.push('')
  })

  return `${lineas.join('\n')}\n`
}

export function descargarReporteRastro(mensajes) {
  const contenido = crearReporteRastro(mensajes)
  const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')

  enlace.href = url
  enlace.download = `rastro-chatbot-llm-${new Date()
    .toISOString()
    .slice(0, 10)}.txt`
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

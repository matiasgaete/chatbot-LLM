import { useEffect, useRef } from 'react'
import { Icon } from './Icons'
import TraceTimeline from './TraceTimeline'
import {
  agruparTurnos,
  claseModo,
  etiquetaModo,
  formatearDuracion,
  resumirTurnos,
} from '../lib/trace'
import { descargarReporteRastro } from '../lib/traceReport'

const formatoHora = new Intl.DateTimeFormat('es', {
  hour: '2-digit',
  minute: '2-digit',
})

function notaDelPanel(modos) {
  if (modos.has('fallback')) {
    return 'Algún turno no pudo conectar con la API y se respondió con la traza local de respaldo.'
  }
  if (modos.has('api')) {
    return 'Traza real: el modelo genera la consulta Prolog y SWI-Prolog la ejecuta sobre base_conocimiento.pl.'
  }
  return 'Traza demo: se calcula localmente a partir de base_conocimiento.pl, sin enviar datos a ningún servidor.'
}

export default function TracePanel({ mensajes, alCerrar }) {
  const cerrarRef = useRef(null)
  const turnos = agruparTurnos(mensajes)
  const resumen = resumirTurnos(turnos)
  const modos = resumen.modos
  const modoPrincipal =
    modos.size === 1 ? etiquetaModo([...modos][0]) : modos.size ? 'Mixto' : 'Sin rastro'

  useEffect(() => {
    cerrarRef.current?.focus()
  }, [])

  return (
    <>
      <div
        className="trace-scrim"
        onClick={alCerrar}
        aria-hidden="true"
      />

      <aside
        className="trace-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trace-panel-titulo"
      >
        <header className="trace-panel-header">
          <div className="trace-panel-title">
            <h2 id="trace-panel-titulo">Rastro de la conversación</h2>
            <p>
              {turnos.length} respuesta{turnos.length === 1 ? '' : 's'} ·{' '}
              {modoPrincipal}
            </p>
          </div>
          <button
            ref={cerrarRef}
            type="button"
            className="icon-button"
            onClick={alCerrar}
            aria-label="Cerrar rastro de la conversación"
          >
            <Icon name="close" />
          </button>
        </header>

        <div className="trace-panel-body">
          <div className="trace-summary-card">
            <div className="trace-summary-stat">
              <strong>{resumen.turnos}</strong>
              <span>turnos</span>
            </div>
            <div className="trace-summary-stat">
              <strong>{resumen.pasos}</strong>
              <span>pasos</span>
            </div>
            <div className="trace-summary-stat">
              <strong>
                {resumen.turnos ? formatearDuracion(resumen.duracion) : '—'}
              </strong>
              <span>tiempo</span>
            </div>
          </div>

          <div className="trace-pipeline" aria-label="Flujo del rastro">
            <span>Pregunta</span>
            <i>→</i>
            <b>Prolog</b>
            <i>→</i>
            <b>Base</b>
            <i>→</i>
            <b>Respuesta</b>
          </div>

          {turnos.length === 0 ? (
            <div className="trace-empty">
              <strong>Todavía no hay rastro</strong>
              Envía una pregunta y toca «Rastro» debajo de una respuesta para
              ver la consulta, el resultado y la redacción final.
            </div>
          ) : (
            turnos.map((turno, indice) => {
              const trace = turno.respuesta.trace

              return (
                <section
                  className="trace-turn"
                  key={turno.respuesta.id}
                  aria-label={`Turno ${indice + 1}`}
                >
                  <header className="trace-turn-head">
                    <div className="trace-turn-top">
                      <span className="trace-turn-index">
                        Turno {indice + 1}
                      </span>
                      <span className="trace-turn-time">
                        {formatoHora.format(
                          new Date(turno.respuesta.at),
                        )}
                      </span>
                    </div>
                    <div className="trace-turn-question-row">
                      <p className="trace-turn-question">
                        {turno.pregunta?.text ?? 'Pregunta no disponible'}
                      </p>
                      <span
                        className={`trace-mode-badge ${claseModo(
                          trace.mode,
                        )}`}
                      >
                        {etiquetaModo(trace.mode)}
                      </span>
                    </div>
                  </header>

                  <TraceTimeline trace={trace} compact />
                </section>
              )
            })
          )}
        </div>

        <footer className="trace-panel-footer">
          <p>{notaDelPanel(modos)}</p>
          <button
            type="button"
            className="button-secondary"
            onClick={() => descargarReporteRastro(mensajes)}
            disabled={turnos.length === 0}
          >
            <Icon name="download" size={16} />
            Descargar rastro (.txt)
          </button>
        </footer>
      </aside>
    </>
  )
}

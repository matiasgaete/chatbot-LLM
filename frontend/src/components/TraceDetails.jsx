import { useId } from 'react'
import { Icon } from './Icons'
import TraceTimeline from './TraceTimeline'
import {
  claseModo,
  etiquetaModo,
  formatearDuracion,
} from '../lib/trace'

export default function TraceDetails({
  trace,
  abierto,
  alAlternar,
  alAbrirPanel,
}) {
  const id = useId().replace(/:/g, '')

  if (!trace?.steps?.length) return null

  const duracion =
    trace.durationMs ??
    trace.steps.reduce((total, paso) => total + (paso.durationMs ?? 0), 0)

  return (
    <div className="trace-wrap">
      <button
        type="button"
        className={`trace-toggle ${abierto ? 'open' : ''}`}
        onClick={alAlternar}
        aria-expanded={abierto}
        aria-controls={`trace-${id}`}
        title="Ver cómo se obtuvo esta respuesta"
      >
        <span className="trace-toggle-icon" aria-hidden="true">
          <Icon name="trace" size={14} />
        </span>
        <span className="trace-toggle-label">Rastro</span>
        <span className="trace-toggle-meta">
          {trace.steps.length} pasos · {formatearDuracion(duracion)}
        </span>
        <Icon name="chevron-down" size={14} className="trace-chevron" />
      </button>

      {abierto && (
        <div className="trace-card" id={`trace-${id}`}>
          <div className="trace-card-head">
            <div className="trace-card-heading">
              <span>Cómo se obtuvo esta respuesta</span>
              <span className={`trace-mode-badge ${claseModo(trace.mode)}`}>
                {etiquetaModo(trace.mode)}
              </span>
            </div>

            {alAbrirPanel && (
              <button
                type="button"
                className="trace-panel-link"
                onClick={alAbrirPanel}
              >
                Ver todo
              </button>
            )}
          </div>

          <TraceTimeline trace={trace} compact />

          {trace.nota && (
            <div className="trace-note">
              <Icon name="info" size={13} />
              <span>{trace.nota}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

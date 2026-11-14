import FormattedText from './FormattedText'
import { Icon } from './Icons'
import { formatearDuracion } from '../lib/trace'

const ICONOS = {
  analysis: 'search',
  query: 'terminal',
  result: 'database',
  answer: 'sparkles',
  error: 'info',
}

function textoFila(fila) {
  if (fila && typeof fila === 'object') {
    if (fila.variable) return `${fila.variable} = ${fila.valor}`
    if (fila.valor) return String(fila.valor)
  }

  return String(fila ?? '')
}

export default function TraceTimeline({ trace, compact = false }) {
  const pasos = trace?.steps ?? []

  if (pasos.length === 0) return null

  return (
    <ol
      className={`trace-steps ${compact ? 'trace-steps--compact' : ''}`}
      aria-label="Pasos del rastro"
    >
      {pasos.map((paso, indice) => {
        const kind = paso.kind ?? 'analysis'
        const code = paso.code?.trim()

        return (
          <li
            key={paso.id ?? `${kind}-${indice}`}
            className={`trace-step trace-step--${kind}`}
          >
            <span className="trace-marker" aria-hidden="true">
              <Icon name={ICONOS[kind] ?? 'info'} size={12} />
            </span>

            <div className="trace-step-body">
              <div className="trace-step-head">
                <span className="trace-step-title">{paso.title}</span>
                {Number.isFinite(paso.durationMs) && (
                  <span className="trace-time">
                    {formatearDuracion(paso.durationMs)}
                  </span>
                )}
              </div>

              {paso.summary && (
                <p
                  className={`trace-summary ${
                    kind === 'result' && !code ? 'mono' : ''
                  }`}
                >
                  {kind === 'error' ? (
                    paso.summary
                  ) : (
                    <FormattedText text={paso.summary} />
                  )}
                </p>
              )}

              {code && (
                <pre className="trace-code">
                  <code>{code}</code>
                </pre>
              )}

              {paso.rows?.length > 0 && (
                <div className="trace-rows">
                  {paso.rows.map((fila, numero) => (
                    <span
                      key={`${paso.id ?? indice}-fila-${numero}`}
                      className="trace-row-pill"
                    >
                      {textoFila(fila)}
                    </span>
                  ))}
                </div>
              )}

              {paso.chips?.length > 0 && (
                <div className="trace-chips">
                  {paso.chips.map((chip, numero) => (
                    <span
                      key={`${paso.id ?? indice}-chip-${numero}`}
                      className="trace-chip"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}

              {paso.facts?.length > 0 && (
                <div className="trace-facts">
                  <span className="trace-facts-label">Hechos usados</span>
                  {paso.facts.map((hecho, numero) => (
                    <code key={`${paso.id ?? indice}-hecho-${numero}`}>
                      {hecho}
                    </code>
                  ))}
                </div>
              )}

              {paso.detail && <p className="trace-detail">{paso.detail}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

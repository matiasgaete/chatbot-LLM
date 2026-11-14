import { useEffect, useRef, useState } from 'react'
import './App.css'
import BotAvatar from './components/BotAvatar'
import FormattedText from './components/FormattedText'
import { Icon } from './components/Icons'
import { modoApi, obtenerRespuesta } from './lib/api'
import { ESTADISTICAS } from './lib/knowledge'

const formatoHora = new Intl.DateTimeFormat('es', {
  hour: '2-digit',
  minute: '2-digit',
})

function crearId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function crearMensaje(role, text, at = Date.now(), extra = {}) {
  return { id: crearId(), role, kind: 'text', text, at, ...extra }
}

function crearConversacionInicial(soloSaludo = false) {
  const ahora = Date.now()

  if (soloSaludo) {
    return [
      crearMensaje(
        'bot',
        '¡Listo! Conversación reiniciada. 🔄 ¿Qué idioma o país quieres consultar?',
        ahora,
      ),
    ]
  }

  return [
    crearMensaje(
      'bot',
      '¡Hola! 👋 Soy el asistente del proyecto *Chatbot LLM*.',
      ahora - 60_000,
    ),
    crearMensaje(
      'bot',
      'Puedo responder sobre idiomas, familias lingüísticas, países y dialectos a partir de la base de conocimiento. Escribe tu pregunta abajo. 👇',
      ahora - 30_000,
    ),
  ]
}

function formatearTamano(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function liberarArchivos(mensajes) {
  for (const mensaje of mensajes) {
    if (mensaje.file?.url) URL.revokeObjectURL(mensaje.file.url)
  }
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function Mensaje({ mensaje, inicioGrupo }) {
  const esMio = mensaje.role === 'user'
  const esMedia = mensaje.kind === 'image' || mensaje.kind === 'file'

  return (
    <div className={`message-row ${esMio ? 'out' : 'in'}`}>
      <div className="message-stack">
        <div
          className={`bubble ${inicioGrupo ? 'bubble--tail' : ''} ${
            esMedia ? 'bubble--media' : ''
          }`}
        >
          {mensaje.kind === 'image' ? (
            <div className="media-content">
              <img src={mensaje.file.url} alt={mensaje.file.name} />
              <a
                className="media-download"
                href={mensaje.file.url}
                download={mensaje.file.name}
                aria-label={`Descargar ${mensaje.file.name}`}
              >
                <Icon name="download" size={16} />
              </a>
            </div>
          ) : mensaje.kind === 'file' ? (
            <a
              className="file-card"
              href={mensaje.file.url}
              download={mensaje.file.name}
            >
              <span className="file-icon">
                <Icon name="document" size={22} />
              </span>
              <span className="file-info">
                <span className="file-name">{mensaje.file.name}</span>
                <span className="file-size">
                  {formatearTamano(mensaje.file.size)}
                </span>
              </span>
              <span className="file-download">
                <Icon name="download" size={18} />
              </span>
            </a>
          ) : (
            <div className="bubble-text">
              <FormattedText text={mensaje.text} />
            </div>
          )}

          <div className="bubble-meta">
            <time dateTime={new Date(mensaje.at).toISOString()}>
              {formatoHora.format(mensaje.at)}
            </time>
            {esMio && (
              <span className="checks" title="Entregado" aria-label="Entregado">
                <Icon name="checks" size={15} />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalInfo({ alCerrar, estadoApi }) {
  const cerrarRef = useRef(null)

  useEffect(() => {
    cerrarRef.current?.focus()
  }, [])

  return (
    <div className="modal-backdrop" onClick={alCerrar} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-titulo"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="modal-header">
          <BotAvatar size={56} />
          <div>
            <h2 id="info-titulo">Chatbot LLM</h2>
            <p>Interfaz de chat · Proyecto de idiomas</p>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-stats">
            <div className="stat">
              <strong>{ESTADISTICAS.idiomas}</strong>
              <span>idiomas</span>
            </div>
            <div className="stat">
              <strong>{ESTADISTICAS.paises}</strong>
              <span>países</span>
            </div>
            <div className="stat">
              <strong>{ESTADISTICAS.dialectos}</strong>
              <span>dialecto</span>
            </div>
          </div>

          <p className="modal-note">
            {estadoApi === 'api'
              ? 'La interfaz está conectada a la API configurada en VITE_CHAT_API_URL.'
              : estadoApi === 'fallback'
                ? 'La API no respondió. La conversación sigue en modo local de respaldo.'
                : 'Modo demo: las respuestas se calculan en tu navegador con los datos de chatbot/base_conocimiento.pl. Los mensajes no se envían a ningún servidor.'}
          </p>

          <p className="modal-note modal-note--light">
            Interfaz hecha con React + Vite. Incluye {ESTADISTICAS.idiomas}{' '}
            idiomas y {ESTADISTICAS.paises} países de la base original en
            Prolog.
          </p>
        </div>

        <div className="modal-actions">
          <button
            ref={cerrarRef}
            type="button"
            className="button-primary"
            onClick={alCerrar}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [mensajes, setMensajes] = useState(() => crearConversacionInicial())
  const [borrador, setBorrador] = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [infoAbierto, setInfoAbierto] = useState(false)
  const [estadoApi, setEstadoApi] = useState(modoApi ? 'api' : 'demo')

  const mensajesRef = useRef(mensajes)
  const textareaRef = useRef(null)
  const listaRef = useRef(null)
  const menuRef = useRef(null)
  const menuBotonRef = useRef(null)

  const generacionRef = useRef(0)
  const colaRef = useRef(Promise.resolve())
  const pendientesRef = useRef(0)
  const primerScrollRef = useRef(true)

  function agregarMensaje(mensaje) {
    const siguientes = [...mensajesRef.current, mensaje]
    mensajesRef.current = siguientes
    setMensajes(siguientes)
  }

  function encolarRespuesta(texto, historial) {
    const generacion = generacionRef.current
    pendientesRef.current += 1
    setEscribiendo(true)

    colaRef.current = colaRef.current
      .then(async () => {
        if (generacion !== generacionRef.current) return

        await esperar(450 + Math.random() * 450)
        if (generacion !== generacionRef.current) return

        const respuesta = await obtenerRespuesta(texto, historial)
        await esperar(Math.min(900, 350 + respuesta.text.length * 4))
        if (generacion !== generacionRef.current) return

        setEstadoApi(respuesta.meta?.mode ?? 'demo')
        agregarMensaje(
          crearMensaje('bot', respuesta.text, Date.now(), {
            meta: respuesta.meta,
          }),
        )
      })
      .catch((error) => {
        console.error('Error al generar la respuesta:', error)
      })
      .finally(() => {
        if (generacion !== generacionRef.current) return
        pendientesRef.current = Math.max(0, pendientesRef.current - 1)
        if (pendientesRef.current === 0) setEscribiendo(false)
      })
  }

  function enviarTexto(texto) {
    const limpio = texto.trim()
    if (!limpio) return

    agregarMensaje(crearMensaje('user', limpio))
    setBorrador('')
    setMenuAbierto(false)

    const historial = mensajesRef.current
      .slice(0, -1)
      .map((mensaje) => ({
        role: mensaje.role === 'user' ? 'user' : 'assistant',
        content:
          mensaje.text ||
          (mensaje.file ? `[Archivo] ${mensaje.file.name}` : ''),
      }))
      .filter((item) => item.content)

    encolarRespuesta(limpio, historial)
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  function reiniciarConversacion() {
    const hayMensajesDelUsuario = mensajesRef.current.some(
      (mensaje) => mensaje.role === 'user',
    )

    if (
      hayMensajesDelUsuario &&
      !window.confirm('¿Vaciar esta conversación y empezar de nuevo?')
    ) {
      return
    }

    generacionRef.current += 1
    pendientesRef.current = 0
    colaRef.current = Promise.resolve()
    setEscribiendo(false)
    liberarArchivos(mensajesRef.current)

    const nueva = crearConversacionInicial(true)
    mensajesRef.current = nueva
    setMensajes(nueva)
    setBorrador('')
    setMenuAbierto(false)
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  function descargarConversacion() {
    const lineas = mensajesRef.current.map((mensaje) => {
      const quien = mensaje.role === 'user' ? 'Tú' : 'Chatbot LLM'
      const contenido =
        mensaje.kind === 'file'
          ? `[Archivo] ${mensaje.file.name}`
          : mensaje.kind === 'image'
            ? `[Imagen] ${mensaje.file.name}`
            : mensaje.text
      return `[${formatoHora.format(mensaje.at)}] ${quien}: ${contenido}`
    })

    const contenido = `Chatbot LLM — Conversación\n${new Intl.DateTimeFormat(
      'es',
      { dateStyle: 'long', timeStyle: 'short' },
    ).format(new Date())}\n\n${lineas.join('\n')}\n`

    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `chatbot-llm-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(enlace)
    enlace.click()
    enlace.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMenuAbierto(false)
  }

  function manejarTecla(evento) {
    if (
      evento.key === 'Enter' &&
      !evento.shiftKey &&
      !evento.nativeEvent.isComposing
    ) {
      evento.preventDefault()
      enviarTexto(borrador)
    }
  }

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }, [borrador])

  useEffect(() => {
    const lista = listaRef.current
    if (!lista) return
    lista.scrollTo({
      top: lista.scrollHeight,
      behavior: primerScrollRef.current ? 'auto' : 'smooth',
    })
    primerScrollRef.current = false
  }, [mensajes, escribiendo])

  useEffect(() => {
    if (!menuAbierto) return

    function alHacerClicFuera(evento) {
      if (
        !menuRef.current?.contains(evento.target) &&
        !menuBotonRef.current?.contains(evento.target)
      ) {
        setMenuAbierto(false)
      }
    }

    document.addEventListener('mousedown', alHacerClicFuera)
    return () => document.removeEventListener('mousedown', alHacerClicFuera)
  }, [menuAbierto])

  useEffect(() => {
    function alPresionarTecla(evento) {
      if (evento.key === 'Escape') {
        setMenuAbierto(false)
        setInfoAbierto(false)
      }
    }

    document.addEventListener('keydown', alPresionarTecla)
    return () => document.removeEventListener('keydown', alPresionarTecla)
  }, [])

  useEffect(() => {
    return () => {
      generacionRef.current += 1
      liberarArchivos(mensajesRef.current)
    }
  }, [])

  return (
    <div className="app-frame">
      <div className="wa-window">
        <main className="chat" aria-label="Conversación con Chatbot LLM">
          <header className="chat-header">
            <BotAvatar size={40} online={!escribiendo} />
            <div className="chat-identity">
              <div className="chat-title">Chatbot LLM</div>
              <div className={`chat-status ${escribiendo ? 'typing' : ''}`}>
                {escribiendo ? 'escribiendo…' : 'en línea'}
              </div>
            </div>
            <div className="chat-actions">
              <button
                ref={menuBotonRef}
                type="button"
                className="icon-button"
                title="Menú de la conversación"
                aria-label="Abrir menú de la conversación"
                aria-haspopup="menu"
                aria-expanded={menuAbierto}
                onClick={() => setMenuAbierto((abierto) => !abierto)}
              >
                <Icon name="menu" />
              </button>

              {menuAbierto && (
                <div className="menu-popover" role="menu" ref={menuRef}>
                  <button
                    type="button"
                    className="menu-item"
                    role="menuitem"
                    onClick={() => {
                      setInfoAbierto(true)
                      setMenuAbierto(false)
                    }}
                  >
                    <Icon name="info" size={20} />
                    Información del chatbot
                  </button>
                  <button
                    type="button"
                    className="menu-item"
                    role="menuitem"
                    onClick={descargarConversacion}
                  >
                    <Icon name="download" size={20} />
                    Descargar conversación
                  </button>
                  <div className="menu-separator" />
                  <button
                    type="button"
                    className="menu-item danger"
                    role="menuitem"
                    onClick={reiniciarConversacion}
                  >
                    <Icon name="trash" size={20} />
                    Vaciar conversación
                  </button>
                </div>
              )}
            </div>
          </header>

          <div
            className="messages"
            ref={listaRef}
            role="log"
            aria-label="Mensajes de la conversación"
          >
            <div className="messages-inner">
              <div className="date-divider" title={new Date().toLocaleDateString('es')}>
                HOY
              </div>

              <div className="system-note">
                <Icon name="info" size={14} />
                <span>
                  {estadoApi === 'api'
                    ? 'Conectado a la API del chatbot.'
                    : estadoApi === 'fallback'
                      ? 'La API no respondió. Se está usando el respaldo local.'
                      : 'Modo demo local. Las respuestas se calculan en tu navegador con la base de conocimiento.'}
                </span>
              </div>

              {mensajes.map((mensaje, indice) => (
                <Mensaje
                  key={mensaje.id}
                  mensaje={mensaje}
                  inicioGrupo={
                    indice === 0 || mensajes[indice - 1].role !== mensaje.role
                  }
                />
              ))}

              {escribiendo && (
                <div className="message-row in">
                  <div
                    className="bubble typing-bubble"
                    role="status"
                    aria-label="El chatbot está escribiendo"
                  >
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <footer className="composer">
            <form
              className="composer-form"
              onSubmit={(evento) => {
                evento.preventDefault()
                enviarTexto(borrador)
              }}
            >
              <div className="composer-input-wrap">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={borrador}
                  onChange={(evento) => setBorrador(evento.target.value)}
                  onKeyDown={manejarTecla}
                  placeholder="Escribe un mensaje"
                  aria-label="Escribe un mensaje"
                  enterKeyHint="send"
                />
              </div>
              <button
                type="submit"
                className="send-button"
                disabled={!borrador.trim()}
                aria-label="Enviar mensaje"
                title={borrador.trim() ? 'Enviar' : 'Escribe un mensaje'}
              >
                <Icon name="send" size={22} />
              </button>
            </form>
          </footer>
        </main>
      </div>

      {infoAbierto && (
        <ModalInfo
          alCerrar={() => setInfoAbierto(false)}
          estadoApi={estadoApi}
        />
      )}
    </div>
  )
}

export default App

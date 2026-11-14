import { DIALECTOS, ESTADISTICAS } from './knowledge'
import {
  analizarEntidades,
  idiomasDeFamilia,
  normalizar,
  paisesDeIdioma,
} from './chatbot'

const ATOMO_IDIOMA = {
  neerlandes: 'holandes',
  shangaines: 'shanganes',
}

const ATOMO_FAMILIA = {
  germanica: 'germanico',
  romance: 'romance',
  eslava: 'eslavo',
  grupo_mandarin: 'grupo_mandarin',
  grupo_yue: 'grupo_yue',
  grupo_wu: 'grupo_wu',
  uralica: 'uralico',
  japonica: 'japonico',
  coreanica: 'coreanico',
  turquica: 'turquico',
  indoeuropeo: 'indoeuropeo',
  sinotibetanas: 'sinotibetanas',
}

const formatoNumero = new Intl.NumberFormat('es', {
  maximumFractionDigits: 1,
})

function atomizar(texto = '') {
  return normalizar(texto).replaceAll(' ', '_')
}

function idiomaAtom(clave) {
  return ATOMO_IDIOMA[clave] ?? clave
}

function familiaAtom(clave) {
  return ATOMO_FAMILIA[clave] ?? clave
}

function fila(variable, valor) {
  return { variable, valor: String(valor) }
}

function pluralSoluciones(cantidad) {
  if (cantidad === 0) return 'sin soluciones'
  if (cantidad === 1) return '1 solución'
  return `${cantidad} soluciones`
}

function entidadesDetectadas(analisis) {
  const nombres = [
    ...analisis.idiomas.map((item) => item.nombre),
    ...(analisis.idiomasDePaises ?? []).map((item) => item.nombre),
    ...analisis.paises.map((item) => item.nombre),
    ...analisis.familias.map((item) => item.datos.nombre),
  ]

  return [...new Set(nombres)].slice(0, 8)
}

function base(tipo, descripcion, analisis) {
  return {
    tipo,
    descripcion,
    consulta: null,
    tituloConsulta: 'Traducción a Prolog',
    resultado: null,
    resumenResultado: 'sin consulta',
    filas: [],
    hechos: [],
    chips: entidadesDetectadas(analisis),
    detalleAnalisis: '',
  }
}

/**
 * Construye una consulta Prolog "equivalente" y su resultado a partir de la
 * base local. No ejecuta un motor Prolog: sirve para que el modo demo muestre
 * el mismo tipo de rastro que devuelve el backend real.
 */
function construirTraza(mensaje) {
  const analisis = analizarEntidades(mensaje)
  const {
    texto,
    idiomas,
    paises,
    idioma,
    pais,
    familia,
    idiomasComparados,
    comparacionPorPaises,
    intenciones,
  } = analisis

  if (!texto) {
    const r = base('vacio', 'Mensaje vacío', analisis)
    r.detalleAnalisis = 'No hay texto que interpretar.'
    return r
  }

  if (intenciones.saludo) {
    const r = base('cortesia', 'Saludo', analisis)
    r.detalleAnalisis = 'Es un saludo; no hace falta consultar la base.'
    return r
  }

  if (intenciones.gracias) {
    const r = base('cortesia', 'Agradecimiento', analisis)
    r.detalleAnalisis = 'Es un agradecimiento; no hace falta consultar la base.'
    return r
  }

  if (intenciones.despedida) {
    const r = base('cortesia', 'Despedida', analisis)
    r.detalleAnalisis = 'Es una despedida; no hace falta consultar la base.'
    return r
  }

  if (intenciones.ayuda) {
    const r = base('ayuda', 'Ayuda sobre el chatbot', analisis)
    r.detalleAnalisis =
      'La pregunta pide explicar qué puede hacer el asistente. Se responde con una guía de uso.'
    return r
  }

  if (intenciones.sobreProlog) {
    const r = base('motor', 'Explicación del motor Prolog', analisis)
    r.tituloConsulta = 'Regla de ejemplo'
    r.consulta = 'proviene(Idioma, latin) :- es(Idioma, romance).'
    r.resultado = 'La regla queda cargada en la base de conocimiento.'
    r.resumenResultado = 'regla cargada'
    r.detalleAnalisis =
      'Se muestra una de las reglas que usa el motor para deducir nuevos hechos.'
    return r
  }

  if (intenciones.conteo) {
    const r = base('conteo', 'Cantidad de idiomas y países', analisis)
    r.consulta = 'findall(I, idioma(I), L), length(L, N).'
    r.resultado = `N = ${ESTADISTICAS.idiomas}.`
    r.resumenResultado = pluralSoluciones(1)
    r.filas = [fila('N', ESTADISTICAS.idiomas)]
    r.hechos = [
      `% ${ESTADISTICAS.idiomas} idiomas, ${ESTADISTICAS.paises} países, ${ESTADISTICAS.dialectos} dialecto`,
    ]
    r.detalleAnalisis =
      'Se cuenta cuántos idiomas reconoce la base y se compara con los países registrados.'
    return r
  }

  if (familia && !idioma) {
    const miembros = idiomasDeFamilia(familia.clave)
    const r = base(
      'familia',
      `Idiomas de la familia ${familia.datos.nombre}`,
      analisis,
    )
    r.consulta = `es(X, ${familiaAtom(familia.clave)}).`
    r.filas = miembros.map((item) => fila('X', idiomaAtom(item.clave)))
    r.resultado = r.filas.length
      ? `${r.filas.map((item) => `X = ${item.valor}`).join(' ; ')}.`
      : 'false.'
    r.resumenResultado = pluralSoluciones(miembros.length)
    r.hechos = miembros.map(
      (item) =>
        `es(${idiomaAtom(item.clave)}, ${familiaAtom(item.familia)}).`,
    )
    r.detalleAnalisis = `Se buscan todos los idiomas que pertenecen a ${familia.datos.nombre}.`
    return r
  }

  if (familia && idiomas.length > 0) {
    const perteneceDirecta = idioma.familia === familia.clave
    const perteneceMacro =
      familia.datos.tipo === 'macrofamilia' && idioma.macro === familia.clave
    const verdadero = perteneceDirecta || perteneceMacro
    const r = base(
      'pertenencia',
      `Pertenencia de ${idioma.nombre} a ${familia.datos.nombre}`,
      analisis,
    )
    r.consulta = `es(${idiomaAtom(idioma.clave)}, ${familiaAtom(
      familia.clave,
    )}).`
    r.resultado = verdadero ? 'true.' : 'false.'
    r.resumenResultado = verdadero ? 'true' : 'false'
    r.hechos = [
      `es(${idiomaAtom(idioma.clave)}, ${familiaAtom(idioma.familia)}).`,
    ]
    if (idioma.macro) {
      r.hechos.push(
        `es(${idiomaAtom(idioma.clave)}, ${familiaAtom(idioma.macro)}).`,
      )
    }
    if (idiomas.length > 1) {
      r.detalleAnalisis = `Se detectaron ${idiomas.length} idiomas; la consulta mostrada evalúa el primero (${idioma.nombre}).`
    } else {
      r.detalleAnalisis = `Se comprueba si ${idioma.nombre} pertenece a ${familia.datos.nombre} o a una macrofamilia relacionada.`
    }
    return r
  }

  if (intenciones.origen && idiomas.length >= 2) {
    const [idiomaA, idiomaB] = idiomas
    const origenA = atomizar(idiomaA.origen)
    const origenB = atomizar(idiomaB.origen)
    const mismoOrigen = idiomaA.origen === idiomaB.origen
    const r = base(
      'origen',
      `Origen de ${idiomaA.nombre} y ${idiomaB.nombre}`,
      analisis,
    )
    r.consulta = `proviene(${idiomaAtom(idiomaA.clave)}, X).\nproviene(${idiomaAtom(idiomaB.clave)}, Y).`
    r.filas = [fila('X', origenA), fila('Y', origenB)]
    r.resultado = `X = ${origenA}.\nY = ${origenB}.\nX = Y: ${
      mismoOrigen ? 'true' : 'false'
    }.`
    r.resumenResultado = mismoOrigen
      ? 'mismo origen'
      : 'orígenes distintos'
    r.hechos = [
      `proviene(${idiomaAtom(idiomaA.clave)}, ${origenA}).`,
      `es(${idiomaAtom(idiomaA.clave)}, ${familiaAtom(idiomaA.familia)}).`,
      ...(idiomaA.macro
        ? [
            `es(${idiomaAtom(idiomaA.clave)}, ${familiaAtom(idiomaA.macro)}).`,
          ]
        : []),
      `proviene(${idiomaAtom(idiomaB.clave)}, ${origenB}).`,
      `es(${idiomaAtom(idiomaB.clave)}, ${familiaAtom(idiomaB.familia)}).`,
      ...(idiomaB.macro
        ? [
            `es(${idiomaAtom(idiomaB.clave)}, ${familiaAtom(idiomaB.macro)}).`,
          ]
        : []),
    ]
    r.detalleAnalisis =
      'Se busca la lengua madre de cada idioma y se comparan los dos resultados.'
    return r
  }

  if (intenciones.origen && idioma) {
    const origen = atomizar(idioma.origen)
    const r = base('origen', `Origen de ${idioma.nombre}`, analisis)
    r.consulta = `proviene(${idiomaAtom(idioma.clave)}, X).`
    r.resultado = `X = ${origen}.`
    r.resumenResultado = pluralSoluciones(1)
    r.filas = [fila('X', origen)]
    r.hechos = [
      `proviene(${idiomaAtom(idioma.clave)}, ${origen}).`,
      `es(${idiomaAtom(idioma.clave)}, ${familiaAtom(idioma.familia)}).`,
      ...(idioma.macro
        ? [`es(${idiomaAtom(idioma.clave)}, ${familiaAtom(idioma.macro)}).`]
        : []),
    ]
    r.detalleAnalisis = `Se busca la lengua madre de ${idioma.nombre} a partir de su familia.`
    return r
  }

  if (intenciones.dondeSeHabla && idioma) {
    const paisesIdioma = paisesDeIdioma(idioma.clave)
    const r = base(
      'donde',
      `Países donde se habla ${idioma.nombre}`,
      analisis,
    )
    r.consulta = `se_habla(X, ${idiomaAtom(idioma.clave)}).`
    r.filas = paisesIdioma.map((item) => fila('X', item.clave))
    r.resultado = r.filas.length
      ? `${r.filas.map((item) => `X = ${item.valor}`).join(' ; ')}.`
      : 'false.'
    r.resumenResultado = pluralSoluciones(paisesIdioma.length)
    r.hechos = paisesIdioma.map(
      (item) => `se_habla(${item.clave}, ${idiomaAtom(idioma.clave)}).`,
    )
    r.detalleAnalisis = `Se consultan todos los lugares registrados para ${idioma.nombre}.`
    return r
  }

  if (intenciones.relacion && idiomasComparados.length >= 2) {
    const [idiomaA, idiomaB] = idiomasComparados
    const mismaFamilia = idiomaA.familia === idiomaB.familia
    const mismaMacro = Boolean(idiomaA.macro) && idiomaA.macro === idiomaB.macro
    const verdadero =
      (mismaFamilia || mismaMacro) && idiomaA.clave !== idiomaB.clave
    const titulo =
      comparacionPorPaises && paises[0] && paises[1]
        ? `Relación entre el idioma de ${paises[0].nombre} y el de ${paises[1].nombre}`
        : `Relación entre ${idiomaA.nombre} y ${idiomaB.nombre}`
    const r = base('relacion', titulo, analisis)
    r.consulta = `idiomas_relacionados(${idiomaAtom(
      idiomaA.clave,
    )}, ${idiomaAtom(idiomaB.clave)}).`
    r.resultado = verdadero ? 'true.' : 'false.'
    r.resumenResultado = verdadero ? 'true' : 'false'
    r.hechos = [
      ...(comparacionPorPaises && paises[0] && paises[1]
        ? [
            `se_habla(${paises[0].clave}, ${idiomaAtom(idiomaA.clave)}).`,
            `se_habla(${paises[1].clave}, ${idiomaAtom(idiomaB.clave)}).`,
          ]
        : []),
      `es(${idiomaAtom(idiomaA.clave)}, ${familiaAtom(idiomaA.familia)}).`,
      `es(${idiomaAtom(idiomaB.clave)}, ${familiaAtom(idiomaB.familia)}).`,
      ...(mismaMacro && !mismaFamilia
        ? [
            `es(${idiomaAtom(idiomaA.clave)}, ${familiaAtom(idiomaA.macro)}).`,
            `es(${idiomaAtom(idiomaB.clave)}, ${familiaAtom(idiomaB.macro)}).`,
          ]
        : []),
    ]
    r.detalleAnalisis = comparacionPorPaises
      ? 'Se resolvió el idioma de cada país con se_habla/2 y luego se comparó con idiomas_relacionados/2, que se cumple al compartir cualquier nivel taxonómico: familia directa o macrofamilia.'
      : 'La regla idiomas_relacionados/2 se cumple si los idiomas son distintos y comparten algún nivel taxonómico: familia directa o macrofamilia.'
    return r
  }

  if (pais && (intenciones.queSeHabla || paises.length === 1)) {
    const r = base('pais', `Idioma hablado en ${pais.nombre}`, analisis)
    r.consulta = `se_habla(${pais.clave}, X).`
    r.resultado = `X = ${idiomaAtom(pais.idioma)}.`
    r.resumenResultado = pluralSoluciones(1)
    r.filas = [fila('X', idiomaAtom(pais.idioma))]
    r.hechos = [
      `se_habla(${pais.clave}, ${idiomaAtom(pais.idioma)}).`,
      ...(DIALECTOS[pais.idioma] ?? []).map(
        (dialecto) =>
          `dialecto_de(${idiomaAtom(pais.idioma)}, ${atomizar(
            dialecto.clave,
          )}).`,
      ),
    ]
    r.detalleAnalisis = `Se busca qué idioma está asociado a ${pais.nombre} y si tiene dialectos.`
    return r
  }

  if (intenciones.dialecto && idioma) {
    const dialectos = DIALECTOS[idioma.clave] ?? []
    const r = base('dialecto', `Dialectos de ${idioma.nombre}`, analisis)
    r.consulta = `dialecto_de(${idiomaAtom(idioma.clave)}, X).`
    r.filas = dialectos.map((dialecto) => fila('X', atomizar(dialecto.clave)))
    r.resultado = r.filas.length
      ? `${r.filas.map((item) => `X = ${item.valor}`).join(' ; ')}.`
      : 'false.'
    r.resumenResultado = pluralSoluciones(dialectos.length)
    r.hechos = dialectos.map(
      (dialecto) =>
        `dialecto_de(${idiomaAtom(idioma.clave)}, ${atomizar(
          dialecto.clave,
        )}).`,
    )
    r.detalleAnalisis = `Se consultan los dialectos registrados para ${idioma.nombre}.`
    return r
  }

  if (idioma) {
    const r = base('idioma', `Familia de ${idioma.nombre}`, analisis)
    r.consulta = `es(${idiomaAtom(idioma.clave)}, X).`
    r.filas = [
      fila('X', familiaAtom(idioma.familia)),
      ...(idioma.macro ? [fila('X', familiaAtom(idioma.macro))] : []),
    ]
    r.resultado = `${r.filas.map((item) => `X = ${item.valor}`).join(' ; ')}.`
    r.resumenResultado = pluralSoluciones(r.filas.length)
    r.hechos = [
      `es(${idiomaAtom(idioma.clave)}, ${familiaAtom(idioma.familia)}).`,
    ]
    r.detalleAnalisis = `Se consultan la familia directa y la macrofamilia de ${idioma.nombre}.`
    return r
  }

  if (pais) {
    const r = base('pais', `Idioma hablado en ${pais.nombre}`, analisis)
    r.consulta = `se_habla(${pais.clave}, X).`
    r.resultado = `X = ${idiomaAtom(pais.idioma)}.`
    r.resumenResultado = pluralSoluciones(1)
    r.filas = [fila('X', idiomaAtom(pais.idioma))]
    r.hechos = [`se_habla(${pais.clave}, ${idiomaAtom(pais.idioma)}).`]
    r.detalleAnalisis = `Se busca el idioma asociado a ${pais.nombre}.`
    return r
  }

  const r = base('sin-coincidencia', 'Consulta sin coincidencia', analisis)
  r.detalleAnalisis =
    'No se detectaron idiomas, países ni familias de la base en la pregunta.'
  return r
}

function calcularDuracion(mensaje, respuesta) {
  const base = 520
  const porPregunta = Math.min(900, String(mensaje ?? '').length * 7)
  const porRespuesta = Math.min(1100, String(respuesta ?? '').length * 5)
  return Math.round(base + porPregunta + porRespuesta)
}

/**
 * Devuelve un objeto `trace` listo para guardarse junto al mensaje del bot.
 *
 * El formato es el mismo que consume la interfaz cuando la API responde con
 * su propio rastro. En este caso se marca como `demo` para no confundirlo con
 * una consulta real a SWI-Prolog.
 */
export function crearRastroDemo(mensaje, respuesta, opciones = {}) {
  const traza = construirTraza(mensaje)
  const duracion = opciones.duracionMs ?? calcularDuracion(mensaje, respuesta)
  const analisisMs = Math.max(2, Math.round(duracion * 0.03))

  const pasos = [
    {
      id: 'analisis',
      kind: 'analysis',
      title: 'Interpretación de la pregunta',
      summary: traza.descripcion,
      detail: traza.detalleAnalisis,
      chips: traza.chips,
      durationMs: analisisMs,
    },
  ]

  if (traza.consulta) {
    const consultaMs = Math.max(40, Math.round(duracion * 0.4))
    const resultadoMs = Math.max(3, Math.round(duracion * 0.05))
    const respuestaMs = Math.max(
      40,
      duracion - analisisMs - consultaMs - resultadoMs,
    )

    pasos.push(
      {
        id: 'consulta',
        kind: 'query',
        title: traza.tituloConsulta,
        summary: 'Consulta preparada para la base de conocimiento.',
        code: traza.consulta,
        detail:
          'En modo demo se construye con reglas locales; con la API la genera el modelo.',
        durationMs: consultaMs,
      },
      {
        id: 'resultado',
        kind: 'result',
        title: 'Consulta en la base',
        summary: traza.resumenResultado,
        code: traza.resultado,
        rows: traza.filas,
        facts: traza.hechos,
        detail:
          'Resultado equivalente sobre base_conocimiento.pl (simulación local).',
        durationMs: resultadoMs,
      },
      {
        id: 'respuesta',
        kind: 'answer',
        title: 'Respuesta en lenguaje natural',
        summary: respuesta,
        detail: 'Redactada a partir del resultado de la base.',
        durationMs: respuestaMs,
      },
    )
  } else {
    const sinConsultaMs = Math.max(2, Math.round(duracion * 0.08))
    const respuestaMs = Math.max(
      40,
      duracion - analisisMs - sinConsultaMs,
    )

    pasos.push(
      {
        id: 'sin-consulta',
        kind: 'analysis',
        title: 'Sin consulta Prolog',
        summary: 'Esta pregunta se responde sin consultar la base.',
        detail:
          'No hace falta una consulta para este tipo de mensaje; se responde con información general.',
        durationMs: sinConsultaMs,
      },
      {
        id: 'respuesta',
        kind: 'answer',
        title: 'Respuesta en lenguaje natural',
        summary: respuesta,
        detail: 'Redactada directamente a partir del mensaje.',
        durationMs: respuestaMs,
      },
    )
  }

  return {
    mode: 'demo',
    model: 'reglas locales',
    durationMs: pasos.reduce((total, paso) => total + paso.durationMs, 0),
    steps: pasos,
    nota: 'Traza simulada con la base local. Conecta la API para ver la consulta y el resultado reales de Prolog.',
  }
}

function normalizarPaso(paso, indice) {
  return {
    id: paso.id ?? `paso-${indice}`,
    kind: paso.kind ?? paso.tipo ?? 'analysis',
    title: paso.title ?? paso.titulo ?? `Paso ${indice + 1}`,
    summary: paso.summary ?? paso.resumen ?? '',
    detail: paso.detail ?? paso.detalle ?? '',
    code: paso.code ?? paso.codigo ?? '',
    rows: paso.rows ?? paso.filas ?? [],
    facts: paso.facts ?? paso.hechos ?? [],
    chips: paso.chips ?? [],
    durationMs: paso.durationMs ?? paso.duracionMs ?? paso.duracion_ms ?? null,
  }
}

/**
 * Normaliza el rastro que devuelve el backend. Acepta el formato nuevo
 * (`{ steps: [...] }`) y también respuestas antiguas que solo traen la
 * consulta y el resultado como campos sueltos.
 */
export function normalizarTrazaApi(trace, contexto = {}) {
  if (trace && !Array.isArray(trace) && Array.isArray(trace.steps)) {
    const steps = trace.steps.map(normalizarPaso)
    const durationMs =
      trace.durationMs ??
      steps.reduce((total, paso) => total + (paso.durationMs ?? 0), 0)

    return {
      mode: trace.mode ?? 'api',
      model: trace.model ?? contexto.model ?? null,
      durationMs,
      steps,
      nota:
        trace.nota ??
        'Traza real del pipeline: consulta generada por el modelo y evaluada con SWI-Prolog.',
    }
  }

  if (Array.isArray(trace)) {
    return normalizarTrazaApi({ steps: trace }, contexto)
  }

  const steps = []
  if (contexto.prologQuery) {
    steps.push({
      id: 'consulta',
      kind: 'query',
      title: 'Traducción a Prolog',
      summary: 'Consulta generada por el modelo.',
      code: contexto.prologQuery,
      durationMs: null,
    })
    steps.push({
      id: 'resultado',
      kind: 'result',
      title: 'Consulta en la base',
      summary: 'Resultado devuelto por el motor Prolog.',
      code: contexto.prologResult ?? 'sin resultado',
      durationMs: null,
    })
  }

  steps.push({
    id: 'respuesta',
    kind: 'answer',
    title: 'Respuesta en lenguaje natural',
    summary: contexto.reply ?? 'Respuesta recibida desde la API.',
    durationMs: null,
  })

  return {
    mode: 'api',
    model: contexto.model ?? null,
    durationMs: contexto.durationMs ?? null,
    steps,
    nota:
      'Traza real del pipeline: consulta generada por el modelo y evaluada con SWI-Prolog.',
  }
}

export function formatearDuracion(ms) {
  if (!Number.isFinite(ms)) return '—'
  if (ms < 1000) return `${Math.max(1, Math.round(ms))} ms`
  return `${formatoNumero.format(ms / 1000)} s`
}

export function etiquetaModo(mode) {
  switch (mode) {
    case 'api':
      return 'API real'
    case 'fallback':
      return 'Respaldo local'
    case 'demo':
      return 'Demo local'
    default:
      return 'Rastro'
  }
}

export function claseModo(mode) {
  return ['api', 'demo', 'fallback'].includes(mode) ? mode : 'demo'
}

/**
 * Empareja cada pregunta del usuario con la siguiente respuesta del bot que
 * tenga rastro. Se usa en el panel lateral y en la descarga del informe.
 */
export function agruparTurnos(mensajes) {
  const turnos = []
  let pregunta = null

  for (const mensaje of mensajes) {
    if (mensaje.role === 'user') {
      pregunta = mensaje
    } else if (mensaje.trace?.steps?.length) {
      turnos.push({ pregunta, respuesta: mensaje })
      pregunta = null
    }
  }

  return turnos
}

export function resumirTurnos(turnos) {
  const pasos = turnos.reduce(
    (total, turno) => total + turno.respuesta.trace.steps.length,
    0,
  )
  const duracion = turnos.reduce(
    (total, turno) => total + (turno.respuesta.trace.durationMs ?? 0),
    0,
  )
  const modos = new Set(
    turnos.map((turno) => turno.respuesta.trace.mode ?? 'demo'),
  )

  return { turnos: turnos.length, pasos, duracion, modos }
}

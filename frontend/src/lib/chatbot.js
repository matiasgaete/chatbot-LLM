import {
  DIALECTOS,
  ESTADISTICAS,
  FAMILIAS,
  IDIOMAS,
  PAISES,
} from './knowledge'

export function normalizar(texto = '') {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function crearOpciones(coleccion) {
  return Object.entries(coleccion).map(([clave, datos]) => ({
    clave,
    datos,
    alias: [
      ...new Set(
        [datos.nombre, clave.replaceAll('_', ' '), ...(datos.aliases ?? [])]
          .map(normalizar)
          .filter(Boolean),
      ),
    ],
  }))
}

const OPCIONES_IDIOMAS = crearOpciones(IDIOMAS)
const OPCIONES_PAISES = crearOpciones(PAISES)
const OPCIONES_FAMILIAS = crearOpciones(FAMILIAS)

function buscarMenciones(texto, opciones) {
  const acolchado = ` ${texto} `
  const encontrados = []

  for (const opcion of opciones) {
    for (const alias of opcion.alias) {
      const posicion = acolchado.indexOf(` ${alias} `)
      if (posicion !== -1) {
        encontrados.push({ ...opcion, posicion })
        break
      }
    }
  }

  return encontrados.sort((a, b) => a.posicion - b.posicion)
}

function unirLista(elementos) {
  if (elementos.length === 0) return ''
  if (elementos.length === 1) return elementos[0]
  return `${elementos.slice(0, -1).join(', ')} y ${elementos.at(-1)}`
}

function familiaDe(idioma) {
  return FAMILIAS[idioma.familia]
}

function macroDe(idioma) {
  return idioma.macro ? FAMILIAS[idioma.macro] : null
}

function fraseFamilia(idioma) {
  const familia = familiaDe(idioma)
  if (familia.esGrupo) return `al *${familia.nombre}*`
  return `a la familia *${familia.nombre}*`
}

function fraseMacro(idioma) {
  const macro = macroDe(idioma)
  if (!macro) return ''
  return ` Forma parte de las lenguas *${macro.plural ?? macro.nombre}*.`
}

export function idiomasDeFamilia(claveFamilia) {
  const familia = FAMILIAS[claveFamilia]
  if (!familia) return []

  return Object.entries(IDIOMAS)
    .filter(([, idioma]) =>
      familia.tipo === 'macrofamilia'
        ? idioma.macro === claveFamilia
        : idioma.familia === claveFamilia,
    )
    .map(([clave, idioma]) => ({ clave, ...idioma }))
}

export function paisesDeIdioma(claveIdioma) {
  return Object.entries(PAISES)
    .filter(([, pais]) => pais.idioma === claveIdioma)
    .map(([clave, pais]) => ({ clave, ...pais }))
}

function frasePaises(idioma) {
  const lista = paisesDeIdioma(idioma.clave)
  if (lista.length === 0) return ''
  return ` Se habla en ${unirLista(lista.map((item) => `*${item.nombre}*`))}.`
}

function notaDialecto(claveIdioma) {
  const dialectos = DIALECTOS[claveIdioma]
  if (!dialectos?.length) return ''
  return `\n\nTambién tiene un dialecto registrado: el *${dialectos[0].nombre}*.`
}

function respuestaPertenencia(idioma, familia) {
  const perteneceDirecta = idioma.familia === familia.clave
  const perteneceMacro =
    familia.datos.tipo === 'macrofamilia' && idioma.macro === familia.clave

  if (perteneceDirecta || perteneceMacro) {
    if (perteneceMacro) {
      return `Sí. El *${idioma.nombre}* forma parte de las lenguas *${
        familia.datos.plural ?? familia.datos.nombre
      }*.`
    }

    return `Sí. El *${idioma.nombre}* pertenece ${fraseFamilia(idioma)}.${fraseMacro(
      idioma,
    )}`
  }

  const macroReal = macroDe(idioma)
  const familiaBuscada =
    familia.datos.tipo === 'macrofamilia'
      ? `a las lenguas *${familia.datos.plural ?? familia.datos.nombre}*`
      : familia.datos.esGrupo
        ? `al *${familia.datos.nombre}*`
        : `a la familia *${familia.datos.nombre}*`
  let respuesta = `No. El *${idioma.nombre}* pertenece ${fraseFamilia(
    idioma,
  )}, no ${familiaBuscada}.`

  if (macroReal) {
    respuesta += ` Eso sí: forma parte de las lenguas *${macroReal.plural ?? macroReal.nombre}*.`
  } else {
    respuesta += ` La base no registra una macrofamilia para el ${idioma.nombre}.`
  }

  return respuesta
}

function adjetivoFamilia(idioma) {
  const familia = familiaDe(idioma)
  return familia.esGrupo
    ? `del *${familia.nombre}*`
    : `de la familia *${familia.nombre}*`
}

function notaMacro(idioma) {
  const macro = macroDe(idioma)
  return macro
    ? `, dentro de las lenguas *${macro.plural ?? macro.nombre}*`
    : ''
}

function fraseOrigen(idioma) {
  return `proviene del *${idioma.origen}*`
}

function fraseOrigenPlural(idioma) {
  return `provienen del *${idioma.origen}*`
}

function fraseResumenIdioma(idioma) {
  return `Es ${adjetivoFamilia(idioma)}${notaMacro(
    idioma,
  )} y ${fraseOrigen(idioma)}.`
}

function respuestaRelacion(idiomaA, idiomaB, contexto = {}) {
  const { paisA, paisB } = contexto
  const prefijo =
    paisA && paisB
      ? `En *${paisA.nombre}* se habla *${idiomaA.nombre}* y en *${paisB.nombre}* se habla *${idiomaB.nombre}*. `
      : ''

  if (idiomaA.clave === idiomaB.clave) {
    if (prefijo) {
      return `${prefijo}Es el mismo idioma, así que no hay dos lenguas distintas que comparar.`
    }

    return `Mencionaste el mismo idioma dos veces: *${idiomaA.nombre}*. Para comparar necesito dos idiomas distintos.`
  }

  const mismaFamilia = idiomaA.familia === idiomaB.familia
  const mismaMacro = Boolean(idiomaA.macro) && idiomaA.macro === idiomaB.macro
  const mismoOrigen = idiomaA.origen === idiomaB.origen
  let respuesta

  if (mismaFamilia) {
    const macro = macroDe(idiomaA)
    const nota = macro
      ? ` También forman parte de las lenguas *${macro.plural ?? macro.nombre}*.`
      : ''
    const origen = mismoOrigen
      ? ` Además, los dos ${fraseOrigenPlural(idiomaA)}.`
      : ` El *${idiomaA.nombre}* ${fraseOrigen(idiomaA)} y el *${
          idiomaB.nombre
        }* ${fraseOrigen(idiomaB)}.`
    respuesta = `Sí. El *${idiomaA.nombre}* y el *${idiomaB.nombre}* están relacionados: ambos son ${adjetivoFamilia(
      idiomaA,
    )}.${nota}${origen}`
  } else if (mismaMacro) {
    const macro = FAMILIAS[idiomaA.macro]
    const origen = mismoOrigen
      ? ` Ambos ${fraseOrigenPlural(idiomaA)}.`
      : ` El *${idiomaA.nombre}* ${fraseOrigen(idiomaA)} y el *${
          idiomaB.nombre
        }* ${fraseOrigen(idiomaB)}.`
    respuesta = `Sí. El *${idiomaA.nombre}* y el *${idiomaB.nombre}* están relacionados porque comparten las lenguas *${
      macro.plural ?? macro.nombre
    }*, aunque sus familias directas son distintas: el *${
      idiomaA.nombre
    }* es ${adjetivoFamilia(idiomaA)} y el *${idiomaB.nombre}* es ${adjetivoFamilia(
      idiomaB,
    )}.${origen}`
  } else {
    const origen = mismoOrigen
      ? ` Ambos ${fraseOrigen(idiomaA)}, pero no comparten ningún nivel taxonómico registrado.`
      : ` Además, provienen de orígenes distintos: *${idiomaA.origen}* y *${idiomaB.origen}*.`
    respuesta = `No. El *${idiomaA.nombre}* es ${adjetivoFamilia(
      idiomaA,
    )}${notaMacro(idiomaA)} y el *${idiomaB.nombre}* es ${adjetivoFamilia(
      idiomaB,
    )}${notaMacro(idiomaB)}; no comparten ningún nivel taxonómico en la base de conocimiento.${origen}`
  }

  return `${prefijo}${
    prefijo ? respuesta.replace(/^Sí\. /, '') : respuesta
  }`
}

function notaComun(idiomaA, idiomaB) {
  const macro = macroDe(idiomaA)
  if (macro && idiomaA.macro === idiomaB.macro) {
    return ` Ambos forman parte de las lenguas *${macro.plural ?? macro.nombre}*.`
  }

  if (idiomaA.familia === idiomaB.familia) {
    return ` Ambos son ${adjetivoFamilia(idiomaA)}.`
  }

  return ''
}

function respuestaOrigenComparado(idiomaA, idiomaB, preguntaMismoOrigen = false) {
  const mismoOrigen = idiomaA.origen === idiomaB.origen
  const detalleA = `El *${idiomaA.nombre}* es ${adjetivoFamilia(
    idiomaA,
  )}${notaMacro(idiomaA)} y ${fraseOrigen(idiomaA)}`
  const detalleB = `el *${idiomaB.nombre}* es ${adjetivoFamilia(
    idiomaB,
  )}${notaMacro(idiomaB)} y ${fraseOrigen(idiomaB)}`

  if (mismoOrigen) {
    const comun = notaComun(idiomaA, idiomaB)
    if (preguntaMismoOrigen) {
      return `Sí. El *${idiomaA.nombre}* y el *${idiomaB.nombre}* provienen del mismo origen: *${idiomaA.origen}*.${comun}`
    }

    return `El *${idiomaA.nombre}* y el *${idiomaB.nombre}* comparten el mismo origen: *${idiomaA.origen}*.${comun}`
  }

  const comienzo = preguntaMismoOrigen ? 'No. ' : ''
  return `${comienzo}${detalleA}, mientras que ${detalleB}. No comparten la misma lengua de origen.`
}

/**
 * Detecta entidades e intenciones de una pregunta.
 *
 * Se usa tanto para responder en modo demo como para construir el rastro que
 * explica qué consulta se hizo y qué resultado se obtuvo.
 */
export function analizarEntidades(mensaje) {
  const texto = normalizar(mensaje)

  const idiomas = texto
    ? buscarMenciones(texto, OPCIONES_IDIOMAS).map((m) => ({
        clave: m.clave,
        ...m.datos,
      }))
    : []
  const paises = texto
    ? buscarMenciones(texto, OPCIONES_PAISES).map((m) => ({
        clave: m.clave,
        ...m.datos,
      }))
    : []
  const familias = texto ? buscarMenciones(texto, OPCIONES_FAMILIAS) : []

  const idiomasDePaises = paises
    .map((item) => {
      const datos = IDIOMAS[item.idioma]
      return datos ? { clave: item.idioma, ...datos, pais: item } : null
    })
    .filter(Boolean)

  const comparacionPorPaises =
    idiomas.length < 2 && idiomasDePaises.length >= 2
  const idiomasComparados =
    idiomas.length >= 2
      ? idiomas.slice(0, 2)
      : comparacionPorPaises
        ? idiomasDePaises.slice(0, 2)
        : []

  const idioma = idiomas[0] ?? null
  const idiomaB = idiomas[1] ?? null
  const pais = paises[0] ?? null
  const familia = familias[0] ?? null

  const intenciones = {
    saludo: /^(hola|holaa|buenas|hey|que tal|saludos)\b/.test(texto),
    gracias: /\b(gracias|muchas gracias)\b/.test(texto),
    despedida: /\b(adios|chao|hasta luego|nos vemos)\b/.test(texto),
    ayuda:
      /\b(quien eres|que eres|como funcionas|que puedes hacer|ayuda|opciones)\b/.test(
        texto,
      ),
    sobreProlog:
      /\b(prolog|base de conocimiento|motor|como funciona)\b/.test(texto),
    conteo:
      /\b(cuantos idiomas|cuantas lenguas|cuantos paises|cuantos lugares)\b/.test(
        texto,
      ),
    origen:
      /\b(proviene|viene|origen|de donde|de que lengua|lengua madre|ancestro)\b/.test(
        texto,
      ) || (/\blatin\b/.test(texto) && Boolean(idioma)),
    dondeSeHabla:
      /\b(donde se habla|donde hablan|en que paises|en que lugares)\b/.test(
        texto,
      ),
    queSeHabla:
      /\b(que se habla|que idioma se habla|idioma de|idioma en|se habla en|que idioma hablan|que lengua hablan)\b/.test(
        texto,
      ),
    relacion:
      /\b(relacionad\w*|emparentad\w*|misma familia|familia en comun|comparten familia|parentesco)\b/.test(
        texto,
      ),
    dialecto: /\bdialecto/.test(texto),
  }

  return {
    texto,
    idiomas,
    paises,
    familias,
    idiomasDePaises,
    idiomasComparados,
    comparacionPorPaises,
    idioma,
    idiomaB,
    pais,
    familia,
    intenciones,
  }
}

export function responderLocal(mensaje) {
  const {
    texto,
    idiomas,
    paises,
    idioma,
    idiomaB,
    pais,
    familia,
    idiomasComparados,
    comparacionPorPaises,
    intenciones,
  } = analizarEntidades(mensaje)

  if (!texto) return 'Escribe una pregunta y la reviso. 🙂'

  if (intenciones.saludo) {
    return '¡Hola! 👋 Soy el asistente de *Chatbot LLM*. Pregúntame por idiomas, familias lingüísticas, países o dialectos.'
  }

  if (intenciones.gracias) {
    return '¡De nada! 😊 Si quieres, prueba con otra consulta sobre idiomas.'
  }

  if (intenciones.despedida) {
    return '¡Hasta luego! 👋 Que tengas buen día.'
  }

  if (intenciones.ayuda) {
    return 'Soy la interfaz de chat de *Chatbot LLM*. En este modo demo respondo con la base de conocimiento de idiomas del proyecto: familias, orígenes, países y dialectos.'
  }

  if (intenciones.sobreProlog) {
    return 'La base está escrita en Prolog y contiene hechos como `es(ingles, germanico)` y reglas como `proviene(Idioma, latin) :- es(Idioma, romance)`. Esta interfaz es la capa de chat; el motor real se puede conectar después mediante una API.'
  }

  if (intenciones.conteo) {
    return `La base de conocimiento registra *${ESTADISTICAS.idiomas} idiomas* y *${ESTADISTICAS.paises} países o lugares*, además de *${ESTADISTICAS.dialectos} dialecto*.`
  }

  if (familia && !idioma) {
    const miembros = idiomasDeFamilia(familia.clave)
    if (miembros.length === 0) {
      return `No hay idiomas registrados en *${familia.datos.nombre}* dentro de la base.`
    }

    const nombres = miembros.map((item) => `*${item.nombre}*`)
    if (familia.datos.tipo === 'macrofamilia') {
      return `Las lenguas *${
        familia.datos.plural ?? familia.datos.nombre
      }* de la base son: ${unirLista(nombres)}.`
    }

    return `En la base, *${familia.datos.nombre}* incluye: ${unirLista(nombres)}.`
  }

  if (familia && idiomas.length > 0) {
    if (idiomas.length > 1) {
      const respuestas = idiomas.map((item) =>
        respuestaPertenencia(item, familia),
      )
      return respuestas.join('\n\n')
    }

    return respuestaPertenencia(idioma, familia)
  }

  if (intenciones.origen && idiomas.length >= 2) {
    const preguntaMismoOrigen = /\b(mismo|misma|igual)\b/.test(texto)
    return respuestaOrigenComparado(idioma, idiomaB, preguntaMismoOrigen)
  }

  if (intenciones.origen && idioma) {
    return `El *${idioma.nombre}* proviene del *${idioma.origen}*. Pertenece ${fraseFamilia(
      idioma,
    )}.${fraseMacro(idioma)}${frasePaises(idioma)}`
  }

  if (intenciones.dondeSeHabla && idioma) {
    const paisesIdioma = paisesDeIdioma(idioma.clave)
    if (paisesIdioma.length === 0) {
      return `No hay países registrados para el *${idioma.nombre}* en la base.`
    }

    return `El *${idioma.nombre}* se habla en ${unirLista(
      paisesIdioma.map((item) => `*${item.nombre}*`),
    )}. ${fraseResumenIdioma(idioma)}${notaDialecto(idioma.clave)}`
  }

  if (intenciones.relacion && idiomasComparados.length >= 2) {
    return respuestaRelacion(
      idiomasComparados[0],
      idiomasComparados[1],
      comparacionPorPaises
        ? { paisA: paises[0], paisB: paises[1] }
        : {},
    )
  }

  if (pais && (intenciones.queSeHabla || paises.length === 1)) {
    const idiomaPais = IDIOMAS[pais.idioma]
    return `En *${pais.nombre}* se habla *${idiomaPais.nombre}*. ${fraseResumenIdioma(
      idiomaPais,
    )}${notaDialecto(pais.idioma)}`
  }

  if (intenciones.dialecto && idioma) {
    const dialectos = DIALECTOS[idioma.clave]
    if (!dialectos?.length) {
      return `No hay dialectos registrados para el *${idioma.nombre}* en la base de conocimiento.`
    }

    return `Sí. El *${idioma.nombre}* tiene registrado el dialecto *${dialectos[0].nombre}* (\`${dialectos[0].regla}\`).`
  }

  if (idioma) {
    return `El *${idioma.nombre}* es ${adjetivoFamilia(idioma)}${notaMacro(
      idioma,
    )} y ${fraseOrigen(idioma)}.${frasePaises(idioma)}`
  }

  if (pais) {
    const idiomaPais = IDIOMAS[pais.idioma]
    return `En *${pais.nombre}* se habla *${idiomaPais.nombre}*. ${fraseResumenIdioma(
      idiomaPais,
    )}${notaDialecto(pais.idioma)}`
  }

  return 'No encontré esa relación en la base de conocimiento. 🤔'
}

// Datos tomados de chatbot/base_conocimiento.pl para que la demo pueda
// responder sin necesidad de levantar el motor de Prolog.

export const IDIOMAS = {
  ingles: {
    nombre: 'inglés',
    familia: 'germanica',
    macro: 'indoeuropeo',
    origen: 'protogermánico',
    aliases: ['english'],
  },
  aleman: {
    nombre: 'alemán',
    familia: 'germanica',
    macro: 'indoeuropeo',
    origen: 'protogermánico',
  },
  neerlandes: {
    nombre: 'neerlandés',
    familia: 'germanica',
    macro: 'indoeuropeo',
    origen: 'protogermánico',
    aliases: ['holandés', 'holandes'],
  },
  noruego: {
    nombre: 'noruego',
    familia: 'germanica',
    macro: 'indoeuropeo',
    origen: 'protogermánico',
  },
  sueco: {
    nombre: 'sueco',
    familia: 'germanica',
    macro: 'indoeuropeo',
    origen: 'protogermánico',
  },
  espanol: {
    nombre: 'español',
    familia: 'romance',
    macro: 'indoeuropeo',
    origen: 'latín',
    aliases: ['castellano'],
  },
  frances: {
    nombre: 'francés',
    familia: 'romance',
    macro: 'indoeuropeo',
    origen: 'latín',
  },
  italiano: {
    nombre: 'italiano',
    familia: 'romance',
    macro: 'indoeuropeo',
    origen: 'latín',
  },
  portugues: {
    nombre: 'portugués',
    familia: 'romance',
    macro: 'indoeuropeo',
    origen: 'latín',
  },
  mandarin: {
    nombre: 'mandarín',
    familia: 'grupo_mandarin',
    macro: 'sinotibetanas',
    origen: 'protosinotibetano',
    aliases: ['chino', 'chino mandarín'],
  },
  cantones: {
    nombre: 'cantonés',
    familia: 'grupo_yue',
    macro: 'sinotibetanas',
    origen: 'protosinotibetano',
  },
  shangaines: {
    nombre: 'shanghainés',
    familia: 'grupo_wu',
    macro: 'sinotibetanas',
    origen: 'protosinotibetano',
    aliases: ['shanghaines'],
  },
  finlandes: {
    nombre: 'finlandés',
    familia: 'uralica',
    macro: null,
    origen: 'protourálico',
  },
  ruso: {
    nombre: 'ruso',
    familia: 'eslava',
    macro: 'indoeuropeo',
    origen: 'protoeslavo',
  },
  japones: {
    nombre: 'japonés',
    familia: 'japonica',
    macro: null,
    origen: 'protojapónico',
  },
  coreano: {
    nombre: 'coreano',
    familia: 'coreanica',
    macro: null,
    origen: 'protocoreánico',
  },
  turco: {
    nombre: 'turco',
    familia: 'turquica',
    macro: null,
    origen: 'prototúrquico',
  },
}

export const FAMILIAS = {
  germanica: {
    nombre: 'germánica',
    adjetivo: 'germánico',
    macro: 'indoeuropeo',
    aliases: ['germánico', 'germánicos', 'germánicas'],
  },
  romance: {
    nombre: 'romance',
    adjetivo: 'romance',
    macro: 'indoeuropeo',
    aliases: ['romances', 'románica', 'románicas', 'románicos'],
  },
  eslava: {
    nombre: 'eslava',
    adjetivo: 'eslavo',
    macro: 'indoeuropeo',
    aliases: ['eslavo', 'eslavos', 'eslavas'],
  },
  grupo_mandarin: {
    nombre: 'grupo mandarín',
    adjetivo: 'del grupo mandarín',
    macro: 'sinotibetanas',
    esGrupo: true,
    aliases: ['grupo mandarin', 'familia mandarin'],
  },
  grupo_yue: {
    nombre: 'grupo yue',
    adjetivo: 'del grupo yue',
    macro: 'sinotibetanas',
    esGrupo: true,
    aliases: ['yue'],
  },
  grupo_wu: {
    nombre: 'grupo wu',
    adjetivo: 'del grupo wu',
    macro: 'sinotibetanas',
    esGrupo: true,
    aliases: ['wu'],
  },
  uralica: {
    nombre: 'urálica',
    adjetivo: 'urálico',
    macro: null,
    aliases: ['urálico', 'urálicos', 'urálicas'],
  },
  japonica: {
    nombre: 'japónica',
    adjetivo: 'japónico',
    macro: null,
    aliases: ['japónico', 'japónicos', 'japónicas'],
  },
  coreanica: {
    nombre: 'coreánica',
    adjetivo: 'coreánico',
    macro: null,
    aliases: ['coreánico', 'coreánicos', 'coreánicas'],
  },
  turquica: {
    nombre: 'túrquica',
    adjetivo: 'túrquico',
    macro: null,
    aliases: ['túrquico', 'túrquicos', 'túrquicas'],
  },
  indoeuropeo: {
    nombre: 'indoeuropea',
    plural: 'indoeuropeas',
    adjetivo: 'indoeuropeo',
    macro: null,
    tipo: 'macrofamilia',
    aliases: ['indoeuropeo', 'indoeuropeos', 'indoeuropeas'],
  },
  sinotibetanas: {
    nombre: 'sinotibetanas',
    plural: 'sinotibetanas',
    adjetivo: 'sinotibetano',
    macro: null,
    tipo: 'macrofamilia',
    aliases: ['sinotibetano', 'sinotibetana', 'sinotibetanos'],
  },
}

export const PAISES = {
  reino_unido: {
    nombre: 'Reino Unido',
    idioma: 'ingles',
    aliases: ['uk', 'gran bretaña', 'gran bretana'],
  },
  estados_unidos: {
    nombre: 'Estados Unidos',
    idioma: 'ingles',
    aliases: ['eeuu', 'ee uu', 'usa'],
  },
  inglaterra: {
    nombre: 'Inglaterra',
    idioma: 'ingles',
  },
  alemania: {
    nombre: 'Alemania',
    idioma: 'aleman',
  },
  paises_bajos: {
    nombre: 'Países Bajos',
    idioma: 'neerlandes',
    aliases: ['holanda'],
  },
  noruega: {
    nombre: 'Noruega',
    idioma: 'noruego',
  },
  suecia: {
    nombre: 'Suecia',
    idioma: 'sueco',
  },
  chile: {
    nombre: 'Chile',
    idioma: 'espanol',
  },
  mexico: {
    nombre: 'México',
    idioma: 'espanol',
    aliases: ['méjico', 'mejico'],
  },
  espana: {
    nombre: 'España',
    idioma: 'espanol',
  },
  francia: {
    nombre: 'Francia',
    idioma: 'frances',
  },
  italia: {
    nombre: 'Italia',
    idioma: 'italiano',
  },
  brasil: {
    nombre: 'Brasil',
    idioma: 'portugues',
  },
  finlandia: {
    nombre: 'Finlandia',
    idioma: 'finlandes',
  },
  rusia: {
    nombre: 'Rusia',
    idioma: 'ruso',
  },
  japon: {
    nombre: 'Japón',
    idioma: 'japones',
  },
  corea: {
    nombre: 'Corea',
    idioma: 'coreano',
    aliases: ['corea del sur'],
  },
  turquia: {
    nombre: 'Turquía',
    idioma: 'turco',
  },
  china: {
    nombre: 'China',
    idioma: 'mandarin',
  },
  hong_kong: {
    nombre: 'Hong Kong',
    idioma: 'cantones',
    aliases: ['hongkong'],
  },
  shanghai: {
    nombre: 'Shanghái',
    idioma: 'shangaines',
    aliases: ['shangai'],
  },
}

export const DIALECTOS = {
  espanol: [
    {
      clave: 'chileno',
      nombre: 'chileno',
      regla: 'dialecto_de(espanol, chileno)',
    },
  ],
}

export const ESTADISTICAS = {
  idiomas: Object.keys(IDIOMAS).length,
  paises: Object.keys(PAISES).length,
  dialectos: Object.values(DIALECTOS).reduce(
    (total, lista) => total + lista.length,
    0,
  ),
}

"""Pipeline real del chatbot: pregunta -> consulta Prolog -> respuesta.

El módulo importa `openai` y `pyswip` de forma perezosa para que el servidor
pueda arrancar aunque falten dependencias. En ese caso `responder()` lanza
`MissingDependency` y la API responde 503 con instrucciones concretas.
"""

from __future__ import annotations

import importlib
import importlib.util
import itertools
import os
import re
import shutil
import threading
import time
from pathlib import Path
from typing import Any, Sequence

BASE_DIR = Path(__file__).resolve().parent
KB_PATH = BASE_DIR / "base_conocimiento.pl"
PROMPT_PATH = BASE_DIR / "prompt_a_pl.txt"
PROMPT_NATURAL_PATH = BASE_DIR / "prompt_lenguaje_natural.txt"

DEFAULT_MODEL = "openai/gpt-oss-120b"
DEFAULT_BASE_URL = "https://api.groq.com/openai/v1"
MAX_RESULTS = 50
MAX_HISTORY = 6

# Únicos predicados que el modelo puede usar. La validación de aridad evita
# que una traducción inesperada ejecute algo fuera del dominio del chatbot.
PREDICADOS = {
    "es": 2,
    "se_habla": 2,
    "dialecto_de": 2,
    "idioma": 1,
    "proviene": 2,
    "idiomas_relacionados": 2,
    "mismo_origen": 2,
    "posee_dialecto": 1,
}

VAR_RE = re.compile(r"^[A-Z][A-Za-z0-9_]*$")
VAR_ANONIMA_RE = re.compile(r"^_([A-Z][A-Za-z0-9_]*)?$")
ATOMO_RE = re.compile(r"^[a-z][a-z0-9_]*$")
CONSULTA_RE = re.compile(r"^([a-z][a-z0-9_]*)\s*\((.*)\)\s*\.$")
CONSULTA_EN_TEXTO_RE = re.compile(
    r"[a-z][a-z0-9_]*\s*\([^()\n]*\)\s*\.", re.IGNORECASE
)

_lock_prolog = threading.Lock()
_lock_cliente = threading.Lock()
_prolog: Any = None
_cliente: Any = None


class MissingDependency(RuntimeError):
    """Falta una dependencia de sistema o de Python."""


class PipelineError(RuntimeError):
    """El pipeline no pudo completar la consulta."""


def _resumen_error(error: BaseException) -> str:
    texto = " ".join(str(error).split())
    return texto[:300] if texto else error.__class__.__name__


def _leer_archivo(ruta: Path, descripcion: str) -> str:
    try:
        return ruta.read_text(encoding="utf-8")
    except OSError as error:
        raise PipelineError(
            f"No se pudo leer {descripcion} ({ruta.name}): {_resumen_error(error)}"
        ) from error


def _importar(nombre: str) -> Any:
    try:
        return importlib.import_module(nombre)
    except Exception as error:  # ImportError y errores nativos de la librería
        if "SWI-Prolog not found" in str(error) or "SwiPrologNotFoundError" in type(
            error
        ).__name__:
            raise MissingDependency(
                "No se encontró SWI-Prolog. Instálalo "
                "(`brew install swi-prolog` en macOS) y comprueba que `swipl` "
                "esté en PATH."
            ) from error

        raise MissingDependency(
            f"Falta la dependencia Python '{nombre}'. "
            "Instala las dependencias de chatbot/requirements.txt."
        ) from error


def dependencias() -> dict[str, bool]:
    """Estado de las piezas necesarias para ejecutar el pipeline real."""

    return {
        "openai": importlib.util.find_spec("openai") is not None,
        "pyswip": importlib.util.find_spec("pyswip") is not None,
        "swipl": shutil.which("swipl") is not None,
        "groqKey": bool(os.getenv("GROQ_API_KEY", "").strip()),
        "baseConocimiento": KB_PATH.is_file(),
        "prompt": PROMPT_PATH.is_file(),
        "promptNatural": PROMPT_NATURAL_PATH.is_file(),
    }


def modelo_actual() -> str:
    return os.getenv("GROQ_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL


def _cargar_prolog() -> Any:
    global _prolog

    if _prolog is not None:
        return _prolog

    with _lock_prolog:
        if _prolog is not None:
            return _prolog

        pyswip = _importar("pyswip")

        try:
            motor = pyswip.Prolog()
            motor.consult(str(KB_PATH))
        except Exception as error:
            raise MissingDependency(
                "No se pudo iniciar SWI-Prolog. Instala el motor "
                "(`brew install swi-prolog` en macOS) y comprueba que `swipl` "
                f"esté en PATH. Detalle: {_resumen_error(error)}"
            ) from error

        _prolog = motor
        return _prolog


def _cargar_cliente() -> Any:
    global _cliente

    if _cliente is not None:
        return _cliente

    with _lock_cliente:
        if _cliente is not None:
            return _cliente

        clave = os.getenv("GROQ_API_KEY", "").strip()
        if not clave:
            raise MissingDependency(
                "Falta GROQ_API_KEY. Crea chatbot/.env a partir de "
                "chatbot/.env.example y define tu clave de Groq."
            )

        openai = _importar("openai")
        base_url = (
            os.getenv("GROQ_BASE_URL", DEFAULT_BASE_URL).strip() or DEFAULT_BASE_URL
        )

        try:
            _cliente = openai.OpenAI(api_key=clave, base_url=base_url)
        except Exception as error:
            raise MissingDependency(
                "No se pudo crear el cliente de Groq: "
                + _resumen_error(error)
            ) from error

        return _cliente


def _historial_limpio(historial: Sequence[Any] | None) -> list[dict[str, str]]:
    limpio: list[dict[str, str]] = []

    for item in list(historial or [])[-MAX_HISTORY:]:
        if isinstance(item, dict):
            rol = item.get("role")
            contenido = item.get("content")
        else:
            rol = getattr(item, "role", None)
            contenido = getattr(item, "content", None)

        if rol not in {"user", "assistant"} or not isinstance(contenido, str):
            continue

        texto = contenido.strip()
        if texto:
            limpio.append({"role": rol, "content": texto[:600]})

    return limpio


def _completar(
    mensajes: list[dict[str, str]],
    *,
    max_tokens: int,
    temperature: float,
) -> tuple[str, Any]:
    cliente = _cargar_cliente()

    try:
        respuesta = cliente.chat.completions.create(
            model=modelo_actual(),
            temperature=temperature,
            max_tokens=max_tokens,
            messages=mensajes,
        )
    except Exception as error:
        raise PipelineError(
            "El proveedor del modelo no respondió: " + _resumen_error(error)
        ) from error

    try:
        contenido = respuesta.choices[0].message.content or ""
    except (AttributeError, IndexError, TypeError) as error:
        raise PipelineError(
            "El proveedor devolvió una respuesta sin contenido."
        ) from error

    return contenido, getattr(respuesta, "usage", None)


def _mensajes_traduccion(
    pregunta: str, historial: Sequence[Any] | None
) -> list[dict[str, str]]:
    prompt = _leer_archivo(PROMPT_PATH, "el prompt de traducción").strip()
    base = _leer_archivo(KB_PATH, "la base de conocimiento").strip()

    sistema = (
        f"{prompt}\n\n"
        "### BASE DE CONOCIMIENTO\n"
        f"{base}\n\n"
        "Responde únicamente con una consulta Prolog de una línea terminada "
        "en punto. No agregues explicaciones."
    )

    mensajes = [{"role": "system", "content": sistema}]
    mensajes.extend(_historial_limpio(historial))
    mensajes.append({"role": "user", "content": pregunta.strip()})
    return mensajes


def _extraer_consulta(texto: str) -> str:
    """Limpia Markdown y extrae la primera consulta Prolog del texto."""

    limpio = texto.strip()
    if not limpio:
        raise PipelineError("El modelo no devolvió ninguna consulta Prolog.")

    limpio = re.sub(r"^```[a-zA-Z]*\s*", "", limpio)
    limpio = re.sub(r"\s*```$", "", limpio)

    # Buscar primero dentro del texto: tolera prefijos como "?- " o
    # "Consulta: " que el modelo agrega de vez en cuando.
    coincidencia = CONSULTA_EN_TEXTO_RE.search(limpio)
    if coincidencia:
        return coincidencia.group(0).strip()

    for linea in (linea.strip().strip("`").strip() for linea in limpio.splitlines()):
        if linea.endswith(".") and "(" in linea and ")" in linea:
            return linea

    raise PipelineError(
        "El modelo devolvió una traducción que no parece una consulta Prolog."
    )


def validar_consulta(consulta: str) -> str:
    """Acepta solo consultas del dominio, con átomos y variables seguros."""

    normalizada = consulta.strip()

    if len(normalizada) > 240:
        raise PipelineError("La consulta generada es demasiado larga.")

    coincidencia = CONSULTA_RE.fullmatch(normalizada)
    if not coincidencia:
        raise PipelineError(
            "La consulta generada no tiene el formato permitido."
        )

    predicado = coincidencia.group(1)
    argumentos_texto = coincidencia.group(2).strip()

    if predicado not in PREDICADOS:
        raise PipelineError(
            f"El predicado '{predicado}' no está permitido para el chatbot."
        )

    if "(" in argumentos_texto or ")" in argumentos_texto:
        raise PipelineError("La consulta generada contiene paréntesis anidados.")

    argumentos = (
        [argumento.strip() for argumento in argumentos_texto.split(",")]
        if argumentos_texto
        else []
    )

    if len(argumentos) != PREDICADOS[predicado]:
        raise PipelineError(
            f"El predicado '{predicado}' espera {PREDICADOS[predicado]} "
            f"argumento(s) y recibió {len(argumentos)}."
        )

    for argumento in argumentos:
        if not (
            VAR_RE.fullmatch(argumento)
            or VAR_ANONIMA_RE.fullmatch(argumento)
            or ATOMO_RE.fullmatch(argumento)
        ):
            raise PipelineError(
                f"El argumento '{argumento}' no es un átomo o variable válida."
            )

    return normalizada


def _texto_valor(valor: Any) -> str:
    if isinstance(valor, bytes):
        return valor.decode("utf-8", errors="replace")
    return str(valor)


def _consultar_prolog(consulta: str) -> tuple[list[dict[str, Any]], bool]:
    motor = _cargar_prolog()

    with _lock_prolog:
        try:
            generador = motor.query(consulta)
            try:
                resultados = list(
                    itertools.islice(generador, MAX_RESULTS + 1)
                )
            finally:
                cerrar = getattr(generador, "close", None)
                if callable(cerrar):
                    cerrar()
        except Exception as error:
            raise PipelineError(
                "SWI-Prolog rechazó la consulta: " + _resumen_error(error)
            ) from error

    truncado = len(resultados) > MAX_RESULTS
    return resultados[:MAX_RESULTS], truncado


def _formatear_resultado(
    resultados: list[dict[str, Any]], truncado: bool
) -> tuple[str, list[str]]:
    if not resultados:
        return "false.", []

    if len(resultados) == 1 and not resultados[0]:
        return "true.", ["true"]

    partes: list[str] = []
    filas: list[str] = []

    for fila in resultados:
        if not fila:
            partes.append("true")
            filas.append("true")
            continue

        asignaciones = ", ".join(
            f"{variable} = {_texto_valor(valor)}"
            for variable, valor in fila.items()
        )
        partes.append(asignaciones)
        filas.append(asignaciones)

    texto = "; ".join(partes) + "."
    if truncado:
        texto = (
            f"{'; '.join(partes)} ... "
            f"(limitado a los primeros {MAX_RESULTS} resultados)."
        )

    return texto, filas


def _resumen_soluciones(
    resultados: list[dict[str, Any]], truncado: bool
) -> str:
    if not resultados:
        return "sin soluciones"

    if truncado:
        return f"primeras {MAX_RESULTS} soluciones"

    if len(resultados) == 1:
        return "1 solución"

    return f"{len(resultados)} soluciones"


def _respuesta_de_respaldo(resultado: str) -> str:
    if resultado == "false.":
        return (
            "La base de conocimiento no registra esa relación para los datos "
            "consultados."
        )

    if resultado == "true.":
        return "La base de conocimiento confirma que la relación se cumple."

    valores = resultado.rstrip(".").strip()
    return f"Según la base de conocimiento, la consulta devuelve: {valores}."


def _mensajes_respuesta(
    pregunta: str, consulta: str, resultado: str
) -> list[dict[str, str]]:
    try:
        guia = _leer_archivo(
            PROMPT_NATURAL_PATH, "la guía de respuesta en lenguaje natural"
        ).strip()
    except PipelineError:
        guia = ""

    sistema = (
        (f"{guia}\n\n" if guia else "")
        + "### RESULTADO VERIFICADO\n"
        "Ese resultado es la fuente de verdad y proviene de la base de "
        "conocimiento del proyecto.\n\n"
        "Redacta la respuesta final en español neutro, clara y completa (entre "
        "dos y cuatro frases). Usa el resultado y las relaciones registradas en "
        "la base; puedes mencionar la familia, la macrofamilia, el origen, los "
        "países y los dialectos cuando aporten contexto. Responde solo a la "
        "última pregunta. No menciones la fuente ni la base de conocimiento, no "
        "inventes datos y no incluyas notación Prolog ni nombres de predicados. "
        "Si el resultado es false o está vacío, dilo con naturalidad."
    )

    usuario = (
        f"Pregunta: {pregunta.strip()}\n"
        f"Consulta ejecutada: {consulta}\n"
        f"Resultado: {resultado}\n\n"
        "Redacta la respuesta final para la persona."
    )

    return [
        {"role": "system", "content": sistema},
        {"role": "user", "content": usuario},
    ]


def _milisegundos(inicio: float) -> int:
    return max(1, round((time.perf_counter() - inicio) * 1000))


def _chips_analisis() -> list[str]:
    return [modelo_actual(), "Groq"]


def responder(
    pregunta: str, historial: Sequence[Any] | None = None
) -> dict[str, Any]:
    """Ejecuta el pipeline completo y devuelve respuesta + traza."""

    pregunta = (pregunta or "").strip()
    if not pregunta:
        raise PipelineError("La pregunta está vacía.")

    inicio_total = time.perf_counter()

    # Comprobar las dos piezas antes de gastar una llamada al modelo.
    _cargar_cliente()
    _cargar_prolog()

    # 1. El modelo traduce la pregunta a una consulta del dominio.
    inicio = time.perf_counter()
    crudo, uso_traduccion = _completar(
        _mensajes_traduccion(pregunta, historial),
        max_tokens=120,
        temperature=0.0,
    )
    consulta = validar_consulta(_extraer_consulta(crudo))
    ms_traduccion = _milisegundos(inicio)

    # 2. SWI-Prolog evalúa la consulta validada.
    inicio = time.perf_counter()
    resultados, truncado = _consultar_prolog(consulta)
    ms_consulta = _milisegundos(inicio)

    resultado, filas = _formatear_resultado(resultados, truncado)

    # 3. El modelo redacta la respuesta natural a partir del resultado.
    inicio = time.perf_counter()
    try:
        respuesta, uso_respuesta = _completar(
            _mensajes_respuesta(pregunta, consulta, resultado),
            max_tokens=220,
            temperature=0.2,
        )
        respuesta = respuesta.strip()
        detalle_respuesta = (
            "Redactada por el modelo a partir del resultado de SWI-Prolog."
        )
    except PipelineError as error:
        respuesta = _respuesta_de_respaldo(resultado)
        uso_respuesta = None
        detalle_respuesta = (
            "El modelo no pudo redactar la respuesta; se usó un resumen "
            f"determinista. Detalle: {error}"
        )

    if not respuesta:
        respuesta = _respuesta_de_respaldo(resultado)
        detalle_respuesta = (
            "El modelo devolvió una respuesta vacía; se usó un resumen "
            "determinista."
        )

    ms_respuesta = _milisegundos(inicio)
    duracion_total = _milisegundos(inicio_total)
    modelo = modelo_actual()

    pasos = [
        {
            "id": "analisis",
            "kind": "analysis",
            "title": "Interpretación de la pregunta",
            "summary": "Se tradujo la pregunta al dominio de idiomas.",
            "detail": (
                "El modelo recibió la pregunta, el historial reciente y el "
                "esquema de la base para elegir un predicado permitido."
            ),
            "chips": _chips_analisis(),
            "durationMs": ms_traduccion,
        },
        {
            "id": "consulta",
            "kind": "query",
            "title": "Traducción a Prolog",
            "summary": "Consulta validada contra los predicados permitidos.",
            "code": consulta,
            "detail": (
                "Se verificó el predicado, la aridad y que los argumentos "
                "fueran átomos o variables seguras antes de ejecutarla."
            ),
            "durationMs": 1,
        },
        {
            "id": "resultado",
            "kind": "result",
            "title": "Consulta en la base",
            "summary": _resumen_soluciones(resultados, truncado),
            "code": resultado,
            "rows": filas,
            "detail": (
                "Resultado real devuelto por SWI-Prolog sobre "
                "base_conocimiento.pl."
            ),
            "durationMs": ms_consulta,
        },
        {
            "id": "respuesta",
            "kind": "answer",
            "title": "Respuesta en lenguaje natural",
            "summary": respuesta,
            "detail": detalle_respuesta,
            "durationMs": ms_respuesta,
        },
    ]

    return {
        "reply": respuesta,
        "prologQuery": consulta,
        "prologResult": resultado,
        "trace": {
            "mode": "api",
            "model": modelo,
            "durationMs": duracion_total,
            "steps": pasos,
            "nota": (
                "Traza real: Groq propone la consulta y SWI-Prolog la evalúa "
                "sobre base_conocimiento.pl."
            ),
        },
        "meta": {
            "mode": "api",
            "model": modelo,
            "durationMs": duracion_total,
            "usage": {
                "traduccion": _uso_a_dict(uso_traduccion),
                "respuesta": _uso_a_dict(uso_respuesta),
            },
        },
    }


def _uso_a_dict(uso: Any) -> dict[str, int] | None:
    if uso is None:
        return None

    campos = ("prompt_tokens", "completion_tokens", "total_tokens")
    datos = {
        campo: getattr(uso, campo)
        for campo in campos
        if isinstance(getattr(uso, campo, None), int)
    }
    return datos or None

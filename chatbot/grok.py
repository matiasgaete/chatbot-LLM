import os
from openai import OpenAI
from pyswip import Prolog

prolog = Prolog()
prolog.consult("base_conocimiento.pl")

with open("prompt_a_pl.txt", "r", encoding="utf-8") as f:
    KB = f.read()

cliente = OpenAI(
    api_key="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",
    base_url="https://api.groq.com/openai/v1",
)

sistema = f"{KB}"

stream = cliente.chat.completions.create(
    model="openai/gpt-oss-120b",  # confirma el nombre con cliente.models.list()
    temperature=0.0,
    stream=True,
    messages=[
        {"role": "system", "content": sistema},
        {"role": "user", "content": "el ingles de donde proviene?"},
    ],
)

consulta = []

for chunk in stream:
    if chunk.choices and chunk.choices[0].delta.content:
        consulta.append(chunk.choices[0].delta.content)


consulta = "".join(consulta)

stream = cliente.chat.completions.create(
    model="openai/gpt-oss-120b",  # confirma el nombre con cliente.models.list()
    temperature=0.0,
    stream=True,
    messages=[
        {"role": "system", "content": sistema},
        {"role": "user", "content": f"considera la pregunta (de donde proviene el ingles?) y la respuest prolog ({list(prolog.query(consulta))}) y respondela en lenguaje natural sin notacion prolog"},
    ],
)

for chunk in stream:
    if chunk.choices and chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)

print(list(prolog.query(consulta)))

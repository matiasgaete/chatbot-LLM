import os
from pathlib import Path

from openai import OpenAI

BASE_DIR = Path(__file__).resolve().parent

try:
    from dotenv import load_dotenv

    load_dotenv(BASE_DIR / ".env")
except ImportError:
    pass

with open(BASE_DIR / "prompt_lenguaje_natural.txt", "r", encoding="utf-8") as f:
    KB = f.read()

clave = os.getenv("GROQ_API_KEY", "").strip()
if not clave:
    raise SystemExit(
        "Falta GROQ_API_KEY. Crea chatbot/.env a partir de chatbot/.env.example "
        "y define tu clave de Groq."
    )

cliente = OpenAI(
    api_key=clave,
    base_url=os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1").strip(),
)

sistema = f"{KB}"


context = [{"role": "system", "content": sistema}]
while True:
    try:
        user_input = input("user: ")
    except (EOFError, KeyboardInterrupt):
        print("")
        break

    if not user_input.strip():
        continue

    context.append({"role": "user", "content": f"{user_input}"})
    stream = cliente.chat.completions.create(
        model=os.getenv("GROQ_MODEL", "openai/gpt-oss-120b").strip(),
        temperature=2.0,
        stream=True,
        messages=context,
    )

    print("IA: ", end="", flush=True)
    for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            print(chunk.choices[0].delta.content, end="", flush=True)
    print("")

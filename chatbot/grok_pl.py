import os
from openai import OpenAI

with open("chatbot/prompt_lenguaje_natural.txt", "r", encoding="utf-8") as f:
    KB = f.read()

cliente = OpenAI(
    api_key="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",
    base_url="https://api.groq.com/openai/v1",
)

sistema = f"{KB}"


context = [{"role": "system", "content": sistema}]
while True:
    user_input = input("user: ")
    context.append({"role": "user", "content": f"{user_input}"})
    stream = cliente.chat.completions.create(
        model="openai/gpt-oss-120b",  # confirma el nombre con cliente.models.list()
        temperature=2.0,
        stream=True,
        messages=context
    )

    print("IA: ", end="", flush=True)
    for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            print(chunk.choices[0].delta.content, end="", flush=True)
    print("")



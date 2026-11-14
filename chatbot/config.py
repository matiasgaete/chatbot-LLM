from openai import OpenAI

with open("chatbot/prompt_lenguaje_natural.txt", "r", encoding="utf-8") as f:
    KB = f.read()

cliente = OpenAI(
    api_key="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",
    base_url="https://api.groq.com/openai/v1",
)

sistema = f"{KB}"

context = [{"role": "system", "content": sistema}]
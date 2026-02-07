import openai

from app.config import settings


class OpenAIProvider:
    def __init__(self) -> None:
        self._client = openai.AsyncOpenAI(api_key=settings.openai_api_key)

    async def generate(self, system_prompt: str, messages: list[dict[str, str]]) -> str:
        all_messages = [{"role": "system", "content": system_prompt}, *messages]
        response = await self._client.chat.completions.create(
            model=settings.effective_model,
            messages=all_messages,
            max_tokens=4096,
        )
        return response.choices[0].message.content or ""

import anthropic

from app.config import settings


class AnthropicProvider:
    def __init__(self) -> None:
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def generate(self, system_prompt: str, messages: list[dict[str, str]]) -> str:
        response = await self._client.messages.create(
            model=settings.effective_model,
            max_tokens=4096,
            system=system_prompt,
            messages=messages,
        )
        return response.content[0].text

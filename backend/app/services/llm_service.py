from app.config import settings
from app.providers.anthropic_provider import AnthropicProvider
from app.providers.base import LLMProvider
from app.providers.openai_provider import OpenAIProvider


class LLMService:
    def __init__(self) -> None:
        self._provider: LLMProvider | None = None

    @property
    def provider(self) -> LLMProvider:
        if self._provider is None:
            if settings.llm_provider == "openai":
                self._provider = OpenAIProvider()
            else:
                self._provider = AnthropicProvider()
        return self._provider

    async def generate(self, system_prompt: str, messages: list[dict[str, str]]) -> str:
        return await self.provider.generate(system_prompt, messages)

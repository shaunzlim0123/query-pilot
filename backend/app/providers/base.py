from typing import Protocol


class LLMProvider(Protocol):
    async def generate(self, system_prompt: str, messages: list[dict[str, str]]) -> str: ...

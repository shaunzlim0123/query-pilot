from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # LLM
    llm_provider: str = "anthropic"
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    llm_model: str = ""  # empty = use provider default

    # Neo4j
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "querypilot"

    # Paths
    data_dir: Path = Path("data")
    upload_dir: Path = Path("data/uploads")
    sqlite_url: str = "sqlite+aiosqlite:///data/querypilot.db"
    duckdb_path: str = "data/querypilot.duckdb"

    # Slack
    slack_webhook_url: str = ""

    model_config = {"env_file": ".env", "extra": "ignore"}

    @property
    def effective_model(self) -> str:
        if self.llm_model:
            return self.llm_model
        if self.llm_provider == "openai":
            return "gpt-4o"
        return "claude-sonnet-4-5-20250514"


settings = Settings()

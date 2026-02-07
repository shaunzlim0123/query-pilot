from collections.abc import AsyncGenerator

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import async_session_factory
from app.services.duckdb_service import DuckDBService
from app.services.llm_service import LLMService
from app.services.neo4j_service import Neo4jService
from app.services.scheduler_service import SchedulerService


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session


def get_duckdb(request: Request) -> DuckDBService:
    return request.app.state.duckdb


def get_neo4j(request: Request) -> Neo4jService:
    return request.app.state.neo4j


def get_llm(request: Request) -> LLMService:
    return request.app.state.llm


def get_scheduler(request: Request) -> SchedulerService:
    return request.app.state.scheduler

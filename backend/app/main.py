import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import settings
from app.models.database import init_db
from app.services.duckdb_service import DuckDBService
from app.services.llm_service import LLMService
from app.services.neo4j_service import Neo4jService
from app.services.scheduler_service import SchedulerService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup
    logger.info("Starting QueryPilot...")

    # Ensure data directories exist
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    settings.upload_dir.mkdir(parents=True, exist_ok=True)

    # Initialize SQLite
    await init_db()
    logger.info("SQLite initialized")

    # Initialize DuckDB
    duckdb = DuckDBService()
    duckdb.connect()
    app.state.duckdb = duckdb
    logger.info("DuckDB connected")

    # Initialize Neo4j
    neo4j = Neo4jService()
    try:
        await neo4j.connect()
        logger.info("Neo4j connected")
    except Exception as e:
        logger.warning(f"Neo4j connection failed (metrics/reports will be unavailable): {e}")
    app.state.neo4j = neo4j

    # Initialize LLM service
    app.state.llm = LLMService()
    logger.info(f"LLM provider: {settings.llm_provider}")

    # Initialize scheduler
    scheduler = SchedulerService(duckdb, neo4j)
    try:
        await scheduler.start()
    except Exception as e:
        logger.warning(f"Scheduler start failed: {e}")
    app.state.scheduler = scheduler

    yield

    # Shutdown
    logger.info("Shutting down QueryPilot...")
    await scheduler.stop()
    await neo4j.close()
    duckdb.close()


app = FastAPI(title="QueryPilot", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
async def health():
    return {"status": "ok"}

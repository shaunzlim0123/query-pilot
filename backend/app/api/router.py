from fastapi import APIRouter

from app.api.alarms import router as alarms_router
from app.api.datasets import router as datasets_router
from app.api.metrics import router as metrics_router
from app.api.queries import router as queries_router
from app.api.reports import router as reports_router

api_router = APIRouter(prefix="/api")
api_router.include_router(datasets_router)
api_router.include_router(queries_router)
api_router.include_router(metrics_router)
api_router.include_router(reports_router)
api_router.include_router(alarms_router)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_duckdb, get_neo4j, get_scheduler
from app.models.report import Report, ReportSchedule
from app.schemas.report import (
    ReportResponse,
    ReportScheduleCreate,
    ReportScheduleResponse,
    ReportScheduleUpdate,
)
from app.services.duckdb_service import DuckDBService
from app.services.neo4j_service import Neo4jService
from app.services.report_service import ReportService
from app.services.scheduler_service import SchedulerService

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/schedules", response_model=ReportScheduleResponse)
async def create_schedule(
    body: ReportScheduleCreate,
    db: AsyncSession = Depends(get_db),
    scheduler: SchedulerService = Depends(get_scheduler),
):
    schedule = ReportSchedule(
        name=body.name,
        root_metric_id=body.root_metric_id,
        cron_expression=body.cron_expression,
    )
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)
    scheduler.add_report_job(schedule.id, schedule.cron_expression)
    return schedule


@router.get("/schedules", response_model=list[ReportScheduleResponse])
async def list_schedules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ReportSchedule).order_by(ReportSchedule.created_at.desc())
    )
    return result.scalars().all()


@router.put("/schedules/{schedule_id}", response_model=ReportScheduleResponse)
async def update_schedule(
    schedule_id: str,
    body: ReportScheduleUpdate,
    db: AsyncSession = Depends(get_db),
    scheduler: SchedulerService = Depends(get_scheduler),
):
    schedule = await db.get(ReportSchedule, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    if body.name is not None:
        schedule.name = body.name
    if body.cron_expression is not None:
        schedule.cron_expression = body.cron_expression
    if body.is_active is not None:
        schedule.is_active = body.is_active

    await db.commit()
    await db.refresh(schedule)

    if schedule.is_active:
        scheduler.add_report_job(schedule.id, schedule.cron_expression)
    else:
        scheduler.remove_report_job(schedule.id)

    return schedule


@router.delete("/schedules/{schedule_id}")
async def delete_schedule(
    schedule_id: str,
    db: AsyncSession = Depends(get_db),
    scheduler: SchedulerService = Depends(get_scheduler),
):
    schedule = await db.get(ReportSchedule, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    scheduler.remove_report_job(schedule.id)
    await db.delete(schedule)
    await db.commit()
    return {"detail": "Schedule deleted"}


@router.post("/schedules/{schedule_id}/run", response_model=ReportResponse)
async def run_report(
    schedule_id: str,
    db: AsyncSession = Depends(get_db),
    duckdb: DuckDBService = Depends(get_duckdb),
    neo4j: Neo4jService = Depends(get_neo4j),
):
    service = ReportService(db, duckdb, neo4j)
    report = await service.generate_report(schedule_id)
    if not report:
        raise HTTPException(status_code=404, detail="Schedule not found or no metrics")
    return report


@router.get("/", response_model=list[ReportResponse])
async def list_reports(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Report).order_by(Report.generated_at.desc()))
    return result.scalars().all()


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: str, db: AsyncSession = Depends(get_db)):
    report = await db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies import get_db, get_duckdb, get_neo4j, get_scheduler
from app.models.alarm import Alarm, AlarmEvent
from app.schemas.alarm import (
    AlarmCreate,
    AlarmEventResponse,
    AlarmResponse,
    AlarmUpdate,
)
from app.services.alarm_service import AlarmService
from app.services.duckdb_service import DuckDBService
from app.services.neo4j_service import Neo4jService
from app.services.scheduler_service import SchedulerService

router = APIRouter(prefix="/alarms", tags=["alarms"])


@router.post("/", response_model=AlarmResponse)
async def create_alarm(
    body: AlarmCreate,
    db: AsyncSession = Depends(get_db),
    scheduler: SchedulerService = Depends(get_scheduler),
):
    alarm = Alarm(
        name=body.name,
        metric_id=body.metric_id,
        operator=body.operator,
        threshold=body.threshold,
        check_interval=body.check_interval,
        slack_webhook=body.slack_webhook,
    )
    db.add(alarm)
    await db.commit()
    await db.refresh(alarm)
    scheduler.add_alarm_job(alarm.id, alarm.check_interval)
    return alarm


@router.get("/", response_model=list[AlarmResponse])
async def list_alarms(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alarm).order_by(Alarm.created_at.desc()))
    return result.scalars().all()


@router.put("/{alarm_id}", response_model=AlarmResponse)
async def update_alarm(
    alarm_id: str,
    body: AlarmUpdate,
    db: AsyncSession = Depends(get_db),
    scheduler: SchedulerService = Depends(get_scheduler),
):
    alarm = await db.get(Alarm, alarm_id)
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")

    if body.name is not None:
        alarm.name = body.name
    if body.operator is not None:
        alarm.operator = body.operator
    if body.threshold is not None:
        alarm.threshold = body.threshold
    if body.check_interval is not None:
        alarm.check_interval = body.check_interval
    if body.slack_webhook is not None:
        alarm.slack_webhook = body.slack_webhook
    if body.is_active is not None:
        alarm.is_active = body.is_active

    await db.commit()
    await db.refresh(alarm)

    if alarm.is_active:
        scheduler.add_alarm_job(alarm.id, alarm.check_interval)
    else:
        scheduler.remove_alarm_job(alarm.id)

    return alarm


@router.delete("/{alarm_id}")
async def delete_alarm(
    alarm_id: str,
    db: AsyncSession = Depends(get_db),
    scheduler: SchedulerService = Depends(get_scheduler),
):
    alarm = await db.get(Alarm, alarm_id)
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    scheduler.remove_alarm_job(alarm.id)
    await db.delete(alarm)
    await db.commit()
    return {"detail": "Alarm deleted"}


@router.get("/{alarm_id}/history", response_model=list[AlarmEventResponse])
async def alarm_history(
    alarm_id: str,
    db: AsyncSession = Depends(get_db),
):
    alarm = await db.get(Alarm, alarm_id)
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")

    result = await db.execute(
        select(AlarmEvent)
        .where(AlarmEvent.alarm_id == alarm_id)
        .order_by(AlarmEvent.sent_at.desc())
        .limit(100)
    )
    return result.scalars().all()


@router.post("/{alarm_id}/test")
async def test_alarm(
    alarm_id: str,
    db: AsyncSession = Depends(get_db),
    duckdb: DuckDBService = Depends(get_duckdb),
    neo4j: Neo4jService = Depends(get_neo4j),
):
    alarm = await db.get(Alarm, alarm_id)
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    service = AlarmService(db, duckdb, neo4j)
    return await service.test_alarm(alarm)

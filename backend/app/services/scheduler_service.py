import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alarm import Alarm
from app.models.database import async_session_factory
from app.models.report import ReportSchedule
from app.services.alarm_service import AlarmService
from app.services.duckdb_service import DuckDBService
from app.services.neo4j_service import Neo4jService
from app.services.report_service import ReportService

logger = logging.getLogger(__name__)


class SchedulerService:
    def __init__(self, duckdb: DuckDBService, neo4j: Neo4jService) -> None:
        self.scheduler = AsyncIOScheduler()
        self.duckdb = duckdb
        self.neo4j = neo4j

    async def start(self) -> None:
        await self._load_alarm_jobs()
        await self._load_report_jobs()
        self.scheduler.start()
        logger.info("Scheduler started")

    async def stop(self) -> None:
        self.scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")

    async def _load_alarm_jobs(self) -> None:
        async with async_session_factory() as db:
            result = await db.execute(select(Alarm).where(Alarm.is_active == True))
            alarms = result.scalars().all()
            for alarm in alarms:
                self.add_alarm_job(alarm.id, alarm.check_interval)

    async def _load_report_jobs(self) -> None:
        async with async_session_factory() as db:
            result = await db.execute(
                select(ReportSchedule).where(ReportSchedule.is_active == True)
            )
            schedules = result.scalars().all()
            for schedule in schedules:
                self.add_report_job(schedule.id, schedule.cron_expression)

    def add_alarm_job(self, alarm_id: str, interval_seconds: int) -> None:
        job_id = f"alarm_{alarm_id}"
        self.scheduler.add_job(
            self._run_alarm_check,
            trigger=IntervalTrigger(seconds=interval_seconds),
            id=job_id,
            args=[alarm_id],
            replace_existing=True,
        )
        logger.info(f"Added alarm job {job_id} (every {interval_seconds}s)")

    def remove_alarm_job(self, alarm_id: str) -> None:
        job_id = f"alarm_{alarm_id}"
        try:
            self.scheduler.remove_job(job_id)
            logger.info(f"Removed alarm job {job_id}")
        except Exception:
            pass

    def add_report_job(self, schedule_id: str, cron_expression: str) -> None:
        job_id = f"report_{schedule_id}"
        parts = cron_expression.split()
        if len(parts) == 5:
            trigger = CronTrigger(
                minute=parts[0],
                hour=parts[1],
                day=parts[2],
                month=parts[3],
                day_of_week=parts[4],
            )
        else:
            trigger = CronTrigger(day="1", hour="9")

        self.scheduler.add_job(
            self._run_report_generation,
            trigger=trigger,
            id=job_id,
            args=[schedule_id],
            replace_existing=True,
        )
        logger.info(f"Added report job {job_id} ({cron_expression})")

    def remove_report_job(self, schedule_id: str) -> None:
        job_id = f"report_{schedule_id}"
        try:
            self.scheduler.remove_job(job_id)
            logger.info(f"Removed report job {job_id}")
        except Exception:
            pass

    async def _run_alarm_check(self, alarm_id: str) -> None:
        async with async_session_factory() as db:
            alarm = await db.get(Alarm, alarm_id)
            if not alarm or not alarm.is_active:
                return
            service = AlarmService(db, self.duckdb, self.neo4j)
            try:
                await service.evaluate(alarm)
            except Exception as e:
                logger.error(f"Alarm check failed for {alarm_id}: {e}")

    async def _run_report_generation(self, schedule_id: str) -> None:
        async with async_session_factory() as db:
            service = ReportService(db, self.duckdb, self.neo4j)
            try:
                await service.generate_report(schedule_id)
                logger.info(f"Report generated for schedule {schedule_id}")
            except Exception as e:
                logger.error(f"Report generation failed for {schedule_id}: {e}")

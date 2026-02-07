import statistics
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.report import MetricSnapshot, Report, ReportSchedule
from app.services.duckdb_service import DuckDBService
from app.services.neo4j_service import Neo4jService


class ReportService:
    def __init__(
        self, db: AsyncSession, duckdb: DuckDBService, neo4j: Neo4jService
    ) -> None:
        self.db = db
        self.duckdb = duckdb
        self.neo4j = neo4j

    async def generate_report(self, schedule_id: str) -> Report | None:
        schedule = await self.db.get(ReportSchedule, schedule_id)
        if not schedule:
            return None

        now = datetime.utcnow()
        current_period = now.strftime("%Y-%m")
        # Previous period
        if now.month == 1:
            prev_period = f"{now.year - 1}-12"
        else:
            prev_period = f"{now.year}-{now.month - 1:02d}"

        # Get full metric subtree
        metrics = await self.neo4j.get_subtree_flat(schedule.root_metric_id)
        if not metrics:
            return None

        report_data = {"metrics": [], "period": current_period, "prev_period": prev_period}

        for metric in metrics:
            metric_result = await self._compute_metric(metric, current_period, prev_period)
            report_data["metrics"].append(metric_result)

        report = Report(
            schedule_id=schedule_id,
            report_data=report_data,
            period_start=prev_period,
            period_end=current_period,
        )
        self.db.add(report)
        schedule.last_run_at = now
        await self.db.commit()
        await self.db.refresh(report)
        return report

    async def _compute_metric(
        self, metric: dict, current_period: str, prev_period: str
    ) -> dict:
        result = {
            "metric_id": metric["id"],
            "metric_name": metric["name"],
            "unit": metric.get("unit", ""),
            "depth": metric.get("depth", 0),
            "current_value": None,
            "previous_value": None,
            "delta": None,
            "pct_change": None,
            "is_anomaly": False,
            "error": None,
        }

        sql = metric.get("sql_query", "")
        if not sql:
            result["error"] = "No SQL query defined"
            return result

        # Execute for current period
        try:
            current_sql = sql.replace("$period", f"'{current_period}'")
            _, rows, _ = self.duckdb.execute_query(current_sql)
            if rows:
                first_val = list(rows[0].values())[0]
                result["current_value"] = float(first_val) if first_val is not None else None
        except Exception as e:
            result["error"] = str(e)
            return result

        # Store snapshot
        if result["current_value"] is not None:
            snapshot = MetricSnapshot(
                metric_id=metric["id"],
                value=result["current_value"],
                period=current_period,
            )
            self.db.add(snapshot)

        # Execute for previous period
        try:
            prev_sql = sql.replace("$period", f"'{prev_period}'")
            _, rows, _ = self.duckdb.execute_query(prev_sql)
            if rows:
                first_val = list(rows[0].values())[0]
                result["previous_value"] = float(first_val) if first_val is not None else None
        except Exception:
            pass

        # Compute delta
        if result["current_value"] is not None and result["previous_value"] is not None:
            result["delta"] = result["current_value"] - result["previous_value"]
            if result["previous_value"] != 0:
                result["pct_change"] = round(
                    (result["delta"] / abs(result["previous_value"])) * 100, 2
                )

        # Anomaly detection: check against historical snapshots
        result["is_anomaly"] = await self._check_anomaly(metric["id"], result["current_value"])

        return result

    async def _check_anomaly(self, metric_id: str, current_value: float | None) -> bool:
        if current_value is None:
            return False

        stmt = (
            select(MetricSnapshot.value)
            .where(MetricSnapshot.metric_id == metric_id)
            .order_by(MetricSnapshot.period.desc())
            .limit(12)
        )
        result = await self.db.execute(stmt)
        values = [row[0] for row in result.fetchall() if row[0] is not None]

        if len(values) < 3:
            return False

        mean = statistics.mean(values)
        stdev = statistics.stdev(values)
        if stdev == 0:
            return False

        z_score = abs(current_value - mean) / stdev
        return z_score > 2.0

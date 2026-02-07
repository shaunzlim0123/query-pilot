import operator as op
from datetime import datetime

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alarm import Alarm, AlarmEvent
from app.services.duckdb_service import DuckDBService
from app.services.neo4j_service import Neo4jService

OPERATORS = {
    "gt": op.gt,
    "gte": op.ge,
    "lt": op.lt,
    "lte": op.le,
    "eq": op.eq,
}


class AlarmService:
    def __init__(
        self, db: AsyncSession, duckdb: DuckDBService, neo4j: Neo4jService
    ) -> None:
        self.db = db
        self.duckdb = duckdb
        self.neo4j = neo4j

    async def evaluate(self, alarm: Alarm) -> AlarmEvent | None:
        metric = await self.neo4j.get_metric(alarm.metric_id)
        if not metric or not metric.get("sql_query"):
            alarm.status = "error"
            alarm.last_checked_at = datetime.utcnow()
            await self.db.commit()
            return None

        try:
            _, rows, _ = self.duckdb.execute_query(metric["sql_query"])
            if not rows:
                return None
            value = float(list(rows[0].values())[0])
        except Exception as e:
            alarm.status = "error"
            alarm.last_checked_at = datetime.utcnow()
            event = AlarmEvent(
                alarm_id=alarm.id,
                event_type="error",
                metric_value=None,
                threshold=alarm.threshold,
                message=f"Error computing metric: {e}",
            )
            self.db.add(event)
            await self.db.commit()
            return event

        alarm.last_value = value
        alarm.last_checked_at = datetime.utcnow()

        compare = OPERATORS.get(alarm.operator, op.gt)
        is_breached = compare(value, alarm.threshold)

        if is_breached and alarm.status != "triggered":
            alarm.status = "triggered"
            message = (
                f"🚨 Alarm '{alarm.name}' triggered: "
                f"{metric['name']} = {value} {alarm.operator} {alarm.threshold}"
            )
            event = AlarmEvent(
                alarm_id=alarm.id,
                event_type="triggered",
                metric_value=value,
                threshold=alarm.threshold,
                message=message,
            )
            self.db.add(event)
            await self.db.commit()

            if alarm.slack_webhook:
                await self._send_slack(alarm.slack_webhook, message)

            return event

        elif not is_breached and alarm.status == "triggered":
            alarm.status = "ok"
            message = (
                f"✅ Alarm '{alarm.name}' resolved: "
                f"{metric['name']} = {value} (threshold: {alarm.threshold})"
            )
            event = AlarmEvent(
                alarm_id=alarm.id,
                event_type="resolved",
                metric_value=value,
                threshold=alarm.threshold,
                message=message,
            )
            self.db.add(event)
            await self.db.commit()

            if alarm.slack_webhook:
                await self._send_slack(alarm.slack_webhook, message)

            return event

        await self.db.commit()
        return None

    async def _send_slack(self, webhook_url: str, message: str) -> bool:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    webhook_url,
                    json={"text": message},
                    timeout=10,
                )
                return resp.status_code == 200
        except Exception:
            return False

    async def test_alarm(self, alarm: Alarm) -> dict:
        metric = await self.neo4j.get_metric(alarm.metric_id)
        if not metric or not metric.get("sql_query"):
            return {"error": "Metric not found or has no SQL query"}

        try:
            _, rows, _ = self.duckdb.execute_query(metric["sql_query"])
            if not rows:
                return {"error": "Query returned no results"}
            value = float(list(rows[0].values())[0])
        except Exception as e:
            return {"error": f"Query execution failed: {e}"}

        compare = OPERATORS.get(alarm.operator, op.gt)
        is_breached = compare(value, alarm.threshold)

        result = {
            "metric_name": metric["name"],
            "current_value": value,
            "threshold": alarm.threshold,
            "operator": alarm.operator,
            "is_breached": is_breached,
            "slack_sent": False,
        }

        if alarm.slack_webhook:
            test_msg = f"🧪 Test alarm '{alarm.name}': {metric['name']} = {value}"
            result["slack_sent"] = await self._send_slack(alarm.slack_webhook, test_msg)

        return result

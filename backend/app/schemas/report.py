from datetime import datetime

from pydantic import BaseModel


class ReportScheduleCreate(BaseModel):
    name: str
    root_metric_id: str
    cron_expression: str = "0 9 1 * *"


class ReportScheduleUpdate(BaseModel):
    name: str | None = None
    cron_expression: str | None = None
    is_active: bool | None = None


class ReportScheduleResponse(BaseModel):
    id: str
    name: str
    root_metric_id: str
    cron_expression: str
    is_active: bool
    last_run_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ReportResponse(BaseModel):
    id: str
    schedule_id: str
    report_data: dict
    period_start: str
    period_end: str
    generated_at: datetime

    model_config = {"from_attributes": True}

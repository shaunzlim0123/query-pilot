from datetime import datetime

from pydantic import BaseModel


class AlarmCreate(BaseModel):
    name: str
    metric_id: str
    operator: str  # gt, gte, lt, lte, eq
    threshold: float
    check_interval: int = 300
    slack_webhook: str = ""


class AlarmUpdate(BaseModel):
    name: str | None = None
    operator: str | None = None
    threshold: float | None = None
    check_interval: int | None = None
    slack_webhook: str | None = None
    is_active: bool | None = None


class AlarmResponse(BaseModel):
    id: str
    name: str
    metric_id: str
    operator: str
    threshold: float
    check_interval: int
    slack_webhook: str
    is_active: bool
    last_checked_at: datetime | None
    last_value: float | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AlarmEventResponse(BaseModel):
    id: str
    alarm_id: str
    event_type: str
    metric_value: float | None
    threshold: float
    message: str
    sent_at: datetime

    model_config = {"from_attributes": True}

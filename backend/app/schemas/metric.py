from pydantic import BaseModel


class MetricCreate(BaseModel):
    name: str
    description: str = ""
    dataset_id: str = ""
    sql_query: str = ""
    unit: str = ""
    parent_id: str | None = None
    sort_order: int = 0


class MetricUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    dataset_id: str | None = None
    sql_query: str | None = None
    unit: str | None = None
    sort_order: int | None = None


class MetricResponse(BaseModel):
    id: str
    name: str
    description: str
    dataset_id: str
    sql_query: str
    unit: str
    sort_order: int
    children: list["MetricResponse"] = []


class MetricComputeResponse(BaseModel):
    metric_id: str
    metric_name: str
    value: float | None
    unit: str
    error: str | None = None

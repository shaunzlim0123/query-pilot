from datetime import datetime

from pydantic import BaseModel


class DatasetResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    duckdb_table: str
    column_schema: dict
    row_count: int
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class DatasetPreview(BaseModel):
    columns: list[str]
    rows: list[dict]
    total_rows: int

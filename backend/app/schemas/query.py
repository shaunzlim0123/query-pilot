from datetime import datetime

from pydantic import BaseModel


class ConversationCreate(BaseModel):
    title: str = "New Conversation"
    dataset_ids: list[str] = []


class ConversationResponse(BaseModel):
    id: str
    title: str
    dataset_ids: list[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    generated_sql: str | None = None
    result_data: dict | None = None
    chart_config: dict | None = None
    error: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationDetail(BaseModel):
    id: str
    title: str
    dataset_ids: list[str]
    messages: list[MessageResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class QueryRequest(BaseModel):
    content: str
    dataset_ids: list[str] = []


class SqlExecuteRequest(BaseModel):
    sql: str


class SqlExecuteResponse(BaseModel):
    columns: list[str]
    rows: list[dict]
    row_count: int

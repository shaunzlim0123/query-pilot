from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies import get_db, get_duckdb, get_llm
from app.models.conversation import Conversation, Message
from app.models.dataset import Dataset
from app.schemas.query import (
    ConversationCreate,
    ConversationDetail,
    ConversationResponse,
    MessageResponse,
    QueryRequest,
    SqlExecuteRequest,
    SqlExecuteResponse,
)
from app.services.duckdb_service import DuckDBService
from app.services.llm_service import LLMService
from app.services.text_to_sql import TextToSQLService

router = APIRouter(prefix="/queries", tags=["queries"])


@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    body: ConversationCreate,
    db: AsyncSession = Depends(get_db),
):
    conv = Conversation(title=body.title, dataset_ids=body.dataset_ids)
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Conversation).order_by(Conversation.updated_at.desc())
    )
    return result.scalars().all()


@router.get("/conversations/{conv_id}", response_model=ConversationDetail)
async def get_conversation(conv_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conv_id)
        .options(selectinload(Conversation.messages))
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.delete("/conversations/{conv_id}")
async def delete_conversation(conv_id: str, db: AsyncSession = Depends(get_db)):
    conv = await db.get(Conversation, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await db.delete(conv)
    await db.commit()
    return {"detail": "Conversation deleted"}


@router.post("/conversations/{conv_id}/messages", response_model=MessageResponse)
async def send_message(
    conv_id: str,
    body: QueryRequest,
    db: AsyncSession = Depends(get_db),
    duckdb: DuckDBService = Depends(get_duckdb),
    llm: LLMService = Depends(get_llm),
):
    # Load conversation
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conv_id)
        .options(selectinload(Conversation.messages))
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Determine dataset tables
    dataset_ids = body.dataset_ids or conv.dataset_ids
    if body.dataset_ids and body.dataset_ids != conv.dataset_ids:
        conv.dataset_ids = body.dataset_ids

    tables = []
    for did in dataset_ids:
        ds = await db.get(Dataset, did)
        if ds:
            tables.append(ds.duckdb_table)

    if not tables:
        raise HTTPException(status_code=400, detail="No datasets selected")

    # Save user message
    user_msg = Message(conversation_id=conv_id, role="user", content=body.content)
    db.add(user_msg)

    # Build conversation history for LLM
    history = []
    for msg in conv.messages:
        if msg.role == "user":
            history.append({"role": "user", "content": msg.content})
        elif msg.role == "assistant":
            content = msg.content
            if msg.generated_sql:
                content += f"\n```sql\n{msg.generated_sql}\n```"
            history.append({"role": "assistant", "content": content})

    # Run text-to-SQL pipeline
    t2s = TextToSQLService(llm, duckdb)
    result = await t2s.generate_and_execute(body.content, tables, history)

    # Save assistant message
    assistant_msg = Message(
        conversation_id=conv_id,
        role="assistant",
        content=result["content"],
        generated_sql=result["generated_sql"],
        result_data=result["result_data"],
        chart_config=result["chart_config"],
        error=result["error"],
    )
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)
    return assistant_msg


@router.post("/execute-sql", response_model=SqlExecuteResponse)
async def execute_sql(
    body: SqlExecuteRequest,
    duckdb: DuckDBService = Depends(get_duckdb),
):
    try:
        columns, rows, row_count = duckdb.execute_query(body.sql)
        return SqlExecuteResponse(columns=columns, rows=rows, row_count=row_count)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SQL execution error: {e}")

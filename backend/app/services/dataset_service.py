import os
import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.dataset import Dataset
from app.services.duckdb_service import DuckDBService


class DatasetService:
    def __init__(self, db: AsyncSession, duckdb: DuckDBService) -> None:
        self.db = db
        self.duckdb = duckdb

    async def upload(self, file: UploadFile) -> Dataset:
        filename = file.filename or "unknown"
        file_ext = Path(filename).suffix.lower()
        if file_ext not in (".csv", ".parquet"):
            raise ValueError(f"Unsupported file type: {file_ext}. Only CSV and Parquet are supported.")

        # Save file to disk
        file_id = str(uuid.uuid4())
        stored_name = f"{file_id}{file_ext}"
        stored_path = str(settings.upload_dir / stored_name)
        settings.upload_dir.mkdir(parents=True, exist_ok=True)

        with open(stored_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        file_size = os.path.getsize(stored_path)

        # Create DuckDB table
        try:
            table_name, column_schema, row_count = self.duckdb.create_table_from_file(
                stored_path, filename
            )
        except Exception:
            os.remove(stored_path)
            raise

        dataset = Dataset(
            filename=filename,
            stored_path=stored_path,
            file_type=file_ext.lstrip("."),
            file_size=file_size,
            duckdb_table=table_name,
            column_schema=column_schema,
            row_count=row_count,
        )
        self.db.add(dataset)
        await self.db.commit()
        await self.db.refresh(dataset)
        return dataset

    async def list_all(self) -> list[Dataset]:
        result = await self.db.execute(select(Dataset).order_by(Dataset.uploaded_at.desc()))
        return list(result.scalars().all())

    async def get(self, dataset_id: str) -> Dataset | None:
        return await self.db.get(Dataset, dataset_id)

    async def delete(self, dataset_id: str) -> bool:
        dataset = await self.db.get(Dataset, dataset_id)
        if not dataset:
            return False

        # Remove DuckDB table
        self.duckdb.drop_table(dataset.duckdb_table)

        # Remove file
        if os.path.exists(dataset.stored_path):
            os.remove(dataset.stored_path)

        await self.db.delete(dataset)
        await self.db.commit()
        return True

    def preview(self, table_name: str, limit: int = 50) -> tuple[list[str], list[dict], int]:
        columns, rows = self.duckdb.preview_table(table_name, limit)
        total = self.duckdb.conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        return columns, rows, total

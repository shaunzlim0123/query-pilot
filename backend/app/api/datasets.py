from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_duckdb
from app.schemas.dataset import DatasetPreview, DatasetResponse
from app.services.dataset_service import DatasetService
from app.services.duckdb_service import DuckDBService

router = APIRouter(prefix="/datasets", tags=["datasets"])


def _get_service(
    db: AsyncSession = Depends(get_db),
    duckdb: DuckDBService = Depends(get_duckdb),
) -> DatasetService:
    return DatasetService(db, duckdb)


@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset(
    file: UploadFile,
    service: DatasetService = Depends(_get_service),
):
    try:
        dataset = await service.upload(file)
        return dataset
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")


@router.get("/", response_model=list[DatasetResponse])
async def list_datasets(service: DatasetService = Depends(_get_service)):
    return await service.list_all()


@router.get("/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: str,
    service: DatasetService = Depends(_get_service),
):
    dataset = await service.get(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


@router.get("/{dataset_id}/preview", response_model=DatasetPreview)
async def preview_dataset(
    dataset_id: str,
    limit: int = 50,
    service: DatasetService = Depends(_get_service),
):
    dataset = await service.get(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    columns, rows, total = service.preview(dataset.duckdb_table, limit)
    return DatasetPreview(columns=columns, rows=rows, total_rows=total)


@router.delete("/{dataset_id}")
async def delete_dataset(
    dataset_id: str,
    service: DatasetService = Depends(_get_service),
):
    deleted = await service.delete(dataset_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return {"detail": "Dataset deleted"}

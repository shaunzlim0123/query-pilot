from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_duckdb, get_neo4j
from app.schemas.metric import (
    MetricComputeResponse,
    MetricCreate,
    MetricResponse,
    MetricUpdate,
)
from app.services.duckdb_service import DuckDBService
from app.services.neo4j_service import Neo4jService

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.post("/", response_model=MetricResponse)
async def create_metric(
    body: MetricCreate,
    neo4j: Neo4jService = Depends(get_neo4j),
):
    metric = await neo4j.create_metric(
        name=body.name,
        description=body.description,
        dataset_id=body.dataset_id,
        sql_query=body.sql_query,
        unit=body.unit,
        parent_id=body.parent_id,
        sort_order=body.sort_order,
    )
    return {**metric, "children": []}


@router.get("/tree", response_model=list[MetricResponse])
async def get_metric_tree(neo4j: Neo4jService = Depends(get_neo4j)):
    return await neo4j.get_tree()


@router.get("/{metric_id}", response_model=MetricResponse)
async def get_metric(
    metric_id: str,
    neo4j: Neo4jService = Depends(get_neo4j),
):
    metric = await neo4j.get_metric(metric_id)
    if not metric:
        raise HTTPException(status_code=404, detail="Metric not found")
    return metric


@router.put("/{metric_id}", response_model=MetricResponse)
async def update_metric(
    metric_id: str,
    body: MetricUpdate,
    neo4j: Neo4jService = Depends(get_neo4j),
):
    updates = body.model_dump(exclude_none=True)
    metric = await neo4j.update_metric(metric_id, updates)
    if not metric:
        raise HTTPException(status_code=404, detail="Metric not found")
    return {**metric, "children": []}


@router.delete("/{metric_id}")
async def delete_metric(
    metric_id: str,
    neo4j: Neo4jService = Depends(get_neo4j),
):
    deleted = await neo4j.delete_metric(metric_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Metric not found")
    return {"detail": "Metric deleted"}


@router.get("/{metric_id}/subtree", response_model=MetricResponse)
async def get_subtree(
    metric_id: str,
    neo4j: Neo4jService = Depends(get_neo4j),
):
    tree = await neo4j.get_subtree(metric_id)
    if not tree:
        raise HTTPException(status_code=404, detail="Metric not found")
    return tree


@router.post("/{metric_id}/compute", response_model=MetricComputeResponse)
async def compute_metric(
    metric_id: str,
    neo4j: Neo4jService = Depends(get_neo4j),
    duckdb: DuckDBService = Depends(get_duckdb),
):
    metric = await neo4j.get_metric(metric_id)
    if not metric:
        raise HTTPException(status_code=404, detail="Metric not found")

    sql = metric.get("sql_query")
    if not sql:
        return MetricComputeResponse(
            metric_id=metric_id,
            metric_name=metric["name"],
            value=None,
            unit=metric.get("unit", ""),
            error="No SQL query defined for this metric",
        )

    try:
        _, rows, _ = duckdb.execute_query(sql)
        value = float(list(rows[0].values())[0]) if rows else None
        return MetricComputeResponse(
            metric_id=metric_id,
            metric_name=metric["name"],
            value=value,
            unit=metric.get("unit", ""),
        )
    except Exception as e:
        return MetricComputeResponse(
            metric_id=metric_id,
            metric_name=metric["name"],
            value=None,
            unit=metric.get("unit", ""),
            error=str(e),
        )

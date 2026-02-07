import uuid

from neo4j import AsyncDriver, AsyncGraphDatabase

from app.config import settings


class Neo4jService:
    def __init__(self) -> None:
        self._driver: AsyncDriver | None = None

    async def connect(self) -> None:
        self._driver = AsyncGraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
        )
        # Create uniqueness constraint
        async with self._driver.session() as session:
            await session.run(
                "CREATE CONSTRAINT metric_id IF NOT EXISTS FOR (m:Metric) REQUIRE m.id IS UNIQUE"
            )

    async def close(self) -> None:
        if self._driver:
            await self._driver.close()
            self._driver = None

    @property
    def driver(self) -> AsyncDriver:
        if self._driver is None:
            raise RuntimeError("Neo4j not connected")
        return self._driver

    async def create_metric(
        self,
        name: str,
        description: str = "",
        dataset_id: str = "",
        sql_query: str = "",
        unit: str = "",
        parent_id: str | None = None,
        sort_order: int = 0,
    ) -> dict:
        metric_id = str(uuid.uuid4())
        async with self.driver.session() as session:
            result = await session.run(
                """
                CREATE (m:Metric {
                    id: $id, name: $name, description: $description,
                    dataset_id: $dataset_id, sql_query: $sql_query,
                    unit: $unit, sort_order: $sort_order
                })
                RETURN m
                """,
                id=metric_id,
                name=name,
                description=description,
                dataset_id=dataset_id,
                sql_query=sql_query,
                unit=unit,
                sort_order=sort_order,
            )
            record = await result.single()
            metric = dict(record["m"])

            if parent_id:
                await session.run(
                    """
                    MATCH (parent:Metric {id: $parent_id}), (child:Metric {id: $child_id})
                    CREATE (parent)-[:HAS_CHILD {sort_order: $sort_order}]->(child)
                    """,
                    parent_id=parent_id,
                    child_id=metric_id,
                    sort_order=sort_order,
                )

            return metric

    async def get_metric(self, metric_id: str) -> dict | None:
        async with self.driver.session() as session:
            result = await session.run(
                """
                MATCH (m:Metric {id: $id})
                OPTIONAL MATCH (m)-[:HAS_CHILD]->(child:Metric)
                RETURN m, collect(child) AS children
                ORDER BY child.sort_order
                """,
                id=metric_id,
            )
            record = await result.single()
            if not record:
                return None
            metric = dict(record["m"])
            metric["children"] = [dict(c) for c in record["children"] if c]
            return metric

    async def update_metric(self, metric_id: str, updates: dict) -> dict | None:
        set_clauses = []
        params = {"id": metric_id}
        for key, value in updates.items():
            if value is not None:
                set_clauses.append(f"m.{key} = ${key}")
                params[key] = value

        if not set_clauses:
            return await self.get_metric(metric_id)

        query = f"MATCH (m:Metric {{id: $id}}) SET {', '.join(set_clauses)} RETURN m"
        async with self.driver.session() as session:
            result = await session.run(query, **params)
            record = await result.single()
            return dict(record["m"]) if record else None

    async def delete_metric(self, metric_id: str) -> bool:
        async with self.driver.session() as session:
            # Reparent children to grandparent if exists
            await session.run(
                """
                MATCH (parent:Metric)-[r1:HAS_CHILD]->(target:Metric {id: $id})
                OPTIONAL MATCH (target)-[r2:HAS_CHILD]->(child:Metric)
                FOREACH (c IN CASE WHEN child IS NOT NULL THEN [child] ELSE [] END |
                    CREATE (parent)-[:HAS_CHILD {sort_order: c.sort_order}]->(c)
                )
                """,
                id=metric_id,
            )
            # Delete the node and all its relationships
            result = await session.run(
                "MATCH (m:Metric {id: $id}) DETACH DELETE m RETURN count(m) AS deleted",
                id=metric_id,
            )
            record = await result.single()
            return record["deleted"] > 0

    async def get_tree(self) -> list[dict]:
        async with self.driver.session() as session:
            # Get root metrics (no parent)
            result = await session.run(
                """
                MATCH (m:Metric)
                WHERE NOT ()-[:HAS_CHILD]->(m)
                RETURN m ORDER BY m.sort_order, m.name
                """
            )
            roots = [dict(record["m"]) async for record in result]

            # Build tree recursively
            tree = []
            for root in roots:
                tree.append(await self._build_subtree(session, root))
            return tree

    async def get_subtree(self, root_id: str) -> dict | None:
        async with self.driver.session() as session:
            result = await session.run(
                "MATCH (m:Metric {id: $id}) RETURN m", id=root_id
            )
            record = await result.single()
            if not record:
                return None
            root = dict(record["m"])
            return await self._build_subtree(session, root)

    async def _build_subtree(self, session, node: dict) -> dict:
        result = await session.run(
            """
            MATCH (parent:Metric {id: $id})-[:HAS_CHILD]->(child:Metric)
            RETURN child ORDER BY child.sort_order, child.name
            """,
            id=node["id"],
        )
        children = [dict(record["child"]) async for record in result]
        node["children"] = [await self._build_subtree(session, child) for child in children]
        return node

    async def get_subtree_flat(self, root_id: str) -> list[dict]:
        async with self.driver.session() as session:
            result = await session.run(
                """
                MATCH path = (root:Metric {id: $root_id})-[:HAS_CHILD*0..]->(descendant:Metric)
                RETURN descendant, length(path) AS depth
                ORDER BY depth
                """,
                root_id=root_id,
            )
            metrics = []
            async for record in result:
                m = dict(record["descendant"])
                m["depth"] = record["depth"]
                metrics.append(m)
            return metrics

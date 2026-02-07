import re
from pathlib import Path

import duckdb

from app.config import settings


class DuckDBService:
    def __init__(self) -> None:
        self._conn: duckdb.DuckDBPyConnection | None = None

    def connect(self) -> None:
        Path(settings.duckdb_path).parent.mkdir(parents=True, exist_ok=True)
        self._conn = duckdb.connect(settings.duckdb_path)

    def close(self) -> None:
        if self._conn:
            self._conn.close()
            self._conn = None

    @property
    def conn(self) -> duckdb.DuckDBPyConnection:
        if self._conn is None:
            raise RuntimeError("DuckDB not connected")
        return self._conn

    def _safe_table_name(self, filename: str) -> str:
        name = Path(filename).stem
        name = re.sub(r"[^a-zA-Z0-9_]", "_", name)
        name = re.sub(r"_+", "_", name).strip("_").lower()
        if not name or name[0].isdigit():
            name = f"t_{name}"
        # Ensure uniqueness by checking existing tables
        existing = {row[0] for row in self.conn.execute("SHOW TABLES").fetchall()}
        base = name
        counter = 1
        while name in existing:
            name = f"{base}_{counter}"
            counter += 1
        return name

    def create_table_from_file(self, file_path: str, filename: str) -> tuple[str, dict, int]:
        table_name = self._safe_table_name(filename)
        path = file_path.replace("'", "''")

        if filename.lower().endswith(".parquet"):
            self.conn.execute(f"CREATE TABLE {table_name} AS SELECT * FROM read_parquet('{path}')")
        else:
            self.conn.execute(
                f"CREATE TABLE {table_name} AS SELECT * FROM read_csv_auto('{path}', header=true)"
            )

        schema = self._get_table_schema(table_name)
        row_count = self.conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        return table_name, schema, row_count

    def _get_table_schema(self, table_name: str) -> dict:
        result = self.conn.execute(f"DESCRIBE {table_name}").fetchall()
        return {row[0]: row[1] for row in result}

    def preview_table(self, table_name: str, limit: int = 50) -> tuple[list[str], list[dict]]:
        result = self.conn.execute(f"SELECT * FROM {table_name} LIMIT {int(limit)}")
        columns = [desc[0] for desc in result.description]
        rows = [dict(zip(columns, row)) for row in result.fetchall()]
        return columns, rows

    def execute_query(self, sql: str) -> tuple[list[str], list[dict], int]:
        result = self.conn.execute(sql)
        columns = [desc[0] for desc in result.description]
        rows = [dict(zip(columns, row)) for row in result.fetchall()]
        return columns, rows, len(rows)

    def validate_sql(self, sql: str) -> str | None:
        try:
            self.conn.execute(f"EXPLAIN {sql}")
            return None
        except Exception as e:
            return str(e)

    def drop_table(self, table_name: str) -> None:
        self.conn.execute(f"DROP TABLE IF EXISTS {table_name}")

    def get_table_info(self, table_name: str) -> dict:
        schema = self._get_table_schema(table_name)
        row_count = self.conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        sample = self.conn.execute(f"SELECT * FROM {table_name} LIMIT 5")
        columns = [desc[0] for desc in sample.description]
        sample_rows = [dict(zip(columns, row)) for row in sample.fetchall()]
        return {"schema": schema, "row_count": row_count, "sample_rows": sample_rows}

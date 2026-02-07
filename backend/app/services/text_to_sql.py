import re

from app.prompts.text_to_sql import RETRY_PROMPT, SYSTEM_PROMPT, build_table_schema_text
from app.services.duckdb_service import DuckDBService
from app.services.llm_service import LLMService

MAX_RETRIES = 3

# Disallowed SQL patterns
_DISALLOWED = re.compile(
    r"\b(CREATE|DROP|ALTER|INSERT|UPDATE|DELETE|TRUNCATE|GRANT|REVOKE)\b",
    re.IGNORECASE,
)


def _extract_sql(text: str) -> str | None:
    match = re.search(r"```sql\s*(.*?)\s*```", text, re.DOTALL)
    if match:
        return match.group(1).strip()
    match = re.search(r"```\s*(SELECT.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    lines = text.strip().split("\n")
    sql_lines = [l for l in lines if not l.startswith("#") and l.strip()]
    candidate = "\n".join(sql_lines).strip()
    if candidate.upper().startswith("SELECT"):
        return candidate
    return None


def _suggest_chart(columns: list[str], rows: list[dict]) -> dict | None:
    if not rows or len(columns) < 2:
        return None

    first_col = columns[0].lower()
    has_date = any(
        kw in first_col for kw in ("date", "time", "month", "year", "day", "week", "period")
    )
    numeric_cols = [
        c
        for c in columns[1:]
        if rows and isinstance(rows[0].get(c), (int, float))
    ]

    if not numeric_cols:
        return None

    if has_date:
        return {
            "type": "line",
            "xKey": columns[0],
            "yKeys": numeric_cols[:3],
        }

    if len(rows) <= 20:
        return {
            "type": "bar",
            "xKey": columns[0],
            "yKeys": numeric_cols[:3],
        }

    if len(numeric_cols) >= 2:
        return {
            "type": "scatter",
            "xKey": numeric_cols[0],
            "yKeys": [numeric_cols[1]],
        }

    return None


class TextToSQLService:
    def __init__(self, llm: LLMService, duckdb: DuckDBService) -> None:
        self.llm = llm
        self.duckdb = duckdb

    def _build_schema_context(self, dataset_tables: list[str]) -> str:
        tables = []
        for table_name in dataset_tables:
            info = self.duckdb.get_table_info(table_name)
            tables.append({"table_name": table_name, **info})
        return build_table_schema_text(tables)

    async def generate_and_execute(
        self,
        question: str,
        dataset_tables: list[str],
        conversation_history: list[dict[str, str]],
    ) -> dict:
        schema_text = self._build_schema_context(dataset_tables)
        system = SYSTEM_PROMPT.format(table_schemas=schema_text)

        messages = [*conversation_history, {"role": "user", "content": question}]

        last_error = None
        for attempt in range(MAX_RETRIES):
            if attempt > 0 and last_error:
                messages.append({"role": "assistant", "content": f"```sql\n{sql}\n```"})
                messages.append(
                    {"role": "user", "content": RETRY_PROMPT.format(error=last_error)}
                )

            response_text = await self.llm.generate(system, messages)
            sql = _extract_sql(response_text)

            if not sql:
                return {
                    "content": response_text,
                    "generated_sql": None,
                    "result_data": None,
                    "chart_config": None,
                    "error": None,
                }

            if _DISALLOWED.search(sql):
                return {
                    "content": "I can only generate SELECT queries for safety reasons.",
                    "generated_sql": sql,
                    "result_data": None,
                    "chart_config": None,
                    "error": "Query contains disallowed statements (DDL/DML)",
                }

            validation_error = self.duckdb.validate_sql(sql)
            if validation_error:
                last_error = validation_error
                continue

            try:
                columns, rows, row_count = self.duckdb.execute_query(sql)
                chart_config = _suggest_chart(columns, rows)
                return {
                    "content": response_text,
                    "generated_sql": sql,
                    "result_data": {"columns": columns, "rows": rows, "row_count": row_count},
                    "chart_config": chart_config,
                    "error": None,
                }
            except Exception as e:
                last_error = str(e)
                continue

        return {
            "content": response_text,
            "generated_sql": sql,
            "result_data": None,
            "chart_config": None,
            "error": f"Query failed after {MAX_RETRIES} attempts: {last_error}",
        }

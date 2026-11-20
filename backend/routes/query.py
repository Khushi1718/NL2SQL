from fastapi import APIRouter, HTTPException, Response, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from services.query_service import QueryService
from database_manager import DEFAULT_BENCHMARK_DB_ID, DatabaseManager
from mongo import get_query_history_mongo

router = APIRouter(prefix="/api/query", tags=["Query"])

class GenerateSQLRequest(BaseModel):
    natural_language_query: str
    database_id: Optional[str] = DEFAULT_BENCHMARK_DB_ID

class ExecuteSQLRequest(BaseModel):
    sql: str
    database_id: Optional[str] = DEFAULT_BENCHMARK_DB_ID
    natural_language_query: Optional[str] = None
    prompt_used: Optional[str] = None

class ExportCSVRequest(BaseModel):
    columns: List[str]
    rows: List[Dict[str, Any]]
    filename: Optional[str] = "query_results.csv"

@router.post("/generate")
def generate_sql(request: GenerateSQLRequest):
    """
    Translates a natural language question into validated SQLite syntax
    tailored specifically to the designated database.
    """
    if not request.natural_language_query.strip():
        raise HTTPException(status_code=400, detail="Natural language query cannot be empty.")

    try:
        result = QueryService.generate_sql_from_nl(
            natural_language_query=request.natural_language_query,
            database_id=request.database_id
        )
        return result
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Database '{request.database_id}' not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SQL Generation error: {str(e)}")

@router.post("/execute")
def execute_sql(request: ExecuteSQLRequest):
    """
    Executes validated read-only SQL against the chosen database and records in MongoDB.
    """
    if not request.sql.strip():
        raise HTTPException(status_code=400, detail="SQL query cannot be empty.")

    try:
        result = QueryService.execute_sql_query(
            sql_query=request.sql,
            database_id=request.database_id,
            natural_language_query=request.natural_language_query,
            prompt_used=request.prompt_used
        )
        return result
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Database '{request.database_id}' not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query Execution error: {str(e)}")

@router.get("/history")
def get_query_history(
    database_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """
    Returns persistent query execution history from MongoDB.
    """
    items, total = get_query_history_mongo(database_id=database_id, limit=limit, offset=offset)
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset
    }

@router.post("/export-csv")
def export_csv(request: ExportCSVRequest):
    """
    Generates downloadable CSV from query tabular results.
    """
    csv_content = QueryService.generate_csv_export(request.columns, request.rows)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{request.filename or "results.csv"}"'
        }
    )

@router.get("/suggestions")
def get_query_suggestions(database_id: Optional[str] = DEFAULT_BENCHMARK_DB_ID):
    """
    Returns curated suggestions based on the active database's tables.
    """
    db_id = database_id or DEFAULT_BENCHMARK_DB_ID
    try:
        sqlite_path = DatabaseManager.materialize_database(db_id)
        schema = DatabaseManager.inspect_sqlite_schema(sqlite_path)
        tables = list(schema["tables"].keys())
    except Exception:
        tables = []

    # If it's the benchmark database or has students/customers
    if "students" in tables and "courses" in tables:
        return [
            {
                "category": "Academic",
                "question": "Show all students who scored more than 80 marks.",
                "description": "Filters academic enrollments joined with student profiles."
            },
            {
                "category": "Commercial",
                "question": "Find the top 5 customers by total purchase amount.",
                "description": "Calculates customer total order spending and ranks top 5."
            },
            {
                "category": "HR & Staff",
                "question": "How many employees work in each department?",
                "description": "Groups staff by department with count and average salaries."
            },
            {
                "category": "Compensation",
                "question": "Display the average salary of employees.",
                "description": "Computes mean, min, max salary and total headcount."
            }
        ]

    # Dynamically generate suggestions for uploaded custom CSV / SQLite databases
    if tables:
        first_table = tables[0]
        first_table_cols = [c["name"] for c in schema["tables"][first_table]["columns"]]
        col_names_str = ", ".join(first_table_cols[:3])
        suggestions = [
            {
                "category": "Data Inspection",
                "question": f"Show all records from {first_table}.",
                "description": f"Lists all rows and columns ({col_names_str}) from {first_table}."
            },
            {
                "category": "Top Records",
                "question": f"Show the top 5 records from {first_table}.",
                "description": f"Retrieves the first 5 records from {first_table}."
            }
        ]
        if len(tables) > 1:
            second_table = tables[1]
            suggestions.append({
                "category": "Multi-Table",
                "question": f"List all records from {second_table}.",
                "description": f"Inspects data from {second_table} table."
            })
        return suggestions

    return [
        {
            "category": "Getting Started",
            "question": "Show all records from the primary table.",
            "description": "Retrieves rows from the selected database."
        }
    ]

from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
from prompt_engineering.builder import PromptBuilder
from services.llm_service import llm_service
from database_manager import DatabaseManager, DEFAULT_BENCHMARK_DB_ID

router = APIRouter(prefix="/api/prompt", tags=["Prompt Engineering"])

class InspectPromptRequest(BaseModel):
    question: Optional[str] = "Show all students who scored more than 80 marks."
    database_id: Optional[str] = DEFAULT_BENCHMARK_DB_ID

@router.get("/breakdown")
def get_prompt_engineering_components(database_id: Optional[str] = DEFAULT_BENCHMARK_DB_ID):
    """
    Returns prompt engineering components dynamically for the designated database schema.
    """
    db_id = database_id or DEFAULT_BENCHMARK_DB_ID
    sqlite_path = DatabaseManager.materialize_database(db_id)
    schema_info = DatabaseManager.inspect_sqlite_schema(sqlite_path)

    builder = PromptBuilder(schema_info=schema_info)
    default_question = "Show all records from the primary table."
    if "students" in schema_info.get("tables", {}):
        default_question = "Show all students who scored more than 80 marks."

    return builder.get_inspectable_breakdown(default_question)

@router.post("/inspect")
def inspect_live_prompt(request: InspectPromptRequest):
    """
    Constructs the exact live prompt for a question against the specified database
    and returns prompt components along with LLM's response.
    """
    db_id = request.database_id or DEFAULT_BENCHMARK_DB_ID
    sqlite_path = DatabaseManager.materialize_database(db_id)
    schema_info = DatabaseManager.inspect_sqlite_schema(sqlite_path)

    question = request.question.strip() if request.question else "Show all records."
    builder = PromptBuilder(schema_info=schema_info)
    breakdown = builder.get_inspectable_breakdown(question)
    full_prompt = breakdown["final_constructed_prompt"]

    llm_res = llm_service.generate_sql(full_prompt, question, schema_info=schema_info)

    return {
        **breakdown,
        "database_id": db_id,
        "llm_response": llm_res
    }

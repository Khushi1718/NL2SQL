from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import QueryHistory

router = APIRouter(prefix="/api/history", tags=["Query History"])

@router.get("")
def get_query_history(
    search: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Returns filterable, paginated query history.
    """
    query = db.query(QueryHistory)

    if status and status.upper() != "ALL":
        query = query.filter(QueryHistory.status == status.upper())

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (QueryHistory.natural_language_query.ilike(term)) |
            (QueryHistory.generated_sql.ilike(term)) |
            (QueryHistory.error_message.ilike(term))
        )

    total_count = query.count()
    records = query.order_by(QueryHistory.created_at.desc()).offset(offset).limit(limit).all()

    items = [
        {
            "id": r.id,
            "natural_language_query": r.natural_language_query,
            "generated_sql": r.generated_sql,
            "executed_sql": r.executed_sql,
            "status": r.status,
            "execution_time_ms": round(r.execution_time_ms, 2),
            "row_count": r.row_count,
            "error_message": r.error_message,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in records
    ]

    return {
        "items": items,
        "total": total_count,
        "limit": limit,
        "offset": offset
    }

@router.get("/{history_id}")
def get_history_detail(history_id: int, db: Session = Depends(get_db)):
    """
    Retrieves full details of a specific query history item.
    """
    record = db.query(QueryHistory).filter(QueryHistory.id == history_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="History record not found.")

    return {
        "id": record.id,
        "natural_language_query": record.natural_language_query,
        "generated_sql": record.generated_sql,
        "executed_sql": record.executed_sql,
        "status": record.status,
        "execution_time_ms": round(record.execution_time_ms, 2),
        "row_count": record.row_count,
        "error_message": record.error_message,
        "prompt_used": record.prompt_used,
        "created_at": record.created_at.isoformat() if record.created_at else None
    }

@router.delete("/{history_id}")
def delete_history_item(history_id: int, db: Session = Depends(get_db)):
    """
    Deletes an individual history record by ID.
    """
    record = db.query(QueryHistory).filter(QueryHistory.id == history_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="History record not found.")

    db.delete(record)
    db.commit()
    return {"message": f"History record #{history_id} successfully deleted."}

@router.delete("")
def clear_all_history(db: Session = Depends(get_db)):
    """
    Clears all history records.
    """
    deleted_count = db.query(QueryHistory).delete()
    db.commit()
    return {"message": f"Successfully cleared {deleted_count} history records."}

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from database import get_db, engine, DB_PATH
from models import QueryHistory
from schema_inspector import get_database_schema

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Computes real live dashboard metrics from the database.
    """
    total_queries = db.query(QueryHistory).count()
    successful_queries = db.query(QueryHistory).filter(QueryHistory.status == "SUCCESS").count()
    failed_queries = db.query(QueryHistory).filter(QueryHistory.status != "SUCCESS").count()

    avg_time_record = db.query(func.avg(QueryHistory.execution_time_ms)).filter(QueryHistory.status == "SUCCESS").scalar()
    avg_execution_time = round(float(avg_time_record), 2) if avg_time_record else 0.0

    recent_queries = (
        db.query(QueryHistory)
        .order_by(QueryHistory.created_at.desc())
        .limit(6)
        .all()
    )

    recent_queries_data = [
        {
            "id": q.id,
            "natural_language_query": q.natural_language_query,
            "generated_sql": q.generated_sql,
            "status": q.status,
            "execution_time_ms": round(q.execution_time_ms, 2),
            "row_count": q.row_count,
            "error_message": q.error_message,
            "created_at": q.created_at.isoformat() if q.created_at else None
        }
        for q in recent_queries
    ]

    # Query Activity Chart Data (last 7 days activity)
    now = datetime.utcnow()
    activity_chart = []
    for i in range(6, -1, -1):
        day_date = (now - timedelta(days=i)).date()
        day_start = datetime.combine(day_date, datetime.min.time())
        day_end = datetime.combine(day_date, datetime.max.time())

        success_count = (
            db.query(QueryHistory)
            .filter(
                QueryHistory.created_at >= day_start,
                QueryHistory.created_at <= day_end,
                QueryHistory.status == "SUCCESS"
            )
            .count()
        )
        failed_count = (
            db.query(QueryHistory)
            .filter(
                QueryHistory.created_at >= day_start,
                QueryHistory.created_at <= day_end,
                QueryHistory.status != "SUCCESS"
            )
            .count()
        )

        activity_chart.append({
            "date": day_date.strftime("%b %d"),
            "successful": success_count,
            "failed": failed_count,
            "total": success_count + failed_count
        })

    # Database connection status
    schema = get_database_schema()
    total_records = sum(t.get("row_count", 0) for t in schema["tables"].values())

    db_status = {
        "connected": True,
        "engine": "SQLite",
        "database_file": DB_PATH,
        "tables_count": schema["table_count"],
        "total_records": total_records,
        "relationships_count": len(schema["relationships"])
    }

    return {
        "total_queries": total_queries,
        "successful_queries": successful_queries,
        "failed_queries": failed_queries,
        "avg_execution_time_ms": avg_execution_time,
        "recent_queries": recent_queries_data,
        "activity_chart": activity_chart,
        "database_status": db_status
    }

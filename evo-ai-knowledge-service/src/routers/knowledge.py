from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

from src.database import get_db
from src.config import settings
from src.models import KnowledgeSearchRequest, KnowledgeSearchResponse

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


def _check_token(x_service_token: Optional[str] = Header(None)):
    if settings.SERVICE_TOKEN and x_service_token != settings.SERVICE_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid service token")


@router.post("/search", status_code=200)
def search_knowledge(
    req: KnowledgeSearchRequest,
    db: Session = Depends(get_db),
    x_service_token: Optional[str] = Header(None),
):
    _check_token(x_service_token)

    if not req.query:
        return KnowledgeSearchResponse(results=[], total=0, query=req.query)

    q = f"%{req.query}%"
    limit = min(req.max_results, 50)
    params = {"q": q, "lim": limit}
    where_clauses = ["content ILIKE :q"]

    if req.app_name:
        where_clauses.append("app_name = :app_name")
        params["app_name"] = req.app_name
    if req.user_id:
        where_clauses.append("user_id = :user_id")
        params["user_id"] = req.user_id

    where = " AND ".join(where_clauses)

    rows = db.execute(
        text(f"""
            SELECT id, content, metadata, created_at
            FROM knowledge_entries
            WHERE {where}
            ORDER BY created_at DESC
            LIMIT :lim
        """),
        params,
    ).fetchall()

    results = [
        {
            "id": str(r.id),
            "content": r.content,
            "metadata": r.metadata or {},
            "timestamp": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]
    return KnowledgeSearchResponse(results=results, total=len(results), query=req.query)

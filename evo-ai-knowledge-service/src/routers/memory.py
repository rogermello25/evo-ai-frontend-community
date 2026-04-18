from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
from datetime import datetime

from src.database import get_db
from src.config import settings
from src.models import (
    MemoryEventRequest, MemorySessionRequest, MemorySearchRequest,
    MemoryCompressRequest, MemoryEntry, MemorySearchResponse,
    MemoryLoadResponse, MemoryCompressResponse,
)

router = APIRouter(prefix="/memory", tags=["memory"])


def _check_token(x_service_token: Optional[str] = Header(None)):
    if settings.SERVICE_TOKEN and x_service_token != settings.SERVICE_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid service token")


def _row_to_entry(row) -> MemoryEntry:
    return MemoryEntry(
        id=str(row.id),
        content=row.content,
        timestamp=row.created_at.isoformat() if row.created_at else None,
        metadata={"role": getattr(row, "role", "user"), "source": "event"},
        score=1.0,
    )


def _summary_to_entry(row) -> MemoryEntry:
    return MemoryEntry(
        id=str(row.id),
        content=row.content,
        timestamp=row.created_at.isoformat() if row.created_at else None,
        metadata={"role": "summary", "source": "summary", "messages_compressed": row.messages_compressed},
        score=1.0,
    )


@router.get("/health/status")
def health_status():
    return {"status": "ok", "service": "evo-ai-knowledge-service"}


@router.post("", status_code=201)
def store_session(
    req: MemorySessionRequest,
    db: Session = Depends(get_db),
    x_service_token: Optional[str] = Header(None),
):
    _check_token(x_service_token)
    db.execute(
        text("""
            INSERT INTO knowledge_memory_summaries
                (app_name, user_id, content, messages_compressed, session_id, memory_base_config_id)
            VALUES
                (:app_name, :user_id, :content, 0, :session_id, NULL)
        """),
        {
            "app_name": req.app_name,
            "user_id": req.user_id,
            "content": req.content,
            "session_id": req.session_id,
        },
    )
    db.commit()
    return {"status": "created"}


@router.post("/event", status_code=201)
def store_event(
    req: MemoryEventRequest,
    db: Session = Depends(get_db),
    x_service_token: Optional[str] = Header(None),
):
    _check_token(x_service_token)

    db.execute(
        text("""
            INSERT INTO knowledge_memory_events (app_name, user_id, role, content)
            VALUES (:app_name, :user_id, :role, :content)
        """),
        {"app_name": req.app_name, "user_id": req.user_id, "role": req.role, "content": req.content},
    )
    db.commit()

    if req.max_messages and req.max_messages > 0:
        db.execute(
            text("""
                DELETE FROM knowledge_memory_events
                WHERE id IN (
                    SELECT id FROM knowledge_memory_events
                    WHERE app_name = :app_name AND user_id = :user_id
                    ORDER BY created_at DESC
                    OFFSET :max_messages
                )
            """),
            {"app_name": req.app_name, "user_id": req.user_id, "max_messages": req.max_messages},
        )
        db.commit()

    if req.compression_interval and req.compression_interval > 0:
        count_row = db.execute(
            text("""
                SELECT COUNT(*) as cnt FROM knowledge_memory_events
                WHERE app_name = :app_name AND user_id = :user_id
            """),
            {"app_name": req.app_name, "user_id": req.user_id},
        ).fetchone()
        total = count_row.cnt if count_row else 0
        if total >= req.compression_interval:
            _do_compress(db, req.app_name, req.user_id, compress_count=req.compression_interval)

    return {"status": "created"}


@router.post("/search", status_code=200)
def search_memory(
    req: MemorySearchRequest,
    db: Session = Depends(get_db),
    x_service_token: Optional[str] = Header(None),
):
    _check_token(x_service_token)

    memories = []
    query_filter = f"%{req.query}%" if req.query else "%"
    limit = min(req.max_results, 50)

    # Search summaries first
    summary_rows = db.execute(
        text("""
            SELECT id, content, messages_compressed, created_at
            FROM knowledge_memory_summaries
            WHERE app_name = :app_name AND user_id = :user_id
              AND content ILIKE :q
            ORDER BY created_at DESC
            LIMIT :lim
        """),
        {"app_name": req.app_name, "user_id": req.user_id, "q": query_filter, "lim": limit},
    ).fetchall()
    for r in summary_rows:
        memories.append(MemoryEntry(
            id=str(r.id),
            content=r.content,
            timestamp=r.created_at.isoformat() if r.created_at else None,
            metadata={"role": "summary", "source": "summary", "messages_compressed": r.messages_compressed},
            score=1.0,
        ))

    # Fill remaining from events
    remaining = limit - len(memories)
    if remaining > 0:
        event_rows = db.execute(
            text("""
                SELECT id, content, role, created_at
                FROM knowledge_memory_events
                WHERE app_name = :app_name AND user_id = :user_id
                  AND content ILIKE :q
                ORDER BY created_at DESC
                LIMIT :lim
            """),
            {"app_name": req.app_name, "user_id": req.user_id, "q": query_filter, "lim": remaining},
        ).fetchall()
        for r in event_rows:
            memories.append(MemoryEntry(
                id=str(r.id),
                content=r.content,
                timestamp=r.created_at.isoformat() if r.created_at else None,
                metadata={"role": r.role, "source": "event"},
                score=0.8,
            ))

    return MemorySearchResponse(memories=memories, total=len(memories), query=req.query)


@router.get("/load", status_code=200)
def load_memory(
    app_name: str = Query(...),
    user_id: str = Query(...),
    query: str = Query(""),
    max_results: int = Query(10),
    db: Session = Depends(get_db),
    x_service_token: Optional[str] = Header(None),
):
    _check_token(x_service_token)

    limit = min(max_results, 50)
    memories = []

    if not query:
        # Preload: return medium-term summaries
        rows = db.execute(
            text("""
                SELECT id, content, messages_compressed, created_at
                FROM knowledge_memory_summaries
                WHERE app_name = :app_name AND user_id = :user_id
                ORDER BY created_at DESC
                LIMIT :lim
            """),
            {"app_name": app_name, "user_id": user_id, "lim": limit},
        ).fetchall()
        for r in rows:
            memories.append(MemoryEntry(
                id=str(r.id),
                content=r.content,
                timestamp=r.created_at.isoformat() if r.created_at else None,
                metadata={"role": "summary", "source": "summary", "messages_compressed": r.messages_compressed},
            ))
    else:
        q = f"%{query}%"
        rows = db.execute(
            text("""
                SELECT id, content, role, created_at
                FROM knowledge_memory_events
                WHERE app_name = :app_name AND user_id = :user_id
                  AND content ILIKE :q
                ORDER BY created_at DESC
                LIMIT :lim
            """),
            {"app_name": app_name, "user_id": user_id, "q": q, "lim": limit},
        ).fetchall()
        for r in rows:
            memories.append(MemoryEntry(
                id=str(r.id),
                content=r.content,
                timestamp=r.created_at.isoformat() if r.created_at else None,
                metadata={"role": r.role, "source": "event"},
            ))

    return MemoryLoadResponse(memories=memories, total=len(memories))


@router.post("/compress", status_code=200)
def compress_memory(
    req: MemoryCompressRequest,
    db: Session = Depends(get_db),
    x_service_token: Optional[str] = Header(None),
):
    _check_token(x_service_token)

    count_row = db.execute(
        text("""
            SELECT COUNT(*) as cnt FROM knowledge_memory_events
            WHERE app_name = :app_name AND user_id = :user_id
        """),
        {"app_name": req.app_name, "user_id": req.user_id},
    ).fetchone()
    total = count_row.cnt if count_row else 0

    if total == 0:
        return MemoryCompressResponse(success=False, message="No messages to compress", messages_compressed=0)

    if not req.force and total < 5:
        return MemoryCompressResponse(
            success=False,
            message=f"Not enough messages to compress ({total} < 5). Use force=true to override.",
            messages_compressed=0,
        )

    summary_id, summary_content = _do_compress(db, req.app_name, req.user_id, compress_count=total)
    return MemoryCompressResponse(
        success=True,
        message=f"Compressed {total} messages into summary",
        messages_compressed=total,
        summary_id=summary_id,
        summary_content=summary_content,
    )


def _do_compress(db: Session, app_name: str, user_id: str, compress_count: int):
    rows = db.execute(
        text("""
            SELECT id, role, content, created_at
            FROM knowledge_memory_events
            WHERE app_name = :app_name AND user_id = :user_id
            ORDER BY created_at ASC
            LIMIT :lim
        """),
        {"app_name": app_name, "user_id": user_id, "lim": compress_count},
    ).fetchall()

    if not rows:
        return None, None

    lines = [f"[{r.created_at.strftime('%Y-%m-%d %H:%M')}] {r.role}: {r.content}" for r in rows]
    summary_content = "Conversation summary:\n" + "\n".join(lines)
    ids = [str(r.id) for r in rows]

    result = db.execute(
        text("""
            INSERT INTO knowledge_memory_summaries (app_name, user_id, content, messages_compressed)
            VALUES (:app_name, :user_id, :content, :cnt)
            RETURNING id
        """),
        {"app_name": app_name, "user_id": user_id, "content": summary_content, "cnt": len(rows)},
    ).fetchone()
    summary_id = str(result.id) if result else None

    if ids:
        db.execute(
            text("DELETE FROM knowledge_memory_events WHERE id = ANY(:ids::uuid[])"),
            {"ids": ids},
        )

    db.commit()
    return summary_id, summary_content


@router.delete("/{app_name}/{user_id}", status_code=200)
def clear_memory(
    app_name: str,
    user_id: str,
    db: Session = Depends(get_db),
    x_service_token: Optional[str] = Header(None),
):
    _check_token(x_service_token)
    db.execute(
        text("DELETE FROM knowledge_memory_events WHERE app_name = :a AND user_id = :u"),
        {"a": app_name, "u": user_id},
    )
    db.execute(
        text("DELETE FROM knowledge_memory_summaries WHERE app_name = :a AND user_id = :u"),
        {"a": app_name, "u": user_id},
    )
    db.commit()
    return {"status": "cleared", "app_name": app_name, "user_id": user_id}

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from src.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS knowledge_memory_events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                app_name TEXT NOT NULL,
                user_id TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                content TEXT NOT NULL,
                memory_base_config_id TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_kme_app_user
            ON knowledge_memory_events(app_name, user_id, created_at DESC)
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS knowledge_memory_summaries (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                app_name TEXT NOT NULL,
                user_id TEXT NOT NULL,
                content TEXT NOT NULL,
                messages_compressed INTEGER DEFAULT 0,
                memory_base_config_id TEXT,
                session_id TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_kms_app_user
            ON knowledge_memory_summaries(app_name, user_id, created_at DESC)
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS knowledge_entries (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                app_name TEXT,
                user_id TEXT,
                content TEXT NOT NULL,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_ke_app_user
            ON knowledge_entries(app_name, user_id, created_at DESC)
        """))
        conn.commit()

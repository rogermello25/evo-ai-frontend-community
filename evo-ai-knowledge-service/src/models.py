from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime


class MemoryEventRequest(BaseModel):
    app_name: str
    user_id: str
    role: str = "user"
    content: str
    max_messages: Optional[int] = None
    compression_interval: Optional[int] = None


class MemorySessionRequest(BaseModel):
    app_name: str
    user_id: str
    content: str
    metadata: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None
    short_term_max_messages: Optional[int] = None
    compression_interval: Optional[int] = None


class MemorySearchRequest(BaseModel):
    app_name: str
    user_id: str
    query: str = ""
    max_results: int = 10


class MemoryCompressRequest(BaseModel):
    app_name: str
    user_id: str
    force: bool = False


class MemoryEntry(BaseModel):
    id: Optional[str] = None
    content: str
    timestamp: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    score: Optional[float] = None


class MemorySearchResponse(BaseModel):
    memories: List[MemoryEntry] = []
    total: int = 0
    query: str = ""


class MemoryLoadResponse(BaseModel):
    memories: List[MemoryEntry] = []
    total: int = 0


class MemoryCompressResponse(BaseModel):
    success: bool
    message: str
    messages_compressed: int = 0
    summary_id: Optional[str] = None
    summary_content: Optional[str] = None


class KnowledgeSearchRequest(BaseModel):
    app_name: Optional[str] = None
    user_id: Optional[str] = None
    query: str = ""
    max_results: int = 10


class KnowledgeSearchResponse(BaseModel):
    results: List[Dict[str, Any]] = []
    total: int = 0
    query: str = ""

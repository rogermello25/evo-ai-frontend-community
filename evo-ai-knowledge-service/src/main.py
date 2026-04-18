from fastapi import FastAPI
from contextlib import asynccontextmanager

from src.database import init_db
from src.routers import memory, knowledge


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Evo AI Knowledge Service",
    description="Memory and Knowledge microservice for Evo AI agents",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(memory.router, prefix="/api/v1")
app.include_router(knowledge.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}

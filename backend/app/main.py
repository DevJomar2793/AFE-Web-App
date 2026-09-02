from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.router import api_router
from app.db.session import engine


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    yield
    await engine.dispose()


app = FastAPI(
    title="AFE Inventory API",
    description="Inventory and sales API for Adamos Fresh Eggs.",
    version="0.1.0",
    lifespan=lifespan,
)
app.include_router(api_router)

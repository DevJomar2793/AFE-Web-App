from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.routes.health import router as health_router
from app.routes.inventory import router as inventory_router
from app.routes.returns import router as returns_router
from app.routes.sales import router as sales_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    yield
    await engine.dispose()


app = FastAPI(
    title="AFE Inventory API",
    description="Inventory, sales, and returns API for Adamos Fresh Eggs.",
    version="0.1.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Accept", "Content-Type"],
)
for router in (health_router, inventory_router, sales_router, returns_router):
    app.include_router(router, prefix="/api/v1")

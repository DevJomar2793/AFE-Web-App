from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.inventory import router as inventory_router
from app.api.routes.sales import router as sales_router


api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health_router)
api_router.include_router(inventory_router)
api_router.include_router(sales_router)

"""API routers."""
from app.routers.components import router as components_router
from app.routers.suppliers import router as suppliers_router
from app.routers.boms import router as boms_router
from app.routers.fabrication import router as fabrication_router
from app.routers.devices import router as devices_router
from app.routers.reports import router as reports_router

__all__ = [
    "components_router",
    "suppliers_router",
    "boms_router",
    "fabrication_router",
    "devices_router",
    "reports_router",
]

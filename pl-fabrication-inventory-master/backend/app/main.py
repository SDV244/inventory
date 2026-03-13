"""PL Device Fabrication Inventory API - Main Application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine, Base
from app.routers import (
    components_router,
    suppliers_router,
    boms_router,
    fabrication_router,
    devices_router,
    reports_router,
)

settings = get_settings()

# Create tables (for development; use Alembic in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    ## PL Device Fabrication Inventory Management System
    
    This API provides complete inventory management and fabrication tracking
    for photoluminescence (PL) device manufacturing.
    
    ### Features
    
    - **Inventory Management**: Track components, suppliers, and stock levels
    - **Bill of Materials**: Define and version product recipes
    - **Work Orders**: Manage fabrication workflows with step tracking
    - **Quality Control**: Record and track quality checkpoints
    - **Device Traceability**: Full component-to-device tracking
    - **Reports**: Inventory status, production metrics, and quality analytics
    """,
    openapi_tags=[
        {"name": "Suppliers", "description": "Manage component suppliers"},
        {"name": "Components", "description": "Inventory management for components"},
        {"name": "Bill of Materials", "description": "Product recipes and versions"},
        {"name": "Fabrication", "description": "Work orders and fabrication steps"},
        {"name": "Devices", "description": "Completed PL device units"},
        {"name": "Reports", "description": "Analytics and reporting"},
    ],
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://jarvis.vipmedicalgroup.ai",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": settings.app_version}


# Include routers
app.include_router(suppliers_router, prefix=settings.api_prefix)
app.include_router(components_router, prefix=settings.api_prefix)
app.include_router(boms_router, prefix=settings.api_prefix)
app.include_router(fabrication_router, prefix=settings.api_prefix)
app.include_router(devices_router, prefix=settings.api_prefix)
app.include_router(reports_router, prefix=settings.api_prefix)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

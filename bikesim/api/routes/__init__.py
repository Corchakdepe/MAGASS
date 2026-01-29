"""API routes package."""

from fastapi import APIRouter
from bikesim.api.routes import simulations, analysis, results, filters

# Create main API router
api_router = APIRouter()

# Include sub-routers
api_router.include_router(
    simulations.router,
    prefix="/simulations",
    tags=["simulations"]
)

api_router.include_router(
    analysis.router,
    prefix="/analysis",
    tags=["analysis"]
)

api_router.include_router(
    results.router,
    prefix="/results",
    tags=["results"]
)

api_router.include_router(
    filters.router,
    prefix="/filters",
    tags=["filters"]
)

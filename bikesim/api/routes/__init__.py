"""API routes package."""
from fastapi import APIRouter
from bikesim.api.routes import simulations, analysis, results, filters

# Create main API router
api_router = APIRouter()

# Include analysis router WITHOUT prefix (legacy endpoints like /exe/analizar-json)
api_router.include_router(
    analysis.router,
    tags=["analysis"]
)

# Include other routers with prefixes
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

# Include simulations router WITHOUT prefix (legacy endpoints)
api_router.include_router(
    simulations.router,
    tags=["simulations"]
)

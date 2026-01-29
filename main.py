"""
BikeSim FastAPI Backend - Main Application Entry Point

This is the refactored main API file that uses the new modular architecture.
"""

import logging
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from bikesim.config.settings import get_config
from bikesim.api.routes import api_router
from bikesim.api.routes.execution import router as execution_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# ============================================
# APPLICATION INITIALIZATION
# ============================================

# Load configuration
config = get_config()

# Create FastAPI app
app = FastAPI(
    title=config.api_title,
    version=config.api_version,
    description="Backend API for bike-sharing simulation and analysis"
)

# ============================================
# CORS MIDDLEWARE
# ============================================

allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    config.allowed_origins
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure via environment for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# ROUTES
# ============================================

# Include all API routes
app.include_router(api_router, prefix="/api")

# Include execution routes at root level (for backward compatibility)
app.include_router(execution_router, prefix="/exe", tags=["execution"])

# ============================================
# ROOT ENDPOINT
# ============================================

@app.get("/")
async def root():
    """
    API information and available endpoints.

    Returns:
        API metadata and endpoint listing
    """
    return {
        "name": config.api_title,
        "version": config.api_version,
        "endpoints": {
            "simulation": "/exe/simular-json",
            "analysis": "/exe/analizar-json",
            "list_simulations": "/api/simulations/",
            "simulations_history": "/api/simulations/history",
            "validate_folder": "/api/simulations/validate-folder",
            "summary": "/api/simulations/{folder_name}/summary",
            "results_list": "/api/results/list",
            "results_file": "/api/results/file/{run_folder}/{fname}",
            "filters_result": "/api/filters/result",
            "dashboard_initial_data": "/api/simulations/dashboard/initial-data",
        },
        "config": {
            "results_folder": str(config.results_folder),
            "uploads_folder": str(config.uploads_folder),
        }
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint.

    Returns:
        Service health status
    """
    return {
        "status": "healthy",
        "service": config.api_title,
        "version": config.api_version
    }


# ============================================
# STARTUP EVENT
# ============================================

@app.on_event("startup")
async def startup_event():
    """
    Execute tasks on application startup.
    """
    logger.info(f"Starting {config.api_title} v{config.api_version}")
    logger.info(f"Results folder: {config.results_folder}")
    logger.info(f"Uploads folder: {config.uploads_folder}")

    # Ensure required directories exist
    config.results_folder.mkdir(exist_ok=True, parents=True)
    config.uploads_folder.mkdir(exist_ok=True, parents=True)

    logger.info("Application startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Execute tasks on application shutdown.
    """
    logger.info("Shutting down application")


# ============================================
# RUN APPLICATION
# ============================================

if __name__ == "__main__":
    import uvicorn

    # Get host and port from environment or use defaults
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))

    logger.info(f"Starting server on {host}:{port}")

    uvicorn.run(
        "bikesim.mainapi:app",
        host=host,
        port=port,
        reload=True,  # Set to False in production
        log_level="info"
    )

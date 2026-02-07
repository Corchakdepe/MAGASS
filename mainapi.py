"""
BikeSim FastAPI Backend
Manages bike simulation execution, analysis, and results serving
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from bikesim.config.settings import UPLOADS_FOLDER, RESULTS_BASE_FOLDER
from bikesim.api.routes import api_router

app = FastAPI(title="BikeSim API", version="1.0")

# Get allowed origins from environment variable or use defaults
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:8000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configurable via environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create required directories
UPLOADS_FOLDER.mkdir(exist_ok=True)
RESULTS_BASE_FOLDER.mkdir(exist_ok=True)

# Include the API router with all your endpoints
app.include_router(api_router)  # Add this line

@app.get("/")
async def root():
    """API information and available endpoints"""
    return {
        "name": "BikeSim API",
        "version": "1.0",
        "endpoints": {
            "simulation": "/simulations/...",
            "analysis": "/analysis/...",
            "results": "/results/...",
            "filters": "/filters/...",
            "dashboard": "/dashboard/...",
        },
    }

"""Simulation management API routes."""

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from pathlib import Path

from bikesim.core.models import SimulationMetadata, SimulationHistory
from bikesim.core.exceptions import SimulationNotFoundError
from bikesim.services.simulation_service import SimulationService
from bikesim.api.dependencies import get_simulation_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=dict)
async def list_simulations(
        service: SimulationService = Depends(get_simulation_service)
):
    """
    List all simulation folders with enriched metadata.

    Returns:
        Dictionary with simulations list and total count
    """
    try:
        # Enrich with upload info if available
        service.enrich_with_upload_info()

        simulations = service.list_simulations()

        return {
            "simulations": [s.dict() for s in simulations],
            "total": len(simulations)
        }
    except Exception as e:
        logger.error(f"Error listing simulations: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error listing simulations: {str(e)}"
        )


@router.get("/history", response_model=SimulationHistory)
async def get_history(
        service: SimulationService = Depends(get_simulation_service)
):
    """
    Get simulation history with metadata.

    Returns:
        Simulation history
    """
    try:
        service.enrich_with_upload_info()
        history = service.repository.load_history()
        return history
    except Exception as e:
        logger.error(f"Error loading history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error loading history: {str(e)}"
        )


@router.get("/by-name", response_model=SimulationMetadata)
async def get_by_name(
        name: str = Query(..., description="Simulation name"),
        service: SimulationService = Depends(get_simulation_service)
):
    """
    Get simulation by name.

    Args:
        name: Simulation name

    Returns:
        Simulation metadata
    """
    try:
        history = service.repository.load_history()
        for sim in history.simulations:
            if sim.simname == name:
                return sim

        raise HTTPException(
            status_code=404,
            detail=f"Simulation not found: {name}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding simulation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error finding simulation: {str(e)}"
        )


@router.get("/{folder_name}", response_model=SimulationMetadata)
async def get_simulation(
        folder_name: str,
        service: SimulationService = Depends(get_simulation_service)
):
    """
    Get simulation by folder name.

    Args:
        folder_name: Simulation folder name

    Returns:
        Simulation metadata
    """
    try:
        return service.get_simulation(folder_name)
    except SimulationNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting simulation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting simulation: {str(e)}"
        )


@router.get("/{folder_name}/summary")
async def get_summary(
        folder_name: Optional[str] = None,
        service: SimulationService = Depends(get_simulation_service)
):
    """
    Get simulation summary data.

    Args:
        folder_name: Simulation folder name (None for latest)

    Returns:
        Summary data as comma-separated string
    """
    try:
        summary_file = service.get_summary_file(folder_name)

        if not summary_file or not summary_file.exists():
            # Return default empty summary
            return "0," + ",".join(["0.0"] * 13)

        content = summary_file.read_text(encoding="utf-8").strip()
        logger.info(f"Read summary from: {summary_file}")

        return content
    except Exception as e:
        logger.error(f"Error reading summary: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error reading summary: {str(e)}"
        )


@router.get("/validate-folder")
async def validate_folder(
        path: str = Query(..., description="Folder path to validate"),
        service: SimulationService = Depends(get_simulation_service)
):
    """
    Validate if folder exists and count files.

    Args:
        path: Folder path

    Returns:
        Validation result with file count
    """
    try:
        folder_path = Path(path)

        if not folder_path.is_absolute():
            folder_path = service.config.root_dir / folder_path

        exists = folder_path.exists() and folder_path.is_dir()
        file_count = len(list(folder_path.rglob("*"))) if exists else 0

        return {
            "valid": exists,
            "path": str(folder_path),
            "file_count": file_count
        }
    except Exception as e:
        logger.error(f"Folder validation failed: {e}")
        return {
            "valid": False,
            "error": str(e)
        }


@router.get("/dashboard/initial-data")
async def get_dashboard_initial_data(
        run: str = Query(..., description="Simulation folder name"),
        service: SimulationService = Depends(get_simulation_service)
):
    """
    Get initial data for dashboard (city, bikes, stations).

    Args:
        run: Simulation folder name

    Returns:
        Dashboard initial data
    """
    try:
        sim = service.get_simulation(run)

        return {
            "city": sim.cityname or "N/A",
            "numBikes": sim.numberOfBikes or 0,
            "numStations": sim.numberOfStations or 0,
            "simname": sim.simname
        }
    except SimulationNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Simulation not found: {run}"
        )
    except Exception as e:
        logger.error(f"Error fetching initial data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching initial data: {str(e)}"
        )

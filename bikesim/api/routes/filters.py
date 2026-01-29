"""Filter results API routes."""

import logging
import re
from fastapi import APIRouter, HTTPException, Query, Depends

from bikesim.services.simulation_service import SimulationService
from bikesim.repositories.result_repository import ResultRepository
from bikesim.utils.file_utils import parse_int_list_from_text
from bikesim.api.dependencies import get_simulation_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/result")
async def get_filter_result(
    run: str = Query(..., description="Simulation folder name"),
    filename: str = Query(..., description="Filter file name"),
    kind: str = Query("stations", description="Filter kind: stations, hours, percent"),
    service: SimulationService = Depends(get_simulation_service)
):
    """
    Get parsed filter results from a specific file.

    Args:
        run: Simulation folder name
        filename: Filter file name
        kind: Type of filter result

    Returns:
        Parsed filter data
    """
    try:
        # Find simulation folder
        folder = service.repository.find_by_folder_name(run)
        if not folder:
            raise HTTPException(
                status_code=404,
                detail=f"Simulation not found: {run}"
            )

        # Get file path
        file_path = folder / filename
        if not file_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Filter file not found: {filename}"
            )

        # Read file content
        text = file_path.read_text(encoding="utf-8").strip()

        # Parse based on kind
        if kind in ("stations", "hours"):
            numbers = parse_int_list_from_text(text)
            if kind == "stations":
                return {"stations": numbers}
            else:
                return {"hours": numbers}
        elif kind == "percent":
            match = re.search(r"\d+(\.\d+)?", text)
            value = float(match.group(0)) if match else 0.0
            return {"percent": value}
        else:
            # Return raw text for unknown kinds
            return {"raw": text}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reading filter result: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error reading filter result: {str(e)}"
        )

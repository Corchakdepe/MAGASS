"""Simulation and analysis execution routes."""

import logging
import os
from fastapi import APIRouter, HTTPException, Depends

from bikesim.core.models import SimulationParams, AnalysisRequest
from bikesim.services.simulation_service import SimulationService
from bikesim.api.dependencies import get_simulation_service
from bikesim.analysis.runner import run_analysis  # Use new runner
from Frontend.simulation_runner import run_simulation

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/simular-json")
async def execute_simulation(
        params: SimulationParams,
        service: SimulationService = Depends(get_simulation_service)
):
    """
    Execute bike simulation with given parameters.

    Args:
        params: Simulation parameters

    Returns:
        Execution result with output folder
    """
    try:
        # Create simulation folder if not specified
        if not hasattr(params, 'ruta_salida') or not params.ruta_salida:
            metadata = service.create_simulation_folder(params)
            output_folder = metadata.path
        else:
            output_folder = params.ruta_salida
            os.makedirs(output_folder, exist_ok=True)

        # Run simulation (using existing simulation_runner)
        run_simulation(
            ruta_entrada=params.ruta_entrada,
            ruta_salida=output_folder,
            stress_type=params.stress_type,
            stress=params.stress,
            walk_cost=params.walk_cost,
            delta=params.delta,
            dias=params.dias
        )

        logger.info(f"Simulation completed: {output_folder}")

        return {
            "ok": True,
            "output_folder_name": output_folder
        }

    except Exception as e:
        logger.error(f"Simulation execution failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Simulation execution failed: {str(e)}"
        )


@router.post("/analizar-json")
async def execute_analysis(request: AnalysisRequest):
    """
    Execute analysis with given parameters.

    This endpoint handles:
    - Standard analysis
    - Filter-based map generation
    - Filter-based graph generation

    Args:
        request: Analysis request parameters

    Returns:
        Analysis result
    """
    try:
        logger.info(f"Analysis requested: {request.input_folder}")

        # Use new refactored runner
        result = run_analysis(request)

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis execution failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Analysis execution failed: {str(e)}"
        )

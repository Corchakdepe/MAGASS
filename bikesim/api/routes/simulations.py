"""Simulation management API routes."""

import logging
import os
from Frontend.simulation_runner import run_simulation
from Frontend.analysis_models import SimulateArgs
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from pathlib import Path
from bikesim.core.models import SimulationMetadata, SimulationHistory
from bikesim.core.exceptions import SimulationNotFoundError
from bikesim.services.simulation_service import SimulationService
from bikesim.api.dependencies import get_simulation_service
from bikesim.utils.file_utils import get_latest_simulation_folder, create_simulation_folder
from bikesim.utils.historymanagement import enrich_history_with_station_info, load_history

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/exe/simular-json")
def exe_simular_json(args: SimulateArgs):
    """Executes bike simulation with given parameters"""
    try:
        # Create output folder if not specified
        if not args.ruta_salida:
            output_folder = create_simulation_folder(
                stress_type=args.stress_type,
                stress=args.stress,
                walk_cost=args.walk_cost,
                delta=args.delta,
                simname=args.simname,
            )
            ruta_salida = str(output_folder)
        else:
            ruta_salida = args.ruta_salida
            os.makedirs(ruta_salida, exist_ok=True)

        # Run simulation
        run_simulation(
            ruta_entrada=args.ruta_entrada,
            ruta_salida=ruta_salida,
            stress_type=args.stress_type,
            stress=args.stress,
            walk_cost=args.walk_cost,
            delta=args.delta,
            dias=args.dias,
        )

        return {"ok": True, "output_folder_name": ruta_salida}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# NEW: This is your main list endpoint using the service layer
@router.get("/list-simulations")
async def list_simulations_legacy(
    service: SimulationService = Depends(get_simulation_service)
):
    """Lists all simulation folders with enriched metadata (legacy endpoint)"""
    try:
        logger.info("=== /list-simulations called ===")

        # Use service to get results folder (Docker-compatible)
        results_folder = service.config.results_folder
        logger.info(f"Results folder: {results_folder}")

        folders = [f for f in results_folder.glob("*_sim_*") if f.is_dir()]
        folders_sorted = sorted(folders, key=lambda x: x.stat().st_mtime, reverse=True)

        logger.info(f"Found {len(folders)} simulation folders")

        # Enrich history with station/bike info if missing
        history = enrich_history_with_station_info()
        meta_by_folder = {
            s.get("simfolder"): s for s in history.get("simulations", [])
        }

        simulations = []
        for folder in folders_sorted:
            stat = folder.stat()
            created = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
            file_count = len(list(folder.glob("*")))
            meta = meta_by_folder.get(folder.name, {})

            simulations.append({
                "name": meta.get("simname", folder.name),
                "simfolder": folder.name,
                "path": str(folder),
                "created": created,
                "file_count": file_count,
                "cityname": meta.get("cityname"),
                "numberOfStations": meta.get("numberOfStations"),
                "numberOfBikes": meta.get("numberOfBikes"),
                "simdataId": meta.get("simdataId"),
                "simdata": meta.get("simdata", {}),
            })

        logger.info(f"Returning {len(simulations)} simulations")
        return {"simulations": simulations, "total": len(simulations)}

    except Exception as e:
        logger.error(f"Error in list_simulations_legacy: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error listing simulations: {e}")


@router.get("/simulations-history")
async def get_simulations_history():
    """Returns simulations history JSON directly (for frontend)"""
    try:
        history = enrich_history_with_station_info()
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading history: {e}")


@router.get("/simulation-by-name")
async def get_simulation_by_name(name: str = Query(...)):
    """Finds simulation by name in history"""
    history = load_history()
    for sim in history.get("simulations", []):
        if sim.get("simname") == name:
            return sim
    raise HTTPException(status_code=404, detail=f"Simulation not found: {name}")


@router.get("/simulation-summary")
async def get_simulation_summary(
    folder: Optional[str] = Query(default=None),
    service: SimulationService = Depends(get_simulation_service)
):
    """Returns simulation summary data as comma-separated string"""
    try:
        results_folder = service.config.results_folder

        if folder:
            folder_path = results_folder / folder
            if not folder_path.exists() or not folder_path.is_dir():
                logger.error(f"Requested summary for missing folder: {folder_path}")
                raise HTTPException(status_code=400, detail=f"Folder not found: {folder}")
        else:
            folder_path = get_latest_simulation_folder()
            if not folder_path:
                return "0," + ",".join(["0.0"] * 13)

        # Find summary file
        summary_files = list(folder_path.glob("*ResumenEjecucion*.txt"))
        if not summary_files:
            logger.warning(f"No ResumenEjecucion file found in {folder_path}")
            return "0," + ",".join(["0.0"] * 13)

        summary_path = summary_files[0]
        logger.info(f"Reading summary from: {summary_path}")
        return summary_path.read_text(encoding="utf-8").strip()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reading summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error reading summary: {e}")


@router.get("/validate-folder")
async def validate_folder(
    path: str = Query(...),
    service: SimulationService = Depends(get_simulation_service)
):
    """Validates if folder exists and counts files"""
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
        return {"valid": False, "error": str(e)}


# Keep the service-based endpoints below (they use dependency injection)
@router.get("/history", response_model=SimulationHistory)
async def get_history(
    service: SimulationService = Depends(get_simulation_service)
):
    """Get simulation history with metadata."""
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
    """Get simulation by name."""
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
    """Get simulation by folder name."""
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


@router.get("/dashboard/initial-data")
async def get_dashboard_initial_data(
    run: str = Query(..., description="Simulation folder name"),
    service: SimulationService = Depends(get_simulation_service)
):
    """Get initial data for dashboard (city, bikes, stations)."""
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

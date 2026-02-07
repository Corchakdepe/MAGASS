"""Simulation management API routes."""

import logging
import os
from Frontend.simulation_runner import run_simulation
from Frontend.analysis_models import SimulateArgs
from datetime import datetime
import shutil
from fastapi import UploadFile, File
import os
import pandas as pd
from pathlib import Path
from fastapi.responses import HTMLResponse
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

"""@router.post("/exe/simular-json")
def exe_simular_json(args: SimulateArgs):
    Executes bike simulation with given parameters
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
    """


@router.post("/exe/simular-json")
def exe_simular_json(args: SimulateArgs):
    """Executes bike simulation with given parameters"""
    try:
        # Use uploaded folder path if provided
        if not args.ruta_entrada and hasattr(args, 'folderPath') and args.folderPath:
            args.ruta_entrada = args.folderPath

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

        # Validate input folder exists
        if not os.path.exists(args.ruta_entrada):
            raise HTTPException(
                status_code=400,
                detail=f"Input folder does not exist: {args.ruta_entrada}"
            )

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


@router.post("/upload-files")
async def upload_files(files: list[UploadFile] = File(...)):
    """Upload CSV files for simulation"""
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = Path("./uploads")
        upload_dir.mkdir(exist_ok=True)

        # Create a timestamped subdirectory
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        session_dir = upload_dir / f"upload_{timestamp}"
        session_dir.mkdir(exist_ok=True)

        uploaded_files = []
        for file in files:
            if not file.filename.lower().endswith('.csv'):
                continue

            file_path = session_dir / file.filename
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            uploaded_files.append(file.filename)

        if not uploaded_files:
            raise HTTPException(status_code=400, detail="No CSV files uploaded")

        return {
            "success": True,
            "uploaded_files": uploaded_files,
            "upload_path": str(session_dir),
            "message": f"Uploaded {len(uploaded_files)} CSV files"
        }

    except Exception as e:
        logger.error(f"File upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")




@router.post("/analyze-upload")
async def analyze_uploaded_files(request: dict):
    """Analyze uploaded CSV files to extract station and bike information"""
    try:
        folder_path = request.get("folderPath")
        if not folder_path:
            raise HTTPException(status_code=400, detail="No folder path provided")

        folder = Path(folder_path)
        if not folder.exists():
            raise HTTPException(status_code=404, detail=f"Folder not found: {folder_path}")

        # Look for station and trip files
        csv_files = list(folder.glob("*.csv"))
        if not csv_files:
            raise HTTPException(status_code=400, detail="No CSV files found in upload folder")

        station_data = {}
        city_name = "Unknown City"

        # Try to find station information
        for csv_file in csv_files:
            try:
                df = pd.read_csv(csv_file, nrows=10)  # Read first 10 rows for inspection

                # Check if this looks like a stations file
                station_columns = ['station_id', 'station_name', 'lat', 'lon', 'capacity', 'available_bikes']
                has_station_info = any(col in df.columns for col in station_columns)

                if has_station_info:
                    # Read full file if it's reasonable size
                    df_full = pd.read_csv(csv_file) if csv_file.stat().st_size < 10_000_000 else df

                    # Try to extract city name from filename or data
                    if 'city' in df_full.columns:
                        city_name = str(df_full['city'].iloc[0])
                    elif 'city_name' in df_full.columns:
                        city_name = str(df_full['city_name'].iloc[0])

                    # Extract station data
                    for _, row in df_full.iterrows():
                        station_id = str(row.get('station_id') or row.get('id') or '')
                        if station_id:
                            station_data[station_id] = {
                                'id': station_id,
                                'name': str(row.get('station_name') or row.get('name') or station_id),
                                'lat': float(row.get('lat') or row.get('latitude') or 0),
                                'lng': float(row.get('lon') or row.get('lng') or row.get('longitude') or 0),
                                'capacity': int(row.get('capacity') or row.get('total_docks') or 10),
                                'available_bikes': int(
                                    row.get('available_bikes') or row.get('num_bikes_available') or 0)
                            }

                    break  # Found station data

            except Exception as e:
                logger.warning(f"Could not read {csv_file.name}: {e}")
                continue

        # If no station data found, create mock data
        if not station_data:
            logger.info("No station data found in CSV files, creating mock data")
            # Try to get trip data to infer stations
            trip_data = None
            for csv_file in csv_files:
                try:
                    df = pd.read_csv(csv_file)
                    if 'start_station_id' in df.columns or 'end_station_id' in df.columns:
                        trip_data = df
                        break
                except:
                    continue

            if trip_data is not None:
                # Extract unique station IDs from trip data
                start_stations = trip_data.get('start_station_id', pd.Series([])).dropna().unique()
                end_stations = trip_data.get('end_station_id', pd.Series([])).dropna().unique()
                all_stations = set(start_stations) | set(end_stations)

                for i, station_id in enumerate(list(all_stations)[:20]):  # Limit to 20 stations for preview
                    station_data[str(station_id)] = {
                        'id': str(station_id),
                        'name': f"Station {i + 1}",
                        'lat': 40.4168 + (i * 0.01) - 0.05,  # Mock coordinates around a city center
                        'lng': -3.7038 + (i * 0.01) - 0.05,
                        'capacity': 20 + (i % 10),
                        'available_bikes': (20 + (i % 10)) // 2
                    }
                city_name = "City Data"
            else:
                # Create minimal mock data
                for i in range(5):
                    station_data[f"station_{i}"] = {
                        'id': f"station_{i}",
                        'name': f"Station {i + 1}",
                        'lat': 40.4168 + (i * 0.01),
                        'lng': -3.7038 + (i * 0.01),
                        'capacity': 15 + (i * 2),
                        'available_bikes': 5 + i
                    }

        stations = list(station_data.values())
        total_bikes = sum(s['available_bikes'] for s in stations)

        return {
            "success": True,
            "city": city_name,
            "totalStations": len(stations),
            "totalBikes": total_bikes,
            "stations": stations,
            "fileCount": len(csv_files),
            "message": f"Analyzed {len(csv_files)} CSV files"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing upload: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error analyzing upload: {str(e)}")




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



import asyncio
import json
import logging
from datetime import datetime
from http.client import HTTPException
from typing import Optional

import pandas as pd
import req
from fastapi import APIRouter, Query
from pathlib import Path
from starlette.responses import HTMLResponse
from Frontend.analysis_models import AnalysisArgs
from bikesim.analysis import run_analysis
from bikesim.api.routes.simulations import router, logger
from bikesim.core.models import AnalysisRequest
from bikesim.utils.file_utils import find_run_folder
from bikesim.utils.historymanagement import load_history, enrich_history_with_station_info
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import time
from functools import lru_cache

# Initialize geocoder with a user agent
geolocator = Nominatim(user_agent="bike_simulation_app")

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/dashboard/initial-data")
async def get_dashboard_initial_data(run: str = Query(..., description="Simulation folder name")):
    """Returns initial data (city, bikes, stations) for a specific simulation run"""
    try:
        # Get simulation metadata from history
        history = load_history()

        # Find the simulation by folder name
        sim = None
        for s in history.get("simulations", []):
            if s.get("simfolder") == run:
                sim = s
                break

        if not sim:
            # Try to enrich history and search again
            history = enrich_history_with_station_info()
            for s in history.get("simulations", []):
                if s.get("simfolder") == run:
                    sim = s
                    break

        if not sim:
            raise HTTPException(
                status_code=404,
                detail=f"Simulation not found: {run}"
            )

        # Return the data in the format expected by frontend
        return {
            "city": sim.get("cityname", "N/A"),
            "numBikes": sim.get("numberOfBikes", 0),
            "numStations": sim.get("numberOfStations", 0),
            "simname": sim.get("simname", run),
        }

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching initial data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching initial data: {e}"
        )


"""@router.post("/dashboard/mapacapacidades")
async def createInitialMap(req: AnalysisRequest):
    Executes analysis with optional filtering for maps/graphs
    try:
        # === STANDARD ANALYSIS ===
        final_args = AnalysisArgs(
            input_folder=req.input_folder,
            output_folder=req.output_folder,
            seleccion_agregacion=req.seleccion_agregacion,
            delta_media=req.delta_media,
            delta_acumulada=req.delta_acumulada,
            graf_barras_est_med=req.graf_barras_est_med,
            graf_barras_est_acum=req.graf_barras_est_acum,
            graf_barras_dia=req.graf_barras_dia,
            graf_linea_comp_est=req.graf_linea_comp_est,
            graf_linea_comp_mats=req.graf_linea_comp_mats,
            mapa_densidad=req.mapa_densidad,
            video_densidad=req.video_densidad,
            mapa_voronoi=req.mapa_voronoi,
            mapa_circulo=req.mapa_circulo,
            mapa_capacidad="all",  # Still hardcoded as "all"
            mapa_desplazamientos=req.mapa_desplazamientos,
            filtrado_EstValor=req.filtrado_EstValor,
            filtrado_EstValorDias=req.filtrado_EstValorDias,
            filtrado_Horas=req.filtrado_Horas,
            filtrado_PorcentajeEstaciones=req.filtrado_PorcentajeEstaciones,
            filtro=req.filtro,
            tipo_filtro=req.tipo_filtro,
            use_filter_for_maps=req.use_filter_for_maps,  # Changed
            use_filter_for_graphs=req.use_filter_for_graphs,  # Changed
            filter_result_filename=req.filter_result_filename,  # Changed
            apply_filter_to_line_comp=req.apply_filter_to_line_comp,  # From AnalysisArgs
            user_name_map=req.user_name_map,
        )

        run_analysis_result = run_analysis(final_args)


        return run_analysis_result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis execution failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
"""


@router.post("/dashboard/mapacapacidades")
async def createInitialMap(req: AnalysisRequest):
    """Executes analysis with optional filtering for maps/graphs"""
    try:
        # === STANDARD ANALYSIS ===
        final_args = AnalysisArgs(
            input_folder=req.input_folder,
            output_folder=req.output_folder,
            seleccion_agregacion=req.seleccion_agregacion,
            delta_media=req.delta_media,
            delta_acumulada=req.delta_acumulada,
            graf_barras_est_med=req.graf_barras_est_med,
            graf_barras_est_acum=req.graf_barras_est_acum,
            graf_barras_dia=req.graf_barras_dia,
            graf_linea_comp_est=req.graf_linea_comp_est,
            graf_linea_comp_mats=req.graf_linea_comp_mats,
            mapa_densidad=req.mapa_densidad,
            video_densidad=req.video_densidad,
            mapa_voronoi=req.mapa_voronoi,
            mapa_circulo=req.mapa_circulo,
            mapa_capacidad="all",  # Still hardcoded as "all"
            mapa_desplazamientos=req.mapa_desplazamientos,
            filtrado_EstValor=req.filtrado_EstValor,
            filtrado_EstValorDias=req.filtrado_EstValorDias,
            filtrado_Horas=req.filtrado_Horas,
            filtrado_PorcentajeEstaciones=req.filtrado_PorcentajeEstaciones,
            filtro=req.filtro,
            tipo_filtro=req.tipo_filtro,
            use_filter_for_maps=req.use_filter_for_maps,
            use_filter_for_graphs=req.use_filter_for_graphs,
            filter_result_filename=req.filter_result_filename,
            apply_filter_to_line_comp=req.apply_filter_to_line_comp,
            user_name_map=req.user_name_map,
        )

        run_analysis_result = run_analysis(final_args)

        # === CREATE AND SAVE SIMULATION INFO JSON ===
        try:
            # Since runID = output_folder by design, use req.output_folder as run_id
            run_id = req.output_folder

            # DEBUG: Log what we received
            logger.info(f"Received output_folder: '{run_id}'")

            # Extract just the folder name from the path
            # Remove any leading "./" or "results/" prefixes
            import os

            # Get just the basename (last part of the path)
            if "/" in run_id:
                # Extract just the last part
                run_id = os.path.basename(run_id.rstrip("/"))
                logger.info(f"Extracted run_id: '{run_id}'")

            # Build the correct simulation path
            simulation_path = Path("./results") / run_id

            # DEBUG: Log the constructed path
            logger.info(f"Constructed simulation path: {simulation_path.absolute()}")
            logger.info(f"Path exists: {simulation_path.exists()}")

            # Check if the path exists (it should after run_analysis)
            if not simulation_path.exists():
                logger.warning(f"Simulation path does not exist: {simulation_path}")
                # Try to create it
                simulation_path.mkdir(parents=True, exist_ok=True)

            # List files to verify
            if simulation_path.exists():
                files = list(simulation_path.glob("*"))
                logger.info(f"Found {len(files)} files in {simulation_path}")
                if files:
                    logger.info(f"Sample files: {[f.name for f in files[:5]]}")

            # Create JSON data based on your requirements
            json_data = _create_simulation_info_json(run_id, simulation_path)

            # Save JSON file
            json_file_path = simulation_path / "simulation_info.json"
            with open(json_file_path, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, indent=2, ensure_ascii=False)

            logger.info(f"Simulation info JSON saved to: {json_file_path}")

        except Exception as json_error:
            logger.warning(f"Failed to create simulation info JSON: {json_error}", exc_info=True)
            # Don't fail the main request if JSON creation fails

        return run_analysis_result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis execution failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


def _create_simulation_info_json(run_id: str, simulation_path: Path) -> dict:
    """Create simulation info JSON data based on requirements."""

    # Initialize default values
    city = "Unknown City"
    country = ""
    full_location = ""
    stations = 0
    avg_capacity = 0.0
    total_capacity = 0.0
    min_capacity = 0.0
    max_capacity = 0.0
    active_bikes = 0
    utilization_percentage = 0.0
    avg_lat = None
    avg_lon = None

    try:
        # 1. Load coordinates for city detection
        coordenadas_file = simulation_path / "coordenadas.csv"
        if coordenadas_file.exists():
            coordenadas_df = pd.read_csv(coordenadas_file, header=None)
            stations = len(coordenadas_df)

            # Determine city from coordinates
            if len(coordenadas_df.columns) >= 3:
                latitudes = coordenadas_df.iloc[:, 1].astype(float)
                longitudes = coordenadas_df.iloc[:, 2].astype(float)
                avg_lat = float(latitudes.mean())
                avg_lon = float(longitudes.mean())

                city_info = _try_geocode_xyz(avg_lat, avg_lon)
                city = city_info.get("city", "Unknown City")
                country = city_info.get("country", "")
                full_location = city_info.get("full_location", "")

        # 2. Load capacities
        capacidades_file = simulation_path / "capacidades.csv"
        if not capacidades_file.exists():
            # Try alternative names
            alt_names = ["capacities.csv", "station_capacities.csv"]
            for alt_name in alt_names:
                alt_file = simulation_path / alt_name
                if alt_file.exists():
                    capacidades_file = alt_file
                    break

        if capacidades_file.exists():
            capacidades_df = pd.read_csv(capacidades_file, header=None)

            if capacidades_df.iloc[0, 0] == 'header':
                capacity_values = capacidades_df.iloc[1:, 0].astype(float).values
            else:
                capacity_values = capacidades_df.iloc[:, 0].astype(float).values

            # Calculate statistics
            total_capacity = float(capacity_values.sum())
            avg_capacity = float(capacity_values.mean())
            min_capacity = float(capacity_values.min())
            max_capacity = float(capacity_values.max())

            # Active bikes and utilization (assuming initial state)
            # If you have actual bike counts, modify this section
            active_bikes = 0  # As per your requirement: always 0 initially
            if total_capacity > 0:
                utilization_percentage = (active_bikes / total_capacity) * 100
            else:
                utilization_percentage = 0.0

        # Create the JSON structure with all required fields
        return {
            "CITY": city,
            "COUNTRY": country,
            "FULL_LOCATION": full_location,
            "STATIONS": {
                "count": stations,
                "avg_capacity": round(avg_capacity, 2)
            },
            "TOTAL_CAPACITY": round(total_capacity, 2),
            "MIN_CAPACITY": round(min_capacity, 2),
            "MAX_CAPACITY": round(max_capacity, 2),
            "CAPACITY_RANGE": f"{min_capacity:.0f}-{max_capacity:.0f}",
            "ACTIVE_BIKES": active_bikes,
            "UTILIZATION": {
                "percentage": round(utilization_percentage, 2),
                "description": f"{utilization_percentage:.2f}% utilization"
            },
            "COORDINATES": {
                "average_latitude": avg_lat,
                "average_longitude": avg_lon
            } if avg_lat is not None and avg_lon is not None else None,
            "SIMULATION_ID": run_id,
            "GENERATED_AT": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error creating simulation info JSON: {e}")
        # Return complete structure even if there's an error
        return {
            "CITY": "Error",
            "COUNTRY": "",
            "FULL_LOCATION": "",
            "STATIONS": {
                "count": 0,
                "avg_capacity": 0.0
            },
            "TOTAL_CAPACITY": 0.0,
            "MIN_CAPACITY": 0.0,
            "MAX_CAPACITY": 0.0,
            "CAPACITY_RANGE": "0-0",
            "ACTIVE_BIKES": 0,
            "UTILIZATION": {
                "percentage": 0.0,
                "description": "0% utilization"
            },
            "COORDINATES": None,
            "SIMULATION_ID": run_id,
            "GENERATED_AT": datetime.now().isoformat(),
            "ERROR": str(e)
        }


@router.get("/dashboard/simulation-info/{run_id}")
async def get_simulation_info(run_id: str):
    """
    Get simulation information from CSV files or cached JSON.
    """
    try:
        # Construct the path to the simulation folder
        results_path = Path("./results")
        simulation_path = results_path / run_id

        # Check if JSON file exists (created by map creation)
        json_file = simulation_path / "simulation_info.json"
        if json_file.exists():
            logger.info(f"Loading simulation info from cached JSON: {json_file}")
            with open(json_file, 'r', encoding='utf-8') as f:
                cached_data = json.load(f)

            # Return in a consistent format
            return {
                "city": cached_data.get("CITY", "Unknown City"),
                "stations": cached_data.get("STATIONS", {}).get("count", 0),
                "total_capacity": cached_data.get("TOTAL_CAPACITY", 0),
                "active_bikes": cached_data.get("ACTIVE_BIKES", 0),
                "average_capacity": cached_data.get("STATIONS", {}).get("avg_capacity", 0),
                "min_capacity": 0,  # Not in cached data
                "max_capacity": cached_data.get("MAX_CAPACITY", 0),
                "utilization_percentage": cached_data.get("UTILIZATION", {}).get("percentage", 0),
                "simulation_id": run_id
            }

        # If no JSON file exists, proceed with original CSV processing
        # ... (keep your existing CSV processing code here)

    except Exception as e:
        logger.error(f"Error getting simulation info: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing simulation data: {str(e)}")


def _try_geocode_xyz(latitude: float, longitude: float) -> Optional[dict]:
    try:
        import requests

        url = f"http://geocode.xyz/{latitude},{longitude}"
        params = {
            "geoit": "json",
            "json": 1
        }

        response = requests.get(url, params=params, timeout=3)
        if response.status_code == 200:
            data = response.json()

            # GeoCode.xyz returns different structures
            if 'city' in data or 'standard' in data:
                city = data.get('city') or data.get('standard', {}).get('city')
                if city and city != "Throttled! See geocode.xyz/pricing":
                    return {
                        "city": city,
                        "country": data.get('country', ''),
                        "state": data.get('prov', ''),
                        "postcode": data.get('postal', ''),
                        "full_address": data.get('standard', {}).get('addresst', ''),
                        "latitude": latitude,
                        "longitude": longitude,
                        "raw_response": data
                    }
    except Exception:
        pass
    return None

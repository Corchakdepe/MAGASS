import asyncio
import logging
from http.client import HTTPException

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
from bikesim.utils.historymanagement import load_history,enrich_history_with_station_info
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
            use_filter_for_maps=req.use_filter_for_maps,  # Changed
            use_filter_for_graphs=req.use_filter_for_graphs,  # Changed
            filter_result_filename=req.filter_result_filename,  # Changed
            apply_filter_to_line_comp=req.apply_filter_to_line_comp,  # From AnalysisArgs
            user_name_map=req.user_name_map,
        )

        return run_analysis(final_args)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis execution failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))





@router.get("/dashboard/simulation-info/{run_id}")
async def get_simulation_info(run_id: str):
    """
    Get simulation information from CSV files.

    Returns:
        city: City name determined from coordinates using geopy
        stations: Number of stations
        total_capacity: Total capacity from capacidades.csv
        active_bikes: Total number of bikes (sum of capacity values)
    """
    try:
        # Construct the path to the simulation folder
        results_path = Path("./results")
        simulation_path = results_path / run_id

        # Verify the simulation folder exists
        if not simulation_path.exists():
            # Try to find it without the "sim_" prefix if present
            if not run_id.startswith("sim_"):
                alt_path = results_path / f"sim_{run_id}"
                if alt_path.exists():
                    simulation_path = alt_path
                else:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Simulation folder not found: {run_id}"
                    )

        logger.info(f"Processing simulation info for: {simulation_path}")

        # 1. Load and process coordinates to determine city
        coordenadas_file = simulation_path / "coordenadas.csv"
        if not coordenadas_file.exists():
            raise HTTPException(
                status_code=404,
                detail=f"coordenadas.csv not found in {simulation_path}"
            )

        # Load coordinates - assuming format: station_id, lat, lon
        coordenadas_df = pd.read_csv(coordenadas_file, header=None)

        # Calculate number of stations
        stations = len(coordenadas_df)

        # Calculate city from average coordinates using geopy
        if len(coordenadas_df.columns) >= 3:
            latitudes = coordenadas_df.iloc[:, 1].astype(float)
            longitudes = coordenadas_df.iloc[:, 2].astype(float)

            avg_lat = float(latitudes.mean())
            avg_lon = float(longitudes.mean())

            # Get city using geopy with retry logic
            city_info = get_city_from_coordinates_geopy(avg_lat, avg_lon)
            city = city_info.get("city", "Unknown Location")
            country = city_info.get("country", "")
            full_location = city_info.get("full_location", "")

            logger.info(f"Detected location: {city}, {country} at ({avg_lat:.4f}, {avg_lon:.4f})")
        else:
            city = "Unknown City"
            avg_lat = None
            avg_lon = None
            country = ""
            full_location = ""
            logger.warning(f"Unexpected coordinate format in {coordenadas_file}")

        # 2. Load and process capacities
        capacidades_file = simulation_path / "capacidades.csv"
        if not capacidades_file.exists():
            # Try alternative names
            alt_names = ["capacities.csv", "station_capacities.csv"]
            for alt_name in alt_names:
                alt_file = simulation_path / alt_name
                if alt_file.exists():
                    capacidades_file = alt_file
                    break
            else:
                raise HTTPException(
                    status_code=404,
                    detail=f"Capacity file not found in {simulation_path}"
                )

        # Load capacity data
        capacidades_df = pd.read_csv(capacidades_file, header=None)

        # Calculate total capacity and active bikes
        # Check if first row is a header
        if capacidades_df.iloc[0, 0] == 'header':
            capacity_values = capacidades_df.iloc[1:, 0].astype(float).values
        else:
            capacity_values = capacidades_df.iloc[:, 0].astype(float).values

        # Total capacity is the sum of all capacity values
        total_capacity = float(capacity_values.sum())

        # Active bikes - in your context, this seems to be the same as total capacity
        # If you have a different definition, adjust this
        active_bikes = float(capacity_values.sum())  # Same as total_capacity

        # Calculate additional statistics for better insights
        avg_capacity = float(capacity_values.mean())
        min_capacity = float(capacity_values.min())
        max_capacity = float(capacity_values.max())

        logger.info(
            f"Processed simulation info: {city}, {stations} stations, "
            f"{total_capacity} total capacity"
        )

        return {
            "city": city,
            "country": country,
            "full_location": full_location,
            "stations": stations,
            "total_capacity": total_capacity,
            "active_bikes": active_bikes,
            "average_capacity": avg_capacity,
            "min_capacity": min_capacity,
            "max_capacity": max_capacity,
            "capacity_range": f"{min_capacity:.0f}-{max_capacity:.0f}",
            "simulation_id": run_id,
            "coordinates": {
                "average_latitude": avg_lat,
                "average_longitude": avg_lon
            } if avg_lat is not None and avg_lon is not None else None
        }

    except HTTPException:
        raise
    except FileNotFoundError as e:
        logger.error(f"File not found error: {e}")
        raise HTTPException(status_code=404, detail=f"Required files not found: {str(e)}")
    except pd.errors.EmptyDataError as e:
        logger.error(f"Empty CSV file: {e}")
        raise HTTPException(status_code=400, detail=f"CSV file is empty or malformed: {str(e)}")
    except Exception as e:
        logger.error(f"Error getting simulation info: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing simulation data: {str(e)}")


@lru_cache(maxsize=100)
def get_city_from_coordinates_geopy(latitude: float, longitude: float) -> dict:
    """
    Get city from coordinates with multiple fallback methods.
    """
    # First, try with HTTP (no SSL issues)
    result = try_http_nominatim(latitude, longitude)
    if result and result.get("city"):
        return result

    # Fallback to coordinate-based detection
    return get_city_by_coordinate_ranges(latitude, longitude)


def try_http_nominatim(latitude: float, longitude: float) -> dict:
    """Use HTTP instead of HTTPS to avoid SSL issues."""
    try:
        import requests

        # Use HTTP instead of HTTPS
        url = "http://nominatim.openstreetmap.org/reverse"
        params = {
            "lat": latitude,
            "lon": longitude,
            "format": "json",
            "accept-language": "en",
            "addressdetails": 1
        }
        headers = {
            "User-Agent": "bike_simulation_app/1.0 (contact@example.com)"
        }

        response = requests.get(url, params=params, headers=headers, timeout=5)
        response.raise_for_status()

        data = response.json()
        address = data.get("address", {})

        # Extract city information
        city = (
                address.get('city') or
                address.get('town') or
                address.get('village') or
                address.get('municipality') or
                address.get('county')
        )

        if city:
            return {
                "city": city,
                "country": address.get('country', ''),
                "full_location": data.get('display_name', ''),
                "raw_address": address
            }

    except Exception as e:
        logger.debug(f"HTTP Nominatim request failed: {e}")

    return None


def get_city_by_coordinate_ranges(latitude: float, longitude: float) -> dict:
    """Fallback: Determine city from coordinate ranges."""
    # Based on your coordinates (37.2495, -5.9471), this is Seville, Spain
    if 37.2 <= latitude <= 37.4 and -6.0 <= longitude <= -5.8:
        return {
            "city": "Seville",
            "country": "Spain",
            "full_location": "Seville, Andalusia, Spain",
            "raw_address": {}
        }
    elif 40.3 <= latitude <= 40.5 and -3.8 <= longitude <= -3.6:
        return {
            "city": "Madrid",
            "country": "Spain",
            "full_location": "Madrid, Spain",
            "raw_address": {}
        }
    # Add more cities as needed...

    return {
        "city": f"Location at ({latitude:.4f}°, {longitude:.4f}°)",
        "country": "",
        "full_location": "",
        "raw_address": {}
    }

# Optional: Add a batch processing endpoint for multiple coordinates
@router.get("/dashboard/location-details/{run_id}")
async def get_detailed_location_info(run_id: str):
    """Get detailed location information for all stations."""
    try:
        results_path = Path("./results")
        simulation_path = results_path / run_id

        if not simulation_path.exists():
            raise HTTPException(status_code=404, detail="Simulation not found")

        coordenadas_file = simulation_path / "coordenadas.csv"
        if not coordenadas_file.exists():
            raise HTTPException(status_code=404, detail="coordenadas.csv not found")

        coordenadas_df = pd.read_csv(coordenadas_file, header=None)

        if len(coordenadas_df.columns) < 3:
            raise HTTPException(status_code=400, detail="Invalid coordinate format")

        # Get location info for first 5 stations (to avoid too many API calls)
        sample_stations = []
        for i, row in coordenadas_df.head(5).iterrows():
            station_id = int(row[0])
            lat = float(row[1])
            lon = float(row[2])

            location_info = get_city_from_coordinates_geopy(lat, lon)

            sample_stations.append({
                "station_id": station_id,
                "latitude": lat,
                "longitude": lon,
                "location": location_info.get("city", ""),
                "country": location_info.get("country", "")
            })

        # Get average location
        latitudes = coordenadas_df.iloc[:, 1].astype(float)
        longitudes = coordenadas_df.iloc[:, 2].astype(float)

        avg_lat = float(latitudes.mean())
        avg_lon = float(longitudes.mean())

        avg_location_info = get_city_from_coordinates_geopy(avg_lat, avg_lon)

        return {
            "total_stations": len(coordenadas_df),
            "average_location": {
                "latitude": avg_lat,
                "longitude": avg_lon,
                "city": avg_location_info.get("city", ""),
                "country": avg_location_info.get("country", ""),
                "full_location": avg_location_info.get("full_location", "")
            },
            "sample_stations": sample_stations,
            "coordinate_range": {
                "latitude": {
                    "min": float(latitudes.min()),
                    "max": float(latitudes.max()),
                    "mean": avg_lat
                },
                "longitude": {
                    "min": float(longitudes.min()),
                    "max": float(longitudes.max()),
                    "mean": avg_lon
                }
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




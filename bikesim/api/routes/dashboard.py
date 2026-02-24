import json
import logging
from datetime import datetime
from http.client import HTTPException
from fastapi import APIRouter, Query
from pathlib import Path
from bikesim.analysis.analysis_models import AnalysisArgs
from bikesim.analysis.simulation_runner import _try_geocode_xyz
from bikesim.analysis import run_analysis
from bikesim.api.routes.simulations import logger
from bikesim.core.models import AnalysisRequest
from bikesim.utils.historymanagement import load_history, enrich_history_with_station_info

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
            mapa_capacidad="all",
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
            run_id = req.output_folder
            logger.info(f"Received output_folder: '{run_id}'")

            # Extract just the folder name from the path
            import os
            if "/" in run_id:
                run_id = os.path.basename(run_id.rstrip("/"))
                logger.info(f"Extracted run_id: '{run_id}'")

            # Build the correct simulation path
            simulation_path = Path("./results") / run_id

            # Create JSON data from history - NO DEFAULTS
            json_data = await _create_simulation_info_json(run_id, simulation_path)

            # Only save if we have actual data
            if json_data.get("STATIONS", {}).get("count", 0) > 0:
                json_file_path = simulation_path / "simulation_info.json"
                with open(json_file_path, 'w', encoding='utf-8') as f:
                    json.dump(json_data, f, indent=2, ensure_ascii=False)
                logger.info(f"Simulation info JSON saved to: {json_file_path}")

        except Exception as json_error:
            logger.warning(f"Failed to create simulation info JSON: {json_error}", exc_info=True)

        return run_analysis_result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis execution failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


async def _create_simulation_info_json(run_id: str, simulation_path: Path) -> dict:
    """Create simulation info JSON data using REAL files first, history as backup."""

    try:
        # ============ 1. TRY TO READ FROM ACTUAL FILES FIRST ============
        city = ""
        country = ""
        full_location = ""
        stations_count = 0
        total_capacity = 0
        avg_capacity = 0
        min_capacity = 0
        max_capacity = 0
        total_bikes = 0
        avg_lat = 0
        avg_lon = 0

        # Read capacities.csv - THIS IS THE SOURCE OF TRUTH for capacity data
        capacidades_file = simulation_path / "capacidades.csv"
        if capacidades_file.exists():
            try:
                capacidades_df = pd.read_csv(capacidades_file, header=None)

                if not capacidades_df.empty:
                    if capacidades_df.iloc[0, 0] == 'header':
                        capacity_values = capacidades_df.iloc[1:, 0].astype(float).values
                    else:
                        capacity_values = capacidades_df.iloc[:, 0].astype(float).values

                    stations_count = len(capacity_values)
                    total_capacity = float(capacity_values.sum())
                    avg_capacity = float(capacity_values.mean())
                    min_capacity = float(capacity_values.min())
                    max_capacity = float(capacity_values.max())

                    logger.info(
                        f"Read capacities from file: {stations_count} stations, total capacity: {total_capacity}")
            except Exception as e:
                logger.error(f"Error reading capacidades.csv: {e}")

        # Read coordenadas.csv for coordinates
        coordenadas_file = simulation_path / "coordenadas.csv"
        if coordenadas_file.exists():
            try:
                coordenadas_df = pd.read_csv(coordenadas_file)
                if len(coordenadas_df) > 0:
                    latitudes = coordenadas_df.iloc[:, 1].astype(float).values
                    longitudes = coordenadas_df.iloc[:, 2].astype(float).values

                    avg_lat = float(np.mean(latitudes))
                    avg_lon = float(np.mean(longitudes))

                    # Try to geocode for city name
                    if avg_lat != 0 and avg_lon != 0:
                        city_info = _try_geocode_xyz(avg_lat, avg_lon)
                        city = city_info.get("city", "")
                        country = city_info.get("country", "")
                        full_location = city_info.get("full_location", "")

                        logger.info(f"Geocoded city from coordinates: {city}")
            except Exception as e:
                logger.error(f"Error reading coordenadas.csv: {e}")

        # Read indices_bicicleta.csv for total bikes
        indices_file = simulation_path / "indices_bicicleta.csv"
        if indices_file.exists():
            try:
                indices_df = pd.read_csv(indices_file, header=None)
                if len(indices_df) >= 2:
                    bike_counts = indices_df.iloc[1, :].values
                    total_bikes = int(bike_counts.sum())
                    logger.info(f"Read total bikes from indices: {total_bikes}")
            except Exception as e:
                logger.error(f"Error reading indices_bicicleta.csv: {e}")

        # ============ 2. IF FILES ARE MISSING, FALL BACK TO HISTORY ============
        if stations_count == 0 or total_bikes == 0:
            history_path = Path("./results/simulations_history.json")
            if history_path.exists():
                try:
                    with open(history_path, 'r', encoding='utf-8') as f:
                        history = json.load(f)

                    for sim in history.get("simulations", []):
                        if sim.get("simfolder") == run_id:
                            logger.info(f"Falling back to history data for {run_id}")

                            # Only use history if file data is missing
                            if stations_count == 0:
                                stations_count = sim.get("numberOfStations", 0)
                            if total_capacity == 0:
                                total_capacity = sim.get("total_capacity", 0)
                            if avg_capacity == 0:
                                avg_capacity = sim.get("avg_capacity", 0)
                            if min_capacity == 0:
                                min_capacity = sim.get("min_capacity", 0)
                            if max_capacity == 0:
                                max_capacity = sim.get("max_capacity", 0)
                            if total_bikes == 0:
                                total_bikes = sim.get("numberOfBikes", 0)
                            if not city:
                                city = sim.get("cityname", "")

                            # Get coordinates from history if file missing
                            if avg_lat == 0 and avg_lon == 0:
                                coords = sim.get("coordinates", {})
                                avg_lat = coords.get("avg_lat", 0)
                                avg_lon = coords.get("avg_lon", 0)

                            break
                except Exception as e:
                    logger.error(f"Error reading history: {e}")

        # ============ 3. BUILD THE JSON WITH ONLY NON-EMPTY VALUES ============
        result = {}

        # Add city info if we have it
        if city:
            result["CITY"] = city
            if full_location:
                result["FULL_LOCATION"] = full_location
            if country:
                result["COUNTRY"] = country

        # Add stations data if we have it
        if stations_count > 0:
            result["STATIONS"] = {
                "count": stations_count
            }
            if avg_capacity > 0:
                result["STATIONS"]["avg_capacity"] = round(avg_capacity, 2)

        # Add capacity data if we have it
        if total_capacity > 0:
            result["TOTAL_CAPACITY"] = round(total_capacity, 2)
        if min_capacity > 0:
            result["MIN_CAPACITY"] = round(min_capacity, 2)
        if max_capacity > 0:
            result["MAX_CAPACITY"] = round(max_capacity, 2)

        # Add capacity range if we have both min and max
        if min_capacity > 0 and max_capacity > 0:
            result["CAPACITY_RANGE"] = f"{min_capacity:.0f}-{max_capacity:.0f}"
        elif min_capacity > 0:
            result["CAPACITY_RANGE"] = f"{min_capacity:.0f}-?"
        elif max_capacity > 0:
            result["CAPACITY_RANGE"] = f"?-{max_capacity:.0f}"

        # Add bikes data if we have it
        if total_bikes > 0:
            result["TOTAL_BIKES"] = total_bikes

        # Always add utilization (initial state is 0)
        result["ACTIVE_BIKES"] = 0
        result["UTILIZATION"] = {
            "percentage": 0.0,
            "description": "0.00% utilization"
        }

        # Add coordinates if we have them
        if avg_lat != 0 and avg_lon != 0:
            result["COORDINATES"] = {
                "average_latitude": round(avg_lat, 6),
                "average_longitude": round(avg_lon, 6)
            }

        # Always add simulation ID and timestamp
        result["SIMULATION_ID"] = run_id
        result["GENERATED_AT"] = datetime.now().isoformat()

        logger.info(f"Created simulation info JSON with fields: {list(result.keys())}")
        return result

    except Exception as e:
        logger.error(f"Error creating simulation info JSON: {e}", exc_info=True)
        # Return minimal valid JSON with just the simulation ID
        return {
            "SIMULATION_ID": run_id,
            "GENERATED_AT": datetime.now().isoformat()
        }


@router.get("/dashboard/simulation-info/{run_id}")
async def get_simulation_info(run_id: str):
    """
    Get simulation information ONLY from real data - NO HARDCODED DEFAULTS.
    """
    try:
        # 1. Try to get from cached JSON first
        simulation_path = Path("./results") / run_id
        json_file = simulation_path / "simulation_info.json"

        if json_file.exists():
            logger.info(f"Loading simulation info from cached JSON: {json_file}")
            with open(json_file, 'r', encoding='utf-8') as f:
                cached_data = json.load(f)

            # Only return fields that actually have data
            result = {
                "simulation_id": run_id
            }

            # Add only fields that exist and have values
            if cached_data.get("CITY"):
                result["city"] = cached_data["CITY"]
            if cached_data.get("STATIONS", {}).get("count", 0) > 0:
                result["stations"] = cached_data["STATIONS"]["count"]
            if cached_data.get("TOTAL_CAPACITY", 0) > 0:
                result["total_capacity"] = cached_data["TOTAL_CAPACITY"]
            if cached_data.get("TOTAL_BIKES", 0) > 0:
                result["total_bikes"] = cached_data["TOTAL_BIKES"]
            if cached_data.get("STATIONS", {}).get("avg_capacity", 0) > 0:
                result["average_capacity"] = cached_data["STATIONS"]["avg_capacity"]
            if cached_data.get("MIN_CAPACITY", 0) > 0:
                result["min_capacity"] = cached_data["MIN_CAPACITY"]
            if cached_data.get("MAX_CAPACITY", 0) > 0:
                result["max_capacity"] = cached_data["MAX_CAPACITY"]

            result["active_bikes"] = cached_data.get("ACTIVE_BIKES", 0)
            result["utilization_percentage"] = cached_data.get("UTILIZATION", {}).get("percentage", 0)

            return result

        # 2. If no JSON, try to get from history
        history_path = Path("./results/simulations_history.json")
        if history_path.exists():
            with open(history_path, 'r', encoding='utf-8') as f:
                history = json.load(f)

            for sim in history.get("simulations", []):
                if sim.get("simfolder") == run_id:
                    result = {"simulation_id": run_id}

                    if sim.get("cityname"):
                        result["city"] = sim["cityname"]
                    if sim.get("numberOfStations", 0) > 0:
                        result["stations"] = sim["numberOfStations"]
                    if sim.get("total_capacity", 0) > 0:
                        result["total_capacity"] = sim["total_capacity"]
                    if sim.get("numberOfBikes", 0) > 0:
                        result["total_bikes"] = sim["numberOfBikes"]
                    if sim.get("avg_capacity", 0) > 0:
                        result["average_capacity"] = sim["avg_capacity"]
                    if sim.get("min_capacity", 0) > 0:
                        result["min_capacity"] = sim["min_capacity"]
                    if sim.get("max_capacity", 0) > 0:
                        result["max_capacity"] = sim["max_capacity"]

                    result["active_bikes"] = 0
                    result["utilization_percentage"] = 0

                    return result

        # 3. If nothing found, return empty dict with only simulation_id
        logger.warning(f"No simulation data found for {run_id}")
        return {"simulation_id": run_id}

    except Exception as e:
        logger.error(f"Error getting simulation info: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing simulation data: {str(e)}")

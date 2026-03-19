import json
import logging
import os
from pathlib import Path

from fastapi import APIRouter, Query, HTTPException

from bikesim.analysis.analysis_models import AnalysisArgs
from bikesim.analysis import run_analysis
from bikesim.core.models import AnalysisRequest
from bikesim.utils.historymanagement import load_history, enrich_history_with_station_info

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/dashboard/initial-data")
async def get_dashboard_initial_data(run: str = Query(..., description="Simulation folder name")):
    try:
        history = load_history()

        sim = None
        for s in history.get("simulations", []):
            if s.get("simfolder") == run:
                sim = s
                break

        if not sim:
            history = enrich_history_with_station_info()
            for s in history.get("simulations", []):
                if s.get("simfolder") == run:
                    sim = s
                    break

        if not sim:
            raise HTTPException(status_code=404, detail=f"Simulation not found: {run}")

        return {
            "city": sim.get("cityname", "N/A"),
            "numBikes": sim.get("numberOfBikes", 0),
            "numStations": sim.get("numberOfStations", 0),
            "simname": sim.get("simname", run),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching initial data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error fetching initial data: {e}")


@router.post("/dashboard/mapacapacidades")
async def createInitialMap(req: AnalysisRequest):
    """
    Generate capacity map and related analysis outputs.
    IMPORTANT: do not rewrite simulation_info.json here.
    """
    try:
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

        logger.info("Running map capacity analysis for output_folder=%s", req.output_folder)
        run_analysis_result = run_analysis(final_args)

        run_id = req.output_folder
        if "/" in run_id:
            run_id = os.path.basename(run_id.rstrip("/"))

        simulation_path = Path("./results") / run_id
        map_file = simulation_path / "MapaCapacidades.html"

        if map_file.exists():
            logger.info("MapaCapacidades.html generated successfully: %s", map_file)
        else:
            logger.warning("MapaCapacidades.html was not generated at expected path: %s", map_file)

        return run_analysis_result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis execution failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/simulation-info/{run_id}")
async def get_simulation_info(run_id: str):
    try:
        simulation_path = Path("./results") / run_id
        json_file = simulation_path / "simulation_info.json"

        if json_file.exists():
            logger.info(f"Loading simulation info from cached JSON: {json_file}")
            with open(json_file, "r", encoding="utf-8") as f:
                cached_data = json.load(f)

            result = {
                "simulation_id": run_id,
                "active_bikes": cached_data.get("ACTIVE_BIKES", 0),
                "utilization_percentage": cached_data.get("UTILIZATION", {}).get("percentage", 0),
            }

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

            return result

        history_path = Path("./results/simulations_history.json")
        if history_path.exists():
            with open(history_path, "r", encoding="utf-8") as f:
                history = json.load(f)

            for sim in history.get("simulations", []):
                if sim.get("simfolder") == run_id:
                    result = {
                        "simulation_id": run_id,
                        "active_bikes": sim.get("numberOfBikes", 0),
                        "utilization_percentage": 0,
                    }

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

                    return result

        logger.warning(f"No simulation data found for {run_id}")
        return {"simulation_id": run_id}

    except Exception as e:
        logger.error(f"Error getting simulation info: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing simulation data: {str(e)}")

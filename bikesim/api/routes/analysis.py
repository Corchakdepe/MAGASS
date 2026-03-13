"""Analysis execution API routes.



"""

import logging
from pathlib import Path
from typing import Optional, List, Union

import os
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from fastapi import APIRouter, HTTPException

from bikesim.analysis import run_analysis
from bikesim.analysis.analysis_models import AnalysisArgs, StationDays
from bikesim.core.models import AnalysisRequest
from bikesim.utils.filterutilities import find_last_filter_file, load_stations_from_file

logger = logging.getLogger(__name__)
router = APIRouter()


def _path_from_filter_result(output_folder: str, filter_result: object) -> Optional[Path]:
    if filter_result is None:
        return None

    if isinstance(filter_result, (str, Path)):
        p = Path(filter_result)
        if not p.is_absolute():
            p = Path(output_folder) / p
        if p.exists():
            return p

    if isinstance(filter_result, dict):
        candidates = [
            filter_result.get("filter_result_filename"),
            filter_result.get("filename"),
            filter_result.get("file"),
            filter_result.get("path"),
            filter_result.get("filepath"),
            filter_result.get("output_file"),
        ]
        for candidate in candidates:
            if candidate:
                p = Path(candidate)
                if not p.is_absolute():
                    p = Path(output_folder) / p
                if p.exists():
                    return p

    return None


def _resolve_filter_path(
    output_folder: str,
    requested_filename: Optional[str],
    filter_result: object = None,
) -> Optional[Path]:
    if requested_filename:
        candidate = Path(output_folder) / requested_filename
        if candidate.exists():
            logger.info(f"Resolved filter path from requested filename: {candidate}")
            return candidate
        logger.warning(f"Specified filter file not found: {candidate}")

    from_result = _path_from_filter_result(output_folder, filter_result)
    if from_result:
        logger.info(f"Resolved filter path from filter_result: {from_result}")
        return from_result

    fallback = find_last_filter_file(output_folder)
    if fallback:
        logger.warning(f"Falling back to last filter file found: {fallback}")
    return fallback


def _apply_filter_to_map_spec(spec: Optional[str], stations: List[int]) -> Optional[str]:
    if not spec or not stations:
        return spec

    if spec == "all":
        return "all+" + ";".join(str(s) for s in stations)

    if "+" in spec:
        return f"{spec}+{';'.join(str(s) for s in stations)}"

    return f"{spec}+{';'.join(str(s) for s in stations)}"


@router.post("/exe/analizar-json")
async def analizar(req: AnalysisRequest):
    try:
        # === FILTER FOR MAPS ===
        if req.use_filter_for_maps:
            if not req.filtro or not req.tipo_filtro:
                raise HTTPException(
                    status_code=400,
                    detail="use_filter_for_maps=true requiere 'filtro' y 'tipo_filtro'"
                )

            logger.info(
                f"Running filter for maps with filtro={req.filtro}, tipo_filtro={req.tipo_filtro}"
            )

            solo_filtro_args = AnalysisArgs(
                input_folder=req.input_folder,
                output_folder=req.output_folder,
                seleccion_agregacion=req.seleccion_agregacion,
                delta_media=req.delta_media,
                delta_acumulada=req.delta_acumulada,
                graf_barras_est_med=None,
                graf_barras_est_acum=None,
                graf_barras_dia=None,
                graf_linea_comp_est=None,
                graf_linea_comp_mats=None,
                mapa_densidad=None,
                video_densidad=None,
                mapa_voronoi=None,
                mapa_circulo=None,
                mapa_desplazamientos=None,
                mapa_capacidad=None,
                filtrado_EstValor=req.filtrado_EstValor,
                filtrado_EstValorDias=req.filtrado_EstValorDias,
                filtrado_Horas=req.filtrado_Horas,
                filtrado_PorcentajeEstaciones=req.filtrado_PorcentajeEstaciones,
                filtro=req.filtro,
                tipo_filtro=req.tipo_filtro,
                use_filter_for_maps=False,
                use_filter_for_graphs=False,
                filter_result_filename=req.filter_result_filename,
                user_name_map=None,
            )

            filter_result = run_analysis(solo_filtro_args)
            logger.info(f"Map filter result: {filter_result}")

            filter_path = _resolve_filter_path(
                req.output_folder,
                req.filter_result_filename,
                filter_result,
            )

            if not filter_path:
                logger.warning("No filter file found after map filter operation")
                estaciones = []
            else:
                estaciones = load_stations_from_file(filter_path)
                logger.info(
                    f"Loaded {len(estaciones)} stations from map filter {filter_path}: {estaciones[:10]}"
                )

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
                mapa_densidad=_apply_filter_to_map_spec(req.mapa_densidad, estaciones),
                video_densidad=_apply_filter_to_map_spec(req.video_densidad, estaciones),
                mapa_voronoi=req.mapa_voronoi,
                mapa_circulo=_apply_filter_to_map_spec(req.mapa_circulo, estaciones),
                mapa_desplazamientos=req.mapa_desplazamientos,
                mapa_capacidad=req.mapa_capacidad,
                filtrado_EstValor=req.filtrado_EstValor,
                filtrado_EstValorDias=req.filtrado_EstValorDias,
                filtrado_Horas=req.filtrado_Horas,
                filtrado_PorcentajeEstaciones=req.filtrado_PorcentajeEstaciones,
                filtro=None,
                tipo_filtro=None,
                use_filter_for_maps=False,
                use_filter_for_graphs=False,
                filter_result_filename=filter_path.name if filter_path else req.filter_result_filename,
                user_name_map=req.user_name_map,
            )

            return run_analysis(final_args)

        # === FILTER FOR GRAPHS ===
        if req.use_filter_for_graphs:
            if not req.filtro or not req.tipo_filtro:
                raise HTTPException(
                    status_code=400,
                    detail="use_filter_for_graphs=true requiere 'filtro' y 'tipo_filtro'"
                )

            logger.info(
                f"Running filter for graphs with filtro={req.filtro}, tipo_filtro={req.tipo_filtro}"
            )

            solo_filtro_args = AnalysisArgs(
                input_folder=req.input_folder,
                output_folder=req.output_folder,
                seleccion_agregacion=req.seleccion_agregacion,
                delta_media=req.delta_media,
                delta_acumulada=req.delta_acumulada,
                graf_barras_est_med=None,
                graf_barras_est_acum=None,
                graf_barras_dia=None,
                graf_linea_comp_est=None,
                graf_linea_comp_mats=None,
                mapa_densidad=None,
                video_densidad=None,
                mapa_voronoi=None,
                mapa_circulo=None,
                mapa_desplazamientos=None,
                mapa_capacidad=None,
                filtrado_EstValor=req.filtrado_EstValor,
                filtrado_EstValorDias=req.filtrado_EstValorDias,
                filtrado_Horas=req.filtrado_Horas,
                filtrado_PorcentajeEstaciones=req.filtrado_PorcentajeEstaciones,
                filtro=req.filtro,
                tipo_filtro=req.tipo_filtro,
                use_filter_for_maps=False,
                use_filter_for_graphs=False,
                filter_result_filename=req.filter_result_filename,
                user_name_map=req.user_name_map,
            )

            filter_result = run_analysis(solo_filtro_args)
            logger.info(f"Graph filter result: {filter_result}")

            filter_path = _resolve_filter_path(
                req.output_folder,
                req.filter_result_filename,
                filter_result,
            )

            logger.info(f"filter_result raw: {filter_result}")
            logger.info(f"filter_path chosen: {filter_path}")
            logger.info(f"filter_path exists: {filter_path.exists() if filter_path else False}")

            if not filter_path:
                raise HTTPException(
                    status_code=400,
                    detail="No se pudo encontrar el archivo de filtro generado"
                )

            estaciones = load_stations_from_file(filter_path)
            logger.info(f"loaded estaciones: {estaciones}")

            if not estaciones:
                raise HTTPException(
                    status_code=400,
                    detail=f"El filtro no ha seleccionado ninguna estación. Archivo usado: {filter_path.name}"
                )

            logger.info(f"Filter selected {len(estaciones)} stations")

            station_days_list: List[StationDays] = [
                StationDays(station_id=st, days="all") for st in estaciones
            ]

            graf_barras_est_med_spec: Optional[str] = None
            graf_barras_est_acum_spec: Optional[str] = None

            if estaciones:
                barra_est = estaciones[0]
                dias_spec = "all"

                if req.graf_barras_est_med is not None:
                    graf_barras_est_med_spec = f"{barra_est}-{dias_spec}"
                if req.graf_barras_est_acum is not None:
                    graf_barras_est_acum_spec = f"{barra_est}-{dias_spec}"

            final_args = AnalysisArgs(
                input_folder=req.input_folder,
                output_folder=req.output_folder,
                seleccion_agregacion=req.seleccion_agregacion,
                delta_media=req.delta_media,
                delta_acumulada=req.delta_acumulada,
                graf_barras_est_med=graf_barras_est_med_spec,
                graf_barras_est_acum=graf_barras_est_acum_spec,
                graf_barras_dia=req.graf_barras_dia,
                graf_linea_comp_est=station_days_list if req.graf_linea_comp_est is not None else None,
                graf_linea_comp_mats=req.graf_linea_comp_mats,
                mapa_densidad=None,
                video_densidad=None,
                mapa_voronoi=None,
                mapa_circulo=None,
                mapa_desplazamientos=None,
                mapa_capacidad=None,
                filtrado_EstValor=req.filtrado_EstValor,
                filtrado_EstValorDias=req.filtrado_EstValorDias,
                filtrado_Horas=req.filtrado_Horas,
                filtrado_PorcentajeEstaciones=req.filtrado_PorcentajeEstaciones,
                filtro=None,
                tipo_filtro=None,
                use_filter_for_maps=False,
                use_filter_for_graphs=False,
                filter_result_filename=filter_path.name,
                user_name_map=req.user_name_map,
            )

            return run_analysis(final_args)

        logger.info("Running standard analysis without filters")

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
            mapa_desplazamientos=req.mapa_desplazamientos,
            mapa_capacidad=req.mapa_capacidad,
            filtrado_EstValor=req.filtrado_EstValor,
            filtrado_EstValorDias=req.filtrado_EstValorDias,
            filtrado_Horas=req.filtrado_Horas,
            filtrado_PorcentajeEstaciones=req.filtrado_PorcentajeEstaciones,
            filtro=req.filtro,
            tipo_filtro=req.tipo_filtro,
            use_filter_for_maps=False,
            use_filter_for_graphs=False,
            filter_result_filename=req.filter_result_filename,
            user_name_map=req.user_name_map,
        )

        return run_analysis(final_args)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis execution failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))



UPLOADS_DIR = "./uploads"

@router.get("/list-upload-folders")
def list_upload_folders():
    try:
        folders = sorted(
            [
                f for f in os.listdir(UPLOADS_DIR)
                if os.path.isdir(os.path.join(UPLOADS_DIR, f))
            ],
            reverse=True,  # newest first
        )
        return {"folders": [f"./uploads/{f}" for f in folders]}
    except FileNotFoundError:
        return JSONResponse(status_code=404, content={"detail": "uploads/ not found"})

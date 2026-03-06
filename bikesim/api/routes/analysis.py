"""Analysis execution API routes."""

import logging
from pathlib import Path
from typing import Optional, List

from bikesim.analysis.analysis_models import AnalysisArgs, StationDays
from fastapi import APIRouter, HTTPException

from bikesim.analysis import run_analysis
from bikesim.core.models import AnalysisRequest
from bikesim.utils.filterutilities import find_last_filter_file, load_stations_from_file

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/exe/analizar-json")
async def analizar(req: AnalysisRequest):
    """Executes analysis with optional filtering for maps/graphs"""
    try:
        # === FILTER FOR MAPS ===
        if req.use_filter_for_maps:
            if not req.filtro or not req.tipo_filtro:
                raise HTTPException(
                    status_code=400,
                    detail="use_filter_for_maps=true requiere 'filtro' y 'tipo_filtro'"
                )

            logger.info(f"Running filter for maps with filtro={req.filtro}, tipo_filtro={req.tipo_filtro}")

            # Step 1: run filter only
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
                filter_result_filename=None,
                user_name_map=None,
            )

            # Run the filter
            filter_result = run_analysis(solo_filtro_args)
            logger.info(f"Filter result: {filter_result}")

            # Step 2: locate filter result
            filter_path = None

            if req.filter_result_filename:
                filter_path = Path(req.output_folder) / req.filter_result_filename
                if not filter_path.exists():
                    filter_path = None
                    logger.warning(f"Specified filter file not found: {req.filter_result_filename}")

            if not filter_path:
                filter_path = find_last_filter_file(req.output_folder)

            if not filter_path:
                logger.warning("No filter file found after filter operation")
                # Continue without filtering instead of failing
                estaciones = []
            else:
                estaciones = load_stations_from_file(filter_path)
                logger.info(f"Loaded {len(estaciones)} stations from filter: {estaciones[:10]}...")

            # Step 3: modify map specifications to include filtered stations
            def apply_filter_to_map_spec(spec: Optional[str], stations: List[int]) -> Optional[str]:
                if not spec or not stations:
                    return spec

                # If spec is 'all', replace with station list
                if spec == 'all':
                    return 'all+' + ';'.join(str(s) for s in stations)

                # If spec already has stations, append new ones
                if '+' in spec:
                    return f"{spec}+{';'.join(str(s) for s in stations)}"

                # Otherwise create new spec
                return f"{spec}+{';'.join(str(s) for s in stations)}"

            # Create final args with filtered maps
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
                mapa_densidad=apply_filter_to_map_spec(req.mapa_densidad,
                                                       estaciones) if req.use_filter_for_maps else req.mapa_densidad,
                video_densidad=apply_filter_to_map_spec(req.video_densidad,
                                                        estaciones) if req.use_filter_for_maps else req.video_densidad,
                mapa_voronoi=req.mapa_voronoi,
                mapa_circulo=apply_filter_to_map_spec(req.mapa_circulo,
                                                      estaciones) if req.use_filter_for_maps else req.mapa_circulo,
                mapa_desplazamientos=req.mapa_desplazamientos,
                mapa_capacidad=req.mapa_capacidad,
                filtrado_EstValor=req.filtrado_EstValor,
                filtrado_EstValorDias=req.filtrado_EstValorDias,
                filtrado_Horas=req.filtrado_Horas,
                filtrado_PorcentajeEstaciones=req.filtrado_PorcentajeEstaciones,
                filtro=None,  # Don't filter again
                tipo_filtro=None,
                use_filter_for_maps=False,
                use_filter_for_graphs=False,
                filter_result_filename=filter_path.name if filter_path else None,
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

            logger.info(f"Running filter for graphs with filtro={req.filtro}, tipo_filtro={req.tipo_filtro}")

            # 1) run filter only
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
                filter_result_filename=None,
                user_name_map=req.user_name_map
            )

            filter_result = run_analysis(solo_filtro_args)
            logger.info(f"Filter result: {filter_result}")

            # 2) locate filter result
            filter_path = None

            if req.filter_result_filename:
                filter_path = Path(req.output_folder) / req.filter_result_filename
                if not filter_path.exists():
                    filter_path = None

            if not filter_path:
                filter_path = find_last_filter_file(req.output_folder)

            if not filter_path:
                raise HTTPException(
                    status_code=400,
                    detail="No se pudo encontrar el archivo de filtro generado"
                )

            estaciones = load_stations_from_file(filter_path)

            if not estaciones:
                raise HTTPException(
                    status_code=400,
                    detail="El filtro no ha seleccionado ninguna estación"
                )

            logger.info(f"Filter selected {len(estaciones)} stations")

            # 3) build station_days_list
            station_days_list: List[StationDays] = [
                StationDays(station_id=st, days="all") for st in estaciones
            ]

            # 4) build bar specs - use first station for bar charts
            if estaciones:
                barra_est = estaciones[0]
                dias_spec = "all"
                graf_barras_est_med_spec: Optional[str] = None
                graf_barras_est_acum_spec: Optional[str] = None

                if req.graf_barras_est_med:
                    graf_barras_est_med_spec = f"{barra_est}-{dias_spec}"
                if req.graf_barras_est_acum:
                    graf_barras_est_acum_spec = f"{barra_est}-{dias_spec}"
            else:
                graf_barras_est_med_spec = None
                graf_barras_est_acum_spec = None

            # 5) run analysis with filtered graphs
            final_args = AnalysisArgs(
                input_folder=req.input_folder,
                output_folder=req.output_folder,
                seleccion_agregacion=req.seleccion_agregacion,
                delta_media=req.delta_media,
                delta_acumulada=req.delta_acumulada,
                graf_barras_est_med=graf_barras_est_med_spec,
                graf_barras_est_acum=graf_barras_est_acum_spec,
                graf_barras_dia=req.graf_barras_dia,
                graf_linea_comp_est=station_days_list,
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
                filtro=None,  # Don't filter again
                tipo_filtro=None,
                use_filter_for_maps=False,
                use_filter_for_graphs=False,
                filter_result_filename=filter_path.name if filter_path else None,
                user_name_map=req.user_name_map
            )

            return run_analysis(final_args)

        # === STANDARD ANALYSIS ===
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
            filter_result_filename=None,
            user_name_map=req.user_name_map
        )

        return run_analysis(final_args)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis execution failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

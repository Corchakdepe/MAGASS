"""Analysis execution API routes."""

import logging
from pathlib import Path
from typing import Optional, List

from Frontend.analysis_models import AnalysisArgs, StationDays
from fastapi import APIRouter, HTTPException, Depends
from Frontend.analysis_runnerBackUp import run_analysis

from bikesim.core.models import AnalysisRequest, AnalysisResult
from bikesim.services.analysis_service import AnalysisService
from bikesim.api.dependencies import get_analysis_service
from bikesim.utils.filterutilities import _find_last_filter_file, _load_stations_from_file

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
                apply_filter_to_line_comp=False,
                user_map_name=None,
            )

            _ = run_analysis(solo_filtro_args)

            # Step 2: locate filter result
            if req.filter_result_filename:
                filter_path = Path(req.output_folder) / req.filter_result_filename
            else:
                filter_path = _find_last_filter_file(req.output_folder)

            estaciones = _load_stations_from_file(filter_path) if filter_path else []
            estaciones_str = ";".join(str(i) for i in estaciones) if estaciones else ""

            def add_estaciones(spec: Optional[str]) -> Optional[str]:
                if not spec or "+" in spec or not estaciones_str:
                    return spec
                return f"{spec}+{estaciones_str}"

            # Step 3: run analysis with filtered maps
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
                mapa_densidad=add_estaciones(req.mapa_densidad),
                video_densidad=add_estaciones(req.video_densidad),
                mapa_voronoi=req.mapa_voronoi,
                mapa_circulo=add_estaciones(req.mapa_circulo),
                mapa_desplazamientos=req.mapa_desplazamientos,
                mapa_capacidad= req.mapa_capacidad,
                filtrado_EstValor=req.filtrado_EstValor,
                filtrado_EstValorDias=req.filtrado_EstValorDias,
                filtrado_Horas=req.filtrado_Horas,
                filtrado_PorcentajeEstaciones=req.filtrado_PorcentajeEstaciones,
                filtro=req.filtro,
                tipo_filtro=req.tipo_filtro,
                apply_filter_to_line_comp=False,
                filter_result_filename=filter_path.name if filter_path else None,
                user_map_name=req.user_map_name,
            )

            return run_analysis(final_args)

        # === FILTER FOR GRAPHS ===
        if req.use_filter_for_graphs:
            if not req.filtro or not req.tipo_filtro:
                raise HTTPException(
                    status_code=400,
                    detail="use_filter_for_graphs=true requiere 'filtro' y 'tipo_filtro'"
                )

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

            _ = run_analysis(solo_filtro_args)

            # 2) locate filter result
            if req.filter_result_filename:
                filter_path = Path(req.output_folder) / req.filter_result_filename
            else:
                filter_path = _find_last_filter_file(req.output_folder)

            estaciones = _load_stations_from_file(filter_path) if filter_path else []

            if not estaciones:
                raise HTTPException(
                    status_code=400,
                    detail="El filtro no ha seleccionado ninguna estación"
                )

            # 3) build station_days_list
            station_days_list: List[StationDays] = [
                StationDays(station_id=st, days="all") for st in estaciones
            ]

            # 4) build bar specs
            barra_est = estaciones[0]
            dias_spec = "all"
            graf_barras_est_med_spec: Optional[str] = None
            graf_barras_est_acum_spec: Optional[str] = None

            if req.graf_barras_est_med:
                graf_barras_est_med_spec = f"{barra_est}-{dias_spec}"
            if req.graf_barras_est_acum:
                graf_barras_est_acum_spec = f"{barra_est}-{dias_spec}"

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
                filtro=req.filtro,
                tipo_filtro=req.tipo_filtro,
                use_filter_for_maps=False,
                use_filter_for_graphs=False,
                filter_result_filename=filter_path.name if filter_path else None,
                user_name_map=req.user_name_map
            )

            return run_analysis(final_args)

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

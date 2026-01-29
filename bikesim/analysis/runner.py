"""
Entry point functions for running analysis.

These functions maintain backward compatibility with the old API.
"""

import logging
from pathlib import Path
from typing import Optional

from fastapi import HTTPException

from bikesim.core.models import AnalysisArgs, AnalysisResult
from bikesim.analysis.orchestrator import AnalysisOrchestrator

logger = logging.getLogger(__name__)


def run_analysis(args: AnalysisArgs) -> dict:
    """
    Run complete analysis workflow.

    Args:
        args: Analysis arguments

    Returns:
        Dictionary with analysis results
    """
    try:
        orchestrator = AnalysisOrchestrator(args)
        result = orchestrator.execute()
        return result.dict()

    except Exception as e:
        logger.error(f"Analysis failed: {e}", exc_info=True)
        raise


def run_filter_only(
        input_folder: str,
        output_folder: str,
        filtro: str,
        tipo_filtro: str,
        seleccion: str
) -> Path:
    """
    Run only filter operation.

    Args:
        input_folder: Input folder path
        output_folder: Output folder path
        filtro: Filter specification
        tipo_filtro: Filter type
        seleccion: Matrix selection specification

    Returns:
        Path to filter result file
    """
    args = AnalysisArgs(
        input_folder=input_folder,
        output_folder=output_folder,
        seleccion_agregacion=seleccion,
        delta_media=None,
        delta_acumulada=None,
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
        filtrado_EstValor=None,
        filtrado_EstValorDias=None,
        filtrado_Horas=None,
        filtrado_PorcentajeEstaciones=None,
        filtro=filtro,
        tipo_filtro=tipo_filtro,
        use_filter_for_maps=False,
        filter_result_filename=None,
    )

    run_analysis(args)

    # Find generated filter file
    out_dir = Path(output_folder)
    pattern = "Filtrado_Estaciones"

    candidates = sorted(out_dir.glob(f"*{pattern}*.csv"))
    if not candidates:
        candidates = sorted(out_dir.glob(f"*{pattern}*.txt"))

    if not candidates:
        raise HTTPException(
            status_code=400,
            detail="Filter did not generate station file"
        )

    return candidates[-1]


def run_full_analysis(
        *,
        input_folder: str,
        output_folder: str,
        seleccion_agregacion: str,
        delta_media: Optional[int],
        delta_acumulada: Optional[int],
        mapa_densidad: Optional[str],
        video_densidad: Optional[str],
        mapa_voronoi: Optional[str],
        mapa_circulo: Optional[str],
        mapa_desplazamientos: Optional[str],
        filtro: Optional[str],
        tipo_filtro: Optional[str],
        filtrado_EstValor: Optional[str],
        filtrado_EstValorDias: Optional[str],
        filtrado_Horas: Optional[str],
        filtrado_PorcentajeEstaciones: Optional[str]
) -> dict:
    """
    Run full analysis with all parameters.

    This is a convenience function for backward compatibility.

    Returns:
        Analysis result dictionary
    """
    args = AnalysisArgs(
        input_folder=input_folder,
        output_folder=output_folder,
        seleccion_agregacion=seleccion_agregacion,
        delta_media=delta_media,
        delta_acumulada=delta_acumulada,
        graf_barras_est_med=None,
        graf_barras_est_acum=None,
        graf_barras_dia=None,
        graf_linea_comp_est=None,
        graf_linea_comp_mats=None,
        mapa_densidad=mapa_densidad,
        video_densidad=video_densidad,
        mapa_voronoi=mapa_voronoi,
        mapa_circulo=mapa_circulo,
        mapa_desplazamientos=mapa_desplazamientos,
        filtrado_EstValor=filtrado_EstValor,
        filtrado_EstValorDias=filtrado_EstValorDias,
        filtrado_Horas=filtrado_Horas,
        filtrado_PorcentajeEstaciones=filtrado_PorcentajeEstaciones,
        filtro=filtro,
        tipo_filtro=tipo_filtro,
        use_filter_for_maps=False,
        filter_result_filename=None,
    )

    return run_analysis(args)
